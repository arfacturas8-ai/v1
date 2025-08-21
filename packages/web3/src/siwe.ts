import { SiweMessage } from "siwe";

export async function generateSiweMessage(
  address: string,
  chainId: number,
  domain: string,
  uri: string,
  nonce: string
) {
  const siweMessage = new SiweMessage({
    domain,
    address,
    statement: "Sign in to CRYB Platform",
    uri,
    version: "1",
    chainId,
    nonce,
    expirationTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });

  return siweMessage.prepareMessage();
}

export async function verifySiweMessage(message: string, signature: string) {
  try {
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });
    
    return {
      success: fields.success,
      data: fields.data,
      error: fields.error,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error as Error,
    };
  }
}

export function generateNonce(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}