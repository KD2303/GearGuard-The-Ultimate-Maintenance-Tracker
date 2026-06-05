const crypto = require('crypto');

/**
 * Transparent field-level encryption for sensitive Mongoose string fields.
 * Supports Key Rotation by looking up the key based on the prefix version.
 */

const ALGORITHM = 'aes-256-gcm';

// Configuration State
let keyRegistry = null;
let primaryVersion = 'v1';

/**
 * Initialize and retrieve the key registry.
 */
function getKeys() {
  if (keyRegistry) return keyRegistry;
  
  keyRegistry = {};

  const keysEnv = process.env.MAINTENANCE_LOG_ENCRYPTION_KEYS;
  if (keysEnv) {
    try {
      const parsed = JSON.parse(keysEnv);
      for (const [v, hex] of Object.entries(parsed)) {
        if (hex && hex.length >= 64) {
          keyRegistry[v] = Buffer.from(hex.slice(0, 64), 'hex');
        }
      }
    } catch (e) {
      console.error('[fieldEncryption] Failed to parse MAINTENANCE_LOG_ENCRYPTION_KEYS as JSON');
    }
  }

  // Fallback for local development or legacy configuration
  if (Object.keys(keyRegistry).length === 0) {
    const explicit = process.env.MAINTENANCE_LOG_ENCRYPTION_KEY;
    if (explicit && explicit.length >= 64) {
      keyRegistry['v1'] = Buffer.from(explicit.slice(0, 64), 'hex');
    } else {
      const fallbackSecret = process.env.JWT_SECRET;
      if (fallbackSecret) {
        keyRegistry['v1'] = crypto.createHash('sha256').update(fallbackSecret).digest();
      }
    }
  }

  primaryVersion = process.env.PRIMARY_ENCRYPTION_VERSION || 'v1';
  if (!keyRegistry[primaryVersion]) {
    // Default to the first available key if primary is not found
    primaryVersion = Object.keys(keyRegistry)[0] || 'v1';
  }

  return keyRegistry;
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith('enc:v');
}

function encryptField(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext;
  }

  const keys = getKeys();
  const key = keys[primaryVersion];
  if (!key) {
    return plaintext;
  }

  // If already encrypted with the target primary version, return it unchanged.
  if (isEncrypted(plaintext)) {
    if (plaintext.startsWith(`enc:${primaryVersion}:`)) {
      return plaintext;
    }
    // If it's encrypted but NOT with the primary version, we must decrypt it first before re-encrypting.
    // However, Mongoose getters should have already decrypted it if accessed via normal means.
    // If we somehow get a raw encrypted string of another version here, we decrypt it.
    plaintext = decryptField(plaintext);
    if (isEncrypted(plaintext)) {
      // Decryption failed, we should NOT re-encrypt a broken ciphertext. Return as is.
      return plaintext;
    }
  }

  const IV_BYTES = 12;
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `enc:${primaryVersion}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptField(value) {
  if (!isEncrypted(value)) {
    return value; // Legacy plaintext or empty value
  }

  const keys = getKeys();
  try {
    // Format: enc:vX:<iv>:<authTag>:<data>
    const parts = value.split(':');
    if (parts.length !== 5) return value; // Invalid format

    const [, version, ivHex, authTagHex, dataHex] = parts;
    const key = keys[version];
    if (!key) {
      console.warn(`[fieldEncryption] Key version '${version}' not found in registry. Returning ciphertext.`);
      return value;
    }

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

// Ensure the registry is loaded immediately on module require if available
getKeys();

module.exports = {
  encryptField,
  decryptField,
  isEncrypted,
};
