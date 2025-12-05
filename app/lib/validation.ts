// Input validation and sanitization utilities

/**
 * Sanitize text input - removes potentially dangerous characters
 * Allows: letters, numbers, spaces, common punctuation, emojis
 */
export const sanitizeText = (input: string): string => {
  return input
    .trim()
    // Remove potentially dangerous characters
    .replace(/[<>{}\\\/\[\]`$]/g, '')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Collapse multiple spaces into one
    .replace(/\s+/g, ' ');
};

/**
 * Validate and sanitize group name
 * Max 30 chars, no dangerous characters
 */
export const sanitizeGroupName = (name: string): string => {
  return sanitizeText(name).slice(0, 30);
};

/**
 * Validate group name meets requirements
 */
export const isValidGroupName = (name: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeText(name);
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Group name must be at least 2 characters' };
  }
  
  if (sanitized.length > 30) {
    return { valid: false, error: 'Group name cannot exceed 30 characters' };
  }
  
  // Check for suspicious patterns (script injection, etc.)
  const suspiciousPatterns = /javascript:|data:|on\w+\s*=/i;
  if (suspiciousPatterns.test(sanitized)) {
    return { valid: false, error: 'Invalid characters in group name' };
  }
  
  return { valid: true };
};

/**
 * Sanitize username
 * Alphanumeric + underscore only, 3-20 chars
 */
export const sanitizeUsername = (username: string): string => {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
};

/**
 * Validate username
 */
export const isValidUsername = (username: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeUsername(username);
  
  if (sanitized.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (sanitized.length > 20) {
    return { valid: false, error: 'Username cannot exceed 20 characters' };
  }
  
  if (!/^[a-z0-9_]+$/.test(sanitized)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true };
};

/**
 * Sanitize pick reasoning / comments
 * Max 280 chars (tweet-length)
 */
export const sanitizeReasoning = (text: string): string => {
  return sanitizeText(text).slice(0, 280);
};

/**
 * Sanitize email (basic cleanup)
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};