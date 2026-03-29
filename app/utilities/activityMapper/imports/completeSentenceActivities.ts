import { defineAsyncComponent } from "vue";

export const CompleteSentenceByRephrasingWithChoices = defineAsyncComponent(
  () =>
    import(
      "~/components/primary-sources/activities/complete-sentences/complete-sentences-by-rephrasing-with-choices.vue"
    )
);
export const CompleteSentenceByRephrasing = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-by-rephrasing.vue"
    )
);
export const CompleteSentencesBySelectingCorrectOnes = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-by-selecting-correct-ones.vue"
    )
);
export const CompleteSentencesByDraggingCluesActivity = defineAsyncComponent(
  () =>
    import(
      "~/components/primary-sources/activities/complete-sentences/complete-sentences-by-dragging-clues.vue"
    )
);
export const CompleteSentencesWithTwoClausesActivity = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-with-two-clauses.vue"
    )
);
export const CompleteSentencesByClickingSpecifics = defineAsyncComponent(
  () =>
    import(
      "~/components/primary-sources/activities/complete-sentences/complete-sentences-by-clicking-specifics.vue"
    )
);
export const CompleteSentencesByClicking = defineAsyncComponent(
  () =>
    import(
      "~/components/primary-sources/activities/complete-sentences/complete-sentences-by-clicking.vue"
    )
);
export const CompleteSentencesWithThreeClauses = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-with-three-clauses.vue"
    )
);
export const CompleteSentencesBySelectingClues = defineAsyncComponent(
  () =>
    import(
      "@/components/primary-sources/activities/complete-sentences/complete-sentences-by-selecting-clues.vue"
    )
);

export const CompleteSentenceRearrangeDraggingActivity = defineAsyncComponent(
  () =>
    import(
      "~/components/primary-sources/activities/complete-sentences/complete-sentence-rearrange-dragging.vue"
    )
);

export const CompleteSentenceByRearrangingActivity = defineAsyncComponent(
  () =>
    import(
      "~/components/primary-sources/activities/complete-sentences/complete-sentence-rearrange.vue"
    )
);
