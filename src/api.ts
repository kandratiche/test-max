export interface Creds {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
}

export const DEFAULT_API_URL = "https://api.green-api.com";
const SUFFIX: string = import.meta.env.VITE_CHAT_ID_SUFFIX ?? "@c.us";

export const digits = (s: string) => s.replace(/\D/g, "");
export const toChatId = (phone: string) => digits(phone) + SUFFIX;

const url = (c: Creds, method: string, tail = "") =>
  `${c.apiUrl.replace(/\/+$/, "")}/waInstance${c.idInstance}/${method}/${c.apiTokenInstance}${tail}`;

async function request<T>(u: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(u, init);
  if (!res.ok) throw new Error(`Ошибка API: HTTP ${res.status}`);
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}

export const getStateInstance = (c: Creds) =>
  request<{ stateInstance: string }>(url(c, "getStateInstance"));

export const sendMessage = (c: Creds, chatId: string, message: string) =>
  request<{ idMessage: string }>(url(c, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message }),
  });

export interface Notification {
  receiptId: number;
  body: {
    typeWebhook: string;
    idMessage?: string;
    timestamp?: number;
    senderData?: { chatId: string; senderName?: string };
    messageData?: {
      typeMessage: string;
      textMessageData?: { textMessage: string };
      extendedTextMessageData?: { text: string };
    };
  };
}

export const receiveNotification = (c: Creds, signal: AbortSignal) =>
  request<Notification>(url(c, "receiveNotification", "?receiveTimeout=5"), {
    signal,
  });

export const deleteNotification = (c: Creds, receiptId: number) =>
  request(url(c, "deleteNotification", `/${receiptId}`), { method: "DELETE" });
