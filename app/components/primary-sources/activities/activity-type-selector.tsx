"use client";

import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, PenLine, GraduationCap, ArrowLeft } from "lucide-react";

// Local imports
import { Button } from "../../../../../tie_open_school_primary_frontend/components/ui/button";
import CurriculumIndicator from "@/app/(learning-activities)/curriculum-indicator";
import { cn } from "@/lib/utils";

const activityTypes = [
  {
    type: "activities",
    label: "Start Learning",
    description: "Interactive activities to build knowledge",
    icon: BookOpen,
    borderColor: "border-picton-blue-200 hover:border-picton-blue-400",
    bgColor: "bg-picton-blue-100 group-hover:bg-picton-blue-200",
    iconColor: "text-picton-blue-600 group-hover:text-picton-blue-700",
    buttonBg: "bg-picton-blue-500 group-hover:bg-picton-blue-600",
    gradientFrom: "from-picton-blue-50",
    activeCurriculum: ["Tanzania Curriculum", "Cambridge"],
  },
  {
    type: "tests",
    label: "Test Yourself",
    description: "Practice tests to check understanding",
    icon: PenLine,
    borderColor: "border-lemon-200 hover:border-lemon-400",
    bgColor: "bg-lemon-100 group-hover:bg-lemon-200",
    iconColor: "text-lemon-600 group-hover:text-lemon-700",
    buttonBg: "bg-lemon-500 group-hover:bg-lemon-600",
    gradientFrom: "from-lemon-50",
    activeCurriculum: ["Tanzania Curriculum"],
  },
  {
    type: "exams",
    label: "Take Exam",
    description: "Comprehensive exams for assessment",
    icon: GraduationCap,
    borderColor: "border-purple-200 hover:border-purple-400",
    bgColor: "bg-purple-100 group-hover:bg-purple-200",
    iconColor: "text-purple-600 group-hover:text-purple-700",
    buttonBg: "bg-purple-500 group-hover:bg-purple-600",
    gradientFrom: "from-purple-50",
    activeCurriculum: ["Tanzania Curriculum"],
  },
];

const ActivityTypeSelector = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const curriculum = searchParams.get("curc");

  const handleSelect = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    // Navigate to the appropriate page with existing params
    router.push(
      `/${type}?${params.toString()}${type === "activities" ? "&type=" + type : ""}`,
    );
  };

  return (
    <div className="container mx-auto py-6 md:py-20 px-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-4">
          <Button
            href={`/activities${searchParams.get("curc") ? `?curc=${searchParams.get("curc")}` : ""}`}
            className="w-fit xl:hidden"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>
          <CurriculumIndicator />
        </div>

        <h2 className="text-3xl text-center  lg:text-5xl text-picton-blue-900 font-bold tracking-wide mb-4">
          What would you like to do?
        </h2>
        <p
          className="text-xl text-center text-picton-blue-700"
          style={{
            fontFamily: "var(--font-shaky-hand-some-comic)",
          }}
        >
          Choose your learning path
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:max-w-6xl mx-auto md:px-4">
        {activityTypes.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <motion.button
              key={activity.type}
              initial={
                activity.activeCurriculum.includes(curriculum || "")
                  ? { opacity: 0, y: 30 }
                  : { y: 30 }
              }
              animate={
                activity.activeCurriculum.includes(curriculum || "")
                  ? { opacity: 1, y: 0 }
                  : { y: 0 }
              }
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => handleSelect(activity.type)}
              className={cn(
                "relative overflow-hidden rounded-2xl bg-white border-2 transition-all hover:shadow-xl duration-300 p-8",
                activity.activeCurriculum.includes(curriculum || "")
                  ? `${activity.borderColor} group`
                  : "",
                {
                  "pointer-events-none opacity-50 grayscale":
                    !activity.activeCurriculum.includes(curriculum || ""),
                },
              )}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={`w-20 h-20 rounded-full ${activity.bgColor}
                  flex items-center justify-center transition-colors duration-300`}
                >
                  <Icon size={40} className={activity.iconColor} />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-picton-blue-900 mb-2">
                    {activity.label}
                  </h3>
                  <p
                    className="text-picton-blue-600"
                    style={{
                      fontFamily: "var(--font-shaky-hand-some-comic)",
                    }}
                  >
                    {activity.description}
                  </p>
                </div>

                <div
                  className={`mt-4 px-6 py-2 rounded-full ${activity.buttonBg}
                  text-white font-semibold transition-colors duration-300`}
                >
                  Get Started
                </div>
              </div>

              {/* Decorative gradient overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${activity.gradientFrom}
                to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTypeSelector;
