import { ref, computed, type Ref } from 'vue';
import type { VideoQuiz, VideoInteraction, QuizResult, BranchResult } from '~/types/video-quiz.interface';

export const useVideoQuiz = (videoId: string) => {
  const activeQuiz = ref<VideoQuiz | null>(null);
  const quizHistory = ref<VideoInteraction[]>([]);
  const currentPath = ref<string[]>([]);
  const quizzes = ref<VideoQuiz[]>([]);
  const quizStartTime = ref<number>(0);
  
  const onQuizTrigger = ref<((quiz: VideoQuiz) => void) | null>(null);
  const onQuizSubmit = ref<((result: QuizResult) => void) | null>(null);
  const onBranchExecute = ref<((branchResult: BranchResult) => void) | null>(null);
  const onError = ref<((error: string) => void) | null>(null);

  /**
   * Load quizzes for video
   */
  const loadQuizzes = async (videoQuizzes: VideoQuiz[]) => {
    try {
      quizzes.value = videoQuizzes.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error: any) {
      const errorMsg = `Failed to load quizzes: ${error.message}`;
      console.error('[useVideoQuiz]', errorMsg);
      if (onError.value) {
        onError.value(errorMsg);
      }
    }
  };

  /**
   * Check if quiz should trigger at current timestamp
   */
  const checkQuizAtTimestamp = (timestamp: number, tolerance: number = 0.5): VideoQuiz | null => {
    // Find quiz at this timestamp that hasn't been answered yet
    const quiz = quizzes.value.find(q => {
      const timeDiff = Math.abs(q.timestamp - timestamp);
      const isAtTimestamp = timeDiff <= tolerance;
      const notAnswered = !quizHistory.value.some(h => h.quizId === q.id);
      return isAtTimestamp && notAnswered;
    });

    if (quiz) {
      activeQuiz.value = quiz;
      quizStartTime.value = Date.now();
      
      if (onQuizTrigger.value) {
        onQuizTrigger.value(quiz);
      }
      
      return quiz;
    }

    return null;
  };

  /**
   * Submit quiz answer
   */
  const submitQuizAnswer = (
    quizId: string,
    answer: any,
    userId: string
  ): QuizResult => {
    const quiz = quizzes.value.find(q => q.id === quizId);
    
    if (!quiz) {
      const errorMsg = `Quiz with ID ${quizId} not found`;
      console.error('[useVideoQuiz]', errorMsg);
      if (onError.value) {
        onError.value(errorMsg);
      }
      throw new Error(errorMsg);
    }

    // Calculate if answer is correct
    let isCorrect = false;
    if (quiz.type === 'multiple_choice') {
      // For multiple choice, check if selected option ID matches correct answer
      if (typeof quiz.correctAnswer === 'string') {
        isCorrect = answer === quiz.correctAnswer;
      } else if (typeof quiz.correctAnswer === 'number' && quiz.options) {
        const correctOption = quiz.options.find(opt => opt.isCorrect);
        isCorrect = correctOption ? answer === correctOption.id : false;
      }
    } else if (quiz.type === 'true_false') {
      isCorrect = answer === quiz.correctAnswer;
    } else if (quiz.type === 'short_answer') {
      // For short answer, use case-insensitive comparison
      const userAnswer = String(answer).toLowerCase().trim();
      const correctAnswer = String(quiz.correctAnswer).toLowerCase().trim();
      isCorrect = userAnswer === correctAnswer || 
                  userAnswer.includes(correctAnswer) || 
                  correctAnswer.includes(userAnswer);
    } else if (quiz.type === 'drag_and_drop') {
      isCorrect = String(answer).toLowerCase() === String(quiz.correctAnswer).toLowerCase();
    }

    // Calculate time spent
    const timeSpent = quizStartTime.value > 0 
      ? Math.floor((Date.now() - quizStartTime.value) / 1000) 
      : 0;

    // Create interaction record
    const interaction: VideoInteraction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      videoId,
      userId,
      quizId: quiz.id,
      timestamp: quiz.timestamp,
      response: answer,
      isCorrect,
      timeSpent,
      score: isCorrect ? quiz.points : 0,
      createdAt: new Date(),
    };

    // Add to history
    quizHistory.value.push(interaction);

    // Clear active quiz
    activeQuiz.value = null;
    quizStartTime.value = 0;

    // Create result
    const result: QuizResult = {
      quizId: quiz.id,
      isCorrect,
      score: interaction.score,
      response: answer,
      timeSpent,
    };

    if (onQuizSubmit.value) {
      onQuizSubmit.value(result);
    }

    return result;
  };

  /**
   * Get next segment after quiz
   */
  const getNextSegment = (currentTimestamp: number, quizResult?: QuizResult): number => {
    // If quiz has branching, it will be handled by useVideoBranching
    // Otherwise, continue from current position
    return currentTimestamp;
  };

  /**
   * Check if quiz is required at timestamp
   */
  const isQuizRequired = (timestamp: number): boolean => {
    const quiz = quizzes.value.find(q => 
      Math.abs(q.timestamp - timestamp) < 0.5
    );
    return quiz?.required ?? false;
  };

  /**
   * Get quiz at specific timestamp
   */
  const getQuizAtTimestamp = (timestamp: number): VideoQuiz | undefined => {
    return quizzes.value.find(q => 
      Math.abs(q.timestamp - timestamp) < 0.5
    );
  };

  /**
   * Check if all quizzes have been answered
   */
  const areAllQuizzesAnswered = computed(() => {
    const requiredQuizzes = quizzes.value.filter(q => q.required);
    return requiredQuizzes.length > 0 && 
           requiredQuizzes.every(q => 
             quizHistory.value.some(h => h.quizId === q.id)
           );
  });

  /**
   * Get total quiz score
   */
  const totalScore = computed(() => {
    return quizHistory.value.reduce((sum, interaction) => sum + interaction.score, 0);
  });

  /**
   * Get quiz completion percentage
   */
  const quizCompletionPercentage = computed(() => {
    if (quizzes.value.length === 0) return 100;
    const answeredCount = quizHistory.value.length;
    return Math.floor((answeredCount / quizzes.value.length) * 100);
  });

  /**
   * Reset quiz state
   */
  const reset = () => {
    activeQuiz.value = null;
    quizHistory.value = [];
    currentPath.value = [];
    quizStartTime.value = 0;
  };

  /**
   * Get quiz statistics
   */
  const getQuizStats = computed(() => {
    const totalQuizzes = quizzes.value.length;
    const answeredQuizzes = quizHistory.value.length;
    const correctAnswers = quizHistory.value.filter(i => i.isCorrect).length;
    const averageTime = quizHistory.value.length > 0
      ? Math.floor(quizHistory.value.reduce((sum, i) => sum + i.timeSpent, 0) / quizHistory.value.length)
      : 0;

    return {
      totalQuizzes,
      answeredQuizzes,
      correctAnswers,
      incorrectAnswers: answeredQuizzes - correctAnswers,
      averageTime,
      accuracy: answeredQuizzes > 0 
        ? Math.floor((correctAnswers / answeredQuizzes) * 100) 
        : 0,
      totalScore: totalScore.value,
    };
  });

  return {
    activeQuiz,
    quizHistory,
    currentPath,
    quizzes,
    areAllQuizzesAnswered,
    totalScore,
    quizCompletionPercentage,
    quizStats: getQuizStats,
    loadQuizzes,
    checkQuizAtTimestamp,
    submitQuizAnswer,
    getNextSegment,
    isQuizRequired,
    getQuizAtTimestamp,
    reset,
    onQuizTrigger,
    onQuizSubmit,
    onBranchExecute,
    onError,
  };
};

