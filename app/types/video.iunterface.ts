import type { BaseEntity } from "./base.interface";
import type { videoType } from "./types.data";

export interface Videos extends BaseEntity {
    subject:string;
    videoType:videoType;
    videoFileUrl:string;
    language?:string;
    educationLevel?:string;
} 