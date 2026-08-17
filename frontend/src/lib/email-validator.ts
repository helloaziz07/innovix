/**
 * Utility for detecting disposable and temporary email domains.
 * This list includes common services like Mailinator, Temp-Mail, GuerrillaMail, etc.
 */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'poke.email',
  'spam4.me',
  '10minutemail.com',
  '10minutemail.net',
  'temp-mail.org',
  'tempmail.com',
  'tempmail.net',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'maildrop.cc',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'trashmail.me',
  'dispostable.com',
  'getairmail.com',
  'nada.email',
  'nada.ltd',
  'getnada.com',
  'tempail.com',
  'mohmal.com',
  'mohmal.in',
  'emailondeck.com',
  'minuteinbox.com',
  'fakeinbox.com',
  'fleckens.hu',
  'inboxbear.com',
  'dropmail.me',
  '10mail.org',
  'yandex.com', // Sometimes used for bulk spam, but legit. Remove if needed. We will keep only strict disposable.
  'generator.email',
  'mailforspam.com',
  'mailcatch.com',
]);

/**
 * Checks if the given email address is from a known disposable provider.
 * @param email The email address to check
 * @returns true if the email is from a known disposable domain, false otherwise.
 */
export function isDisposableEmail(email: string): boolean {
  try {
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (!domain) return false;
    
    // Check against exact domain matches
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return true;
    }

    // Optional: add regex for very common temporary mail patterns if needed
    // e.g. checking for 'temp', 'disposable', 'trash' in the domain itself
    if (/temp.*mail|mail.*temp|disposable|trashmail|10minute/i.test(domain)) {
        return true;
    }

    return false;
  } catch (error) {
    console.error("Error validating email domain", error);
    return false;
  }
}
