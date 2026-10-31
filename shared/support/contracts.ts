import { z } from 'zod';
export const supportCategorySchema = z.enum(['technical', 'feature', 'support']);
export const supportStatusSchema = z.enum(['new', 'in_review', 'resolved']);
export type SupportCategory = z.infer<typeof supportCategorySchema>;
export const supportMessageSchema = z.object({ id: z.string(), body: z.string(), sender: z.enum(['user', 'admin']), createdAt: z.string().datetime({ offset: true }) });
// Explicit allowlist: internal notes and staff-only fields never reach a learner.
export const supportTicketSchema = z.object({
  id: z.string(), category: supportCategorySchema, educationLevel: z.enum(['primary', 'secondary']), language: z.enum(['en', 'sw']),
  subject: z.string(), body: z.string(), status: supportStatusSchema, createdAt: z.string().datetime({ offset: true }), messages: z.array(supportMessageSchema).default([]),
});
export type SupportTicket = z.infer<typeof supportTicketSchema>;
const count = z.object({ total: z.number().int().nonnegative(), new: z.number().int().nonnegative() });
export const supportListSchema = z.object({ items: z.array(supportTicketSchema), total: z.number().int().nonnegative(), counts: z.object({ technical: count, feature: count, support: count }) });
export const createSupportSchema = z.object({ category: supportCategorySchema, educationLevel: z.enum(['primary', 'secondary']), language: z.enum(['en', 'sw']), subject: z.string().trim().min(1).max(150), body: z.string().trim().min(1).max(5000) });
export const supportReplySchema = z.object({ body: z.string().trim().min(1).max(5000) });
export const supportQuerySchema = z.object({ category: supportCategorySchema.optional(), status: supportStatusSchema.optional(), search: z.string().trim().max(200).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(10) });
