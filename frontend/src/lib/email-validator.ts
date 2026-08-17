/**
 * Utility for enforcing an allowlist of legitimate email domains.
 * This list restricts signups to well-known, authentic email providers to prevent temp/spam accounts.
 */

const ALLOWED_DOMAINS = new Set([
  'gmail.com',
  'google.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'zoho.in',
  'yandex.com',
  'gmx.com',
  'mail.com'
]);

/**
 * Checks if the given email address is from an explicitly allowed domain.
 * @param email The email address to check
 * @returns true if the email domain is in our strict allowlist, false otherwise.
 */
export function isAllowedEmailDomain(email: string): boolean {
  try {
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (!domain) return false;
    
    // Check if the domain is strictly in our allowed list
    return ALLOWED_DOMAINS.has(domain);
  } catch (error) {
    console.error("Error validating email domain", error);
    return false; // Fail securely
  }
}
