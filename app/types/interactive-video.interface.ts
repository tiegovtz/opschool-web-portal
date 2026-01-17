export interface QuizOption {
  id: string
  label: string
}

export interface VideoInteraction {
  id: string
  startTime: number // seconds
  endTime: number // seconds
  type: 'quiz' | 'selection'
}

export interface QuizInteraction extends VideoInteraction {
  type: 'quiz'
  question: string
  options: QuizOption[]
  correctAnswer: string // option id
  feedback?: {
    correct: string
    incorrect: string
  }
}

export interface SelectionItem {
  id: string
  imageUrl: string
  imageAlt: string
  correctLabel: string
}

export interface SelectionInteraction extends VideoInteraction {
  type: 'selection'
  task: string
  items: SelectionItem[]
  labels: string[] // Available labels to select
  feedback?: {
    correct: string
    incorrect: string
  }
}

export type Interaction = QuizInteraction | SelectionInteraction



