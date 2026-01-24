import { ref, computed } from 'vue';
import type { SpeakerType, PracticeMode } from '~/types/script.interface';

export const useTurnManager = (mode: () => PracticeMode) => {
  const currentTurn = ref<SpeakerType>('student1');
  const isStudent1Turn = computed(() => currentTurn.value === 'student1');
  const isStudent2Turn = computed(() => currentTurn.value === 'student2');
  const isAITurn = computed(() => currentTurn.value === 'ai');

  const switchTurn = () => {
    if (mode() === 'multi-user') {
      // Alternate between student1 and student2
      currentTurn.value = currentTurn.value === 'student1' ? 'student2' : 'student1';
    } else {
      // Single-user mode: alternate between student and AI
      currentTurn.value = currentTurn.value === 'student1' ? 'ai' : 'student1';
    }
  };

  const setTurn = (speaker: SpeakerType) => {
    currentTurn.value = speaker;
  };

  const reset = () => {
    currentTurn.value = 'student1';
  };

  const getNextSpeaker = (): SpeakerType => {
    if (mode() === 'multi-user') {
      return currentTurn.value === 'student1' ? 'student2' : 'student1';
    } else {
      return currentTurn.value === 'student1' ? 'ai' : 'student1';
    }
  };

  return {
    currentTurn,
    isStudent1Turn,
    isStudent2Turn,
    isAITurn,
    switchTurn,
    setTurn,
    reset,
    getNextSpeaker,
  };
};

