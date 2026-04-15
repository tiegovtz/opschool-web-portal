import type { User } from "./user.interface";

export interface AuthResponse {
    access_token:string;
    refresh_token:string;
    user:User
}

export interface StudentPremLookupResponse {
    premNumber: string | number;
    firstName: string;
    lastName: string;
    dob: string;
    sex: string;
    classLevel: string;
    schoolName: string;
    schoolRegNo: string;
}
