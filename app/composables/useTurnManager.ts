import { ref, computed } from 'vue';
import type { SpeakerType, PracticeMode } from '~/types/script.interface';

export const useTurnManager = (mode: () => PracticeMode) => {
  const currentTurn = ref<SpeakerType>('');
  const speakerOrder = ref<SpeakerType[]>([]);
  const aiSpeakerId = ref<SpeakerType>('ai');
  const primaryStudentId = ref<SpeakerType>('student1');
  const isAITurn = computed(() => currentTurn.value === aiSpeakerId.value);

  const switchTurn = () => {
    if (!speakerOrder.value.length) return;

    if (mode() === 'single-user') {
      currentTurn.value =
        currentTurn.value === primaryStudentId.value ? aiSpeakerId.value : primaryStudentId.value;
      return;
    }

    const nextIndex =
      (speakerOrder.value.findIndex((speaker) => speaker === currentTurn.value) + 1) %
      speakerOrder.value.length;
    currentTurn.value = speakerOrder.value[nextIndex] || speakerOrder.value[0];
  };

  const setTurn = (speaker: SpeakerType) => {
    currentTurn.value = speaker;
  };

  const configure = (options: {
    order: SpeakerType[];
    aiId?: SpeakerType;
    primaryStudent?: SpeakerType;
  }) => {
    speakerOrder.value = Array.from(new Set((options.order || []).filter(Boolean)));
    aiSpeakerId.value = options.aiId || 'ai';
    primaryStudentId.value = options.primaryStudent || speakerOrder.value[0] || 'student1';
    currentTurn.value = primaryStudentId.value;
  };

  const reset = () => {
    currentTurn.value = primaryStudentId.value;
  };

  const getNextSpeaker = (): SpeakerType => {
    if (!speakerOrder.value.length) return currentTurn.value;
    if (mode() === 'single-user') {
      return currentTurn.value === primaryStudentId.value ? aiSpeakerId.value : primaryStudentId.value;
    }
    const nextIndex =
      (speakerOrder.value.findIndex((speaker) => speaker === currentTurn.value) + 1) %
      speakerOrder.value.length;
    return speakerOrder.value[nextIndex] || speakerOrder.value[0];
  };

  return {
    currentTurn,
    isAITurn,
    switchTurn,
    setTurn,
    configure,
    reset,
    getNextSpeaker,
  };
};
