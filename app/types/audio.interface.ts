import type { BaseEntity } from "./base.interface";
import type { Language } from "./language.interface";
import type { Subjects } from "./subject.interface";

export interface Audios extends BaseEntity {
  audioType: string;
  language: Language;
  subject: Subjects;
  audioFileUrl: string;
  syllabus: string;
  description: string;
  level:any
}

export interface AudioFileInfo {
  id: string;
  filename: string;
  name: string;
  size?: number;
  created: string;
  modified: string;
  url: string;
  downloadUrl: string;
  type: string;
  audioFileUrl: string;
  chapterId?: string;
  chapterName?: string;
  voiceType?: string;
  thumbnail?: string;
  description?: string;
}
