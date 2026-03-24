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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityType } from "@/lib/types/activity-types";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Plus,
  X,
  Image as ImageIcon,
  HelpCircle,
} from "lucide-react";
import {
  HiddenWordsType,
  hiddenWordsSchema,
} from "@/shared/schemas/activities/hidden-words";
import FileUpload from "@/components/ui/file-upload";
import { BaseActivityFormProps, ActivityMetadata } from "./index";

interface HiddenWordsFormProps extends BaseActivityFormProps<HiddenWordsType> {}

const HiddenWordsForm: React.FC<HiddenWordsFormProps> = ({
  onSubmitSuccess,
  onCancel,
  defaultValues,
  context = "assignment",
  onSubmit: customOnSubmit,
  metadata,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [gridPreview, setGridPreview] = useState<string[][]>([]);

  // Determine if this is a game mode based on defaultValues
  const isGameMode = defaultValues?.type === ActivityType.HiddenWordsGame;

  const form = useForm<HiddenWordsType & Partial<ActivityMetadata>>({
    resolver: zodResolver(hiddenWordsSchema),
    defaultValues: {
      title:
        metadata?.title ||
        (isGameMode ? "Hidden Words Game" : "Find the Hidden Words"),
      displayTitle:
        metadata?.displayTitle ||
        (isGameMode ? "Hidden Words Game" : "Find the Hidden Words"),
      type: isGameMode
        ? ActivityType.HiddenWordsGame
        : ActivityType.HiddenWords,
      words: isGameMode ? [] : ["APPLE", "BANANA", "ORANGE", "GRAPE", "MELON"],
      gridSize: {
        rows: 10,
        columns: 10,
      },
      difficulty: "medium",
      instructions:
        metadata?.instructions ||
        (isGameMode
          ? "Find all the hidden words in the grid below. This is a timed game mode with random objects!"
          : "Find all the hidden words in the grid below. Words can be horizontal, vertical, or diagonal."),
      notes: isGameMode
        ? "Objects will be fetched based on the specified type criteria. Look carefully at each row and column."
        : "Look carefully at each row and column. Words may be spelled forwards or backwards.",
      questionImage: null,
      showWordList: true,
      allowDiagonal: true,
      allowReverse: false,
      // Game mode specific fields
      ...(isGameMode && {
        objectType: "",
        gameTimeLimit: 300, // 5 minutes default
      }),
      ...defaultValues,
    },
  });

  const onSubmit = async (
    data: HiddenWordsType & Partial<ActivityMetadata>,
  ) => {
    try {
      if (customOnSubmit) {
        await customOnSubmit(data);
      } else {
        const { activitiesApi } = await import(
          "@/shared/services/activities-api"
        );
        const result = await activitiesApi.createActivity(data as any);

        toast.success("Activity created successfully!");

        if (onSubmitSuccess) {
          onSubmitSuccess(result.id);
        }
      }
    } catch (error) {
      toast.error("Failed to create activity");
      console.error(error);
    }
  };

  const generateGridPreview = () => {
    const words = form.getValues("words").filter((word: string) => word.trim());
    const { rows, columns } = form.getValues("gridSize");

    // Simple preview generation (in real implementation, this would be more sophisticated)
    const grid = Array(rows)
      .fill(null)
      .map(() => Array(columns).fill("•"));

    // Place first few words horizontally for preview
    words.slice(0, 3).forEach((word: string, index: number) => {
      if (index < rows && word.length <= columns) {
        for (let i = 0; i < word.length; i++) {
          if (i < columns) {
            grid[index][i] = word[i];
          }
        }
      }
    });

    setGridPreview(grid);
  };

  const getSubmitButtonText = () => {
    switch (context) {
      case "platform":
        return "Create Public Activity";
      case "assignment":
      default:
        return "Create Activity";
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Overview */}
      {metadata && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {metadata.displayTitle}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {metadata.description}
                </p>
              </div>
              <Badge variant="outline">Hidden Words Activity</Badge>
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
              {!metadata && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Type</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select activity type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ActivityType.HiddenWords}>
                                Hidden Words (Regular)
                              </SelectItem>
                              <SelectItem value={ActivityType.HiddenWordsGame}>
                                Hidden Words Game
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Game mode fetches random objects based on type
                          criteria and has a time limit.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Game Mode Specific Fields */}
                  {form.watch("type") === ActivityType.HiddenWordsGame && (
                    <>
                      <FormField
                        control={form.control}
                        name="objectType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Object Type Criteria</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., animals/fruits/colors (separated by /)"
                                {...field}
                                className="bg-white"
                              />
                            </FormControl>
                            <FormDescription>
                              Type criteria separated by "/" - objects will be
                              fetched based on these types
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gameTimeLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Game Time Limit (seconds)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={60}
                                max={1800}
                                placeholder="300"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                                className="bg-white"
                              />
                            </FormControl>
                            <FormDescription>
                              Time limit for the game mode (60-1800 seconds)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter activity title"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions for Students</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain how to complete the activity..."
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

              <FormField
                control={form.control}
                name="questionImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Image (Optional)</FormLabel>
                    <FormControl>
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                        accept="image/*"
                        maxSize={5 * 1024 * 1024}
                        placeholder="Upload an image to accompany the word search"
                      />
                    </FormControl>
                    <FormDescription>
                      Add a related image to make the activity more engaging
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            {/* Grid Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Grid Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gridSize.rows"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grid Rows</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={5}
                            max={20}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gridSize.columns"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grid Columns</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={5}
                            max={20}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Easy: Words are placed horizontally and vertically only.
                        Medium: Words can also be placed diagonally. Hard: Words
                        can also be placed in reverse.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </Card>

          {/* Words to Find - Only show for regular mode */}
          {form.watch("type") !== ActivityType.HiddenWordsGame && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Words to Find</CardTitle>
                  <Badge variant="outline">
                    {
                      form.watch("words").filter((word: string) => word.trim())
                        .length
                    }{" "}
                    words
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.watch("words").map((word: string, index: number) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`words.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Word {index + 1}</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter word"
                                className="uppercase"
                                onChange={(e) =>
                                  field.onChange(e.target.value.toUpperCase())
                                }
                              />
                            </FormControl>
                            {form.watch("words").length > 3 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  const words = form
                                    .getValues("words")
                                    .filter(
                                      (_: string, i: number) => i !== index,
                                    );
                                  form.setValue("words", words);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const words = form.getValues("words");
                      form.setValue("words", [...words, ""]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Word
                  </Button>

                  {form.watch("words").length > 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const words = form.getValues("words");
                        form.setValue("words", words.slice(0, 10));
                        toast.info("Reduced to 10 words for better gameplay");
                      }}
                    >
                      Reduce to 10 Words
                    </Button>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    💡 <strong>Tips:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Use 5-12 words for optimal difficulty</li>
                    <li>Words should be 3-10 letters long</li>
                    <li>
                      Consider theme-related words (e.g., animals, colors, food)
                    </li>
                    <li>Avoid very similar words to prevent confusion</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Game Mode Information */}
          {form.watch("type") === ActivityType.HiddenWordsGame && (
            <Card>
              <CardHeader>
                <CardTitle>Game Mode Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  In game mode, words will be automatically fetched from the
                  database based on the object type criteria you specified
                  above. The system will randomly select up to 9 objects for
                  each game session.
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">
                    How it works:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Objects are filtered by the type criteria you entered
                    </li>
                    <li>
                      • Up to 9 random objects will be selected for each game
                    </li>
                    <li>
                      • Previously completed objects are filtered out for replay
                      value
                    </li>
                    <li>
                      • If no new objects are available, existing ones will be
                      reused
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="sm:w-auto w-full"
            >
              Cancel
            </Button>
            <Button type="submit" className="sm:w-auto w-full">
              {getSubmitButtonText()}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default HiddenWordsForm;
