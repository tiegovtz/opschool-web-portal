export interface Syllabus {
  syllabus_title: string;
  level: string;
  content: Competence[];
}

export interface Competence {
  main_competence: string;
  specific_competence: string;
  number_of_periods: number;
  learning_activities: LearningActivity[];
}

export interface LearningActivity {
  activity: string;
  teaching_learning_methods: string[];
  assessment_criteria: string;
  suggested_resources: string;
}

