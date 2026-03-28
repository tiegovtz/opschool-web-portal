import type { BaseEntity } from "./base.interface";

export type LanguageSupport = 'kiswahili'|'english';
export interface Language extends BaseEntity{
    code:string;
    
}