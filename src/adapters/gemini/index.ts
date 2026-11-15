import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../lib/config/env';

export interface ExtractedMedicationCandidate {
  name: string;
  doseText: string;
  frequency: 'daily' | 'specific_days';
  weekdays?: number[];
  localTimes: string[];
  mealContext?: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
  confidence: number;
  uncertainFields: string[];
  notes?: string;
}

const SYSTEM_PROMPT = `
You are a precise, cautious medical schedule intake assistant for GRACE, an elderly care platform.
Your ONLY task is to extract structured schedule information from text typed by an elder or caregiver.

CRITICAL SAFETY RULES:
1. NEVER invent, infer, or recommend dosages or frequencies.
2. If any piece of information is ambiguous or missing, do NOT guess. Mark the field in uncertainFields.
3. Dose text must be literal text from the input (e.g. "500mg", "1 tablet", "2 puffs").
4. Return ONLY valid, minified JSON matching this schema:
{
  "name": "string",
  "doseText": "string",
  "frequency": "daily" | "specific_days",
  "weekdays": [0, 1, 2, 3, 4, 5, 6] (optional, 0=Sun),
  "localTimes": ["HH:mm", ...],
  "mealContext": "string" (e.g. "after breakfast", optional),
  "instructions": "string" (optional),
  "startDate": "YYYY-MM-DD" (optional),
  "endDate": "YYYY-MM-DD" (optional),
  "confidence": number between 0.0 and 1.0,
  "uncertainFields": ["fieldName", ...],
  "notes": "string" (optional)
}
5. Do NOT include Markdown formatting or code fences. Return raw JSON only.
`;

export class GeminiIntakeAdapter {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (env.geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(env.geminiApiKey);
      } catch (err) {
        console.warn('[GEMINI] Failed to initialize Gemini client:', err);
      }
    }
  }

  async parseMedicationText(
    inputText: string
  ): Promise<ExtractedMedicationCandidate> {
    if (!this.genAI) {
      return this.heuristicFallback(inputText);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: env.geminiModel,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const prompt = `${SYSTEM_PROMPT}\n\nINPUT TEXT TO EXTRACT:\n"${inputText}"`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const parsed = JSON.parse(text);
      return {
        name: parsed.name || 'Unspecified Medicine',
        doseText: parsed.doseText || '1 dose',
        frequency: parsed.frequency === 'specific_days' ? 'specific_days' : 'daily',
        weekdays: parsed.weekdays,
        localTimes: Array.isArray(parsed.localTimes) && parsed.localTimes.length > 0
          ? parsed.localTimes
          : ['09:00'],
        mealContext: parsed.mealContext,
        instructions: parsed.instructions,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
        uncertainFields: Array.isArray(parsed.uncertainFields) ? parsed.uncertainFields : [],
        notes: parsed.notes,
      };
    } catch (err) {
      console.warn('[GEMINI_PARSE_FAILED] Falling back to heuristic:', err);
      return this.heuristicFallback(inputText);
    }
  }

  private heuristicFallback(inputText: string): ExtractedMedicationCandidate {
    const uncertainFields: string[] = [];
    const lines = inputText.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    const firstLine = lines[0] || 'New Medication';

    // Basic heuristic: check for common dosage patterns
    const doseMatch = inputText.match(/(\d+\s*(?:mg|ml|mcg|tablets?|capsules?|puffs?))/i);
    const doseText = doseMatch ? doseMatch[1] : '1 tablet';
    if (!doseMatch) uncertainFields.push('doseText');

    // Check for times
    const times: string[] = [];
    if (/morning|breakfast/i.test(inputText)) times.push('08:00');
    if (/afternoon|lunch/i.test(inputText)) times.push('13:00');
    if (/evening|dinner|night/i.test(inputText)) times.push('20:00');
    if (times.length === 0) {
      times.push('09:00');
      uncertainFields.push('localTimes');
    }

    return {
      name: firstLine.replace(doseMatch ? doseMatch[0] : '', '').trim() || 'Medication',
      doseText,
      frequency: 'daily',
      localTimes: times,
      mealContext: /after\s+(?:breakfast|lunch|dinner|meals?)/i.test(inputText)
        ? 'After meals'
        : undefined,
      confidence: 0.5,
      uncertainFields,
      notes: 'Extracted with local heuristic parser (Gemini offline)',
    };
  }
}

export const geminiAdapter = new GeminiIntakeAdapter();
