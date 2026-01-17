import { ref, computed } from 'vue';
import type { VideoBranch, BranchResult, QuizResult, VideoSession } from '~/types/video-quiz.interface';

export const useVideoBranching = () => {
  const branchingHistory = ref<BranchResult[]>([]);
  const currentPath = ref<string[]>([]);

  const onBranchExecute = ref<((branchResult: BranchResult) => void) | null>(null);
  const onError = ref<((error: string) => void) | null>(null);

  /**
   * Evaluate branch conditions and determine next action
   */
  const evaluateBranch = (
    branch: VideoBranch,
    quizResult: QuizResult,
    session?: VideoSession
  ): BranchResult => {
    try {
      // Calculate current session score if session provided
      const currentScore = session 
        ? session.interactions.reduce((sum, i) => sum + i.score, 0)
        : 0;

      // Find matching branch condition
      let matchedBranch = branch.branches.find(b => {
        switch (b.condition) {
          case 'correct':
            return quizResult.isCorrect;
          case 'incorrect':
            return !quizResult.isCorrect;
          case 'score_threshold':
            if (b.value !== undefined && typeof b.value === 'number') {
              return currentScore >= b.value;
            }
            return false;
          case 'custom':
            // Custom condition evaluation (can be extended)
            // For now, return false as custom logic needs to be implemented per use case
            return false;
          default:
            return false;
        }
      });

      // Use matched branch or default
      const action = matchedBranch ? matchedBranch.action : branch.defaultAction;
      const target = matchedBranch ? matchedBranch.target : branch.defaultTarget;
      const message = matchedBranch ? matchedBranch.message : undefined;

      // Generate branch ID
      const branchId = matchedBranch 
        ? `${matchedBranch.condition}_${matchedBranch.action}_${Date.now()}`
        : `default_${branch.defaultAction}_${Date.now()}`;

      const branchResult: BranchResult = {
        action,
        target: target || 0,
        message,
        branchId,
      };

      // Track branching history
      branchingHistory.value.push(branchResult);
      currentPath.value.push(branchId);

      if (onBranchExecute.value) {
        onBranchExecute.value(branchResult);
      }

      return branchResult;
    } catch (err: any) {
      const errorMsg = `Failed to evaluate branch: ${err.message}`;
      console.error('[useVideoBranching]', errorMsg);
      if (onError.value) {
        onError.value(errorMsg);
      }
      
      // Return default action on error
      return {
        action: branch.defaultAction,
        target: branch.defaultTarget || 0,
        branchId: `error_${Date.now()}`,
      };
    }
  };

  /**
   * Execute branch action
   */
  const executeBranchAction = (
    branchResult: BranchResult,
    videoPlayer: any,
    navigateToVideo?: (videoId: string) => void
  ): void => {
    try {
      switch (branchResult.action) {
        case 'jump_to_timestamp':
          if (videoPlayer && typeof branchResult.target === 'number') {
            // Seek to specific timestamp
            if (videoPlayer.currentTime !== undefined) {
              videoPlayer.currentTime = branchResult.target;
            } else if (videoPlayer.seek) {
              videoPlayer.seek(branchResult.target);
            } else if (videoPlayer.fastSeek) {
              videoPlayer.fastSeek(branchResult.target);
            }
          }
          break;

        case 'jump_to_video':
          if (navigateToVideo && typeof branchResult.target === 'string') {
            navigateToVideo(branchResult.target);
          }
          break;

        case 'repeat_segment':
          if (videoPlayer) {
            // Repeat last 30 seconds
            const currentTime = videoPlayer.currentTime || 0;
            const repeatStart = Math.max(0, currentTime - 30);
            if (videoPlayer.currentTime !== undefined) {
              videoPlayer.currentTime = repeatStart;
            } else if (videoPlayer.seek) {
              videoPlayer.seek(repeatStart);
            }
          }
          break;

        case 'show_explanation':
          // This will be handled by the UI component
          // Just continue playback
          if (videoPlayer && videoPlayer.play) {
            videoPlayer.play();
          }
          break;

        case 'continue':
        default:
          // Continue normal playback
          if (videoPlayer && videoPlayer.play) {
            videoPlayer.play();
          }
          break;
      }
    } catch (err: any) {
      const errorMsg = `Failed to execute branch action: ${err.message}`;
      console.error('[useVideoBranching]', errorMsg);
      if (onError.value) {
        onError.value(errorMsg);
      }
    }
  };

  /**
   * Get next timestamp based on branch result
   */
  const getNextTimestamp = (
    currentTimestamp: number,
    branchResult: BranchResult
  ): number => {
    if (branchResult.action === 'jump_to_timestamp' && typeof branchResult.target === 'number') {
      return branchResult.target;
    }
    // For other actions, continue from current position
    return currentTimestamp;
  };

  /**
   * Get path visualization data
   */
  const getPathVisualization = computed(() => {
    return {
      currentPath: currentPath.value,
      branchHistory: branchingHistory.value,
      totalBranches: branchingHistory.value.length,
      pathLength: currentPath.value.length,
    };
  });

  /**
   * Reset branching state
   */
  const reset = () => {
    branchingHistory.value = [];
    currentPath.value = [];
  };

  /**
   * Get alternative paths (for visualization)
   */
  const getAlternativePaths = (branches: VideoBranch[]): string[][] => {
    // Generate all possible path combinations
    // This is a simplified version - can be enhanced for complex branching
    const paths: string[][] = [];
    
    branches.forEach((branch, index) => {
      branch.branches.forEach((rule, ruleIndex) => {
        paths.push([`branch_${index}_rule_${ruleIndex}`]);
      });
    });

    return paths;
  };

  return {
    branchingHistory,
    currentPath,
    pathVisualization: getPathVisualization,
    evaluateBranch,
    executeBranchAction,
    getNextTimestamp,
    getAlternativePaths,
    reset,
    onBranchExecute,
    onError,
  };
};

