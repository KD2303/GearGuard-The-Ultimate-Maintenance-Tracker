const crypto = require('crypto');

/**
 * Transparent field-level encryption for sensitive Mongoose string fields.
 *
 * Maintenance notes contain repair findings, safety observations and cost
 * commentary that were stored in plaintext. A database snapshot or backup leak
 * exposed all of it. This module provides AES-256-GCM authenticated encryption
 * that can be attached to a schema path via get and set functions, so the
 * controllers and the rest of the app continue to read and write plain strings.
 *
 * Encrypted values are tagged with a versioned prefix so that:
 *  - decrypt can tell an encrypted value from a legacy plaintext value, which
 *    keeps existing documents readable during a gradual migration;
 *  - the format can evolve in future without ambiguity.
 *
 * Format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'enc:v1:';
const IV_BYTES = 12; // 96-bit nonce recommended for GCM

let cachedKey = null;

/**
 * Derive a stable 32-byte key. A dedicated key is preferred; if it is not set
 * the function falls back to deriving one from JWT_SECRET so the feature still
 * works in development. Returns null when no secret material is available, in
 * which case encryption is skipped and values pass through unchanged.
 */
function getKey() {
  if (cachedKey) return cachedKey;

  const explicit = process.env.MAINTENANCE_LOG_ENCRYPTION_KEY;
  if (explicit && explicit.length >= 64) {
    cachedKey = Buffer.from(explicit.slice(0, 64), 'hex');
    return cachedKey;
  }

  const fallbackSecret = process.env.JWT_SECRET;
  if (fallbackSecret) {
    cachedKey = crypto.createHash('sha256').update(fallbackSecret).digest();
    return cachedKey;
  }

  return null;
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

function encryptField(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext;
  }

  // Avoid double encryption if a value is written back unchanged.
  if (isEncrypted(plaintext)) {
    return plaintext;
  }

  const key = getKey();
  if (!key) {
    return plaintext;
  }

  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptField(value) {
  if (!isEncrypted(value)) {
    // Legacy plaintext or empty value: return as is.
    return value;
  }

  const key = getKey();
  if (!key) {
    return value;
  }

  try {
    const [, , ivHex, authTagHex, dataHex] = value.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('[fieldEncryption] Failed to decrypt value:', error.message);
    return value;
  }
}

module.exports = {
  encryptField,
  decryptField,
  isEncrypted,
  PREFIX,
};
