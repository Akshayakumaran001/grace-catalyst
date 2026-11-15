import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { AppError } from '../errors/app-errors';
import { ZodError } from 'zod';

export interface ApiResponseEnvelope<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export function apiSuccess<T>(data: T, status: number = 200) {
  const envelope: ApiResponseEnvelope<T> = {
    data,
    error: null,
    meta: {
      requestId: randomUUID(),
      timestamp: new Date().toISOString(),
    },
  };
  return NextResponse.json(envelope, { status });
}

export function apiCreated<T>(data: T) {
  return apiSuccess(data, 201);
}

export function apiError(error: unknown) {
  const requestId = randomUUID();
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    const envelope: ApiResponseEnvelope<null> = {
      data: null,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: { requestId, timestamp },
    };
    return NextResponse.json(envelope, { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    const envelope: ApiResponseEnvelope<null> = {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request payload failed validation.',
        details: error.flatten().fieldErrors,
      },
      meta: { requestId, timestamp },
    };
    return NextResponse.json(envelope, { status: 422 });
  }

  // Generic internal server error
  console.error('[API_UNHANDLED_ERROR]', error);
  const envelope: ApiResponseEnvelope<null> = {
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred.',
    },
    meta: { requestId, timestamp },
  };
  return NextResponse.json(envelope, { status: 500 });
}
