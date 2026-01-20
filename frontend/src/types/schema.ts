import { z } from "zod";

// Enums
export const SubmissionStatusEnum = z.enum([
  "pending",
  "submitted",
  "approved",
  "rejected",
  "failed",
]);

export const DirectoryStatusEnum = z.enum(["active", "inactive", "testing"]);

export type SubmissionStatus = z.infer<typeof SubmissionStatusEnum>;
export type DirectoryStatus = z.infer<typeof DirectoryStatusEnum>;

// SaaS Product Schemas
export const SaasProductSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required"),
  website_url: z.url("Must be a valid URL"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  short_description: z.string().max(500).optional().nullable(),
  category: z.string().optional().nullable(),
  logo_url: z.url().optional().nullable(),
  contact_email: z.email("Must be a valid email"),
  tagline: z.string().max(255).optional().nullable(),
  pricing_model: z.string().optional().nullable(),
  features: z.array(z.string()).optional().nullable(),
  social_links: z
    .object({
      twitter: z.string().optional(),
      facebook: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
    })
    .optional()
    .nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const SaasProductCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  website_url: z.url("Must be a valid URL"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  short_description: z.string().max(500).optional(),
  category: z.string().optional(),
  logo_url: z.url("Must be a valid URL").optional(),
  contact_email: z.email("Must be a valid email"),
  tagline: z.string().max(255).optional(),
  pricing_model: z.string().optional(),
  features: z.array(z.string()).optional(),
  social_links: z
    .object({
      twitter: z.url().optional(),
      linkedin: z.url().optional(),
      facebook: z.url().optional(),
      github: z.url().optional(),
    })
    .optional(),
});

export const SaasProductUpdateSchema = SaasProductCreateSchema.partial();

export type SaasProduct = z.infer<typeof SaasProductSchema>;
export type SaasProductCreate = z.infer<typeof SaasProductCreateSchema>;
export type SaasProductUpdate = z.infer<typeof SaasProductUpdateSchema>;

// Directory Schemas
export const DirectorySchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required"),
  url: z.url("Must be a valid URL"),
  submission_url: z.url().optional().nullable(),
  status: DirectoryStatusEnum,
  requires_login: z.boolean().optional(),
  login_url: z.string().optional().nullable(),
  login_username: z.string().optional().nullable(),
  login_password: z.string().optional().nullable(),
  is_multi_step: z.boolean().optional(),
  step_count: z.number().int().optional(),
  domain_authority: z.number().int().min(0).max(100).optional().nullable(),
  category: z.string().optional().nullable(),
  requires_approval: z.boolean(),
  estimated_approval_time: z.string().optional().nullable(),
  total_submissions: z.number().int(),
  successful_submissions: z.number().int(),
  detected_form_structure: z.array(z.any()).optional().nullable(),
  last_form_detection: z.string().optional().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const DirectoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  url: z.url("Must be a valid URL"),
  submission_url: z.url("Must be a valid URL").optional(),
  status: DirectoryStatusEnum.optional(),
  requires_login: z.boolean().optional(),
  login_url: z.string().optional(),
  login_username: z.string().optional(),
  login_password: z.string().optional(),
  is_multi_step: z.boolean().optional(),
  step_count: z.number().int().optional(),
  domain_authority: z.number().int().min(0).max(100).optional(),
  category: z.string().optional(),
  requires_approval: z.boolean().optional(),
  estimated_approval_time: z.string().optional(),
});

export const DirectoryUpdateSchema = DirectoryCreateSchema.partial();

export type Directory = z.infer<typeof DirectorySchema>;
export type DirectoryCreate = z.infer<typeof DirectoryCreateSchema>;
export type DirectoryUpdate = z.infer<typeof DirectoryUpdateSchema>;

// Submission Schemas
export const SubmissionSchema = z.object({
  id: z.number(),
  saas_product_id: z.number(),
  directory_id: z.number(),
  status: SubmissionStatusEnum,
  submitted_at: z.coerce.date().optional().nullable(),
  approved_at: z.coerce.date().optional().nullable(),
  rejected_at: z.coerce.date().optional().nullable(),
  submission_data: z.array(z.any()).optional().nullable(),
  response_message: z.string().optional().nullable(),
  listing_url: z.url().optional().nullable(),
  retry_count: z.number().int(),
  max_retries: z.number().int(),
  last_retry_at: z.coerce.date().optional().nullable(),
  error_log: z
    .array(
      z.object({
        timestamp: z.coerce.date(),
        error: z.string(),
      }),
    )
    .optional()
    .nullable(),
  detected_fields: z.array(z.any()).optional().nullable(),
  form_screenshot_url: z.string().optional().nullable(),
  current_step: z.number().int().optional(),
  completed_steps: z.array(z.number()).optional().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const SubmissionWithDetailsSchema = SubmissionSchema.extend({
  saas_product: SaasProductSchema,
  directory: DirectorySchema,
});

export const SubmissionCreateSchema = z.object({
  saas_product_id: z.number().int().positive(),
  directory_id: z.number().int().positive(),
});

export const BulkSubmissionRequestSchema = z.object({
  saas_product_id: z.number().int().positive(),
  directory_ids: z
    .array(z.number().int().positive())
    .min(1, "Select at least one directory"),
});

export type Submission = z.infer<typeof SubmissionSchema>;
export type SubmissionWithDetails = z.infer<typeof SubmissionWithDetailsSchema>;
export type SubmissionCreate = z.infer<typeof SubmissionCreateSchema>;
export type BulkSubmissionRequest = z.infer<typeof BulkSubmissionRequestSchema>;

// Dashboard Stats Schema
export const DashboardStatsSchema = z.object({
  total_submissions: z.number().int(),
  pending_submissions: z.number().int(),
  submitted_submissions: z.number().int(),
  approved_submissions: z.number().int(),
  failed_submissions: z.number().int(),
  success_rate: z.number(),
  total_directories: z.number().int(),
  active_directories: z.number().int(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// API Response Types
export type ApiResponse<T> = {
  data: T;
  status: number;
};

export type ApiError = {
  detail: string;
  status?: number;
};

// Filter Types
export interface SubmissionFilters {
  status?: SubmissionStatus;
  saas_product_id?: number;
  directory_id?: number;
  skip?: number;
  limit?: number;
  search?: string;
}

export interface DirectoryFilters {
  status?: DirectoryStatus;
  skip?: number;
  limit?: number;
}
