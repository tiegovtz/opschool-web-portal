"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Plus, X, ImageIcon, AlertCircle, Loader2 } from "lucide-react";
import {
  MatchingWithLettersType,
  matchingWithLettersSchema,
} from "@/shared/schemas/activities/matching-with-letters";
import { BaseActivityFormProps, ActivityMetadata } from "./index";
import ImagePreviewUpload from "@/components/ui/image-preview-upload";
import { uploadOptionalImage } from "@/services/upload.service";
import { useGrades } from "@/shared/services/activities-search-filters";
import { getGradeName } from "@/lib/utils";

interface MatchingWithLettersFormProps
  extends BaseActivityFormProps<MatchingWithLettersType> {}

/**
 * Transforms the user-friendly form data into the server format.
 *
 * Server format for Matching with Letters:
 * - activity.description = "Matching with letters" (algorithm name)
 * - activity.activity_description = "Title/Answer1/Answer2/..." (title + answers joined by /)
 * - activity_question.text_one = question/statement text
 * - activity_question.text_two = correct answers for each question (joined by /)
 * - activity_question.path = optional image path
 */
export function transformToServerFormat(
  formData: MatchingWithLettersType,
  metadata?: ActivityMetadata,
  uploadedImages?: {
    activityImage?: string | null;
    questionImages?: Map<string, string | null>;
  }
) {
  // Extract answer texts without the letter prefix (e.g., "A. Paris" -> "Paris")
  const answerTexts = formData.answers.map((answer: string) => {
    // Remove the letter prefix (e.g., "A. ", "B. ", etc.)
    const parts = answer.split(". ");
    return parts.length > 1 ? parts.slice(1).join(". ") : answer;
  });

  // Build activity_description: "Title/Answer1/Answer2/..."
  const activityDescription = [
    formData?.instructions || "",
    ...answerTexts,
  ].join("/");

  // Build correct answers string for text_two
  // Each question's correct answer letter maps to the answer text at that position
  // Format: answers joined by "/" in the order they appear (for server to match)
  const correctAnswersString = answerTexts.join("/");

  // Define the question type for type safety
  interface QuestionInput {
    id: string;
    text: string;
    correctAnswer: string;
    image?: unknown;
    notes?: string;
  }

  // Transform questions to server format
  const questions = formData.questions.map((question: QuestionInput) => ({
    text_one: question.text, // Question/statement text
    text_two: correctAnswersString, // All answers (server uses index to match)
    description: question.notes || null, // Optional notes
    path: uploadedImages?.questionImages?.get(question.id) || null, // Image path
  }));

  return {
    // Activity metadata
    activity: {
      activity_name: metadata?.activityName || formData.title,
      topic_id: metadata?.topicId ? parseInt(metadata.topicId) : 0,
      description: ActivityType.MatchingWithLetters, // Algorithm name
      activity_description: activityDescription, // Title + answers
      sub_topic: metadata?.subTopic || null,
      summary: metadata?.summary || null,
      summary_path: uploadedImages?.activityImage || null, // Activity image path
      is_public: true, // Will be published separately
      is_premium: metadata?.isPremium || false,
    },
    // Questions
    questions,
  };
}

const MatchingWithLettersForm: React.FC<MatchingWithLettersFormProps> = ({
  onSubmitSuccess,
  onCancel,
  defaultValues,
  context = "assignment",
  onSubmit: customOnSubmit,
  metadata,
}) => {
  const { grades } = useGrades("TET", "REGULAR_ACTIVITIES");
  const [isUploading, setIsUploading] = useState(false);
  // Store activity-level image as File
  const [activityImage, setActivityImage] = useState<File | null>(null);
  // Store question images as Map<questionId, File>
  const [questionImages, setQuestionImages] = useState<
    Map<string, File | null>
  >(new Map());

  const form = useForm<MatchingWithLettersType>({
    resolver: zodResolver(matchingWithLettersSchema),
    defaultValues: {
      title:
        metadata?.activityName ||
        "Match the statements with the correct letters",
      type: ActivityType.MatchingWithLetters,
      questions: [],
      answers: [],
      instructions:
        "Match each statement on the left with the correct letter answer on the right.",
      notes: "Read each statement carefully before making your choice.",
      showLettersRandomly: true,
      allowMultipleAttempts: true,
      questionImage: null,
      ...defaultValues,
    },
  });

  const onSubmit = async (data: MatchingWithLettersType) => {
    try {
      if (customOnSubmit) {
        setIsUploading(true);

        // Get grade name for uploads
        const gradeName = getGradeName(metadata?.gradeId, grades);

        // Upload images if grade is available
        let uploadedActivityImage: string | null = null;
        const uploadedQuestionImages = new Map<string, string | null>();

        if (gradeName) {
          // Upload activity image
          if (activityImage) {
            try {
              uploadedActivityImage = await uploadOptionalImage(
                gradeName,
                activityImage
              );
            } catch (error) {
              console.error("Failed to upload activity image:", error);
              toast.error("Failed to upload activity image");
            }
          }

          // Upload question images
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
        // The parent component should use transformToServerFormat with these paths
        await customOnSubmit({
          ...data,
          _uploadedImages: {
            activityImage: uploadedActivityImage,
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

  return (
    <div className="space-y-6">
      {/* Activity Overview - show metadata if provided */}
      {metadata && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {metadata.activityName}
                </CardTitle>
                {metadata.summary && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {metadata.summary}
                  </p>
                )}
              </div>
              <Badge variant="outline">Matching with Letters</Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Activity Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Activity Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Only show title field if metadata not provided */}
              {!metadata && (
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Title displayed during the activity"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This title is shown to students during the activity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions for Students</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain how to complete the matching activity..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These instructions will be shown to students before they
                      start
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional hints or notes for students..."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional hints or tips that can help students
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Activity Image Upload */}
              <div className="space-y-2">
                <FormLabel>Activity Image (Optional)</FormLabel>
                <ImagePreviewUpload
                  value={activityImage}
                  onChange={(file) => setActivityImage(file)}
                  placeholder="Drop activity image here or click to upload"
                  disabled={isUploading}
                  isUploading={isUploading}
                />
                <FormDescription>
                  Optional image to display with the activity. Will be uploaded
                  when you create the activity.
                </FormDescription>
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Questions & Statements</CardTitle>
                <Badge variant="outline">
                  {form.watch("questions").length} questions
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {form.watch("questions").map(
                (
                  question: {
                    id: string;
                    text: string;
                    correctAnswer: string;
                    image?: unknown;
                    notes?: string;
                  },
                  index: number
                ) => (
                  <Card key={index} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          Question {index + 1}
                        </CardTitle>
                        {form.watch("questions").length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const questions = form
                                .getValues("questions")
                                .filter((_: unknown, i: number) => i !== index);
                              form.setValue("questions", questions);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name={`questions.${index}.text`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Statement</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter the question or statement"
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`questions.${index}.correctAnswer`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Correct Letter</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="A"
                                  className="text-center font-bold text-lg"
                                  maxLength={1}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Single letter (A-Z)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`questions.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hint (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Optional hint for students"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Question Image Upload */}
                      <div className="space-y-2">
                        <FormLabel>Question Image (Optional)</FormLabel>
                        <ImagePreviewUpload
                          value={questionImages.get(
                            form.watch(`questions.${index}.id`)
                          )}
                          onChange={(file) => {
                            const questionId = form.watch(
                              `questions.${index}.id`
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
                          placeholder="Drop question image here"
                          disabled={isUploading}
                          isUploading={isUploading}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const questions = form.getValues("questions");
                  const nextLetter = String.fromCharCode(65 + questions.length); // A, B, C, etc.
                  form.setValue("questions", [
                    ...questions,
                    {
                      id: (questions.length + 1).toString(),
                      text: "",
                      correctAnswer: nextLetter,
                      image: null,
                      notes: "",
                    },
                  ]);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>

              <div className="text-sm text-muted-foreground">
                <p>
                  💡 <strong>Tips:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Keep statements clear and concise</li>
                  <li>Use sequential letters (A, B, C, D, etc.)</li>
                  <li>Ensure only one correct answer per statement</li>
                  <li>Consider adding hints for difficult questions</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Answer Options Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Answer Options</CardTitle>
                <Badge variant="outline">
                  {form.watch("answers").length} options
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch("answers").map((answer: string, index: number) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`answers.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Answer Option {index + 1}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder={`${String.fromCharCode(
                              65 + index
                            )}. Enter answer text`}
                            {...field}
                          />
                        </FormControl>
                        {form.watch("answers").length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const answers = form
                                .getValues("answers")
                                .filter((_: string, i: number) => i !== index);
                              form.setValue("answers", answers);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormDescription>
                        Start with the letter (e.g., &quot;A. Paris&quot;)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const answers = form.getValues("answers");
                  const nextLetter = String.fromCharCode(65 + answers.length);
                  form.setValue("answers", [...answers, `${nextLetter}. `]);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Answer Option
              </Button>

              <div className="text-sm text-muted-foreground">
                <p>
                  💡 <strong>Tips:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Include the letter prefix (A., B., C., etc.)</li>
                  <li>Make distractors plausible but clearly incorrect</li>
                  <li>Keep answer options roughly the same length</li>
                  <li>Avoid "all of the above" or "none of the above"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="sm:w-auto w-full"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="sm:w-auto w-full"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                getSubmitButtonText()
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MatchingWithLettersForm;
