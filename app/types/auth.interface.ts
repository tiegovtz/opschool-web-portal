import type { User } from "./user.interface";

export interface AuthResponse {
    access_token:string;
    refresh_token:string;
    user:User
}

export interface StudentLookupApiRecord {
    premNumber?: string | number | null;
    firstName?: string | null;
    lastName?: string | null;
    dob?: string | null;
    sex?: string | null;
    classLevel?: string | null;
    schoolName?: string | null;
    schoolRegNo?: string | null;
}

export interface StudentLookupRecord {
    premNumber: string;
    firstName: string;
    lastName: string;
    dob: string;
    sex: string;
    classLevel: string;
    schoolName: string;
    schoolRegNo: string;
}

export interface StudentInfoLookupRequest {
    schoolRegNo: string;
    classLevel: string;
    isPrimary: boolean;
}

export type StudentPremLookupResponse = StudentLookupApiRecord;
export type StudentInfoLookupResponse = StudentLookupApiRecord | StudentLookupApiRecord[];
