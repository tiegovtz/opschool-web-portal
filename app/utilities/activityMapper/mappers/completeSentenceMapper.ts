import { ActivityType } from "@/lib/types/activity-types";
import {
  // CompleteSentenceByRephrasingWithChoices,
  CompleteSentenceByRephrasing,
  CompleteSentencesBySelectingCorrectOnes,
  CompleteSentencesByDraggingCluesActivity,
  CompleteSentencesWithTwoClausesActivity,
  CompleteSentencesByClickingSpecifics,
  CompleteSentencesByClicking,
  CompleteSentencesWithThreeClauses,
  CompleteSentencesBySelectingClues,
  CompleteSentenceRearrangeDraggingActivity,
  CompleteSentenceByRearrangingActivity,
} from "../imports";

export const completeSentenceMapper = {
  [ActivityType.CompleteSentenceByRephrasingWithChoices]:
    CompleteSentenceByRephrasing,
  [ActivityType.CompleteSentencesByRephrasing]: CompleteSentenceByRephrasing,
  [ActivityType.CompleteSentencesTwoFieldsNoClues]:
    CompleteSentenceByRephrasing,
  [ActivityType.CompleteSentencesByRephrasingTwoFields]:
    CompleteSentenceByRephrasing,
  [ActivityType.CompleteSentencesBySelectingCorrectOnes]:
    CompleteSentencesBySelectingCorrectOnes,
  [ActivityType.CompleteSentencesByDraggingClues]:
    CompleteSentencesByDraggingCluesActivity,
  [ActivityType.CompleteSentencesByDraggingCluesPics2]:
    CompleteSentencesByDraggingCluesActivity,
  [ActivityType.CompleteSentencesByDraggingCluesPics]:
    CompleteSentencesByDraggingCluesActivity,
  [ActivityType.CompleteSentencesWithTwoClauses]:
    CompleteSentencesWithTwoClausesActivity,
  [ActivityType.CompleteSentencesByClickingSpecifics]:
    CompleteSentencesByClickingSpecifics,
  [ActivityType.CompleteSentencesByClicking]: CompleteSentencesByClicking,
  [ActivityType.CompleteSentencesWithThreeClauses]:
    CompleteSentencesWithThreeClauses,
  [ActivityType.CompleteSentencesWithFourClauses]:
    CompleteSentencesWithThreeClauses,
  [ActivityType.CompleteSentencesBySelectingClues]:
    CompleteSentencesBySelectingClues,
  [ActivityType.CompleteSentencesByRearrangingDragging]:
    CompleteSentenceRearrangeDraggingActivity,
  [ActivityType.CompleteSentencesByRearrangingDraggingJunior]:
    CompleteSentenceRearrangeDraggingActivity,
  [ActivityType.CompleteSentencesByRearranging]:
    CompleteSentenceByRearrangingActivity,
};
