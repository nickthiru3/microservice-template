import { z } from "zod";
import type { TDealCategory } from "./types";

export const categoryEnum = [
  "foodDrink",
  "bathroom",
  "jewelery",
  "sports",
  "tech",
  "auto",
  "entertainment",
  "travel",
] as const satisfies Readonly<TDealCategory[]>;

export const dealPayloadSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(255),
  originalPrice: z.coerce.number().gte(1),
  discount: z.coerce.number().min(0).max(100),
  logoFileKey: z.string().min(1),
  category: z.enum(categoryEnum),
  // ISO 8601 date-time validation without deprecated helpers
  expiration: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "Invalid ISO 8601 date-time",
    }),
});

export type TCreateDealPayload = z.infer<typeof dealPayloadSchema>;
