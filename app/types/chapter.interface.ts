import type { Audios } from "./audio.interface";
import type { BaseEntity } from "./base.interface";

export interface Chapter extends BaseEntity {
  crashCourse?: string;
  topic: string;
  chapterNo: number;
  content:string;
  audios: Audios[];
}
