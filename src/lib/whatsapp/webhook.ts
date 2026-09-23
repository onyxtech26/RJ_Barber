import crypto from 'crypto';
import { sendTextMessage } from './client';

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description: string };
  };
}

export interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        messages?: Array<WhatsAppMessage>;
        statuses?: Array<WhatsAppStatus>;
      };
      field: string;
    }>;
  }>;
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const actualSignature = signature.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(actualSignature)
  );
}

export function extractMessages(payload: WhatsAppWebhookPayload): WhatsAppMessage[] {
  const messages: WhatsAppMessage[] = [];
  
  if (payload.object === 'whatsapp_business_account' && payload.entry) {
    for (const entry of payload.entry) {
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            messages.push(...change.value.messages);
          }
        }
      }
    }
  }
  
  return messages;
}

export async function handleButtonReply(buttonId: string, customerPhone: string): Promise<void> {
  if (buttonId.startsWith('confirm_')) {
    await sendTextMessage(customerPhone, 'Your appointment has been confirmed. Thank you!');
  } else if (buttonId.startsWith('cancel_')) {
    await sendTextMessage(customerPhone, 'Your appointment has been cancelled. Please book again when you are ready.');
  } else if (buttonId.startsWith('reschedule_')) {
    await sendTextMessage(customerPhone, 'To reschedule, please visit our booking page.');
  } else {
    await sendTextMessage(customerPhone, 'Action received.');
  }
}

export async function handleTextMessage(text: string, customerPhone: string): Promise<void> {
  await sendTextMessage(customerPhone, 'Thank you for your message. We will get back to you shortly.');
}
