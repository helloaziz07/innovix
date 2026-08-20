import fpPromise from '@fingerprintjs/fingerprintjs'

/**
 * Initializes FingerprintJS and returns a unique visitor ID (device_id).
 * We cache the result so we don't re-calculate the fingerprint multiple times per session.
 */
let visitorIdCache: string | null = null

export const getDeviceId = async (): Promise<string> => {
  if (visitorIdCache) return visitorIdCache
  
  try {
    const fp = await fpPromise.load()
    const result = await fp.get()
    visitorIdCache = result.visitorId
    return visitorIdCache
  } catch (error) {
    console.error('Failed to generate device fingerprint:', error)
    // Fallback: Generate a random UUID and store it in localStorage if fingerprinting fails
    // This is not as secure as real fingerprinting, but ensures the app doesn't break
    let fallbackId = localStorage.getItem('fallback_device_id')
    if (!fallbackId) {
      fallbackId = `fb-${crypto.randomUUID()}`
      localStorage.setItem('fallback_device_id', fallbackId)
    }
    return fallbackId
  }
}
