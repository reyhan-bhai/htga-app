import { randomInt } from "crypto";

/**
 * Generate a secure random password with guaranteed character diversity
 * @param length - Length of the password (default: 12)
 * @returns Secure random password string
 */
export function generateSecurePassword(length: number = 12): string {
  if (length < 8) {
    throw new Error("Password length must be at least 8 characters");
  }

  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = uppercase + lowercase + digits + symbols;

  let password = "";

  // Ensure at least one character from each category
  password += uppercase[randomInt(0, uppercase.length)];
  password += lowercase[randomInt(0, lowercase.length)];
  password += digits[randomInt(0, digits.length)];
  password += symbols[randomInt(0, symbols.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[randomInt(0, allChars.length)];
  }

  // Fisher-Yates shuffle algorithm
  const passwordArray = password.split("");
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join("");
}
