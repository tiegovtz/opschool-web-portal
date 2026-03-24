"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
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
import { ImageIcon, ArrowLeftRight, Loader2, Type } from "lucide-react";
import {
  MATCHING_ITEMS_TYPES,
  getItemCount,
  getMatchingCategory,
} from "@/shared/schemas/activities/matching-items";
import { BaseActivityFormProps, ActivityMetadata } from "./index";
import ImagePreviewUpload from "@/components/ui/image-preview-upload";
import { uploadOptionalImage } from "@/services/upload.service";
import { useGrades } from "@/shared/services/activities-search-filters";
import { getGradeName } from "@/lib/utils";

// Form schema - we use a flexible approach that validates based on the activity type
const matchingItemSchema = z.object({
  id: z.string(),
  leftText: z.string().optional().default(""),
  rightText: z.string().optional().default(""),
});

const formSchema = z.object({
  type: z.enum([
    ActivityType.PictureTextMatching,
    ActivityType.TextTextMatching,
    ActivityType.PicturePictureMatching,
    ActivityType.PictureTextMatchingSixItems,
    ActivityType.TextTextMatchingSixItems,
    ActivityType.PicturePictureMatchingSixItems,
  ]),
  instruction: z.string().min(1, "Instruction is required"),
  items: z.array(matchingItemSchema).min(1, "At least one item is required"),
});

type FormType = z.infer<typeof formSchema>;
type MatchingItemType = z.infer<typeof matchingItemSchema>;

interface MatchingItemsFormProps extends BaseActivityFormProps<FormType> {
  // Which variant to create - determines the default type
  variant?: "picture-text" | "text-text" | "picture-picture";
  // Whether to use 6 items (default is 8)
  useSixItems?: boolean;
}

/**
 * Transforms the form data into the server format.
 *
 * Server format for Matching Items activities:
 * - For Picture-Text: path = left image, textOne = right text
 * - For Text-Text: textTwo = left text, textOne = right text
 * - For Picture-Picture: path = image, textOne = match key (split into two sets)
 */
export function transformToServerFormat(
  formData: FormType,
  metadata?: ActivityMetadata,
  uploadedImages?: {
    leftImages?: Map<string, string | null>;
    rightImages?: Map<string, string | null>;
  }
) {
  const category = getMatchingCategory(formData.type);

  // Build activity_description: just the instruction
  const activityDescription = formData.instruction;

  interface QuestionData {
    text_one: string;
    text_two: string | null;
    description: string | null;
    path: string | null;
    path_two?: string | null;
  }

  let questions: QuestionData[] = [];

  if (category === "picture-text") {
    // Picture-Text: each item has left image (path) and right text (textOne)
    questions = formData.items.map((item) => ({
      text_one: item.rightText || "",
      text_two: null,
      description: null,
      path: uploadedImages?.leftImages?.get(item.id) || null,
    }));
  } else if (category === "text-text") {
    // Text-Text: each item has left text (textTwo) and right text (textOne)
    questions = formData.items.map((item) => ({
      text_one: item.rightText || "",
      text_two: item.leftText || "",
      description: null,
      path: null,
    }));
  } else if (category === "picture-picture") {
    // Picture-Picture: Create two questions per item (one for left, one for right)
    // Use item.id as the matchKey to link left and right pairs
    const leftQuestions = formData.items.map((item) => ({
      text_one: `pair_${item.id}`, // Auto-generated match key
      text_two: null,
      description: null,
      path: uploadedImages?.leftImages?.get(item.id) || null,
    }));

    const rightQuestions = formData.items.map((item) => ({
      text_one: `pair_${item.id}`, // Same auto-generated match key
      text_two: null,
      description: null,
      path: uploadedImages?.rightImages?.get(item.id) || null,
    }));

    // First half are left images, second half are right images
    questions = [...leftQuestions, ...rightQuestions];
  }

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

const MatchingItemsForm: React.FC<MatchingItemsFormProps> = ({
  onSubmitSuccess,
  onCancel,
  defaultValues,
  context = "assignment",
  onSubmit: customOnSubmit,
  metadata,
  variant = "picture-text",
  useSixItems = false,
}) => {
  const { grades } = useGrades("TET", "REGULAR_ACTIVITIES");
  const [isUploading, setIsUploading] = useState(false);
  // Store left images as Map<itemId, File>
  const [leftImages, setLeftImages] = useState<Map<string, File | null>>(
    new Map()
  );
  // Store right images as Map<itemId, File> (for picture-picture only)
  const [rightImages, setRightImages] = useState<Map<string, File | null>>(
    new Map()
  );

  // Determine initial type based on variant and useSixItems
  const getDefaultType = (): FormType["type"] => {
    if (variant === "picture-text") {
      return useSixItems
        ? ActivityType.PictureTextMatchingSixItems
        : ActivityType.PictureTextMatching;
    } else if (variant === "text-text") {
      return useSixItems
        ? ActivityType.TextTextMatchingSixItems
        : ActivityType.TextTextMatching;
    } else {
      return useSixItems
        ? ActivityType.PicturePictureMatchingSixItems
        : ActivityType.PicturePictureMatching;
    }
  };

  // Create initial items based on count
  const createInitialItems = (count: number): MatchingItemType[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: (i + 1).toString(),
      leftText: "",
      rightText: "",
    }));
  };

  const defaultType = getDefaultType();
  const defaultItemCount = getItemCount(defaultType);

  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: defaultType,
      instruction: "Match each item on the left with its pair on the right.",
      items: createInitialItems(defaultItemCount),
      ...defaultValues,
    },
  });

  const {
    fields: itemFields,
    append: appendItem,
    replace: replaceItems,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedType = form.watch("type");
  const category = getMatchingCategory(watchedType);
  const expectedItemCount = getItemCount(watchedType);

  // Update items when type changes
  useEffect(() => {
    const currentCount = itemFields.length;
    if (currentCount !== expectedItemCount) {
      if (currentCount < expectedItemCount) {
        // Add more items
        for (let i = currentCount; i < expectedItemCount; i++) {
          appendItem({
            id: (i + 1).toString(),
            leftText: "",
            rightText: "",
          });
        }
      } else {
        // Remove extra items (from the end)
        replaceItems(itemFields.slice(0, expectedItemCount));
      }
    }
  }, [expectedItemCount]);

  const onSubmit = async (data: FormType) => {
    try {
      if (customOnSubmit) {
        setIsUploading(true);

        // Get grade name for uploads
        const gradeName = getGradeName(metadata?.gradeId, grades);

        // Upload images if grade is available
        const uploadedLeftImages = new Map<string, string | null>();
        const uploadedRightImages = new Map<string, string | null>();

        if (gradeName) {
          // Upload left images
          for (const [itemId, file] of leftImages.entries()) {
            if (file) {
              try {
                const path = await uploadOptionalImage(gradeName, file);
                uploadedLeftImages.set(itemId, path);
              } catch (error) {
                console.error(
                  `Failed to upload left image for item ${itemId}:`,
                  error
                );
              }
            }
          }

          // Upload right images (for picture-picture matching)
          if (category === "picture-picture") {
            for (const [itemId, file] of rightImages.entries()) {
              if (file) {
                try {
                  const path = await uploadOptionalImage(gradeName, file);
                  uploadedRightImages.set(itemId, path);
                } catch (error) {
                  console.error(
                    `Failed to upload right image for item ${itemId}:`,
                    error
                  );
                }
              }
            }
          }
        }

        // Pass data with uploaded image paths to parent
        await customOnSubmit({
          ...data,
          _uploadedImages: {
            leftImages: uploadedLeftImages,
            rightImages: uploadedRightImages,
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

  const getCategoryDescription = () => {
    switch (category) {
      case "picture-text":
        return "Each item has an image on the left and matching text on the right. Students match images to their corresponding text.";
      case "text-text":
        return "Each item has text on both sides. Students match text items from the left column to their pairs on the right.";
      case "picture-picture":
        return "Each item has images on both sides. Students match images from the left column to their corresponding images on the right.";
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case "picture-text":
        return (
          <div className="flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            <ArrowLeftRight className="h-3 w-3" />
            <Type className="h-4 w-4" />
          </div>
        );
      case "text-text":
        return (
          <div className="flex items-center gap-1">
            <Type className="h-4 w-4" />
            <ArrowLeftRight className="h-3 w-3" />
            <Type className="h-4 w-4" />
          </div>
        );
      case "picture-picture":
        return (
          <div className="flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            <ArrowLeftRight className="h-3 w-3" />
            <ImageIcon className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Info */}
        <Alert>
          {getCategoryIcon()}
          <AlertTitle className="ml-2">{watchedType}</AlertTitle>
          <AlertDescription className="ml-2">
            {getCategoryDescription()}
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {MATCHING_ITEMS_TYPES.map((type) => {
                        const typeCategory = getMatchingCategory(type);
                        const count = getItemCount(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => field.onChange(type)}
                            className={`p-3 border rounded-lg text-left transition-colors ${
                              field.value === type
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Badge
                                variant={
                                  field.value === type ? "default" : "outline"
                                }
                                className="text-xs"
                              >
                                {count} items
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">
                              {typeCategory === "picture-text" &&
                                "Picture → Text"}
                              {typeCategory === "text-text" && "Text → Text"}
                              {typeCategory === "picture-picture" &&
                                "Picture → Picture"}
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
                      placeholder="e.g., Match each item on the left with its pair on the right."
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

        {/* Items Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Matching Items</CardTitle>
              <Badge variant="outline">
                {itemFields.length} / {expectedItemCount} items
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {category === "picture-text" &&
                "Add an image for the left side and text for the right side. Items in the same row are matched pairs."}
              {category === "text-text" &&
                "Add text for both sides. Items in the same row are matched pairs."}
              {category === "picture-picture" &&
                "Add images for both sides. Items in the same row are matched pairs. Provide a match key to identify pairs."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Column Headers */}
            <div className="grid grid-cols-[auto_1fr_1fr] gap-4 pb-2 border-b">
              <div className="w-8" />
              <div className="font-medium text-sm flex items-center gap-2">
                {category === "picture-text" || category === "picture-picture"
                  ? "Left Image"
                  : "Left Text"}
              </div>
              <div className="font-medium text-sm">
                {category === "picture-text" || category === "text-text"
                  ? "Right Text"
                  : "Right Image"}
              </div>
            </div>

            {itemFields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center justify-center w-8 h-10 text-muted-foreground">
                  <span className="text-sm font-medium">{index + 1}</span>
                </div>

                {/* Left Side */}
                <div className="space-y-2">
                  {(category === "picture-text" ||
                    category === "picture-picture") && (
                    <ImagePreviewUpload
                      value={leftImages.get(form.watch(`items.${index}.id`))}
                      onChange={(file) => {
                        const itemId = form.watch(`items.${index}.id`);
                        setLeftImages((prev) => {
                          const newMap = new Map(prev);
                          if (file) {
                            newMap.set(itemId, file);
                          } else {
                            newMap.delete(itemId);
                          }
                          return newMap;
                        });
                      }}
                      placeholder="Drop image"
                      disabled={isUploading}
                      isUploading={isUploading}
                      maxSize={5 * 1024 * 1024}
                    />
                  )}
                  {category === "text-text" && (
                    <FormField
                      control={form.control}
                      name={`items.${index}.leftText`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Left side text" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Right Side */}
                <div className="space-y-2">
                  {(category === "picture-text" ||
                    category === "text-text") && (
                    <FormField
                      control={form.control}
                      name={`items.${index}.rightText`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Right side text" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {category === "picture-picture" && (
                    <ImagePreviewUpload
                      value={rightImages.get(form.watch(`items.${index}.id`))}
                      onChange={(file) => {
                        const itemId = form.watch(`items.${index}.id`);
                        setRightImages((prev) => {
                          const newMap = new Map(prev);
                          if (file) {
                            newMap.set(itemId, file);
                          } else {
                            newMap.delete(itemId);
                          }
                          return newMap;
                        });
                      }}
                      placeholder="Drop image"
                      disabled={isUploading}
                      isUploading={isUploading}
                      maxSize={5 * 1024 * 1024}
                    />
                  )}
                </div>
              </div>
            ))}
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

export default MatchingItemsForm;
