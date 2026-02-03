import type { BaseEntity } from "./base.interface";

export interface Topic extends BaseEntity {
  uid: string;
  name: string;
  descriptions: string;
  thumbnail?: string;
  number: 0;
  featured: true;
  status: string;
  level: string;
  subject: string;
}
