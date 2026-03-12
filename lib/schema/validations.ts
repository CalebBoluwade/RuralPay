import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Please enter your Phone number, Email, or Username"),
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
    username: z
      .string("Enter a Username")
      .min(3, "Username must be at least 3 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    email: z.email("Invalid Email Address"),
    phoneNumber: z
      .string("Enter a Phone Number")
      .min(10, "Phone number must be at least 10 digits"),
    password: z
      .string("Enter a Password")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string("Confirm Password"),
    isMerchant: z.boolean().optional(),
    businessName: z.string().optional(),
    businessAddress: z.string().optional(),
    businessType: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export const ContactSearchSchema = z.object({
  phoneNumber: z.string().min(3, "Enter A Valid Phone Number"),
});

export type ContactSearch = z.infer<typeof ContactSearchSchema>;

export const transferSchema = z.object({
  bankCode: z.string().min(3, "Please select a bank"),
  accountNumber: z
    .string()
    .min(10, "Account number must be 10 digits")
    .max(10, "Account number must be 10 digits")
    .regex(/^[0-9]+$/, "Account number must contain only digits"),
  fromAccount: z.string(),
  amount: z.string().refine((val) => {
    const num = Number.parseFloat(val);
    return !Number.isNaN(num);
  }, "Please Enter A Valid Amount"),
  narration: z.string(),
});

export type TransferFormData = z.infer<typeof transferSchema>;

export const cardPaySchema = z.object({
  cardId: z.string(),
  amount: z.string().refine((val) => {
    const num = Number.parseFloat(val);
    return !Number.isNaN(num);
  }, "Please Enter A Valid Amount"),
});

export type CardPaySchema = z.infer<typeof cardPaySchema>;
