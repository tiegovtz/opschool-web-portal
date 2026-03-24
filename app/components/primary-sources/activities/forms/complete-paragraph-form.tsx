"use client";

import React, { useState, useEffect } from "react";
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
import { Loader2, FileText, HelpCircle, AlertCircle } from "lucide-react";
import {
  completeParagraphSchema,
  CompleteParagraphType,
  countBlanks,
  validateBlanksMatchAnswers,
} from "@/shared/schemas/activities/complete-paragraph";
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

interface CompleteParagraphFormProps
  extends BaseActivityFormProps<CompleteParagraphType> {
  // Which variant to create
  variant?: "with-clues" | "without-clues";
}

/**
 * Transforms the form data into the server format.
 *
 * Server format:
 * - text_one = paragraph with blanks (___)
 * - text_two = answers separated by space
 * - path = optional image
 */
export function transformToServerFormat(
  formData: CompleteParagraphType,
  metadata?: ActivityMetadata,
  uploadedImages?: {
    activityImage?: string | null;
  }
) {
  // Join answers with space separator (as per server format)
  const answersString = formData.answers.join(" ");

  const questions = [
    {
      text_one: formData.paragraph,
      text_two: answersString,
      text_three: null,
      description: null,
      path: uploadedImages?.activityImage || null,
    },
  ];

  return {
    activity: {
      activity_name: metadata?.activityName || formData.instruction,
      topic_id: metadata?.topicId ? parseInt(metadata.topicId) : 0,
      description: formData.type, // Algorithm name
      activity_description: formData.instruction,
      sub_topic: metadata?.subTopic || null,
      summary: metadata?.summary || null,
      summary_path: null,
      is_public: true,
      is_premium: metadata?.isPremium || false,
    },
    questions,
  };
}

const CompleteParagraphForm: React.FC<CompleteParagraphFormProps> = ({
  onCancel,
  context = "platform",
  onSubmit,
  metadata,
  variant = "without-clues",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Get grades for image upload path
  const { grades } = useGrades("TET", "REGULAR_ACTIVITIES");

  // Determine activity type based on variant
  const activityType =
    variant === "with-clues"
      ? ActivityType.CompleteParagraphWithCluesJunior
      : ActivityType.CompleteParagraphWithoutClues;

  const form = useForm<CompleteParagraphType>({
    resolver: zodResolver(completeParagraphSchema),
    defaultValues: {
      type: activityType,
      instruction: "",
      paragraph: "",
      answers: [""],
      image: null,
    },
    mode: "onChange",
  });

  // Watch paragraph to count blanks
  const watchParagraph = form.watch("paragraph");
  const blankCount = countBlanks(watchParagraph || "");

  // Watch answers array
  const watchAnswers = form.watch("answers");
  const answerCount = watchAnswers?.length || 0;

  // Auto-adjust answer count when blanks change
  useEffect(() => {
    const currentAnswers = form.getValues("answers") || [];
    const currentAnswerCount = currentAnswers.length;

    if (blankCount > currentAnswerCount) {
      // Add more answer fields
      const newAnswers = [...currentAnswers];
      for (let i = currentAnswerCount; i < blankCount; i++) {
        newAnswers.push("");
      }
      form.setValue("answers", newAnswers);
    } else if (blankCount < currentAnswerCount && blankCount > 0) {
      // Remove extra answer fields
      form.setValue("answers", currentAnswers.slice(0, blankCount));
    }
  }, [blankCount, form]);

  // Handle form submission
  const handleSubmit = async (data: CompleteParagraphType) => {
    // Validate blanks match answers
    if (!validateBlanksMatchAnswers(data.paragraph, data.answers)) {
      toast.error(
        `Number of blanks (${blankCount}) doesn't match number of answers (${data.answers.length})`
      );
      return;
    }

    // Check for empty answers
    const emptyAnswers = data.answers.filter((a) => !a.trim());
    if (emptyAnswers.length > 0) {
      toast.error("All answer fields must be filled");
      return;
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

  const variantTitle =
    variant === "with-clues"
      ? "Complete Paragraph with Clues"
      : "Complete Paragraph without Clues";

  const variantDescription =
    variant === "with-clues"
      ? "Students will see word options to drag into blanks"
      : "Students will type answers directly into blanks";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{variantTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {variantDescription}
            </p>
          </div>
        </div>

        {/* Instructions Card */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>How to create blanks</AlertTitle>
          <AlertDescription>
            Use three underscores (<code className="font-mono">___</code>) to
            create a blank in your paragraph. The answers should be provided in
            the order they appear in the paragraph.
          </AlertDescription>
        </Alert>

        {/* Instruction Field */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Activity Instruction
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      This instruction will be shown to students at the top of
                      the activity
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="instruction"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="e.g., Fill in the blanks using 'so' or 'for' to complete the following story."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Paragraph and Image */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                Paragraph Content
                <Badge variant="secondary" className="ml-2">
                  {blankCount} blank{blankCount !== 1 ? "s" : ""} detected
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Paragraph Text */}
              <div className="lg:col-span-2">
                <FormField
                  control={form.control}
                  name="paragraph"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paragraph Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the paragraph with ___ for blanks. Example: The cat ___ on the mat. It was very ___."
                          className="min-h-[200px] font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use <code className="font-mono">___</code> (three
                        underscores) to mark blanks
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
                        Add an image to display alongside the paragraph
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Answers
              <Badge variant="outline" className="ml-2">
                {answerCount} answer{answerCount !== 1 ? "s" : ""}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs font-normal">
                      Enter answers in the order they appear in the paragraph.
                      Answer fields are auto-generated based on the number of
                      blanks.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {blankCount === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Add blanks (<code className="font-mono">___</code>) to your
                  paragraph to see answer fields
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {watchAnswers.map((_, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`answers.${index}`}
                    render={({ field: inputField }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">
                          Blank {index + 1}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`Answer ${index + 1}`}
                            {...inputField}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Warning */}
        {blankCount > 0 && answerCount > 0 && blankCount !== answerCount && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Mismatch Detected</AlertTitle>
            <AlertDescription>
              You have {blankCount} blank{blankCount !== 1 ? "s" : ""} but{" "}
              {answerCount} answer{answerCount !== 1 ? "s" : ""}. These should
              match.
            </AlertDescription>
          </Alert>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || blankCount === 0}
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

export default CompleteParagraphForm;
