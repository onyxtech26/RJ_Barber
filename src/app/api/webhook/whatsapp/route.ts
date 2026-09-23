import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyWebhookSignature, 
  extractMessages, 
  handleButtonReply, 
  handleTextMessage,
  WhatsAppWebhookPayload
} from '@/lib/whatsapp/webhook';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: WhatsAppWebhookPayload = JSON.parse(rawBody);
    const messages = extractMessages(payload);

    // Run processing async so we return 200 immediately
    void (async () => {
      for (const message of messages) {
        if (message.type === 'interactive' && message.interactive?.button_reply) {
          await handleButtonReply(message.interactive.button_reply.id, message.from);
        } else if (message.type === 'text' && message.text) {
          await handleTextMessage(message.text.body, message.from);
        }
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
