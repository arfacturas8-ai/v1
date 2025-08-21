import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(30).optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  password: z.string().min(8).optional(),
}).refine(
  (data) => data.email || data.username || data.walletAddress,
  "Either email, username, or wallet address must be provided"
);

export const RegisterSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  displayName: z.string().min(1).max(50),
  password: z.string().min(8).optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
}).refine(
  (data) => data.email || data.walletAddress,
  "Either email or wallet address must be provided"
);

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;