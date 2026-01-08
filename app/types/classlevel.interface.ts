import type { BaseEntity } from "./base.interface";
import type { educationLevel } from "./educationlevel.interface";

export interface ClassLevel extends BaseEntity{
    educationLevel:educationLevel
}