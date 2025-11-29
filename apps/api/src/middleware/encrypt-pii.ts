import { FastifyRequest, FastifyReply } from 'fastify';
import { fieldEncryption } from '../services/field-encryption';

// Fields to encrypt in different models
const ENCRYPTION_MAP = {
  user: ['email', 'phoneNumber', 'ipAddress'],
  payment: ['cardNumber', 'cvv', 'billingAddress'],
  message: ['content'], // For DMs
  profile: ['realName', 'address', 'dateOfBirth']
};

/**
 * Middleware to encrypt PII before storing
 */
export async function encryptPIIMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Only process POST/PUT/PATCH requests with body
  if (!request.body || !['POST', 'PUT', 'PATCH'].includes(request.method)) {
    return;
  }

  const path = request.url.toLowerCase();
  
  // Determine which fields to encrypt based on route
  let fieldsToEncrypt: string[] = [];
  
  if (path.includes('/users') || path.includes('/auth/register')) {
    fieldsToEncrypt = ENCRYPTION_MAP.user;
  } else if (path.includes('/payments')) {
    fieldsToEncrypt = ENCRYPTION_MAP.payment;
  } else if (path.includes('/messages') && path.includes('/direct')) {
    fieldsToEncrypt = ENCRYPTION_MAP.message;
  } else if (path.includes('/profile')) {
    fieldsToEncrypt = ENCRYPTION_MAP.profile;
  }
  
  // Encrypt fields if any
  if (fieldsToEncrypt.length > 0) {
    request.body = fieldEncryption.encryptObject(request.body, fieldsToEncrypt);
  }
}

/**
 * Hook to decrypt PII after retrieval
 */
export function decryptPIIHook(data: any, model: string): any {
  const fieldsToDecrypt = ENCRYPTION_MAP[model as keyof typeof ENCRYPTION_MAP];
  
  if (!fieldsToDecrypt) {
    return data;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => fieldEncryption.decryptObject(item, fieldsToDecrypt));
  }
  
  // Handle single object
  return fieldEncryption.decryptObject(data, fieldsToDecrypt);
}