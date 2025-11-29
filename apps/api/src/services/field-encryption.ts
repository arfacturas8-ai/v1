import crypto from 'crypto';

export class FieldEncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor(encryptionKey?: string) {
    // Use provided key or generate from environment
    const keyString = encryptionKey || process.env.FIELD_ENCRYPTION_KEY || 
      crypto.randomBytes(32).toString('hex');
    
    // Ensure key is 32 bytes for AES-256
    this.key = Buffer.from(keyString.substring(0, 64), 'hex');
  }

  /**
   * Encrypt sensitive field data
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return iv:authTag:encrypted format
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt field data
   */
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Encrypt PII fields in an object
   */
  encryptObject(obj: any, fieldsToEncrypt: string[]): any {
    const encrypted = { ...obj };
    
    for (const field of fieldsToEncrypt) {
      if (obj[field]) {
        encrypted[field] = this.encrypt(String(obj[field]));
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt PII fields in an object
   */
  decryptObject(obj: any, fieldsToDecrypt: string[]): any {
    const decrypted = { ...obj };
    
    for (const field of fieldsToDecrypt) {
      if (obj[field]) {
        try {
          decrypted[field] = this.decrypt(obj[field]);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          decrypted[field] = obj[field]; // Keep encrypted if decryption fails
        }
      }
    }
    
    return decrypted;
  }

  /**
   * Hash data for indexing (one-way)
   */
  hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data + (process.env.HASH_SALT || 'cryb-platform'))
      .digest('hex');
  }

  /**
   * Generate encryption key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Singleton instance
export const fieldEncryption = new FieldEncryptionService();