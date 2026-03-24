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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ActivityType } from "@/lib/types/activity-types";
import { toast } from "sonner";
import {
  Plus,
  X,
  ImageIcon,
  FileText,
  HelpCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  MultipleChoiceWithNotesType,
  multipleChoiceWithNotesSchema,
  QuestionType,
} from "@/shared/schemas/activities/multiple-choice-with-notes";
import { BaseActivityFormProps, ActivityMetadata } from "./index";
import ImagePreviewUpload from "@/components/ui/image-preview-upload";
import { uploadOptionalImage } from "@/services/upload.service";
import { useGrades } from "@/shared/services/activities-search-filters";
import { getGradeName } from "@/lib/utils";

interface MultipleChoiceWithNotesFormProps extends BaseActivityFormProps<MultipleChoiceWithNotesType> {}

/**
 * Transforms the user-friendly form data into the server format.
 *
 * Server format for Multiple Choice with Notes:
 * - activity.description = "Multiple choice with notes" (algorithm name)
 * - activity.activity_description = "instruction header//<b>passage title</b>\n\n1. instruction1\n2. instruction2\n\npassage content"
 * - activity_question.text_one = "question text\na) option1\nb) option2\nc) option3\nd) option4"
 * - activity_question.text_two = correct answer letter (e.g., "B", "C")
 * - activity_question.path = optional image path
 */
export function transformToServerFormat(
  formData: MultipleChoiceWithNotesType,
  metadata?: ActivityMetadata,
  uploadedImages?: {
    passageImage?: string | null;
    questionImages?: Map<string, string | null>;
  },
) {
  // Build activity_description based on whether passage is included
  let activityDescription: string;

  if (
    formData.hasPassage &&
    (formData.passageTitle || formData.passageContent)
  ) {
    // Build the notes section (after //)
    // Format: <b>Title</b>\n\nPassage content
    const notesSection = [
      formData.passageTitle ? `<b>${formData.passageTitle}</b>` : "",
      formData.passageContent,
    ]
      .filter(Boolean)
      .join("\n\n");

    // Build activity_description: "instruction header//notes section"
    activityDescription = `${formData.instructionHeader}//${notesSection}`;
  } else {
    // No passage, just use instruction header
    activityDescription = `${formData.instructionHeader}//`;
  }

  // Define the question type for type safety
  interface QuestionInput {
    id: string;
    questionText: string;
    options: Array<{ id: string; text: string }>;
    correctAnswer: string;
    image?: unknown;
  }

  // Transform questions to server format
  const questions = formData.questions.map((question: QuestionInput) => {
    // Build textOne: question text followed by options
    // Format: "question text\na) option1\nb) option2\nc) option3\nd) option4"
    const optionsText = question.options
      .map((opt) => `${opt.id})\t${opt.text}`)
      .join("\n");
    const textOne = `${question.questionText}\n${optionsText}`;

    // textTwo is just the correct answer letter (uppercase)
    const textTwo = question.correctAnswer.toUpperCase();

    return {
      text_one: textOne,
      text_two: textTwo,
      description: null,
      path: uploadedImages?.questionImages?.get(question.id) || null,
    };
  });

  return {
    // Activity metadata
    activity: {
      activity_name: metadata?.activityName || formData.passageTitle,
      topic_id: metadata?.topicId ? parseInt(metadata.topicId) : 0,
      description: ActivityType.MultipleChoiceWithNotes, // Algorithm name
      activity_description: activityDescription,
      sub_topic: metadata?.subTopic || null,
      summary: metadata?.summary || null,
      summary_path: formData.hasPassage
        ? uploadedImages?.passageImage || null
        : null, // Passage image path (only if passage enabled)
      is_public: true,
      is_premium: metadata?.isPremium || false,
    },
    // Questions
    questions,
  };
}

const MultipleChoiceWithNotesForm: React.FC<
  MultipleChoiceWithNotesFormProps
> = ({
  onSubmitSuccess,
  onCancel,
  defaultValues,
  context = "assignment",
  onSubmit: customOnSubmit,
  metadata,
}) => {
  const { grades } = useGrades("TET", "REGULAR_ACTIVITIES");
  const [isUploading, setIsUploading] = useState(false);
  // Track whether to show passage section
  const [hasPassage, setHasPassage] = useState(true);
  // Store passage image as File
  const [passageImage, setPassageImage] = useState<File | null>(null);
  // Store question images as Map<questionId, File>
  const [questionImages, setQuestionImages] = useState<
    Map<string, File | null>
  >(new Map());

  const form = useForm<MultipleChoiceWithNotesType>({
    resolver: zodResolver(multipleChoiceWithNotesSchema),
    defaultValues: {
      type: ActivityType.MultipleChoiceWithNotes,
      instructionHeader:
        "Write the letter of the most correct answer from the given set of distractors.",
      hasPassage: true,
      passageTitle: metadata?.activityName || "",
      passageContent: "",
      questions: [
        {
          id: "1",
          questionText: "",
          options: [
            { id: "a", text: "" },
            { id: "b", text: "" },
            { id: "c", text: "" },
            { id: "d", text: "" },
          ],
          correctAnswer: "a",
          image: null,
        },
      ],
      passageImage: null,
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

  const onSubmit = async (data: MultipleChoiceWithNotesType) => {
    try {
      if (customOnSubmit) {
        setIsUploading(true);

        // Get grade name for uploads
        const gradeName = getGradeName(metadata?.gradeId, grades);

        // Upload images if grade is available
        let uploadedPassageImage: string | null = null;
        const uploadedQuestionImages = new Map<string, string | null>();

        if (gradeName) {
          // Upload passage image (only if passage is enabled)
          if (hasPassage && passageImage) {
            try {
              uploadedPassageImage = await uploadOptionalImage(
                gradeName,
                passageImage,
              );
            } catch (error) {
              console.error("Failed to upload passage image:", error);
              toast.error("Failed to upload passage image");
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
                  error,
                );
              }
            }
          }
        }

        // Pass data with uploaded image paths to parent
        await customOnSubmit({
          ...data,
          hasPassage,
          _uploadedImages: {
            passageImage: hasPassage ? uploadedPassageImage : null,
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
      options: [
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" },
      ],
      correctAnswer: "a",
      image: null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Info */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Multiple Choice with Notes</AlertTitle>
          <AlertDescription>
            Create a reading passage with multiple choice questions. Students
            will read the passage and answer questions by selecting the correct
            option (a, b, c, or d).
          </AlertDescription>
        </Alert>

        {/* Instruction Header Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Activity Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="instructionHeader"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Instruction</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Write the letter of the most correct answer..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This instruction appears at the top of the activity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Passage Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reading Passage
              </CardTitle>
              <Button
                type="button"
                variant={hasPassage ? "destructive" : "default"}
                size="sm"
                onClick={() => {
                  setHasPassage(!hasPassage);
                  if (hasPassage) {
                    // Clear passage fields when disabling
                    form.setValue("passageTitle", "");
                    form.setValue("passageContent", "");
                    form.setValue("hasPassage", false);
                    setPassageImage(null);
                  } else {
                    form.setValue("hasPassage", true);
                  }
                }}
                className="flex items-center gap-2"
              >
                {hasPassage ? (
                  <>
                    <ToggleRight className="h-5 w-5" />
                    <span className="text-sm">Disable Passage</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5" />
                    <span className="text-sm">Enable Passage</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {hasPassage ? (
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="passageTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passage Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., The Connection Between Physics and Other Disciplines"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The title will be displayed in bold at the top of the
                      passage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passageContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passage Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the main reading passage here..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The main text that students will read before answering
                      questions. You can include multiple paragraphs.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Passage Image Upload */}
              <div className="space-y-2">
                <FormLabel>Passage Image (Optional)</FormLabel>
                <ImagePreviewUpload
                  value={passageImage}
                  onChange={(file) => setPassageImage(file)}
                  placeholder="Drop passage image here or click to upload"
                  disabled={isUploading}
                  isUploading={isUploading}
                />
                <FormDescription>
                  Optional image to accompany the reading passage. Will be
                  uploaded when you create the activity.
                </FormDescription>
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Passage is disabled. Click the toggle above to add a reading
                passage to this activity.
              </p>
            </CardContent>
          )}
        </Card>

        {/* Questions Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Questions</CardTitle>
              <Badge variant="outline">
                {questionFields.length} question
                {questionFields.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {questionFields.map((questionField, questionIndex) => (
              <Card key={questionField.id} className="border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      Question {questionIndex + 1}
                    </CardTitle>
                    {questionFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(questionIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Question Text */}
                  <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.questionText`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the question..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Options */}
                  <div className="space-y-3">
                    <FormLabel>Answer Options</FormLabel>
                    {["a", "b", "c", "d"].map((optionId, optionIndex) => (
                      <div key={optionId} className="flex gap-2 items-center">
                        <span className="text-sm font-medium w-6">
                          {optionId})
                        </span>
                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.options.${optionIndex}.text`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder={`Option ${optionId.toUpperCase()}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Correct Answer Selection */}
                  <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.correctAnswer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correct Answer</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            {["a", "b", "c", "d"].map((option) => (
                              <div
                                key={option}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem
                                  value={option}
                                  id={`q${questionIndex}-${option}`}
                                />
                                <Label
                                  htmlFor={`q${questionIndex}-${option}`}
                                  className="cursor-pointer"
                                >
                                  {option.toUpperCase()}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Question Image Upload */}
                  <div className="space-y-2">
                    <FormLabel>Question Image (Optional)</FormLabel>
                    <ImagePreviewUpload
                      value={questionImages.get(
                        form.watch(`questions.${questionIndex}.id`),
                      )}
                      onChange={(file) => {
                        const questionId = form.watch(
                          `questions.${questionIndex}.id`,
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
            ))}

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
        <div className="flex justify-between pt-4">
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
          <div className="flex gap-2 ml-auto">
            <Button type="submit" disabled={isUploading}>
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
        </div>
      </form>
    </Form>
  );
};

export default MultipleChoiceWithNotesForm;
