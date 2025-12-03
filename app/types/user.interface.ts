import type { BaseEntity } from "./base.interface";

export interface User extends BaseEntity {
  ageGroup: string;
  username?: string;
  type: string;
  role?: string;
  region: string;
  district: string;
  school?: string;
  organization?: string;
  level?: string;
  gender?: string;
  timeSpent?:number;
  loginAt?:string;
  timeSpentFormatted?:string;
  profilePic?:string;
}
