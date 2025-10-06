import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required for secure token storage. ' +
      'Generate a key with: openssl rand -hex 32'
    );
  }
  
  if (key.length < 64) {
    throw new Error('ENCRYPTION_KEY must be at least 32 bytes (64 hex characters)');
  }
  
  return key;
}

const ENCRYPTION_KEY = getEncryptionKey();

export interface EncryptedData {
  encrypted: string;
  salt: string;
}

export function encryptToken(plainText: string): EncryptedData {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const combined = iv.toString('hex') + ':' + encrypted;
  
  return {
    encrypted: combined,
    salt: salt,
  };
}

export function decryptToken(encryptedData: string, salt: string): string {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
    
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt token');
  }
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
