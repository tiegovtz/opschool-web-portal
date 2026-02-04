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

export type SpeakerType = string;
export type PracticeMode = 'multi-user' | 'single-user';
