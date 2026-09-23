import crypto from 'crypto';

function getSecret() {
  const secret = process.env.TOKEN_SECRET || 'default_fallback_secret_do_not_use_in_prod';
  return secret;
}

export function generateBookingToken(appointmentId: string): string {
  const payload = JSON.stringify({
    appointmentId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
  });
  
  const encodedPayload = Buffer.from(payload).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(encodedPayload)
    .digest('base64url');
    
  return `${encodedPayload}.${signature}`;
}

export function verifyBookingToken(token: string): string | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;
    
    const expectedSignature = crypto
      .createHmac('sha256', getSecret())
      .update(encodedPayload)
      .digest('base64url');
      
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    
    const payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr);
    
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    
    return payload.appointmentId;
  } catch (e) {
    return null;
  }
}
