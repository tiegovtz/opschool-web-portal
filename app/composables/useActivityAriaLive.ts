import { nextTick } from "vue";

type ActivityAriaLiveState = {
  label: string;
  message: string;
  sequence: number;
};

export const useActivityAriaLive = () => {
  const state = useState<ActivityAriaLiveState>("activity-aria-live", () => ({
    label: "",
    message: "",
    sequence: 0,
  }));

  const announce = async (label: string, message: string) => {
    const nextLabel = label.trim();
    const nextMessage = message.trim();

    if (!nextLabel && !nextMessage) return;

    state.value = {
      label: "",
      message: "",
      sequence: state.value.sequence + 1,
    };

    await nextTick();

    state.value = {
      label: nextLabel,
      message: nextMessage,
      sequence: state.value.sequence + 1,
    };
  };

  const clear = () => {
    state.value = {
      label: "",
      message: "",
      sequence: state.value.sequence + 1,
    };
  };

  return {
    state,
    announce,
    clear,
  };
};
