import { randomUUID } from 'crypto';
import {
  CareProfile,
  Membership,
  Invitation,
  Role,
  DEFAULT_NOTIFICATION_POLICY,
} from '../domain/types';
import {
  careProfileRepo,
  membershipRepo,
  invitationRepo,
  auditRepo,
} from '../repositories/firestore';
import { hashPasscode, verifyPasscode, createSessionToken } from '../adapters/tokens';
import {
  UnauthenticatedError,
  ForbiddenError,
  NotFoundError,
  AccountLockedError,
  TokenExpiredError,
} from '../lib/errors/app-errors';
import { can } from '../domain/permissions/policy';

export class CareProfileService {
  async createProfile(data: {
    displayName: string;
    elderDisplayName: string;
    elderEmail?: string;
    timezone?: string;
    locale?: string;
  }): Promise<{ profile: CareProfile; membership: Membership; token: string }> {
    const now = new Date();
    const profileId = randomUUID();
    const memberId = randomUUID();

    const profile: CareProfile = {
      id: profileId,
      displayName: data.displayName,
      locale: data.locale || 'en-IN',
      timezone: data.timezone || 'Asia/Kolkata',
      collaborationMode: 'direct_edit',
      notificationPolicy: DEFAULT_NOTIFICATION_POLICY,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    };

    const membership: Membership = {
      id: memberId,
      careProfileId: profileId,
      displayName: data.elderDisplayName,
      role: 'elderly',
      email: data.elderEmail,
      status: 'active',
      notificationPreferences: { emailEnabled: !!data.elderEmail },
      createdAt: now,
      lastActiveAt: now,
    };

    await careProfileRepo.create(profile);
    await membershipRepo.create(membership);

    await auditRepo.create({
      id: randomUUID(),
      careProfileId: profileId,
      actorMembershipId: memberId,
      action: 'CARE_PROFILE_CREATED',
      resourceType: 'CareProfile',
      resourceId: profileId,
      after: { displayName: profile.displayName },
      createdAt: now,
    });

    const token = await createSessionToken({
      membershipId: memberId,
      careProfileId: profileId,
      role: 'elderly',
      displayName: membership.displayName,
    });

    return { profile, membership, token };
  }

  async createInvitation(
    actorMembership: Membership,
    data: { role: Role; passcode: string; expiresInDays?: number }
  ): Promise<{ invitation: Invitation; rawPasscode: string }> {
    if (!can(actorMembership.role, 'invite_members')) {
      throw new ForbiddenError('Only the profile owner can invite members.');
    }

    const now = new Date();
    const days = data.expiresInDays || 30;
    const expiresAt = new Date(now.getTime() + days * 24 * 3600 * 1000);
    const { hash, salt } = hashPasscode(data.passcode);

    const invitation: Invitation = {
      id: randomUUID(),
      careProfileId: actorMembership.careProfileId,
      role: data.role,
      passcodeHash: hash,
      salt,
      expiresAt,
      maxUses: 10,
      uses: 0,
      failedAttempts: 0,
      createdBy: actorMembership.id,
      createdAt: now,
    };

    await invitationRepo.create(invitation);

    await auditRepo.create({
      id: randomUUID(),
      careProfileId: actorMembership.careProfileId,
      actorMembershipId: actorMembership.id,
      action: 'INVITATION_CREATED',
      resourceType: 'Invitation',
      resourceId: invitation.id,
      after: { role: data.role },
      createdAt: now,
    });

    return { invitation, rawPasscode: data.passcode };
  }

  async joinWithPasscode(data: {
    passcode: string;
    displayName: string;
    email?: string;
  }): Promise<{ profile: CareProfile; membership: Membership; token: string }> {
    const db = await careProfileRepo.findById('demo-profile-meena');
    const invitations = db ? await invitationRepo.findByCareProfile(db.id) : [];

    let matchedInvitation: Invitation | null = null;
    for (const inv of invitations) {
      if (inv.lockedUntil && new Date() < new Date(inv.lockedUntil)) {
        continue;
      }
      if (verifyPasscode(data.passcode, inv.passcodeHash, inv.salt)) {
        matchedInvitation = inv;
        break;
      }
    }

    if (!matchedInvitation) {
      throw new UnauthenticatedError('Invalid passcode or invitation not found.');
    }

    const now = new Date();
    if (now > new Date(matchedInvitation.expiresAt)) {
      throw new TokenExpiredError('This invitation passcode has expired.');
    }

    if (matchedInvitation.uses >= matchedInvitation.maxUses) {
      throw new TokenExpiredError('This invitation has reached its usage limit.');
    }

    // Increment invitation usage
    await invitationRepo.update(matchedInvitation.id, {
      uses: matchedInvitation.uses + 1,
    });

    // Create new membership
    const memberId = randomUUID();
    const membership: Membership = {
      id: memberId,
      careProfileId: matchedInvitation.careProfileId,
      displayName: data.displayName,
      role: matchedInvitation.role,
      email: data.email,
      status: 'active',
      notificationPreferences: { emailEnabled: !!data.email },
      createdAt: now,
      lastActiveAt: now,
    };
    await membershipRepo.create(membership);

    const profile = await careProfileRepo.findById(matchedInvitation.careProfileId);
    if (!profile) throw new NotFoundError('CareProfile');

    await auditRepo.create({
      id: randomUUID(),
      careProfileId: profile.id,
      actorMembershipId: memberId,
      action: 'MEMBER_JOINED',
      resourceType: 'Membership',
      resourceId: memberId,
      after: { role: membership.role, displayName: membership.displayName },
      createdAt: now,
    });

    const token = await createSessionToken({
      membershipId: memberId,
      careProfileId: profile.id,
      role: membership.role,
      displayName: membership.displayName,
    });

    return { profile, membership, token };
  }

  async getMembers(careProfileId: string): Promise<Membership[]> {
    return membershipRepo.findByProfile(careProfileId);
  }

  async revokeMember(
    actorMembership: Membership,
    targetMembershipId: string
  ): Promise<void> {
    if (!can(actorMembership.role, 'revoke_members')) {
      throw new ForbiddenError('Only the profile owner can revoke members.');
    }

    const target = await membershipRepo.findById(targetMembershipId);
    if (!target || target.careProfileId !== actorMembership.careProfileId) {
      throw new NotFoundError('Membership');
    }

    if (target.role === 'elderly') {
      throw new ForbiddenError('Cannot revoke the primary elder membership.');
    }

    await membershipRepo.update(targetMembershipId, {
      status: 'revoked',
      revokedAt: new Date(),
    });

    await auditRepo.create({
      id: randomUUID(),
      careProfileId: actorMembership.careProfileId,
      actorMembershipId: actorMembership.id,
      action: 'MEMBER_REVOKED',
      resourceType: 'Membership',
      resourceId: targetMembershipId,
      createdAt: new Date(),
    });
  }

  async updateCollaborationMode(
    actorMembership: Membership,
    mode: 'direct_edit' | 'elder_approval_required'
  ): Promise<CareProfile> {
    if (!can(actorMembership.role, 'change_consent_preferences')) {
      throw new ForbiddenError('Only the elder can update collaboration mode.');
    }

    const profile = await careProfileRepo.findById(actorMembership.careProfileId);
    if (!profile) throw new NotFoundError('CareProfile');

    const updated = await careProfileRepo.update(profile.id, {
      collaborationMode: mode,
    });

    await auditRepo.create({
      id: randomUUID(),
      careProfileId: profile.id,
      actorMembershipId: actorMembership.id,
      action: 'COLLABORATION_MODE_CHANGED',
      resourceType: 'CareProfile',
      resourceId: profile.id,
      after: { collaborationMode: mode },
      createdAt: new Date(),
    });

    return updated;
  }
}

export const careProfileService = new CareProfileService();
