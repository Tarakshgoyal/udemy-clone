import { z } from 'zod';

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Please enter a valid email').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['USER', 'CREATOR']).default('USER'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const CourseSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  originalPrice: z.coerce.number().min(0).optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).default('All Levels'),
  language: z.string().default('English'),
  topicId: z.string().uuid('Invalid topic').optional(),
  thumbnailUrl: z.string().url().optional(),
  previewVideoUrl: z.string().url().optional(),
  whatYouLearn: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
});

export const SectionSchema = z.object({
  title: z.string().min(3, 'Section title must be at least 3 characters'),
  courseId: z.string().uuid(),
});

export const LectureSchema = z.object({
  title: z.string().min(3, 'Lecture title must be at least 3 characters'),
  sectionId: z.string().uuid(),
  videoUrl: z.string().url().optional(),
  duration: z.coerce.number().min(0).default(0),
  isFree: z.boolean().default(false),
  description: z.string().optional(),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CourseInput = z.infer<typeof CourseSchema>;

export type FormState<T = undefined> = {
  errors?: Partial<Record<string, string[]>>;
  message?: string;
  data?: T;
} | undefined;
