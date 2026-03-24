"use client";

import React from "react";
import { ActivityType } from "@/lib/types/activity-types";
import {
  MatchingWithLettersForm,
  HiddenWordsForm,
  MultipleChoiceWithNotesForm,
  DialogActivityForm,
  MatchingItemsForm,
  CompleteSentencesRephrasingForm,
  InWhichBoxForm,
  CompleteParagraphForm,
  RearrangeStepsVerticallyForm,
  ComprehensionJuniorForm,
  CompleteSentencesDraggingCluesForm,
  BaseActivityFormProps,
  ActivityMetadata,
} from "./forms";
import { Button } from "@/components/ui/button";

interface ActivityFormRendererProps extends BaseActivityFormProps {
  activityType: ActivityType | string | null;
  metadata?: ActivityMetadata;
}

// Shared Activity Form Renderer Component
export const ActivityFormRenderer: React.FC<ActivityFormRendererProps> = ({
  activityType,
  onSubmitSuccess,
  onCancel,
  defaultValues,
  context = "assignment",
  onSubmit,
  metadata,
}) => {
  // Return early if no activity is selected
  if (!activityType) {
    return null;
  }

  // Render form based on selected activity type
  switch (activityType) {
    case ActivityType.MatchingWithLetters:
      return (
        <MatchingWithLettersForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
        />
      );

    case ActivityType.HiddenWords:
    case ActivityType.HiddenWordsGame:
      return (
        <HiddenWordsForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
        />
      );

    case ActivityType.MultipleChoiceWithNotes:
      return (
        <MultipleChoiceWithNotesForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
        />
      );

    case ActivityType.DialogDifferences:
      return (
        <DialogActivityForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="differences"
        />
      );

    case ActivityType.DialogOneSideFixed:
      return (
        <DialogActivityForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="one-side-fixed"
        />
      );

    // Matching Items Activities - Picture-Text
    case ActivityType.PictureTextMatching:
    case ActivityType.PictureTextMatchingSixItems:
      return (
        <MatchingItemsForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="picture-text"
          useSixItems={
            activityType === ActivityType.PictureTextMatchingSixItems
          }
        />
      );

    // Matching Items Activities - Text-Text
    case ActivityType.TextTextMatching:
    case ActivityType.TextTextMatchingSixItems:
      return (
        <MatchingItemsForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="text-text"
          useSixItems={activityType === ActivityType.TextTextMatchingSixItems}
        />
      );

    // Matching Items Activities - Picture-Picture
    case ActivityType.PicturePictureMatching:
    case ActivityType.PicturePictureMatchingSixItems:
      return (
        <MatchingItemsForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="picture-picture"
          useSixItems={
            activityType === ActivityType.PicturePictureMatchingSixItems
          }
        />
      );

    // Complete Sentences by Rephrasing Activities
    case ActivityType.CompleteSentencesByRephrasing:
      return (
        <CompleteSentencesRephrasingForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="rephrasing"
        />
      );

    case ActivityType.CompleteSentenceByRephrasingWithChoices:
      return (
        <CompleteSentencesRephrasingForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="with-choices"
        />
      );

    // Complete Paragraph Activities
    case ActivityType.CompleteParagraphWithCluesJunior:
      return (
        <CompleteParagraphForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="with-clues"
        />
      );

    case ActivityType.CompleteParagraphWithoutClues:
      return (
        <CompleteParagraphForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="without-clues"
        />
      );

    // In Which Box Activities - Text (3 boxes)
    case ActivityType.InWhichBox:
      return (
        <InWhichBoxForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="three-boxes"
          itemType="text"
        />
      );

    // In Which Box Activities - Pics (3 boxes)
    case ActivityType.InWhichBoxPics:
      return (
        <InWhichBoxForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="three-boxes"
          itemType="pics"
        />
      );

    // In Which Box Activities - Mixed (3 boxes)
    case ActivityType.InWhichBoxMixedThreeBoxes:
      return (
        <InWhichBoxForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="three-boxes"
          itemType="mixed"
        />
      );

    // In Which Box Activities - Text (2 boxes)
    case ActivityType.InWhichBoxTwoBoxes:
      return (
        <InWhichBoxForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="two-boxes"
          itemType="text"
        />
      );

    // In Which Box Activities - Pics (2 boxes)
    case ActivityType.InWhichBoxPicsTwoBoxes:
    case ActivityType.InWhichBoxPicsTwoBoxesSixItems:
      return (
        <InWhichBoxForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="two-boxes"
          itemType="pics"
        />
      );

    // In Which Box Activities - Mixed (2 boxes)
    case ActivityType.InWhichBoxMixedTwoBoxesSixItems:
      return (
        <InWhichBoxForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="two-boxes"
          itemType="mixed"
        />
      );

    // Rearrange Steps Vertically Activities
    case ActivityType.RearrangeStepsVertically:
    case ActivityType.RearrangeStepsVerticallyEightRows:
      return (
        <RearrangeStepsVerticallyForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
        />
      );

    // Comprehension Junior Activities
    case ActivityType.ComprehensionJuniorOne:
      return (
        <ComprehensionJuniorForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
        />
      );

    // Complete Sentences by Dragging Clues Activities
    case ActivityType.CompleteSentencesByDraggingClues:
      return (
        <CompleteSentencesDraggingCluesForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="text-only"
        />
      );

    case ActivityType.CompleteSentencesByDraggingCluesPics:
      return (
        <CompleteSentencesDraggingCluesForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="option-images"
        />
      );

    case ActivityType.CompleteSentencesByDraggingCluesPics2:
      return (
        <CompleteSentencesDraggingCluesForm
          onSubmitSuccess={onSubmitSuccess}
          onCancel={onCancel}
          defaultValues={defaultValues}
          context={context}
          onSubmit={onSubmit}
          metadata={metadata}
          variant="question-images"
        />
      );

    case ActivityType.CrosswordWordsGame:
      return (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center space-y-4">
          <h3 className="text-blue-800 font-medium text-lg">
            Crossword Words Game Mode
          </h3>
          <p className="text-blue-700">
            This game mode will automatically generate crossword puzzles using
            objects from the database based on type criteria. Objects will be
            fetched dynamically and used as crossword answers with generated
            clues.
          </p>
          <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
            <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Objects are filtered by the type criteria specified</li>
              <li>• Up to 12 random objects will be selected for each game</li>
              <li>
                • Crossword clues are automatically generated from object names
              </li>
              <li>
                • Previously completed objects are filtered out for replay value
              </li>
              <li>• Game includes timer and progress tracking</li>
            </ul>
          </div>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-blue-300 text-blue-800 hover:bg-blue-100"
          >
            Configure Later
          </Button>
        </div>
      );

    case ActivityType.CrosswordsWithPics:
      return (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center space-y-4">
          <h3 className="text-green-800 font-medium text-lg">
            Crosswords With Pictures Game Mode
          </h3>
          <p className="text-green-700">
            This image-based game mode generates crossword puzzles where clues
            are displayed as pictures instead of text. Players identify objects
            from images and fill in the crossword grid with the corresponding
            words.
          </p>
          <div className="bg-green-100 p-4 rounded-lg border border-green-300">
            <h4 className="font-medium text-green-900 mb-2">How it works:</h4>
            <ul className="text-sm text-green-800 space-y-1 text-left">
              <li>• Objects are filtered by the type criteria specified</li>
              <li>• Up to 12 random objects with images are selected</li>
              <li>• Crossword clues are displayed as images instead of text</li>
              <li>
                • Players identify objects from pictures to solve the puzzle
              </li>
              <li>
                • Previously completed objects are filtered out for replay value
              </li>
              <li>• Game includes timer and progress tracking</li>
            </ul>
          </div>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-green-300 text-green-800 hover:bg-green-100"
          >
            Configure Later
          </Button>
        </div>
      );

    case ActivityType.ConnectionWallGames:
      return (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center space-y-4">
          <h3 className="text-green-800 font-medium text-lg">
            Connection Wall Game Mode
          </h3>
          <p className="text-green-700">
            This game mode will automatically generate connection wall puzzles
            using objects from the database based on type criteria. Objects will
            be fetched dynamically and grouped into categories for matching.
          </p>
          <div className="bg-green-100 p-4 rounded-lg border border-green-300">
            <h4 className="font-medium text-green-900 mb-2">How it works:</h4>
            <ul className="text-sm text-green-800 space-y-1 text-left">
              <li>
                • Objects are filtered by the type criteria specified (separate
                multiple types with "/")
              </li>
              <li>
                • Equal number of objects will be selected from each type for
                balanced categories
              </li>
              <li>
                • Each type becomes a category, creating natural connections
                between items
              </li>
              <li>
                • Previously completed objects are filtered out for replay value
              </li>
              <li>• Game includes timer and progress tracking</li>
              <li>
                • Players must identify connections between items of the same
                type
              </li>
            </ul>
          </div>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-green-300 text-green-800 hover:bg-green-100"
          >
            Configure Later
          </Button>
        </div>
      );

    case ActivityType.MatchingItemsGame:
      return (
        <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg text-center space-y-4">
          <h3 className="text-purple-800 font-medium text-lg">
            Matching Items Game Mode
          </h3>
          <p className="text-purple-700">
            This game mode will automatically generate word-to-syllables
            matching puzzles using objects from the database based on type
            criteria. Objects will be fetched dynamically and matched with their
            syllables.
          </p>
          <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
            <h4 className="font-medium text-purple-900 mb-2">How it works:</h4>
            <ul className="text-sm text-purple-800 space-y-1 text-left">
              <li>
                • Objects are filtered by multiple type criteria (separate with
                "/")
              </li>
              <li>
                • Equal number of objects will be selected from each type for
                balanced matching
              </li>
              <li>
                • Left side shows object names, right side shows their syllables
              </li>
              <li>
                • Players drag object names to match with their correct
                syllables
              </li>
              <li>
                • Previously completed objects are filtered out for replay value
              </li>
              <li>• Game includes timer and progress tracking</li>
            </ul>
          </div>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-purple-300 text-purple-800 hover:bg-purple-100"
          >
            Configure Later
          </Button>
        </div>
      );

    case ActivityType.MatchingItemsPicturesGame:
      return (
        <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-lg text-center space-y-4">
          <h3 className="text-indigo-800 font-medium text-lg">
            Matching Items Pictures Game Mode
          </h3>
          <p className="text-indigo-700">
            This game mode will automatically generate image-to-syllables
            matching puzzles using objects from the database based on type
            criteria. Objects will be fetched dynamically and matched with their
            syllables.
          </p>
          <div className="bg-indigo-100 p-4 rounded-lg border border-indigo-300">
            <h4 className="font-medium text-indigo-900 mb-2">How it works:</h4>
            <ul className="text-sm text-indigo-800 space-y-1 text-left">
              <li>
                • Objects are filtered by the single type criteria specified
              </li>
              <li>
                • Up to 6 random objects will be selected for each game session
              </li>
              <li>
                • Left side shows object images, right side shows their
                syllables
              </li>
              <li>
                • Players drag object images to match with their correct
                syllables
              </li>
              <li>
                • Previously completed objects are filtered out for replay value
              </li>
              <li>• Game includes timer and progress tracking</li>
            </ul>
          </div>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-indigo-300 text-indigo-800 hover:bg-indigo-100"
          >
            Configure Later
          </Button>
        </div>
      );

    // For activities that don't have dedicated forms yet
    default:
      return (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-center space-y-4">
          <h3 className="text-amber-800 font-medium text-lg">
            Form Not Implemented
          </h3>
          <p className="text-amber-700">
            The form for "{activityType}" has not been implemented yet. Please
            check back later or select another activity type.
          </p>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            Go Back
          </Button>
        </div>
      );
  }
};

export default ActivityFormRenderer;
