export const useAiTeacherDraft = () => {
  const draft = useState<string>("tie-ai-prefill-draft", () => "");
  const version = useState<number>("tie-ai-prefill-version", () => 0);

  const setDraft = (value: string) => {
    draft.value = value;
    version.value += 1;
  };

  const consumeDraft = () => {
    const current = draft.value;
    draft.value = "";
    return current;
  };

  const clearDraft = () => {
    draft.value = "";
  };

  return {
    draft,
    version,
    setDraft,
    consumeDraft,
    clearDraft,
  };
};
