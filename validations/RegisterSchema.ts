import z from "zod";
import { messages } from "../constants/messages";

export const RegisterSchema = z.object({
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  password: z
    .string()
    .min(12, {
      message: messages.password.length,
    })
    .refine((val) => /[A-Z]/.test(val), {
      message: messages.password.uppercase,
    })
    .refine((val) => /[0-9]/.test(val), {
      message: messages.password.digit,
    })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
      message: messages.password.special,
    }),
  files: z.array(z.any()),
});

export type RegisterSchema = z.infer<typeof RegisterSchema>;
