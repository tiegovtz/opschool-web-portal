export interface BaseEntity {
  _id: string;
  deletedAt?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  isDefault?:boolean;
  alt?:string;
  thumbnail?:string;
  syllabus?:string;
}
