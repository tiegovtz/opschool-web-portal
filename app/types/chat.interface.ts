export interface ChatSession {
  id: string;
  userId?: string; // Optional for backward compatibility
  teacherId?: string;
  title?: string;
  contextType?: 'general' | 'chapter'; // Optional for backward compatibility
  chapterName?: string;
  subject?: string; // Can be subject ID or name
  level?: string;
  topic?: string;
  chapterNo?: number;
  school_class?: string; // Class ID (ObjectId)
  room_name?: string;
  details?: string;
  school_registration_number?: string;
  teacherEmail?: string;
  start_time?: string; // ISO 8601 timestamp
  end_time?: string; // ISO 8601 timestamp
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: any[];  // UIMessage format
  metadata?: Record<string, any>;
  sequenceOrder: number;
  createdAt: string;
}

export interface ChatContext {
  chapterName?: string;
  subject?: string;
  level?: string;
  topic?: string;
  chapterNo?: number;
  school_class?: string;
  room_name?: string;
  details?: string;
  school_registration_number?: string;
  teacherEmail?: string;
  start_time?: string;
  end_time?: string;
}

export interface CreateSessionRequest {
  teacherId?: string;
  topic?: string;
  start_time?: string; // ISO 8601 timestamp
  end_time?: string; // ISO 8601 timestamp
  school_class?: string; // Class ID (ObjectId)
  subject?: string; // Subject ID (ObjectId) or name
  room_name?: string;
  details?: string;
  school_registration_number?: string;
  teacherEmail?: string;
  // Legacy fields for backward compatibility
  title?: string;
  contextType?: 'general' | 'chapter';
  chapterName?: string;
  level?: string;
  chapterNo?: number;
}

export interface AddMessageRequest {
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: any[];
  metadata?: Record<string, any>;
}
