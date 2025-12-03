import type { BaseEntity } from "./base.interface";
import type { Language } from "./language.interface";
import type { Subjects } from "./subject.interface";

export interface Audios extends BaseEntity {
  audioType: string;
  language: Language;
  subject: Subjects;
  audioFileUrl: string;
  syllabus: string;
}
