"use client";

import React, { useState } from "react";
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
import { ACTIVITY_TYPES_CONFIG } from "@/shared/config/activity-types-config";
import { ActivityType } from "@/lib/types/activity-types";
import DynamicIcon from "@/components/ui/dynamic-icon";
import { Search, Filter } from "lucide-react";
import Heading from "../../../../../tie_open_school_primary_frontend/components/heading";

interface ReusableActivityTypeGridProps {
  onActivityTypeSelect: (activityType: ActivityType) => void;
  showOnlyImplemented?: boolean;
  allowSearch?: boolean;
  context?: "assignment" | "platform";
}

export const ReusableActivityTypeGrid: React.FC<
  ReusableActivityTypeGridProps
> = ({
  onActivityTypeSelect,
  showOnlyImplemented = false,
  allowSearch = true,
  context = "assignment",
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter activities based on props and state
  const filteredActivities = ACTIVITY_TYPES_CONFIG.filter((activity) => {
    // Filter by implementation status
    if (showOnlyImplemented && !activity.implemented) {
      return false;
    }

    // Filter by search term
    if (
      searchTerm &&
      !activity.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const contextMessage =
    context === "platform"
      ? "Platform activities will be publicly available to all users. Ensure that the activity content meets our quality standards."
      : "Assignments created here will be assigned to your students. Make sure the activity is suitable for your class.";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Heading>Choose Activity Type</Heading>
        <p className="text-muted-foreground mt-1">
          Select the type of activity you want to create.
        </p>
      </div>

      {/* Search and Filter Controls */}
      {allowSearch && (
        <div className="flex flex-col sm:flex-row gap-4">
          {allowSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search activity types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>
      )}

      {/* Context Information */}
      <div className="p-4 bg-lemon-50 border border-lemon-200 rounded-lg">
        <p className="text-lemon-800 text-sm">
          <strong>Note:</strong> {contextMessage}
        </p>
      </div>

      {/* Activity Grid - All Activities */}
      {filteredActivities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((activity) => (
            <Card
              key={activity.type}
              className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-picton-blue-200 bg-picton-blue-50 hover:border-picton-blue-300 ${
                !activity.implemented
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : ""
              }`}
              onClick={() => onActivityTypeSelect(activity.type)}
            >
              <CardHeader className="pb-3">
                <div
                  className={`w-12 h-12 rounded-lg ${activity.bgColor} flex items-center justify-center mb-3`}
                >
                  <DynamicIcon
                    name={activity.iconName}
                    className={`h-8 w-8 ${activity.color}`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-picton-blue-900">
                    {activity.title}
                  </CardTitle>
                  {!activity.implemented && (
                    <Badge
                      variant="outline"
                      className="text-xs border-picton-blue-300 text-picton-blue-600"
                    >
                      Coming Soon
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm text-picton-blue-600">
                  {activity.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-picton-blue-500 mb-2">
            No activity types found
          </div>
          <p className="text-sm text-picton-blue-400">
            {searchTerm
              ? "Try adjusting your search terms"
              : "No activities match your current filters"}
          </p>
          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-picton-blue-300 text-picton-blue-600 hover:bg-picton-blue-50"
              onClick={() => {
                setSearchTerm("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
