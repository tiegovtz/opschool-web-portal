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
  BookOpen,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  comprehensionJuniorSchema,
  ComprehensionJuniorType,
  generateQuestionId,
  createDefaultQuestion,
  createDefaultQuestions,
} from "@/shared/schemas/activities/comprehension-junior";
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

interface ComprehensionJuniorFormProps
  extends BaseActivityFormProps<ComprehensionJuniorType> {}

const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 20;

/**
 * Transforms the form data into the server format.
 *
 * Server format for Comprehension Junior One:
 * - activity.description = "Comprehension junior one" (algorithm name)
 * - activity.activity_description = "instruction//notes//" (separated by //)
 * - activity_question.text_one = question text
 * - activity_question.text_two = correct answers separated by "/" (alternatives/variations)
 * - activity_question.path = image path (only on first question)
 *
 * This is a short answer activity - users type their answer and any variation is accepted.
 */
export function transformToServerFormat(
  formData: ComprehensionJuniorType,
  metadata?: ActivityMetadata,
  uploadedImages?: {
    activityImage?: string | null;
  }
) {
  // Build activity_description: "instruction//notes//"
  const activityDescription = `${formData.instruction}//${formData.notes}//`;

  // Transform questions to server format
  const questions = formData.questions.map((question, index) => {
    // Correct answers joined by "/" - these are variations/alternative spellings
    const textTwo = question.correctAnswers.filter((a) => a.trim()).join("/");

    return {
      text_one: question.questionText,
      text_two: textTwo,
      text_three: null,
      description: null,
      // Only first question gets the image path
      path: index === 0 ? uploadedImages?.activityImage || null : null,
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
      summary_path: uploadedImages?.activityImage || null,
      is_public: true,
      is_premium: metadata?.isPremium || false,
    },
    questions,
  };
}

const ComprehensionJuniorForm: React.FC<ComprehensionJuniorFormProps> = ({
  onCancel,
  context = "platform",
  onSubmit,
  metadata,
  defaultValues,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Get grades for image upload path
  const { grades } = useGrades("TET", "REGULAR_ACTIVITIES");

  const form = useForm<ComprehensionJuniorType>({
    resolver: zodResolver(comprehensionJuniorSchema),
    defaultValues: {
      type: ActivityType.ComprehensionJuniorOne,
      instruction: "Answer the following questions.",
      notes: "",
      image: null,
      questions: createDefaultQuestions(3),
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

  const handleAddQuestion = () => {
    if (canAddMore) {
      const newQuestion = createDefaultQuestion();
      appendQuestion(newQuestion);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    if (canRemove) {
      removeQuestion(index);
    }
  };

  const handleAddCorrectAnswer = (questionIndex: number) => {
    const currentAnswers = form.getValues(
      `questions.${questionIndex}.correctAnswers`
    );
    if (currentAnswers.length < 5) {
      form.setValue(`questions.${questionIndex}.correctAnswers`, [
        ...currentAnswers,
        "",
      ]);
    }
  };

  const handleRemoveCorrectAnswer = (
    questionIndex: number,
    answerIndex: number
  ) => {
    const currentAnswers = form.getValues(
      `questions.${questionIndex}.correctAnswers`
    );
    if (currentAnswers.length > 1) {
      form.setValue(
        `questions.${questionIndex}.correctAnswers`,
        currentAnswers.filter((_, i) => i !== answerIndex)
      );
    }
  };

  const handleSubmit = async (data: ComprehensionJuniorType) => {
    // Validate that each question has at least one correct answer
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      const filledAnswers = q.correctAnswers.filter((a) => a.trim());
      if (filledAnswers.length === 0) {
        toast.error(`Question ${i + 1} must have at least one correct answer`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Upload image if present
      let uploadedImagePath: string | null = null;
      const gradeName = getGradeName(metadata?.gradeId, grades);
      if (imageFile && gradeName) {
        setIsUploading(true);
        uploadedImagePath = await uploadOptionalImage(gradeName, imageFile);
        setIsUploading(false);
      }

      // Prepare data with uploaded images
      const dataWithImages = {
        ...data,
        _uploadedImages: {
          activityImage: uploadedImagePath,
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
    watchQuestions?.filter((q) => q.questionText.trim()).length || 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100">
            <BookOpen className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Comprehension Junior</h2>
            <p className="text-sm text-muted-foreground">
              Create a reading comprehension activity with short answer
              questions
            </p>
          </div>
        </div>

        {/* Instructions Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>How it works</AlertTitle>
          <AlertDescription>
            Students will read the notes/passage you provide, then type answers
            to questions. Each question can have multiple correct answer
            variations (e.g., "Mitochondria" and "mitochondrion") - any
            variation will be accepted as correct.
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
                      placeholder="e.g., Answer the following questions based on the passage."
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

        {/* Notes/Content and Image */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Reading Content
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      This is the passage or content students will read before
                      answering questions. You can use HTML formatting like{" "}
                      {"<b>bold</b>"} or {"<br>"} for line breaks.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Notes Text */}
              <div className="lg:col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes / Passage</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the reading content here. You can use HTML tags like <b>bold</b> for formatting..."
                          className="min-h-[200px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Supports HTML formatting. Use {"<b>"} for bold, {"<br>"}{" "}
                        for line breaks.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Optional Image */}
              <div>
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image (Optional)</FormLabel>
                      <FormControl>
                        <ImagePreviewUpload
                          value={imageFile}
                          onChange={(file) => {
                            setImageFile(file);
                            form.setValue("image", file);
                          }}
                          placeholder="Drop image (optional)"
                          disabled={isUploading}
                          isUploading={isUploading}
                        />
                      </FormControl>
                      <FormDescription>
                        Add an image to display with the content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                Questions
                <Badge variant="secondary" className="ml-2">
                  {filledQuestionsCount} / {questionCount} filled
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
              return (
                <Card key={field.id} className="border-2 border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold text-sm">
                          {questionIndex + 1}
                        </div>
                        <span className="font-medium text-sm">
                          Question {questionIndex + 1}
                        </span>
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
                    {/* Question Text */}
                    <FormField
                      control={form.control}
                      name={`questions.${questionIndex}.questionText`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel>Question</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter the question..."
                              {...inputField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Correct Answers */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel className="flex items-center gap-2">
                          Correct Answer(s)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Add multiple variations of the correct answer
                                  (e.g., "Mitochondria", "mitochondrion"). Any
                                  of these will be accepted when students type
                                  their answer.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddCorrectAnswer(questionIndex)}
                          disabled={
                            (watchQuestions?.[questionIndex]?.correctAnswers
                              ?.length || 0) >= 5
                          }
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Variation
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {watchQuestions?.[questionIndex]?.correctAnswers?.map(
                          (_, answerIndex) => (
                            <div
                              key={answerIndex}
                              className="flex items-center gap-2"
                            >
                              <Badge
                                variant="default"
                                className="bg-green-100 text-green-700 shrink-0"
                              >
                                ✓
                              </Badge>
                              <FormField
                                control={form.control}
                                name={`questions.${questionIndex}.correctAnswers.${answerIndex}`}
                                render={({ field: inputField }) => (
                                  <FormItem className="flex-1 space-y-0">
                                    <FormControl>
                                      <Input
                                        placeholder={
                                          answerIndex === 0
                                            ? "Primary correct answer"
                                            : "Alternative spelling/variation"
                                        }
                                        {...inputField}
                                        className="bg-green-50 border-green-200"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              {(watchQuestions?.[questionIndex]?.correctAnswers
                                ?.length || 0) > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleRemoveCorrectAnswer(
                                      questionIndex,
                                      answerIndex
                                    )
                                  }
                                  className="h-8 w-8 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Students will type their answer. Any of the variations
                        above will be accepted as correct.
                      </p>
                    </div>
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

export default ComprehensionJuniorForm;
