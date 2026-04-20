/**
 * vaultCrypto.js
 * --------------
 * Client-side encryption for the DNA Vault key vault using the browser's
 * WebCrypto API (no external libraries needed).
 *
 *   Key derivation:  PBKDF2-SHA256, 200,000 iterations
 *   Encryption:      AES-GCM 256-bit (authenticated encryption)
 *   Randomness:      crypto.getRandomValues (CSPRNG)
 *
 * The user's password is the ONLY thing that can decrypt their vault.
 * The server only ever sees opaque ciphertext. This is the same model
 * used by Bitwarden / 1Password / ProtonMail.
 */

const PBKDF2_ITERATIONS = 200000;

// --------- base64 helpers ---------
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function randomBytes(n) {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return arr;
}

// --------- key derivation ---------
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a retrieval key with the user's password.
 * Returns base64 strings ready to send to the backend.
 */
export async function encryptKey(plaintextKey, password) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt);

  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintextKey)
  );

  return {
    encrypted_key: toBase64(ciphertext),
    iv: toBase64(iv),
    salt: toBase64(salt),
  };
}

/**
 * Decrypt a single vault entry (from GET /vault/list).
 * Throws if the password is wrong — AES-GCM's auth tag fails.
 */
export async function decryptKey(entry, password) {
  const salt = fromBase64(entry.salt);
  const iv = fromBase64(entry.iv);
  const ciphertext = fromBase64(entry.encrypted_key);
  const key = await deriveKey(password, salt);

  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plain);
}

/**
 * Decrypt every entry. Individual failures are caught so one bad entry
 * doesn't kill the whole list. Failed entries come back with decrypted=null.
 */
export async function decryptAll(entries, password) {
  const out = [];
  for (const entry of entries) {
    try {
      const plaintext = await decryptKey(entry, password);
      out.push({ ...entry, decrypted: plaintext });
    } catch (_) {
      out.push({ ...entry, decrypted: null });
    }
  }
  return out;
}
