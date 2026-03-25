import { defineAsyncComponent } from "vue";

export const CompleteSentenceByRephrasingWithChoices = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-by-rephrasing-with-choices"
    )
);
export const CompleteSentenceByRephrasing = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-by-rephrasing"
    )
);
export const CompleteSentencesBySelectingCorrectOnes = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-by-selecting-correct-ones"
    )
);
export const CompleteSentencesByDraggingCluesActivity = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-by-dragging-clues"
    )
);
export const CompleteSentencesWithTwoClausesActivity = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-with-two-clauses"
    )
);
export const CompleteSentencesByClickingSpecifics = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-by-clicking-specifics"
    )
);
export const CompleteSentencesByClicking = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-by-clicking"
    )
);
export const CompleteSentencesWithThreeClauses = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-with-three-clauses"
    )
);
export const CompleteSentencesBySelectingClues = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-by-selecting-clues"
    )
);

export const CompleteSentenceRearrangeDraggingActivity = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentence-rearrange-dragging"
    )
);

export const CompleteSentenceByRearrangingActivity = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentence-rearrange"
    )
);
