"use client";

import { defineComponent, ref, computed, type PropType } from "vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ACTIVITY_TYPES_CONFIG,
  type ActivityTypeConfig,
} from "@/shared/config/activity-types-config";
import { ActivityType } from "@/lib/types/activity-types";
import DynamicIcon from "@/components/ui/dynamic-icon";
import { Icon } from "@iconify/vue";
import Heading from "@/components/ui/heading";

interface ReusableActivityTypeGridProps {
  onActivityTypeSelect: (activityType: ActivityType) => void;
  showOnlyImplemented?: boolean;
  allowSearch?: boolean;
  context?: "assignment" | "platform";
}

export const ReusableActivityTypeGrid = defineComponent({
  name: "ReusableActivityTypeGrid",
  props: {
    onActivityTypeSelect: {
      type: Function as PropType<
        ReusableActivityTypeGridProps["onActivityTypeSelect"]
      >,
      required: true,
    },
    showOnlyImplemented: Boolean,
    allowSearch: {
      type: Boolean,
      default: true,
    },
    context: {
      type: String as PropType<ReusableActivityTypeGridProps["context"]>,
      default: "assignment",
    },
  },
  setup(props) {
    const searchTerm = ref("");

    const filteredActivities = computed<ActivityTypeConfig[]>(() =>
      ACTIVITY_TYPES_CONFIG.filter((activity) => {
        if (props.showOnlyImplemented && !activity.implemented) {
          return false;
        }

        if (
          searchTerm.value &&
          !activity.title.toLowerCase().includes(searchTerm.value.toLowerCase()) &&
          !activity.description
            .toLowerCase()
            .includes(searchTerm.value.toLowerCase())
        ) {
          return false;
        }

        return true;
      }),
    );

    const contextMessage = computed(() =>
      props.context === "platform"
        ? "Platform activities will be publicly available to all users. Ensure that the activity content meets our quality standards."
        : "Assignments created here will be assigned to your students. Make sure the activity is suitable for your class.",
    );

    return () => (
      <div class="space-y-6">
        <div>
          <Heading>Choose Activity Type</Heading>
          <p class="mt-1 text-slate-500">
            Select the type of activity you want to create.
          </p>
        </div>

        {props.allowSearch ? (
          <div class="flex flex-col gap-4 sm:flex-row">
            <div class="relative flex-1">
              <Icon
                icon="lucide:search"
                class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search activity types..."
                modelValue={searchTerm.value}
                onUpdate:modelValue={(value: string | number) => {
                  searchTerm.value = String(value ?? "");
                }}
                class="pl-10"
              />
            </div>
          </div>
        ) : null}

        <div class="rounded-2xl border border-oceanBlue/15 bg-sky-50 p-4">
          <p class="text-sm text-oceanBlue">
            <strong>Note:</strong> {contextMessage.value}
          </p>
        </div>

        {filteredActivities.value.length > 0 ? (
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.value.map((activity: ActivityTypeConfig) => (
            <Card
              key={activity.type}
              class={`cursor-pointer border-2 border-oceanBlue/10 bg-white transition-all duration-200 hover:border-oceanBlue/30 hover:shadow-lg ${
                !activity.implemented
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : ""
              }`}
              onClick={() => props.onActivityTypeSelect(activity.type)}
            >
              <CardHeader class="pb-3">
                <div
                  class={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${activity.bgColor}`}
                >
                  <DynamicIcon
                    name={activity.iconName}
                    className={`h-8 w-8 ${activity.color}`}
                  />
                </div>
                <div class="flex items-center justify-between gap-2">
                  <CardTitle class="text-base text-oceanBlue">
                    {activity.title}
                  </CardTitle>
                  {!activity.implemented && (
                    <Badge
                      variant="outline"
                      class="border-oceanBlue/20 text-xs text-oceanBlue"
                    >
                      Coming Soon
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent class="pt-0">
                <CardDescription class="text-sm text-slate-500">
                  {activity.description}
                </CardDescription>
              </CardContent>
            </Card>
            ))}
          </div>
        ) : (
          <div class="py-12 text-center">
            <div class="mb-2 text-oceanBlue">No activity types found</div>
            <p class="text-sm text-slate-400">
              {searchTerm.value
              ? "Try adjusting your search terms"
              : "No activities match your current filters"}
            </p>
            {searchTerm.value ? (
              <Button
                variant="outline-brand"
                size="sm"
                class="mt-4"
                onClick={() => {
                  searchTerm.value = "";
                }}
              >
                Clear Filters
              </Button>
            ) : null}
          </div>
        )}
      </div>
    );
  },
});

export default ReusableActivityTypeGrid;
