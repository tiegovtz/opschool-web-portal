import type { BaseEntity } from "./base.interface";

export interface Experiment  extends BaseEntity{
    category?:string;
    subject:string;
    description:string;
    materials?:string;
    stepsFile:string;
    level:string;
    syllabus:string;
    language?:string;
    educationLevel?:string;
}