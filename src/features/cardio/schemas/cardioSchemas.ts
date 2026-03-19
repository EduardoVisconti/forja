import { z } from 'zod';

export const TRAINING_TYPES = ['regenerative', 'intervals', 'long', 'walk'] as const;
export const CARDIO_ZONES = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;

const baseCardioSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'cardio.errors.invalidDate'),
  trainingType: z.enum(TRAINING_TYPES).nullable(),
  zone: z.enum(CARDIO_ZONES).nullable(),
  durationMinutes: z
    .number()
    .int()
    .min(1, 'cardio.errors.minOne')
    .max(1440, 'cardio.errors.tooHigh'),
  /** Entered in user's display unit; converted to km before saving */
  distance: z
    .number()
    .min(0, 'cardio.errors.minZero')
    .max(9999, 'cardio.errors.tooHigh'),
  avgPace: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/, 'cardio.errors.invalidPace'),
  avgHr: z
    .number()
    .int()
    .min(30, 'cardio.errors.minThirty')
    .max(250, 'cardio.errors.tooHigh')
    .nullable(),
  notes: z.string().max(500, 'cardio.errors.notesTooLong'),
});

export const cardioSchema = baseCardioSchema.refine(
  (data) => data.trainingType !== null || data.zone !== null,
  { message: 'cardio.errors.selectOne', path: ['trainingType'] },
);

export type CardioFormValues = z.infer<typeof baseCardioSchema>;
