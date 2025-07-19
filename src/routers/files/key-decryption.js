const crypto = require("crypto");

const algorithm = "aes-256-cbc"; //  A common and secure encryption algorithm.

// Ensure your SECRET_KEY is a Buffer of the correct size (32 bytes for AES-256).
const secretKey = process.env.S3_PASSCODE;

if (!secretKey) {
  throw new Error(
    "Secret Key environment variable is missing or invalid. It must be 32 characters long for AES-256-CBC."
  );
}

// Function to encrypt a string
function encryptString(plainText) {
  const iv = crypto.randomBytes(16); // Generate a random Initialization Vector (IV) for each encryption.
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv); // Create a cipher using AES-256-CBC with the key and IV.
  let encrypted = cipher.update(plainText, "utf8", "hex"); // Encrypt data and update.
  encrypted += cipher.final("hex"); // Finalize encryption.
  return iv.toString("hex") + ":" + encrypted; //  Combine IV and encrypted data for storage, separated by a colon.
}

// Function to decrypt a string
function decryptString(encryptedText) {
  const parts = encryptedText.split(":"); // Split the IV and encrypted text.
  const iv = Buffer.from(parts.shift(), "hex"); // Convert IV back to a Buffer.
  const encryptedTextBuffer = Buffer.from(parts.join(":"), "hex"); // Convert encrypted text back to a Buffer.
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey),
    iv
  ); // Create a decipher using the same algorithm, key, and IV.
  let decrypted = decipher.update(encryptedTextBuffer, "hex", "utf8"); // Decrypt and update.
  decrypted += decipher.final("utf8"); // Finalize decryption.
  return decrypted; // Return the decrypted string.
}

module.exports = { encryptString, decryptString };
