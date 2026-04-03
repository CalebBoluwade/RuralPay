import { z } from "zod";

// Define a reusable password regex for consistency
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const loginSchema = z.object({
  identifier: z.string().min(3, "Enter Your Phone Number, Email, or Username"),
  password: z.string().min(6, "Password Must Be At Least 6 Characters"),
});

export const registerSchema = z
  .object({
    firstName: z
      .string("Enter a First Name")
      .min(2, "First Name Must be at least 2 characters"),
    lastName: z
      .string("Enter a Last Name")
      .min(2, "Last Name Must be at least 2 characters"),
    username: z
      .string("Enter a Username")
      .min(3, "Username Must be at least 3 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    email: z.email("Invalid Email Address"),
    phoneNumber: z
      .string("Enter a Phone Number")
      .min(10, "Phone Number Must Be At Least 10 Digits")
      .max(11, "Phone Number Must Be At Most 11 Digits"),
    BVN: z
      .string("Enter Your BVN")
      .min(11, "BVN Must Be 11 Digits")
      .max(11, "BVN Must Be 11 Digits")
      .regex(/^[0-9]+$/, "BVN must contain only digits"),
    password: z
      .string("Enter A Password")
      .min(8, "Password Must Be At Least 8 Characters")
      .regex(
        passwordRegex,
        "Password Must Include Uppercase, Lowercase, a Number, and a Special Character",
      ),
    confirmPassword: z.string("Confirm Password"),
    isMerchant: z.boolean().optional(),
    businessName: z.string().optional(),
    businessAddress: z.string().optional(),
    businessType: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords Don't Match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .min(3, "Please Enter your phone number, email or username"),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string("Enter A Password")
      .min(8, "Password Must Be At Least 8 Characters")
      .regex(
        passwordRegex,
        "Password must include uppercase, lowercase, a number, and a special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export const UserFeedBackSchema = z.object({
  email: z.email().optional(),
  mostLovedFeature: z
    .string("Please Select a Feature")
    .min(5, "Please Select a Feature"),
  mostHatedFeature: z
    .string("Please Select a Feature")
    .min(5, "Please Select a Feature"),
  niceHaveFeature: z
    .string("Please Select a Feature")
    .min(5, "Please Select a Feature"),
  generalFeedback: z.string("Please Select a Feature").min(10),
});

export type UserFeedBack = z.infer<typeof UserFeedBackSchema>;

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
