export interface ScriptLine {
  id: string;
  speaker: 'student1' | 'student2' | 'ai';
  text: string;
  order: number;
}

export interface ConversationScript {
  id: string;
  title: string;
  lines: ScriptLine[];
}

export type SpeakerType = 'student1' | 'student2' | 'ai';
export type PracticeMode = 'multi-user' | 'single-user';

