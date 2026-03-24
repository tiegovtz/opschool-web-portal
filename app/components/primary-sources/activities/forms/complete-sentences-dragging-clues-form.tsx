"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ActivityType } from "@/lib/types/activity-types";
import { toast } from "sonner";
import {
  Plus,
  X,
  Loader2,
  GripHorizontal,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  completeSentencesDraggingCluesSchema,
  CompleteSentencesDraggingCluesType,
  generateQuestionId,
  createDefaultQuestion,
  createDefaultQuestions,
  hasBlankPlaceholder,
  DraggingCluesVariant,
  getVariantFromType,
  variantRequiresImages,
} from "@/shared/schemas/activities/complete-sentences-dragging-clues";
import { BaseActivityFormProps, ActivityMetadata } from "./index";
import ImagePreviewUpload from "@/components/ui/image-preview-upload";
import { uploadOptionalImage } from "@/services/upload.service";
import { useGrades } from "@/shared/services/activities-search-filters";
import { getGradeName } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CompleteSentencesDraggingCluesFormProps
  extends BaseActivityFormProps<CompleteSentencesDraggingCluesType> {
  variant?: DraggingCluesVariant;
}

const MIN_QUESTIONS = 2;
const MAX_QUESTIONS = 12;

/**
 * Transforms the form data into the server format.
 *
 * Server format for Complete Sentences by Dragging Clues:
 * - activity.description = algorithm name
 * - activity.activity_description = "instruction/"
 * - activity_question.text_one = question text with ___ for blank
 * - activity_question.text_two = the answer/clue
 * - activity_question.path = image path (for option images or question images depending on variant)
 */
export function transformToServerFormat(
  formData: CompleteSentencesDraggingCluesType,
  metadata?: ActivityMetadata,
  uploadedImages?: {
    questionImages?: Map<string, string | null>;
  }
) {
  // Build activity_description: "instruction/"
  const activityDescription = `${formData.instruction}/`;

  // Transform questions to server format
  const questions = formData.questions.map((question) => {
    return {
      text_one: question.questionText,
      text_two: question.answer,
      text_three: null,
      description: null,
      path: uploadedImages?.questionImages?.get(question.id) || null,
    };
  });

  return {
    activity: {
      activity_name: metadata?.activityName || formData.instruction,
      topic_id: metadata?.topicId ? parseInt(metadata.topicId) : 0,
      description: formData.type, // Algorithm name
      activity_description: activityDescription,
      sub_topic: metadata?.subTopic || null,
      summary: metadata?.summary || null,
      summary_path: null,
      is_public: true,
      is_premium: metadata?.isPremium || false,
    },
    questions,
  };
}

const CompleteSentencesDraggingCluesForm: React.FC<
  CompleteSentencesDraggingCluesFormProps
> = ({
  onCancel,
  onSubmit,
  metadata,
  variant = "text-only",
  defaultValues,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Store images as Map<questionId, File>
  const [questionImages, setQuestionImages] = useState<
    Map<string, File | null>
  >(new Map());

  // Get grades for image upload path
  const { grades } = useGrades("TET", "REGULAR_ACTIVITIES");

  // Determine activity type based on variant
  const getActivityType = (): CompleteSentencesDraggingCluesType["type"] => {
    switch (variant) {
      case "option-images":
        return ActivityType.CompleteSentencesByDraggingCluesPics;
      case "question-images":
        return ActivityType.CompleteSentencesByDraggingCluesPics2;
      default:
        return ActivityType.CompleteSentencesByDraggingClues;
    }
  };

  const form = useForm<CompleteSentencesDraggingCluesType>({
    resolver: zodResolver(completeSentencesDraggingCluesSchema),
    defaultValues: {
      type: getActivityType(),
      instruction:
        "Complete the sentences by dragging the correct words into the blanks.",
      questions: createDefaultQuestions(4),
      ...defaultValues,
    },
    mode: "onChange",
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const watchQuestions = form.watch("questions");
  const questionCount = watchQuestions?.length || 0;
  const canAddMore = questionCount < MAX_QUESTIONS;
  const canRemove = questionCount > MIN_QUESTIONS;

  const showImages = variantRequiresImages(variant);
  const imageLabel =
    variant === "option-images" ? "Option Image" : "Question Image";
  const imageDescription =
    variant === "option-images"
      ? "This image will be shown as a draggable option"
      : "This image will be shown next to the question";

  const handleAddQuestion = () => {
    if (canAddMore) {
      const newQuestion = createDefaultQuestion();
      appendQuestion(newQuestion);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    if (canRemove) {
      const questionId = questionFields[index].id;
      // Remove image from state
      setQuestionImages((prev) => {
        const newMap = new Map(prev);
        newMap.delete(questionId);
        return newMap;
      });
      removeQuestion(index);
    }
  };

  const handleImageChange = (questionId: string, file: File | null) => {
    setQuestionImages((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionId, file);
      return newMap;
    });
  };

  const handleSubmit = async (data: CompleteSentencesDraggingCluesType) => {
    // Validate that all questions have blank placeholders
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!hasBlankPlaceholder(q.questionText)) {
        toast.error(
          `Question ${
            i + 1
          } must contain a blank placeholder (___). Example: "The ___ is blue."`
        );
        return;
      }
    }

    // Validate images for image variants
    if (showImages) {
      const missingImages = data.questions.filter(
        (q) => !questionImages.get(q.id)
      );
      if (missingImages.length > 0) {
        toast.error(`All questions require images for this activity type.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Upload images if present
      const uploadedQuestionImages = new Map<string, string | null>();
      const gradeName = getGradeName(metadata?.gradeId, grades);

      if (gradeName && showImages) {
        setIsUploading(true);
        for (const [questionId, file] of questionImages.entries()) {
          if (file) {
            try {
              const path = await uploadOptionalImage(gradeName, file);
              uploadedQuestionImages.set(questionId, path);
            } catch (error) {
              console.error(
                `Failed to upload image for question ${questionId}:`,
                error
              );
            }
          }
        }
        setIsUploading(false);
      }

      // Prepare data with uploaded images
      const dataWithImages = {
        ...data,
        _uploadedImages: {
          questionImages: uploadedQuestionImages,
        },
      };

      if (onSubmit) {
        await onSubmit(dataWithImages);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit form";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filledQuestionsCount =
    watchQuestions?.filter(
      (q) =>
        q.questionText.trim() &&
        q.answer.trim() &&
        hasBlankPlaceholder(q.questionText)
    ).length || 0;

  const getVariantTitle = () => {
    switch (variant) {
      case "option-images":
        return "Complete Sentences by Dragging Clues (Picture Options)";
      case "question-images":
        return "Complete Sentences by Dragging Clues (Question Images)";
      default:
        return "Complete Sentences by Dragging Clues";
    }
  };

  const getVariantSubtitle = () => {
    switch (variant) {
      case "option-images":
        return "Students drag picture options to fill in the blanks";
      case "question-images":
        return "Questions have images, students drag text options to fill in blanks";
      default:
        return "Students drag text options to fill in the blanks";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <GripHorizontal className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{getVariantTitle()}</h2>
            <p className="text-sm text-muted-foreground">
              {getVariantSubtitle()}
            </p>
          </div>
        </div>

        {/* Instructions Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>How to create blanks</AlertTitle>
          <AlertDescription>
            Use three underscores (
            <code className="font-mono bg-gray-100 px-1 rounded">___</code>) to
            create a blank in your sentence. Each question should have exactly
            one blank. Example: "The sky is ___." with answer "blue".
          </AlertDescription>
        </Alert>

        {/* Instruction Field */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activity Instruction</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="instruction"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="e.g., Complete the sentences by dragging the correct words into the blanks."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This instruction will be shown to students at the top of the
                    activity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Questions Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                Questions & Answers
                <Badge variant="secondary" className="ml-2">
                  {filledQuestionsCount} / {questionCount} complete
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Min: {MIN_QUESTIONS} | Max: {MAX_QUESTIONS}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuestion}
                  disabled={!canAddMore}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Question
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {questionFields.map((field, questionIndex) => {
              const questionData = watchQuestions?.[questionIndex];
              const hasBlanks = questionData?.questionText
                ? hasBlankPlaceholder(questionData.questionText)
                : false;

              return (
                <Card key={field.id} className="border-2 border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                          {questionIndex + 1}
                        </div>
                        <span className="font-medium text-sm">
                          Question {questionIndex + 1}
                        </span>
                        {questionData?.questionText && !hasBlanks && (
                          <Badge variant="destructive" className="text-xs">
                            Missing ___
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuestion(questionIndex)}
                        disabled={!canRemove}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={`grid gap-4 ${
                        showImages
                          ? "grid-cols-1 lg:grid-cols-3"
                          : "grid-cols-1 lg:grid-cols-2"
                      }`}
                    >
                      {/* Question Text */}
                      <div className={showImages ? "lg:col-span-2" : ""}>
                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.questionText`}
                          render={({ field: inputField }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Sentence with Blank
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">
                                        Use ___ (three underscores) where the
                                        answer should go.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., The capital of France is ___."
                                  {...inputField}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Answer */}
                      <div>
                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.answer`}
                          render={({ field: inputField }) => (
                            <FormItem>
                              <FormLabel>Answer (Clue)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Paris"
                                  {...inputField}
                                  className="bg-green-50 border-green-200"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Image Upload (for image variants) */}
                    {showImages && (
                      <div className="pt-2">
                        <FormItem>
                          <FormLabel>{imageLabel}</FormLabel>
                          <FormControl>
                            <ImagePreviewUpload
                              value={questionImages.get(field.id) || null}
                              onChange={(file) =>
                                handleImageChange(field.id, file)
                              }
                              placeholder={`Upload ${imageLabel.toLowerCase()}`}
                              disabled={isUploading}
                              isUploading={isUploading}
                            />
                          </FormControl>
                          <FormDescription>{imageDescription}</FormDescription>
                        </FormItem>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Add Question Button (inline) */}
            {canAddMore && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-2 text-muted-foreground hover:text-foreground"
                onClick={handleAddQuestion}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Question ({MAX_QUESTIONS - questionCount} remaining)
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || filledQuestionsCount < MIN_QUESTIONS}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Activity"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CompleteSentencesDraggingCluesForm;
