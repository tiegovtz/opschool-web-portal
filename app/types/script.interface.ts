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

export type SpeakerType = 'ai' | 'student1' | 'student2';
export type PracticeMode = 'multi-user' | 'single-user';
