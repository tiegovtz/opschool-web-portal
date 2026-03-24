"use client";

import React, { Suspense, lazy } from "react";
import { ActivityType } from "@/lib/types/activity-types";
import { getActivityTypeConfig } from "@/shared/config/activity-types-config";
import { BaseActivityFormProps } from "./forms";

interface ActivityFormLoaderProps extends BaseActivityFormProps {
  activityType: ActivityType | string | null;
}

// Loading component
const FormLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    <span className="ml-3 text-gray-600">Loading activity form...</span>
  </div>
);

// Error boundary component for form loading errors
const FormErrorFallback = ({
  activityType,
  onCancel,
}: {
  activityType: string;
  onCancel?: () => void;
}) => (
  <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
    <h3 className="text-red-800 font-medium mb-2">Form Loading Error</h3>
    <p className="text-red-700 mb-4">
      The form for "{activityType}" could not be loaded. This might be because:
    </p>
    <ul className="text-red-600 text-sm list-disc list-inside mb-4">
      <li>The form component is not yet implemented</li>
      <li>There was an error loading the form</li>
      <li>The activity type configuration is incorrect</li>
    </ul>
    <button
      onClick={onCancel}
      className="px-4 py-2 bg-white border border-red-300 rounded-md hover:bg-red-100 text-red-700"
    >
      Go Back
    </button>
  </div>
);

// Not implemented component
const FormNotImplemented = ({
  activityType,
  onCancel,
}: {
  activityType: string;
  onCancel?: () => void;
}) => (
  <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
    <h3 className="text-amber-800 font-medium mb-2">Form Not Implemented</h3>
    <p className="text-amber-700 mb-4">
      The form for "{activityType}" has not been implemented yet. Please check
      back later or select another activity type.
    </p>
    <div className="flex gap-3">
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-white border border-amber-300 rounded-md hover:bg-amber-100 text-amber-700"
      >
        Go Back
      </button>
      <a
        href="mailto:support@softteacher.com?subject=Request Activity Form Implementation"
        className="px-4 py-2 bg-amber-200 border border-amber-300 rounded-md hover:bg-amber-300 text-amber-800"
      >
        Request Implementation
      </a>
    </div>
  </div>
);

// Dynamic form component loader with error handling
const DynamicFormComponent = ({
  activityType,
  formComponent,
  ...props
}: ActivityFormLoaderProps & { formComponent: string }) => {
  const [FormComponent, setFormComponent] =
    React.useState<React.ComponentType<any> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true);
        setError(null);

        // Dynamic import of the form component
        const formModule = await import(`./forms/${formComponent}`);

        // Get the default export or named export
        const Component =
          formModule.default ||
          formModule[
            // Convert kebab-case to PascalCase for component name
            formComponent
              .split("-")
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join("") + "Form"
          ];

        if (!Component) {
          throw new Error(`Form component not found in ${formComponent}`);
        }

        setFormComponent(() => Component);
      } catch (err) {
        console.error(`Failed to load form component: ${formComponent}`, err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formComponent]);

  if (loading) {
    return <FormLoadingFallback />;
  }

  if (error || !FormComponent) {
    return (
      <FormErrorFallback
        activityType={activityType as string}
        onCancel={props.onCancel}
      />
    );
  }

  return <FormComponent {...props} />;
};

// Main Activity Form Loader Component
export const ActivityFormLoader: React.FC<ActivityFormLoaderProps> = ({
  activityType,
  onSubmitSuccess,
  onCancel,
  defaultValues,
  context = "assignment",
  onSubmit,
}) => {
  // Return early if no activity is selected
  if (!activityType) {
    return null;
  }

  // Get activity configuration
  const config = getActivityTypeConfig(activityType as ActivityType);

  if (!config) {
    return (
      <FormErrorFallback
        activityType={activityType as string}
        onCancel={onCancel}
      />
    );
  }

  // Check if form is implemented
  if (!config.implemented || !config.formComponent) {
    return (
      <FormNotImplemented activityType={config.title} onCancel={onCancel} />
    );
  }

  // Load the form component dynamically
  return (
    <Suspense fallback={<FormLoadingFallback />}>
      <DynamicFormComponent
        activityType={activityType}
        formComponent={config.formComponent}
        onSubmitSuccess={onSubmitSuccess}
        onCancel={onCancel}
        defaultValues={defaultValues}
        context={context}
        onSubmit={onSubmit}
      />
    </Suspense>
  );
};

export default ActivityFormLoader;
