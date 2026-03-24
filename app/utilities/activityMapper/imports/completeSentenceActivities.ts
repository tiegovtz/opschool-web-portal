import dynamic from "next/dynamic";

export const CompleteSentenceByRephrasingWithChoices = dynamic(
  () =>
    import(
      "@/components/activities/complete-sentences/complete-sentences-by-rephrasing-with-choices"
    )
);
export const CompleteSentenceByRephrasing = dynamic(
  () =>
    import(
      "@/components/activities/complete-sentences/complete-sentences-by-rephrasing"
    )
);
export const CompleteSentencesBySelectingCorrectOnes = dynamic(
  () =>
    import(
      "@/components/activities/complete-sentences/complete-sentences-by-selecting-correct-ones"
    )
);
export const CompleteSentencesByDraggingCluesActivity = dynamic(
  () =>
    import(
      "@/components/activities/complete-sentences/complete-sentences-by-dragging-clues"
    )
);
export const CompleteSentencesWithTwoClausesActivity = dynamic(
  () =>
    import(
      "@/components/activities/complete-sentences/complete-sentences-with-two-clauses"
    )
);
export const CompleteSentencesByClickingSpecifics = dynamic(
  () =>
    import(
      "@/components/activities/complete-sentences/complete-sentences-by-clicking-specifics"
    )
);
export const CompleteSentencesByClicking = dynamic(
  () =>
    import(
      "@/components/activities/complete-sentences/complete-sentences-by-clicking"
    )
);
export const CompleteSentencesWithThreeClauses = dynamic(
  () =>
    import(
      "@/components/activities/complete-sentences/complete-sentences-with-three-clauses"
    )
);
export const CompleteSentencesBySelectingClues = dynamic(
  () =>
    import(
      "@/components/activities/complete-sentences/complete-sentences-by-selecting-clues"
    )
);

export const CompleteSentenceRearrangeDraggingActivity = dynamic(
  () =>
    import(
      "@/components/activities/complete-sentences/complete-sentence-rearrange-dragging"
    )
);

export const CompleteSentenceByRearrangingActivity = dynamic(
  () =>
    import(
      "@/components/activities/complete-sentences/complete-sentence-rearrange"
    )
);
