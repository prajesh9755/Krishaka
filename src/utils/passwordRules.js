/**
 * Simple password validation rules
 * Plain JavaScript function (just like C or Java functions)
 */

/**
 * Checks each password condition:
 * 1. At least 8 characters
 * 2. At least one lowercase letter (a-z)
 * 3. At least one uppercase letter (A-Z)
 * 4. At least one number (0-9)
 * 5. At least one special symbol (@, #, $, %, etc.)
 */
export function checkPasswordRules(password) {
  const pass = password || '';
  const hasMinLength = pass.length >= 8;
  const hasLowerCase = /[a-z]/.test(pass);
  const hasUpperCase = /[A-Z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSymbol = /[^A-Za-z0-9]/.test(pass);

  const isValid = hasMinLength && hasLowerCase && hasUpperCase && hasNumber && hasSymbol;

  return {
    hasMinLength,
    hasLowerCase,
    hasUpperCase,
    hasNumber,
    hasSymbol,
    isValid,
  };
}

/**
 * Returns a simple error string if invalid, or null if valid.
 */
export function getPasswordValidationError(password) {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z).';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z).';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number (0-9).';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special symbol (e.g. @, #, $, %, !).';
  }
  return null;
}
