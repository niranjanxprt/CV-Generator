import { z } from 'zod';

// Profile validation schemas
export const headerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  location: z.string().min(1, "Location is required").max(100, "Location too long"),
  phone: z.string().regex(/^[\+]?[0-9\s\-\(\)]+$/, "Invalid phone format"),
  email: z.string().email("Invalid email format"),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  github: z.string().url("Invalid GitHub URL").optional().or(z.literal(""))
});

export const bulletSchema = z.object({
  id: z.string(),
  categoryLabel: z.string().min(1, "Category label is required"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  keywords: z.array(z.string()).optional(),
  score: z.number().optional()
});

export const experienceSchema = z.object({
  id: z.string(),
  jobTitle: z.string().min(1, "Job title is required"),
  subtitle: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  location: z.string().min(1, "Location is required"),
  startDate: z.string().regex(/^\d{2}\/\d{4}$/, "Use MM/YYYY format"),
  endDate: z.string().regex(/^(\d{2}\/\d{4}|Heute|Present)$/, "Use MM/YYYY, 'Heute', or 'Present'"),
  bullets: z.array(bulletSchema).min(1, "At least one bullet point required")
});

export const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  description: z.string().min(1, "Skill description is required"),
  keywords: z.array(z.string())
});

export const skillCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  skills: z.array(skillSchema).min(1, "At least one skill required"),
  relevanceScore: z.number().optional()
});

export const educationSchema = z.object({
  id: z.string(),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().min(1, "Field is required"),
  institution: z.string().min(1, "Institution is required"),
  startDate: z.string().regex(/^\d{2}\/\d{4}$/, "Use MM/YYYY format"),
  endDate: z.string().regex(/^\d{2}\/\d{4}$/, "Use MM/YYYY format"),
  details: z.string().optional()
});

export const languageSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Language name is required"),
  proficiency: z.string().min(1, "Proficiency level is required")
});

export const referenceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Invalid email format")
});

export const profileSchema = z.object({
  header: headerSchema,
  summary: z.string().min(50, "Summary too short (minimum 50 characters)").max(500, "Summary too long (maximum 500 characters)"),
  experience: z.array(experienceSchema).min(1, "At least one experience entry required").max(10, "Too many experience entries"),
  education: z.array(educationSchema).min(1, "At least one education entry required"),
  skills: z.array(skillCategorySchema).min(1, "At least one skill category required"),
  languages: z.array(languageSchema).min(1, "At least one language required"),
  references: z.array(referenceSchema).min(1, "At least one reference required")
});

export const jobDescriptionSchema = z.string()
  .min(50, "Job description too short (minimum 50 characters)")
  .max(10000, "Job description too long (maximum 10,000 characters)");

// Type exports
export type ProfileFormData = z.infer<typeof profileSchema>;
export type HeaderFormData = z.infer<typeof headerSchema>;
export type ExperienceFormData = z.infer<typeof experienceSchema>;
export type SkillCategoryFormData = z.infer<typeof skillCategorySchema>;
export type EducationFormData = z.infer<typeof educationSchema>;
export type LanguageFormData = z.infer<typeof languageSchema>;
export type ReferenceFormData = z.infer<typeof referenceSchema>;