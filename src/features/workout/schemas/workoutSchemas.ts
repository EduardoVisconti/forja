import { z } from 'zod';

export const templateSchema = z.object({
  name: z.string().min(1, 'workout.errors.nameRequired').max(50, 'workout.errors.nameTooLong'),
  type: z.enum(['gym', 'cardio']),
});

export const exerciseSchema = z.object({
  name: z.string().min(1, 'workout.errors.exerciseNameRequired').max(60, 'workout.errors.exerciseNameTooLong'),
  sets: z.number().int().min(1, 'workout.errors.minOne').max(99, 'workout.errors.tooHigh'),
  reps: z.string().min(1, 'workout.errors.minOne'),
  /** Weight entered in the user's display unit — converted to kg before saving */
  weight: z.number().min(0, 'workout.errors.minZero').max(9999, 'workout.errors.tooHigh'),
  restSeconds: z.number().int().min(0, 'workout.errors.minZero').max(3600, 'workout.errors.tooHigh'),
  notes: z.string().max(200, 'workout.errors.notesTooLong'),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;
export type ExerciseFormValues = z.infer<typeof exerciseSchema>;
