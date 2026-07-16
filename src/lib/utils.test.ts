import { describe, expect, test } from "bun:test";
import {
  formatNaira,
  isAccountNameValid,
  maskPhone,
  maskEmail,
  maskAccountNumber,
  maskCardNumber,
} from "./utils";

describe("formatNaira", () => {
  test("formats a valid amount", () => expect(formatNaira(1000)).toBe("₦1,000.00"));
  test("returns ₦0.00 for undefined", () => expect(formatNaira(undefined)).toBe("₦0.00"));
  test("returns ₦0.00 for 0", () => expect(formatNaira(0)).toBe("₦0.00"));
});

describe("isAccountNameValid", () => {
  test("valid name returns true", () => expect(isAccountNameValid("John Doe")).toBe(true));
  test("null returns false", () => expect(isAccountNameValid(null)).toBe(false));
  test("Account Not Found returns false", () => expect(isAccountNameValid("Account Not Found")).toBe(false));
  test("error string returns false", () => expect(isAccountNameValid("error occurred")).toBe(false));
});

describe("maskPhone", () => {
  test("masks all but last 4 digits", () => expect(maskPhone("08012345678")).toBe("+234 ••• ••• 5678"));
  test("returns placeholder for undefined", () => expect(maskPhone()).toBe("+234 ••• ••• 1234"));
});

describe("maskEmail", () => {
  test("masks email name", () => expect(maskEmail("user@example.com")).toBe("u••••@example.com"));
  test("returns placeholder for undefined", () => expect(maskEmail()).toBe("u••••@example.com"));
});

describe("maskAccountNumber", () => {
  test("masks all but last 4", () => expect(maskAccountNumber("1234567890")).toBe("••••7890"));
  test("returns placeholder for undefined", () => expect(maskAccountNumber()).toBe("••••1234"));
});

describe("maskCardNumber", () => {
  test("masks all but last 4", () => expect(maskCardNumber("4111111111111234")).toBe("•••• •••• •••• 1234"));
  test("returns placeholder for undefined", () => expect(maskCardNumber()).toBe("•••• •••• •••• 1234"));
});
