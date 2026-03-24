"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/inputs/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Info, ImageIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import FileUpload from "@/components/ui/file-upload";
import { toast } from "sonner";
import {
  useGrades,
  useSubjects,
  useTopics,
  useCurriculums,
} from "@/shared/services/activities-search-filters";
import { uploadActivityImage } from "@/services/upload.service";

// Schema for activity metadata - aligned with backend Activity model
const activityMetadataSchema = z.object({
  // Maps to activity_name in backend
  activityName: z.string().min(1, "Activity name is required"),
  // Maps to summary in backend - shown in "Learn More" section
  summary: z.string().optional(),
  // Maps to sub_topic in backend - optional sub-topic within the topic
  subTopic: z.string(),
  // Classification - curriculum code (e.g., "NECTA", "KYN", "CAMB")
  // gradeId is used for filtering subjects/topics but not stored directly on activity
  gradeId: z.string().min(1, "Grade is required"),
  // subjectId is used for filtering topics but not stored directly on activity
  subjectId: z.string().min(1, "Subject is required"),
  // Maps to topic_id in backend - required foreign key
  topicId: z.string().min(1, "Topic is required"),
  // Premium content flag
  isPremium: z.boolean().optional().default(false),
  // Maps to summary_path in backend - path to activity image
  summaryPath: z.string().optional(),
});

export type ActivityMetadata = z.infer<typeof activityMetadataSchema>;

interface ActivityMetadataFormProps {
  onSubmit: (metadata: ActivityMetadata) => void;
  onCancel?: () => void;
  defaultValues?: Partial<ActivityMetadata>;
  isSubmitting?: boolean;
  isEditMode?: boolean;
}

const ActivityMetadataForm: React.FC<ActivityMetadataFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  isSubmitting = false,
  isEditMode = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<ActivityMetadata>({
    resolver: zodResolver(activityMetadataSchema),
    defaultValues: {
      activityName: "",
      summary: "",
      subTopic: "",
      gradeId: "",
      subjectId: "",
      topicId: "",
      isPremium: false,
      summaryPath: "",
      ...defaultValues,
    },
  });

  // const selectedCurriculum = form.watch("curriculumCode");
  const selectedGrade = form.watch("gradeId");
  const selectedSubject = form.watch("subjectId");

  // Fetch grades based on selected curriculum
  const { grades, gradesLoading } = useGrades("TET", "REGULAR_ACTIVITIES");

  // Fetch subjects based on grade
  const { subjects, subjectsLoading } = useSubjects(
    "TET",
    selectedGrade ? parseInt(selectedGrade) : undefined
  );

  // Fetch topics based on grade and subject
  const { topics, topicsLoading } = useTopics(
    "TET",
    selectedSubject ? parseInt(selectedSubject) : undefined,
    selectedGrade ? parseInt(selectedGrade) : undefined
  );

  // Reset dependent fields when curriculum changes
  useEffect(() => {
    form.setValue("gradeId", "");
    form.setValue("subjectId", "");
    form.setValue("topicId", "");
  }, [form]);

  // Reset dependent fields when grade changes
  useEffect(() => {
    if (selectedGrade) {
      form.setValue("subjectId", "");
      form.setValue("topicId", "");
    }
  }, [selectedGrade, form]);

  // Reset topic when subject changes
  useEffect(() => {
    if (selectedSubject) {
      form.setValue("topicId", "");
    }
  }, [selectedSubject, form]);

  // Update activity name with topic name when topic changes
  useEffect(() => {
    if (form.watch("topicId")) {
      const selectedTopic = topics?.find(
        (topic) => topic.id.toString() === form.watch("topicId")
      );
      if (selectedTopic) {
        form.setValue("activityName", selectedTopic.topicName);
      }
    }
  }, [form.watch("topicId")]);

  const handleFormSubmit = (data: ActivityMetadata) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-picton-blue-700">
          Activity Information
        </h2>
        <p className="text-muted-foreground">
          Fill in the basic information about your activity
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-6"
        >
          {/* Classification Card */}
          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="gradeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={gradesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gradesLoading ? (
                            <SelectItem value="loading" disabled>
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading grades...
                              </div>
                            </SelectItem>
                          ) : (
                            grades?.map((grade) => (
                              <SelectItem
                                key={grade.gradeId}
                                value={grade.gradeId.toString()}
                              >
                                {grade.gradeName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedGrade || subjectsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjectsLoading ? (
                            <SelectItem value="loading" disabled>
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading subjects...
                              </div>
                            </SelectItem>
                          ) : (
                            subjects?.map((subject) => (
                              <SelectItem
                                key={subject.id}
                                value={subject.id.toString()}
                              >
                                {subject.subjectName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="topicId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedSubject || topicsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select topic" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {topicsLoading ? (
                            <SelectItem value="loading" disabled>
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading topics...
                              </div>
                            </SelectItem>
                          ) : (
                            topics?.map((topic) => (
                              <SelectItem
                                key={topic.id}
                                value={topic.id.toString()}
                              >
                                {topic.topicName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="subTopic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Two-digit addition"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A clear, descriptive name for this activity
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Activity Image Card */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Activity Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedGrade ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Select a Grade First</AlertTitle>
                  <AlertDescription>
                    Please select a grade above before uploading an image. The
                    image will be stored in the grade-specific folder.
                  </AlertDescription>
                </Alert>
              ) : (
                <FormField
                  control={form.control}
                  name="summaryPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Image (Optional)</FormLabel>
                      <FormControl>
                        <FileUpload
                          value={previewUrl || field.value}
                          accept="image/*"
                          maxSize={5 * 1024 * 1024}
                          placeholder="Drop activity image here or click to upload"
                          disabled={isUploading || isSubmitting}
                          onChange={async (file) => {
                            if (!file) {
                              setSelectedFile(null);
                              setPreviewUrl(null);
                              field.onChange("");
                              return;
                            }

                            setSelectedFile(file);

                            // Create preview
                            const reader = new FileReader();
                            reader.onload = () => {
                              setPreviewUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);

                            // Get grade name for upload
                            const grade = grades?.find(
                              (g) => g.gradeId.toString() === selectedGrade
                            );

                            if (!grade) {
                              toast.error(
                                "Could not determine grade. Please re-select the grade."
                              );
                              return;
                            }

                            // Upload the file
                            setIsUploading(true);
                            try {
                              const response = await uploadActivityImage(
                                grade.gradeName,
                                file
                              );
                              field.onChange(response.image_path);
                              toast.success(response.message);
                            } catch (error: any) {
                              console.error("Upload failed:", error);
                              const errorMessage =
                                error.response?.data?.detail ||
                                error.message ||
                                "Failed to upload image";
                              toast.error(errorMessage);
                              // Clear the preview on error
                              setSelectedFile(null);
                              setPreviewUrl(null);
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload an image for this activity. Max size: 5MB.
                        Supported formats: JPEG, PNG, GIF, WebP.
                      </FormDescription>
                      {field.value && (
                        <p className="text-xs text-muted-foreground">
                          Saved path: {field.value}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card> */}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="sm:w-auto w-full"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="sm:w-auto w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue to Activity Setup"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ActivityMetadataForm;
