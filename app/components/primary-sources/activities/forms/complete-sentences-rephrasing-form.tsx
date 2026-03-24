"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs/input";
import { Textarea } from "@/components/ui/textarea";
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
  FileText,
  ListChecks,
  HelpCircle,
} from "lucide-react";
import {
  completeSentencesRephrasingSchema,
  CompleteSentencesRephrasingType,
  COMPLETE_SENTENCES_REPHRASING_TYPES,
} from "@/shared/schemas/activities/complete-sentences-rephrasing";
import { BaseActivityFormProps, ActivityMetadata } from "./index";
import ImagePreviewUpload from "@/components/ui/image-preview-upload";
import { uploadOptionalImage } from "@/services/upload.service";
import { useGrades } from "@/shared/services/activities-search-filters";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getGradeName } from "@/lib/utils";

interface CompleteSentencesRephrasingFormProps
  extends BaseActivityFormProps<CompleteSentencesRephrasingType> {
  // Which variant to create
  variant?: "rephrasing" | "with-choices";
}

/**
 * Transforms the form data into the server format.
 *
 * Server format:
 * - text_one = question text with blanks (___) and highlights (_word)
 * - text_two = answers separated by "/" if multiple
 * - text_three = choices separated by "/" (only for first question, only for "with choices" variant)
 * - path = optional image
 */
export function transformToServerFormat(
  formData: CompleteSentencesRephrasingType,
  metadata?: ActivityMetadata,
  uploadedImages?: {
    questionImages?: Map<string, string | null>;
  }
) {
  const activityDescription = formData.instruction;
  const hasChoices =
    formData.type === ActivityType.CompleteSentenceByRephrasingWithChoices;

  const questions = formData.questions.map((q, index) => ({
    text_one: q.questionText,
    text_two: q.answers.join("/"), // Multiple answers separated by /
    text_three:
      hasChoices && index === 0 && formData.choices
        ? formData.choices.filter((c) => c.trim() !== "").join("/")
        : null,
    description: null,
    path: uploadedImages?.questionImages?.get(q.id) || null,
  }));

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

const CompleteSentencesRephrasingForm: React.FC<
  CompleteSentencesRephrasingFormProps
> = ({
  onSubmitSuccess,
  onCancel,
  defaultValues,
  context = "assignment",
  onSubmit: customOnSubmit,
  metadata,
  variant = "rephrasing",
}) => {
  const { grades } = useGrades("TET", "REGULAR_ACTIVITIES");
  const [isUploading, setIsUploading] = useState(false);
  // Store question images as Map<questionId, File>
  const [questionImages, setQuestionImages] = useState<
    Map<string, File | null>
  >(new Map());

  const getDefaultType = (): CompleteSentencesRephrasingType["type"] => {
    return variant === "with-choices"
      ? ActivityType.CompleteSentenceByRephrasingWithChoices
      : ActivityType.CompleteSentencesByRephrasing;
  };

  const form = useForm<CompleteSentencesRephrasingType>({
    resolver: zodResolver(completeSentencesRephrasingSchema),
    defaultValues: {
      type: getDefaultType(),
      instruction:
        "Complete each sentence by writing the antonym of the highlighted word.",
      questions: [
        {
          id: "1",
          questionText: "",
          answers: [""],
        },
      ],
      choices: [],
      ...defaultValues,
    },
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const watchedType = form.watch("type");
  const hasChoices =
    watchedType === ActivityType.CompleteSentenceByRephrasingWithChoices;

  const onSubmit = async (data: CompleteSentencesRephrasingType) => {
    try {
      if (customOnSubmit) {
        setIsUploading(true);

        // Get grade name for uploads
        const gradeName = getGradeName(metadata?.gradeId, grades);

        // Upload images if grade is available
        const uploadedQuestionImages = new Map<string, string | null>();

        if (gradeName) {
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
        }

        // Pass data with uploaded image paths to parent
        await customOnSubmit({
          ...data,
          _uploadedImages: {
            questionImages: uploadedQuestionImages,
          },
        } as any);
      } else {
        toast.error("Activity submission not configured");
        console.error("No custom submit handler provided");
      }
    } catch (error) {
      toast.error("Failed to create activity");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const getSubmitButtonText = () => {
    switch (context) {
      case "platform":
        return "Create Platform Activity";
      case "assignment":
      default:
        return "Create Activity";
    }
  };

  const addNewQuestion = () => {
    appendQuestion({
      id: (questionFields.length + 1).toString(),
      questionText: "",
      answers: [""],
    });
  };

  // Handle adding/removing answers for a specific question
  const addAnswer = (questionIndex: number) => {
    const currentAnswers = form.getValues(`questions.${questionIndex}.answers`);
    form.setValue(`questions.${questionIndex}.answers`, [
      ...currentAnswers,
      "",
    ]);
  };

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    const currentAnswers = form.getValues(`questions.${questionIndex}.answers`);
    if (currentAnswers.length > 1) {
      form.setValue(
        `questions.${questionIndex}.answers`,
        currentAnswers.filter((_, i) => i !== answerIndex)
      );
    }
  };

  // Handle choices for "with choices" variant
  const watchedChoices = form.watch("choices") || [];

  const addChoice = () => {
    form.setValue("choices", [...watchedChoices, ""]);
  };

  const removeChoice = (index: number) => {
    form.setValue(
      "choices",
      watchedChoices.filter((_, i) => i !== index)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Info */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle className="ml-2">{watchedType}</AlertTitle>
          <AlertDescription className="ml-2">
            {hasChoices
              ? "Students complete sentences by choosing from provided options."
              : "Students complete sentences by typing the correct word/phrase."}
          </AlertDescription>
        </Alert>

        {/* Activity Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Type</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3">
                      {COMPLETE_SENTENCES_REPHRASING_TYPES.map((type) => {
                        const isWithChoices =
                          type ===
                          ActivityType.CompleteSentenceByRephrasingWithChoices;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => field.onChange(type)}
                            className={`p-4 border rounded-lg text-left transition-colors ${
                              field.value === type
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {isWithChoices ? (
                                <ListChecks className="h-5 w-5" />
                              ) : (
                                <FileText className="h-5 w-5" />
                              )}
                              <span className="font-medium">
                                {isWithChoices ? "With Choices" : "Rephrasing"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {isWithChoices
                                ? "Students select from provided word options."
                                : "Students type the correct answer freely."}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="instruction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Instruction</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Complete each sentence by writing the antonym of the highlighted word."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Displayed at the top of the activity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Choices Card - Only for "with choices" variant */}
        {hasChoices && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Word Choices</CardTitle>
                <Badge variant="outline">{watchedChoices.length} choices</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Add the words that students can choose from to complete the
                sentences.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {watchedChoices.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Choice ${index + 1}`}
                    value={watchedChoices[index]}
                    onChange={(e) => {
                      const newChoices = [...watchedChoices];
                      newChoices[index] = e.target.value;
                      form.setValue("choices", newChoices);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChoice(index)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addChoice}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Choice
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Questions Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Questions</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p className="font-medium mb-1">Formatting Guide:</p>
                      <ul className="text-sm space-y-1">
                        <li>
                          • Use <code className="bg-muted px-1">___</code> (3
                          underscores) for a small input field
                        </li>
                        <li>
                          • Use <code className="bg-muted px-1">______</code>{" "}
                          (6+ underscores) for a larger input field
                        </li>
                        <li>
                          • Use <code className="bg-muted px-1">_word</code> to
                          highlight a word
                        </li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant="outline">
                {questionFields.length} question
                {questionFields.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Use ___ for blanks and _word to highlight words.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {questionFields.map((field, questionIndex) => (
              <div
                key={field.id}
                className="p-4 bg-muted/30 rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    Question {questionIndex + 1}
                  </span>
                  {questionFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        removeQuestion(questionIndex);
                        // Clean up image
                        const questionId = form.getValues(
                          `questions.${questionIndex}.id`
                        );
                        setQuestionImages((prev) => {
                          const newMap = new Map(prev);
                          newMap.delete(questionId);
                          return newMap;
                        });
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>

                {/* Question Text */}
                <FormField
                  control={form.control}
                  name={`questions.${questionIndex}.questionText`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sentence</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Justin only eats the food he _loves, while his older brother eats even the food he ___."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Answers */}
                <div className="space-y-2">
                  <FormLabel>
                    Correct Answer(s)
                    <span className="text-muted-foreground font-normal ml-1">
                      (add multiple if there are multiple correct answers)
                    </span>
                  </FormLabel>
                  {form
                    .watch(`questions.${questionIndex}.answers`)
                    .map((_, answerIndex) => (
                      <div
                        key={answerIndex}
                        className="flex items-center gap-2"
                      >
                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.answers.${answerIndex}`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder={`Answer ${answerIndex + 1}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {form.watch(`questions.${questionIndex}.answers`)
                          .length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeAnswer(questionIndex, answerIndex)
                            }
                            className="text-destructive hover:text-destructive shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAnswer(questionIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Answer
                  </Button>
                </div>

                {/* Optional Image */}
                <div className="space-y-2">
                  <FormLabel>Image (Optional)</FormLabel>
                  <ImagePreviewUpload
                    value={questionImages.get(
                      form.watch(`questions.${questionIndex}.id`)
                    )}
                    onChange={(file) => {
                      const questionId = form.watch(
                        `questions.${questionIndex}.id`
                      );
                      setQuestionImages((prev) => {
                        const newMap = new Map(prev);
                        if (file) {
                          newMap.set(questionId, file);
                        } else {
                          newMap.delete(questionId);
                        }
                        return newMap;
                      });
                    }}
                    placeholder="Drop image (optional)"
                    disabled={isUploading}
                    isUploading={isUploading}
                    maxSize={5 * 1024 * 1024}
                  />
                </div>
              </div>
            ))}

            {/* Add Question Button */}
            <Button
              type="button"
              variant="outline"
              onClick={addNewQuestion}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isUploading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              getSubmitButtonText()
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CompleteSentencesRephrasingForm;
