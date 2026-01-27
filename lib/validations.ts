import { z } from "zod";

export const loginSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    firstName: z
      .string("Enter a First Name")
      .min(2, "First name must be at least 2 characters"),
    lastName: z
      .string("Enter a Last Name")
      .min(2, "Last name must be at least 2 characters"),
    email: z.email("Invalid Email Address"),
    phoneNumber: z
      .string("Enter a Phone Number")
      .min(10, "Phone number must be at least 10 digits"),
    password: z
      .string("Enter a Password")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string("Confirm Password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
