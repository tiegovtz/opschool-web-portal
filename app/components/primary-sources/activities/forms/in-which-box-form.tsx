"use client";

import React, { useState, useEffect } from "react";
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
import { Loader2, LayoutGrid, ImageIcon, Type } from "lucide-react";
import {
  inWhichBoxSchema,
  InWhichBoxType,
  IN_WHICH_BOX_TYPES,
  getBoxCount,
  getItemType,
  getItemsPerBox,
  BoxItemType,
} from "@/shared/schemas/activities/in-which-box";
import { BaseActivityFormProps, ActivityMetadata } from "./index";
import ImagePreviewUpload from "@/components/ui/image-preview-upload";
import { uploadOptionalImage } from "@/services/upload.service";
import { useGrades } from "@/shared/services/activities-search-filters";
import { getGradeName } from "@/lib/utils";

interface InWhichBoxFormProps extends BaseActivityFormProps<InWhichBoxType> {
  variant?: "two-boxes" | "three-boxes";
  itemType?: "text" | "pics" | "mixed";
}

// Generate unique ID for items
const generateItemId = () => Math.random().toString(36).substring(2, 8);

/**
 * Transforms the form data into the server format.
 *
 * Server format varies by activity type:
 * - "In Which Box" (3 boxes, text): 3 questions, each with textOne=label, textTwo=items/separated/by/slash
 * - "In Which Box Two Boxes" (2 boxes, text): 2 questions, textOne=label, textTwo=items/separated/by/slash
 * - Mixed/Pics variants: Complex format with items and label in comma-separated string, images in path fields
 */
export function transformToServerFormat(
  formData: InWhichBoxType,
  metadata?: ActivityMetadata,
  uploadedImages?: {
    boxImages?: Map<string, Map<string, string | null>>; // boxId -> (itemId -> path)
  }
) {
  const activityDescription = formData.instruction;
  const boxCount = getBoxCount(formData.type);
  const itemType = getItemType(formData.type);

  interface QuestionData {
    text_one: string;
    text_two: string;
    text_three?: string | null;
    description: string | null;
    path?: string | null;
    path_two?: string | null;
    path_three?: string | null;
    path_four?: string | null;
  }

  let questions: QuestionData[] = [];

  if (itemType === "text") {
    // Simple text format: each question = one box
    // textOne = box label, textTwo = items separated by /
    questions = formData.boxes.map((box) => ({
      text_one: box.label,
      text_two: box.items.map((item) => item.text).join("/"),
      description: null,
    }));
  } else {
    // Mixed/Pics format: complex structure
    // For 2 boxes with 6 items each:
    // - textOne = "item1,item2,item3,item4,item5,item6,BoxLabel,"
    // - textTwo = "item1,item2,item3,item4,item5,item6,BoxLabel,"
    // - Images distributed across 3 questions

    const box1 = formData.boxes[0];
    const box2 = formData.boxes[1];
    const box3 = formData.boxes[2]; // May be undefined for 2-box variants

    const box1Images = uploadedImages?.boxImages?.get(box1.id);
    const box2Images = uploadedImages?.boxImages?.get(box2.id);
    const box3Images = box3
      ? uploadedImages?.boxImages?.get(box3.id)
      : undefined;

    if (boxCount === 2) {
      // 2 boxes format
      const box1ItemsStr =
        box1.items.map((item) => item.text || generateItemId()).join(",") +
        "," +
        box1.label +
        ",";
      const box2ItemsStr =
        box2.items.map((item) => item.text || generateItemId()).join(",") +
        "," +
        box2.label +
        ",";

      // Question 1: first 4 items from each box
      questions.push({
        text_one: box1ItemsStr,
        text_two: box2ItemsStr,
        description: null,
        path: box1Images?.get(box1.items[0]?.id) || null,
        path_two: box1Images?.get(box1.items[1]?.id) || null,
        path_three: box1Images?.get(box1.items[2]?.id) || null,
        path_four: box1Images?.get(box1.items[3]?.id) || null,
      });

      // Question 2: more items (for box2's first 4 images)
      questions.push({
        text_one: box1ItemsStr,
        text_two: box2ItemsStr,
        description: null,
        path: box2Images?.get(box2.items[0]?.id) || null,
        path_two: box2Images?.get(box2.items[1]?.id) || null,
        path_three: box2Images?.get(box2.items[2]?.id) || null,
        path_four: box2Images?.get(box2.items[3]?.id) || null,
      });

      // Question 3: remaining items (items 5-6 from each box)
      questions.push({
        text_one: "",
        text_two: "",
        description: null,
        path: box1Images?.get(box1.items[4]?.id) || null,
        path_two: box1Images?.get(box1.items[5]?.id) || null,
        path_three: box2Images?.get(box2.items[4]?.id) || null,
        path_four: box2Images?.get(box2.items[5]?.id) || null,
      });
    } else {
      // 3 boxes format
      const box1ItemsStr =
        box1.items.map((item) => item.text || generateItemId()).join(",") +
        "," +
        box1.label;
      const box2ItemsStr =
        box2.items.map((item) => item.text || generateItemId()).join(",") +
        "," +
        box2.label;
      const box3ItemsStr = box3
        ? box3.items.map((item) => item.text || generateItemId()).join(",") +
          "," +
          box3.label
        : "";

      // Question 1: images for box1
      questions.push({
        text_one: box1ItemsStr,
        text_two: box2ItemsStr,
        text_three: box3ItemsStr,
        description: null,
        path: box1Images?.get(box1.items[0]?.id) || null,
        path_two: box1Images?.get(box1.items[1]?.id) || null,
        path_three: box1Images?.get(box1.items[2]?.id) || null,
        path_four: box1Images?.get(box1.items[3]?.id) || null,
      });

      // Question 2: images for box2
      questions.push({
        text_one: box1ItemsStr,
        text_two: box2ItemsStr,
        text_three: box3ItemsStr,
        description: null,
        path: box2Images?.get(box2.items[0]?.id) || null,
        path_two: box2Images?.get(box2.items[1]?.id) || null,
        path_three: box2Images?.get(box2.items[2]?.id) || null,
        path_four: box2Images?.get(box2.items[3]?.id) || null,
      });

      // Question 3: images for box3
      questions.push({
        text_one: "",
        text_two: "",
        text_three: "",
        description: null,
        path: box3Images?.get(box3?.items[0]?.id) || null,
        path_two: box3Images?.get(box3?.items[1]?.id) || null,
        path_three: box3Images?.get(box3?.items[2]?.id) || null,
        path_four: box3Images?.get(box3?.items[3]?.id) || null,
      });
    }
  }

  return {
    activity: {
      activity_name: metadata?.activityName || formData.instruction,
      topic_id: metadata?.topicId ? parseInt(metadata.topicId) : 0,
      description: formData.type,
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

const InWhichBoxForm: React.FC<InWhichBoxFormProps> = ({
  onSubmitSuccess,
  onCancel,
  defaultValues,
  context = "assignment",
  onSubmit: customOnSubmit,
  metadata,
  variant = "two-boxes",
  itemType: initialItemType = "text",
}) => {
  const { grades } = useGrades("TET", "REGULAR_ACTIVITIES");
  const [isUploading, setIsUploading] = useState(false);
  // Store images as Map<boxId, Map<itemId, File>>
  const [boxImages, setBoxImages] = useState<
    Map<string, Map<string, File | null>>
  >(new Map());

  const getDefaultType = (): InWhichBoxType["type"] => {
    if (variant === "three-boxes") {
      if (initialItemType === "pics") return ActivityType.InWhichBoxPics;
      if (initialItemType === "mixed")
        return ActivityType.InWhichBoxMixedThreeBoxes;
      return ActivityType.InWhichBox;
    } else {
      if (initialItemType === "pics")
        return ActivityType.InWhichBoxPicsTwoBoxesSixItems;
      if (initialItemType === "mixed")
        return ActivityType.InWhichBoxMixedTwoBoxesSixItems;
      return ActivityType.InWhichBoxTwoBoxes;
    }
  };

  const createInitialItems = (count: number): BoxItemType[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: generateItemId(),
      text: "",
    }));
  };

  const createInitialBoxes = (boxCount: number, itemsPerBox: number) => {
    return Array.from({ length: boxCount }, (_, i) => ({
      id: (i + 1).toString(),
      label: "",
      items: createInitialItems(itemsPerBox),
    }));
  };

  const defaultType = getDefaultType();
  const defaultBoxCount = getBoxCount(defaultType);
  const defaultItemsPerBox = getItemsPerBox(defaultType);

  const form = useForm<InWhichBoxType>({
    resolver: zodResolver(inWhichBoxSchema),
    defaultValues: {
      type: defaultType,
      instruction: "Sort each item into the appropriate box.",
      boxes: createInitialBoxes(defaultBoxCount, defaultItemsPerBox),
      ...defaultValues,
    },
  });

  const { fields: boxFields, replace: replaceBoxes } = useFieldArray({
    control: form.control,
    name: "boxes",
  });

  const watchedType = form.watch("type");
  const currentBoxCount = getBoxCount(watchedType);
  const currentItemType = getItemType(watchedType);
  const currentItemsPerBox = getItemsPerBox(watchedType);

  // Update boxes when type changes
  useEffect(() => {
    const currentBoxes = form.getValues("boxes");
    if (currentBoxes.length !== currentBoxCount) {
      // Need to adjust number of boxes
      if (currentBoxes.length < currentBoxCount) {
        // Add more boxes
        const newBoxes = [...currentBoxes];
        for (let i = currentBoxes.length; i < currentBoxCount; i++) {
          newBoxes.push({
            id: (i + 1).toString(),
            label: "",
            items: createInitialItems(currentItemsPerBox),
          });
        }
        replaceBoxes(newBoxes);
      } else {
        // Remove extra boxes
        replaceBoxes(currentBoxes.slice(0, currentBoxCount));
      }
    }

    // Update items per box
    const updatedBoxes = form.getValues("boxes").map((box) => {
      if (box.items.length !== currentItemsPerBox) {
        if (box.items.length < currentItemsPerBox) {
          return {
            ...box,
            items: [
              ...box.items,
              ...createInitialItems(currentItemsPerBox - box.items.length),
            ],
          };
        } else {
          return {
            ...box,
            items: box.items.slice(0, currentItemsPerBox),
          };
        }
      }
      return box;
    });
    replaceBoxes(updatedBoxes);
  }, [watchedType, currentBoxCount, currentItemsPerBox]);

  const onSubmit = async (data: InWhichBoxType) => {
    try {
      if (customOnSubmit) {
        setIsUploading(true);

        const gradeName = getGradeName(metadata?.gradeId, grades);
        const uploadedBoxImages = new Map<string, Map<string, string | null>>();

        if (gradeName && currentItemType !== "text") {
          // Upload images for each box
          for (const [boxId, itemImages] of boxImages.entries()) {
            const uploadedItemImages = new Map<string, string | null>();
            for (const [itemId, file] of itemImages.entries()) {
              if (file) {
                try {
                  const path = await uploadOptionalImage(gradeName, file);
                  uploadedItemImages.set(itemId, path);
                } catch (error) {
                  console.error(
                    `Failed to upload image for box ${boxId}, item ${itemId}:`,
                    error
                  );
                }
              }
            }
            uploadedBoxImages.set(boxId, uploadedItemImages);
          }
        }

        await customOnSubmit({
          ...data,
          _uploadedImages: {
            boxImages: uploadedBoxImages,
          },
        } as any);
      } else {
        toast.error("Activity submission not configured");
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
      default:
        return "Create Activity";
    }
  };

  const getActivityTypeLabel = (type: (typeof IN_WHICH_BOX_TYPES)[number]) => {
    const boxCount = getBoxCount(type);
    const itemType = getItemType(type);
    const itemsPerBox = getItemsPerBox(type);

    let label = `${boxCount} Boxes`;
    if (itemType === "pics") label += " • Images";
    else if (itemType === "mixed") label += " • Mixed";
    else label += " • Text";
    label += ` • ${itemsPerBox} items`;

    return label;
  };

  const handleImageChange = (
    boxId: string,
    itemId: string,
    file: File | null
  ) => {
    setBoxImages((prev) => {
      const newMap = new Map(prev);
      let boxMap = newMap.get(boxId);
      if (!boxMap) {
        boxMap = new Map();
        newMap.set(boxId, boxMap);
      }
      if (file) {
        boxMap.set(itemId, file);
      } else {
        boxMap.delete(itemId);
      }
      return newMap;
    });
  };

  const getImageForItem = (boxId: string, itemId: string) => {
    return boxImages.get(boxId)?.get(itemId) || null;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Info */}
        <Alert>
          <LayoutGrid className="h-4 w-4" />
          <AlertTitle className="ml-2">{watchedType}</AlertTitle>
          <AlertDescription className="ml-2">
            Students sort items into {currentBoxCount} categories.
            {currentItemType === "text" && " Items are displayed as text."}
            {currentItemType === "pics" &&
              " Items are displayed as images only."}
            {currentItemType === "mixed" &&
              " Items are displayed as images with text labels."}
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {IN_WHICH_BOX_TYPES.map((type) => {
                        const typeItemType = getItemType(type);
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
                            <div className="flex items-center gap-1 mb-1">
                              {typeItemType === "pics" && (
                                <ImageIcon className="h-4 w-4" />
                              )}
                              {typeItemType === "text" && (
                                <Type className="h-4 w-4" />
                              )}
                              {typeItemType === "mixed" && (
                                <>
                                  <ImageIcon className="h-3 w-3" />
                                  <Type className="h-3 w-3" />
                                </>
                              )}
                            </div>
                            <p className="text-xs font-medium leading-tight">
                              {getActivityTypeLabel(type)}
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
                      placeholder="e.g., Sort each item into the appropriate box."
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

        {/* Boxes */}
        {boxFields.map((boxField, boxIndex) => (
          <Card key={boxField.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Box {boxIndex + 1}</CardTitle>
                <Badge variant="outline">
                  {form.watch(`boxes.${boxIndex}.items`)?.length || 0} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Box Label */}
              <FormField
                control={form.control}
                name={`boxes.${boxIndex}.label`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Box Label / Category Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`e.g., Category ${boxIndex + 1}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Items */}
              <div className="space-y-3">
                <FormLabel>
                  Items
                  {currentItemType === "pics" && (
                    <span className="text-muted-foreground font-normal ml-1">
                      (upload images for each item)
                    </span>
                  )}
                  {currentItemType === "mixed" && (
                    <span className="text-muted-foreground font-normal ml-1">
                      (add text label and image for each item)
                    </span>
                  )}
                </FormLabel>

                <div
                  className={`grid gap-3 ${
                    currentItemType === "text"
                      ? "grid-cols-2 md:grid-cols-3"
                      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  }`}
                >
                  {form
                    .watch(`boxes.${boxIndex}.items`)
                    ?.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className="p-3 bg-muted/30 rounded-lg space-y-2"
                      >
                        <div className="text-xs text-muted-foreground font-medium">
                          Item {itemIndex + 1}
                        </div>

                        {/* Text input - show for text and mixed types */}
                        {currentItemType !== "pics" && (
                          <FormField
                            control={form.control}
                            name={`boxes.${boxIndex}.items.${itemIndex}.text`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Item text"
                                    className="text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Image upload - show for pics and mixed types */}
                        {currentItemType !== "text" && (
                          <ImagePreviewUpload
                            value={getImageForItem(
                              form.watch(`boxes.${boxIndex}.id`),
                              item.id
                            )}
                            onChange={(file) => {
                              handleImageChange(
                                form.watch(`boxes.${boxIndex}.id`),
                                item.id,
                                file
                              );
                            }}
                            placeholder="Drop image"
                            disabled={isUploading}
                            isUploading={isUploading}
                            maxSize={5 * 1024 * 1024}
                          />
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

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

export default InWhichBoxForm;
