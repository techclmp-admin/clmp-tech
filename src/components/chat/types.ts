export interface ChatRoom {
  id: string;
  name: string;
  description?: string | null;
  room_type: 'project' | 'group' | 'direct' | 'general';
  project_id?: string | null;
  is_private?: boolean | null;
  // Back-compat for older UI pieces
  is_active?: boolean;
  last_message_at?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at?: string | null;
  project?: {
    id: string;
    name: string;
  };
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  // UI expects sender_id/chat_room_id naming
  sender_id: string;
  chat_room_id: string;
  parent_message_id?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  attachments: any[];
  mentions: string[];
  message_type: 'text' | 'file' | 'image' | 'system';
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    user_id?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string;
  };
  reactions?: MessageReaction[];
  replies?: ChatMessage[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  profile?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface ChatParticipant {
  id: string;
  chat_room_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  last_read_at?: string;
  is_muted: boolean;
  profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string;
  };
}

export interface TypingIndicator {
  user_id: string;
  profile?: {
    first_name?: string;
    last_name?: string;
  };
}
