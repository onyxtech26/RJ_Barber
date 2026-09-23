const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

export interface WhatsAppResponse {
  messaging_product: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
  error?: any;
}

export interface WhatsAppSection {
  title: string;
  rows: Array<{ id: string; title: string; description?: string }>;
}

function getHeaders() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error('Missing WHATSAPP_ACCESS_TOKEN');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

function getPhoneNumberId() {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error('Missing WHATSAPP_PHONE_NUMBER_ID');
  return id;
}

export async function sendTemplateMessage(
  to: string, 
  templateName: string, 
  languageCode: string, 
  parameters: Array<{type: string; text: string}>
): Promise<WhatsAppResponse> {
  const url = `${WHATSAPP_API_URL}/${getPhoneNumberId()}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters
        }
      ]
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  return response.json();
}

export async function sendTextMessage(to: string, text: string): Promise<WhatsAppResponse> {
  const url = `${WHATSAPP_API_URL}/${getPhoneNumberId()}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { preview_url: false, body: text }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  return response.json();
}

export async function sendInteractiveButtons(
  to: string, 
  bodyText: string, 
  buttons: Array<{id: string; title: string}>
): Promise<WhatsAppResponse> {
  const url = `${WHATSAPP_API_URL}/${getPhoneNumberId()}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map(b => ({
          type: "reply",
          reply: { id: b.id, title: b.title }
        }))
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  return response.json();
}

export async function sendInteractiveList(
  to: string, 
  headerText: string, 
  bodyText: string, 
  buttonText: string, 
  sections: Array<WhatsAppSection>
): Promise<WhatsAppResponse> {
  const url = `${WHATSAPP_API_URL}/${getPhoneNumberId()}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: headerText },
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  return response.json();
}
