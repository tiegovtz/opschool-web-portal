"use client";

import React, { useEffect, useState } from "react";
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
  ListOrdered,
  AlertCircle,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  rearrangeStepsVerticallySchema,
  RearrangeStepsVerticallyType,
  generateStepId,
  createDefaultSteps,
} from "@/shared/schemas/activities/rearrange-steps-vertically";
import { BaseActivityFormProps, ActivityMetadata } from "./index";

interface RearrangeStepsVerticallyFormProps
  extends BaseActivityFormProps<RearrangeStepsVerticallyType> {}

const MIN_STEPS = 5;
const MAX_STEPS = 10;

/**
 * Transforms the form data into the server format.
 *
 * Server format for Rearrange Steps Vertically:
 * - activity.description = algorithm name ("Rearrange the steps vertically" or "Rearrange the steps vertically eight rows")
 * - activity.activity_description = instruction text
 * - activity_question.text_one = step text (order is implicit by array index)
 */
export function transformToServerFormat(
  formData: RearrangeStepsVerticallyType,
  metadata?: ActivityMetadata
) {
  // Transform steps to questions - order is determined by array index
  const questions = formData.steps.map((step) => ({
    text_one: step.text,
    text_two: null,
    text_three: null,
    description: null,
    path: null,
  }));

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

const RearrangeStepsVerticallyForm: React.FC<
  RearrangeStepsVerticallyFormProps
> = ({ onCancel, onSubmit, defaultValues }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RearrangeStepsVerticallyType>({
    resolver: zodResolver(rearrangeStepsVerticallySchema),
    defaultValues: {
      type: ActivityType.RearrangeStepsVertically,
      instruction: "",
      steps: createDefaultSteps(MIN_STEPS),
      ...defaultValues,
    },
    mode: "onChange",
  });

  const { fields, append, remove, swap } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const watchSteps = form.watch("steps");
  const stepCount = watchSteps?.length || 0;
  const canAddMore = stepCount < MAX_STEPS;
  const canRemove = stepCount > MIN_STEPS;

  // Determine which activity type to use based on step count
  useEffect(() => {
    // Update the type based on step count:
    // - 6 steps: "Rearrange the steps vertically"
    // - 8+ steps: "Rearrange the steps vertically eight rows"
    if (stepCount > 6) {
      form.setValue("type", ActivityType.RearrangeStepsVerticallyEightRows);
    } else {
      form.setValue("type", ActivityType.RearrangeStepsVertically);
    }
  }, [stepCount, form]);

  const handleAddStep = () => {
    if (canAddMore) {
      append({ id: generateStepId(), text: "" });
    }
  };

  const handleRemoveStep = (index: number) => {
    if (canRemove) {
      remove(index);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      swap(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      swap(index, index + 1);
    }
  };

  const handleSubmit = async (data: RearrangeStepsVerticallyType) => {
    // Check for empty steps
    const emptySteps = data.steps.filter((step) => !step.text.trim());
    if (emptySteps.length > 0) {
      toast.error("All step fields must be filled");
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(data);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit form";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filledStepsCount = watchSteps?.filter((s) => s.text.trim()).length || 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <ListOrdered className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              Rearrange the Steps Vertically
            </h2>
            <p className="text-sm text-muted-foreground">
              Create an activity where students arrange steps in the correct
              order
            </p>
          </div>
        </div>

        {/* Instructions Card */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>How it works</AlertTitle>
          <AlertDescription>
            Enter the steps in the <strong>correct order</strong>. The activity
            will automatically shuffle them for students. Students must drag and
            drop the steps back into the correct sequence.
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
                      placeholder="e.g., Arrange the following steps in the correct order to make a cup of tea."
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

        {/* Steps Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                Steps
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Min: {MIN_STEPS} | Max: {MAX_STEPS}
                </Badge>
                {/*<Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                  disabled={!canAddMore}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </Button>*/}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                {/* Step Number Indicator */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold text-sm shrink-0">
                  {index + 1}
                </div>

                {/* Step Input */}
                <FormField
                  control={form.control}
                  name={`steps.${index}.text`}
                  render={({ field: inputField }) => (
                    <FormItem className="flex-1 space-y-0">
                      <FormControl>
                        <Input
                          placeholder={`Enter step ${index + 1}...`}
                          {...inputField}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reorder Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                    className="h-8 w-8"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === fields.length - 1}
                    title="Move down"
                    className="h-8 w-8"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveStep(index)}
                  disabled={!canRemove}
                  title={
                    canRemove
                      ? "Remove step"
                      : `Minimum ${MIN_STEPS} steps required`
                  }
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Add Step Button (inline) */}
            {canAddMore && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-2 text-muted-foreground hover:text-foreground"
                onClick={handleAddStep}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Step ({MAX_STEPS - stepCount} remaining)
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
            disabled={isSubmitting || filledStepsCount < MIN_STEPS}
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

export default RearrangeStepsVerticallyForm;
