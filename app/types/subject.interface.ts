import type { BaseEntity } from "./base.interface";

export interface Subjects extends BaseEntity {
  viewedBy: string[];
  description: string;
  level?: string;
  educationLevel?: string;
}
