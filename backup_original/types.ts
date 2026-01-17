
export enum ExerciseType {
  MATCHING = 'MATCHING',
  CATEGORIZATION = 'CATEGORIZATION',
  QUIZ = 'QUIZ',
  UNKNOWN = 'UNKNOWN'
}

export interface ExerciseData {
  title: string;
  instruction: string;
  type: ExerciseType;
  content: MatchingContent | CategorizationContent | QuizContent;
  boundingBox?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
}

export interface MatchingContent {
  pairs: {
    id: string;
    left: string;
    right: string;
  }[];
}

export interface CategorizationContent {
  categories: {
    id: string;
    name: string;
  }[];
  items: {
    id: string;
    text: string;
    categoryId: string; // Correct category
  }[];
}

export interface QuizContent {
  questions: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number; // Kept for backward compatibility (single choice)
    correctIndices?: number[]; // New: For multiple correct answers
    multiSelect?: boolean; // New: Allow selecting multiple options
  }[];
}
