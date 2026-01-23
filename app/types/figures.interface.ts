/**
 * Type definitions for Figures API
 */

export interface ApiFigure {
  id?: string;
  shortcode: string;
  figure_number?: string;
  caption?: string;
  alt?: string;
  description?: string;
  path?: string;
  paths?: string[];
  alts?: string[];
  category: string;
  subject?: string;  // API field - maps to subjectName
  chapter?: string;  // API field - maps to chapterName
  topic?: string;    // API field - maps to topicName
  page_number?: number;
  createdAt?: string;
  updatedAt?: string;
  searchableText?: string;
}

export interface MappedFigure {
  shortcode: string;
  path?: string;
  paths?: string[];
  alt: string;
  alts?: string[];
  category: 'biology' | 'physics' | 'chemistry' | 'mathematics' | 'general';
  description?: string;
  subjectName?: string;  // Mapped from subject
  chapterName?: string;  // Mapped from chapter
  topicName?: string;   // Mapped from topic
  figure_number?: string;
  page_number?: number;
}

export interface GetFiguresOptions {
  limit?: number;
  offset?: number;
  subject?: string;
  category?: string;
  chapter?: string;
  topic?: string;
  shortcode?: string;
}

