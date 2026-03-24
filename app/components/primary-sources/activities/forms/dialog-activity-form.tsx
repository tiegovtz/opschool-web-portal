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
  ImageIcon,
  ArrowLeftRight,
  Lock,
  Unlock,
  GripVertical,
  Loader2,
} from "lucide-react";
import {
  DialogActivityType,
  dialogActivitySchema,
  ItemPairType,
} from "@/shared/schemas/activities/dialog-activity";
import { BaseActivityFormProps, ActivityMetadata } from "./index";
import ImagePreviewUpload from "@/components/ui/image-preview-upload";
import { uploadOptionalImage } from "@/services/upload.service";
import { useGrades } from "@/shared/services/activities-search-filters";
import { getGradeName } from "@/lib/utils";

interface DialogActivityFormProps
  extends BaseActivityFormProps<DialogActivityType> {
  // Which variant to create - determines the default type
  variant?: "differences" | "one-side-fixed";
}

/**
 * Transforms the user-friendly form data into the server format.
 *
 * Server format for Dialog activities:
 * - activity.description = "Dialog Differences" or "Dialog one side fixed"
 * - activity.activity_description = "instruction/leftLabel/rightLabel" or with "||fontSize"
 * - activity_question.text_one = left side text
 * - activity_question.text_two = right side text
 * - activity_question.path = left side image (optional)
 * - activity_question.path_two = right side image (optional)
 */
export function transformToServerFormat(
  formData: DialogActivityType,
  metadata?: ActivityMetadata,
  uploadedImages?: {
    leftImages?: Map<string, string | null>;
    rightImages?: Map<string, string | null>;
  }
) {
  // Build activity_description: "instruction/leftLabel/rightLabel" or "instruction/leftLabel/rightLabel||fontSize"
  let activityDescription = `${formData.instruction}/${formData.leftColumnLabel}/${formData.rightColumnLabel}`;
  if (formData.fontSize && formData.fontSize !== 20) {
    activityDescription += `||${formData.fontSize}`;
  }

  // Define the item pair type for type safety
  interface ItemPairInput {
    id: string;
    leftText?: string;
    rightText?: string;
    leftImage?: unknown;
    rightImage?: unknown;
  }

  // Transform item pairs to server format (questions)
  const questions = formData.itemPairs.map((pair: ItemPairInput) => ({
    text_one: pair.leftText || "",
    text_two: pair.rightText || "",
    description: null,
    path: uploadedImages?.leftImages?.get(pair.id) || null,
    path_two: uploadedImages?.rightImages?.get(pair.id) || null,
  }));

  return {
    // Activity metadata
    activity: {
      activity_name: metadata?.activityName || formData.instruction,
      topic_id: metadata?.topicId ? parseInt(metadata.topicId) : 0,
      description: formData.type, // Algorithm name
      activity_description: activityDescription,
      sub_topic: metadata?.subTopic || null,
      summary: metadata?.summary || null,
      summary_path: null, // Dialog activities don't have a main activity image
      is_public: true,
      is_premium: metadata?.isPremium || false,
    },
    // Questions
    questions,
  };
}

const DialogActivityForm: React.FC<DialogActivityFormProps> = ({
  onSubmitSuccess,
  onCancel,
  defaultValues,
  context = "assignment",
  onSubmit: customOnSubmit,
  metadata,
  variant = "differences",
}) => {
  const { grades } = useGrades("TET", "REGULAR_ACTIVITIES");
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Store left images as Map<itemPairId, File>
  const [leftImages, setLeftImages] = useState<Map<string, File | null>>(
    new Map()
  );
  // Store right images as Map<itemPairId, File>
  const [rightImages, setRightImages] = useState<Map<string, File | null>>(
    new Map()
  );

  const defaultType =
    variant === "one-side-fixed"
      ? ActivityType.DialogOneSideFixed
      : ActivityType.DialogDifferences;

  const form = useForm<DialogActivityType>({
    resolver: zodResolver(dialogActivitySchema),
    defaultValues: {
      type: defaultType,
      instruction: "Sort statements into correct sides.",
      leftColumnLabel: "True statements",
      rightColumnLabel: "False statements",
      itemPairs: [
        {
          id: "1",
          leftText: "",
          rightText: "",
          leftImage: null,
          rightImage: null,
        },
        {
          id: "2",
          leftText: "",
          rightText: "",
          leftImage: null,
          rightImage: null,
        },
        {
          id: "3",
          leftText: "",
          rightText: "",
          leftImage: null,
          rightImage: null,
        },
      ],
      fontSize: 20,
      ...defaultValues,
    },
  });

  const {
    fields: itemPairFields,
    append: appendItemPair,
    remove: removeItemPair,
  } = useFieldArray({
    control: form.control,
    name: "itemPairs",
  });

  const watchedType = form.watch("type");
  const isOneSideFixed = watchedType === ActivityType.DialogOneSideFixed;

  const onSubmit = async (data: DialogActivityType) => {
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

          // Upload right images
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

  const addNewItemPair = () => {
    appendItemPair({
      id: (itemPairFields.length + 1).toString(),
      leftText: "",
      rightText: "",
      leftImage: null,
      rightImage: null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Info */}
        <Alert>
          <ArrowLeftRight className="h-4 w-4" />
          <AlertTitle>
            {isOneSideFixed ? "Dialog One Side Fixed" : "Dialog Differences"}
          </AlertTitle>
          <AlertDescription>
            {isOneSideFixed
              ? "Create a sorting activity where one column has fixed items (with optional images) and students drag items to match."
              : "Create a sorting activity where students drag items from a pool into two columns (e.g., True/False, Categories)."}
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
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          field.onChange(ActivityType.DialogDifferences)
                        }
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          field.value === ActivityType.DialogDifferences
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Unlock className="h-5 w-5" />
                          <span className="font-medium">
                            Dialog Differences
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Both columns are drop zones. Items are shuffled and
                          dragged to either side.
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          field.onChange(ActivityType.DialogOneSideFixed)
                        }
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          field.value === ActivityType.DialogOneSideFixed
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-5 w-5" />
                          <span className="font-medium">One Side Fixed</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Left column is fixed (with images). Students drag
                          items to match on the right.
                        </p>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Instructions & Labels Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions & Labels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="instruction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Instruction</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Sort statements into correct sides."
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leftColumnLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Left Column Label{" "}
                      {isOneSideFixed && (
                        <Badge variant="secondary" className="ml-2">
                          Fixed
                        </Badge>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., True statements" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rightColumnLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Right Column Label</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., False statements" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Item Pairs Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Item Pairs</CardTitle>
              <Badge variant="outline">
                {itemPairFields.length} pair
                {itemPairFields.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isOneSideFixed
                ? "Each row: Left side is fixed (shown to student), Right side is what they drag to match."
                : "Each row: Left item goes to left column, Right item goes to right column. Items will be shuffled."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Column Headers */}
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 pb-2 border-b">
              <div className="w-8" />
              <div className="font-medium text-sm flex items-center gap-2">
                {form.watch("leftColumnLabel") || "Left Column"}
                {isOneSideFixed && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <div className="font-medium text-sm">
                {form.watch("rightColumnLabel") || "Right Column"}
              </div>
              <div className="w-10" />
            </div>

            {itemPairFields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-start p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center justify-center w-8 h-10 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* Left Item */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name={`itemPairs.${index}.leftText`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder={
                              isOneSideFixed
                                ? "Fixed item text (optional if image provided)"
                                : "Left side item (optional if image provided)"
                            }
                            className="min-h-[60px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Left Image Upload */}
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Left Image (Optional)
                    </div>
                    <ImagePreviewUpload
                      value={leftImages.get(
                        form.watch(`itemPairs.${index}.id`)
                      )}
                      onChange={(file) => {
                        const itemId = form.watch(`itemPairs.${index}.id`);
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
                      placeholder="Drop left image"
                      disabled={isUploading}
                      isUploading={isUploading}
                      maxSize={5 * 1024 * 1024}
                    />
                  </div>
                </div>

                {/* Right Item */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name={`itemPairs.${index}.rightText`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder={
                              isOneSideFixed
                                ? "Matching text to drag (optional if image provided)"
                                : "Right side item (optional if image provided)"
                            }
                            className="min-h-[60px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Right Image Upload */}
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Right Image (Optional)
                    </div>
                    <ImagePreviewUpload
                      value={rightImages.get(
                        form.watch(`itemPairs.${index}.id`)
                      )}
                      onChange={(file) => {
                        const itemId = form.watch(`itemPairs.${index}.id`);
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
                      placeholder="Drop right image"
                      disabled={isUploading}
                      isUploading={isUploading}
                      maxSize={5 * 1024 * 1024}
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <div className="flex items-start">
                  {itemPairFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItemPair(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addNewItemPair}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item Pair
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              disabled={isUploading}
            >
              {showPreview ? "Hide Preview" : "Preview"}
            </Button>
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

        {/* Preview Section */}
        {showPreview && (
          <Card className="mt-6 bg-slate-50">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center font-medium text-lg">
                {form.watch("instruction")}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div>
                  <div className="bg-primary/10 p-2 rounded-t-lg text-center font-medium flex items-center justify-center gap-2">
                    {form.watch("leftColumnLabel")}
                    {isOneSideFixed && <Lock className="h-4 w-4" />}
                  </div>
                  <div className="border border-t-0 rounded-b-lg p-2 min-h-[200px] space-y-2">
                    {isOneSideFixed ? (
                      // Show fixed items for one-side-fixed
                      form
                        .watch("itemPairs")
                        ?.map((pair: ItemPairType, i: number) => (
                          <div
                            key={i}
                            className="bg-white p-2 rounded border text-sm"
                          >
                            {pair.leftText || `Item ${i + 1}`}
                          </div>
                        ))
                    ) : (
                      // Show empty slots for differences
                      <div className="text-center text-muted-foreground text-sm py-8">
                        Drop zone for {form.watch("leftColumnLabel")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div className="bg-primary/10 p-2 rounded-t-lg text-center font-medium">
                    {form.watch("rightColumnLabel")}
                  </div>
                  <div className="border border-t-0 rounded-b-lg p-2 min-h-[200px]">
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Drop zone for {form.watch("rightColumnLabel")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Draggable Items Pool */}
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">
                  Items to drag:
                </div>
                <div className="flex flex-wrap gap-2">
                  {form
                    .watch("itemPairs")
                    ?.map((pair: ItemPairType, i: number) => (
                      <React.Fragment key={i}>
                        {!isOneSideFixed && pair.leftText && (
                          <span className="bg-white px-3 py-1 rounded border text-sm">
                            {pair.leftText}
                          </span>
                        )}
                        {pair.rightText && (
                          <span className="bg-white px-3 py-1 rounded border text-sm">
                            {pair.rightText}
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
};

export default DialogActivityForm;
