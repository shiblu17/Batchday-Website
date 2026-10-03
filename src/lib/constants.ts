export const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export const PAYMENT_NUMBERS = {
  bkash: "01XXXXXXXXX",
  nagad: "01XXXXXXXXX",
} as const;

export const ADMIN_EMAILS = [
  "atiquzzaman116592@gmail.com",
] as const;

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email.toLowerCase().trim());
};

