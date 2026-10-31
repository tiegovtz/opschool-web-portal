export interface ScriptLine {
  id: string;
  speaker: string;
  text: string;
  order: number;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  type: 'student' | 'ai';
}

export interface ConversationScript {
  id: string;
  title: string;
  lines: ScriptLine[];
  participants?: ConversationParticipant[];
}

// Participant IDs are supplied by the conversation and can vary per script.
export type SpeakerType = string;
export type PracticeMode = 'multi-user' | 'single-user';
