/**
 * Google Translate Integration Engine for Krishaka
 * Uses Google's free translation infrastructure to translate every single word,
 * sub-module, dropdown option, card, table, and modal on the entire page.
 */

// Available Indian languages supported by Google Translate
export const GOOGLE_TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
];

/**
 * Sets cookies for Google Translate to target language
 */
function setGoogleTranslateCookie(langCode) {
  const hostname = window.location.hostname;
  const cookieVal = langCode === 'en' ? '' : `/en/${langCode}`;
  const expiry = langCode === 'en' ? 'Thu, 01 Jan 1970 00:00:00 UTC' : 'Fri, 31 Dec 9999 23:59:59 GMT';

  // Set on root path
  document.cookie = `googtrans=${cookieVal}; expires=${expiry}; path=/;`;

  // Set on current domain and with leading dot
  if (hostname && hostname !== 'localhost') {
    document.cookie = `googtrans=${cookieVal}; expires=${expiry}; path=/; domain=${hostname};`;
    document.cookie = `googtrans=${cookieVal}; expires=${expiry}; path=/; domain=.${hostname};`;
  }
}

/**
 * Programmatically triggers Google Translate DOM element to translate all page contents
 */
export function applyGoogleTranslate(langCode) {
  if (!langCode) return;

  try {
    // 1. Set the cookie for persistent translation across route transitions & reloads
    setGoogleTranslateCookie(langCode);

    // 2. Trigger Google Translate dropdown widget in the DOM if ready
    const triggerDropdown = () => {
      const selectElement = document.querySelector('.goog-te-combo');
      if (selectElement) {
        selectElement.value = langCode;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    };

    if (!triggerDropdown()) {
      // Poll every 100ms for up to 3.5 seconds in case Google script is still initializing
      let checks = 0;
      const pollTimer = setInterval(() => {
        checks++;
        if (triggerDropdown() || checks > 35) {
          clearInterval(pollTimer);
        }
      }, 100);
    }

    // 3. Dispatch custom window event so listeners can update translation state
    window.dispatchEvent(
      new CustomEvent('krishaka:google-translate-change', {
        detail: { language: langCode },
      })
    );
  } catch (err) {
    console.warn('Google Translate trigger notice:', err);
  }
}

/**
 * Translates a single text or batch of texts using the server-side Google Gemini Translation API
 * @param {string | string[]} input - text or array of texts
 * @param {string} targetLanguage - language code (hi, mr, bn, te, ta, kn, etc.)
 */
export async function translateWithGoogleApi(input, targetLanguage = 'hi') {
  try {
    const isArray = Array.isArray(input);
    const payload = isArray ? { texts: input, targetLanguage } : { text: input, targetLanguage };

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      return isArray ? data.translations : data.translation;
    }
    return input;
  } catch (error) {
    console.warn('Google API translation fallback to original:', error);
    return input;
  }
}
