export type MessageStatus = "unread" | "read" | "archived";

export interface ContactMessageRecord {
  id: string;
  sender_name: string | null;
  sender_email: string | null;
  subject: string | null;
  message: string;
  status: MessageStatus;
  created_at: string;
}

export interface ContactMessage extends ContactMessageRecord {}
