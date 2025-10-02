import { z } from "zod";

export const proposalLineItemSchema = z.object({
  itemId: z.string().min(1),
  sku: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  unitNet: z.number().nonnegative(),
  devHours: z.number().nonnegative(),
});

export const proposalTotalsSchema = z.object({
  monthly: z.number().nonnegative(),
  hours: z.number().nonnegative(),
  oneShot: z.number().nonnegative().optional(),
});

export const createProposalRequestSchema = z.object({
  companyName: z.string().min(1),
  country: z.string().min(1),
  countryId: z.string().min(1),
  subsidiary: z.string().min(1),
  subsidiaryId: z.string().min(1),
  totals: proposalTotalsSchema,
  items: z.array(proposalLineItemSchema).min(1),
  userId: z.string().min(1).optional(),
  userEmail: z.string().email().optional(),
  pipedrive: z
    .object({
      link: z.string().min(1).optional().nullable(),
      dealId: z.string().min(1).optional().nullable(),
    })
    .optional(),
});

export type ProposalLineItemInput = z.infer<typeof proposalLineItemSchema>;
export type CreateProposalRequest = z.infer<typeof createProposalRequestSchema>;
