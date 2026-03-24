"use client";

import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Book,
  Palette,
  Music,
  Calculator,
  Globe,
  Heart,
  ArrowLeft,
} from "lucide-react";

// Local imports
import { cn } from "@/lib/utils";
import {
  useSubjects,
  useTopics,
} from "@/shared/services/activities-search-filters";
import { Button } from "@/components/ui/button";
import { useWindowSize } from "@/shared/hooks/use-window-size";

interface NurseryFlowProps {
  onTopicSelect: (topicId: number, subjectId: string) => void;
}

const subjectIcons = {
  1: Book, // English
  2: Calculator, // Mathematics
  3: Globe, // Science
  4: Palette, // Art
  5: Music, // Music
  6: Heart, // Health
};

const subjectColors = {
  1: {
    bg: "from-blue-400 to-blue-600",
    text: "text-white",
    accent: "bg-blue-500",
    bottomColor: "bg-blue-600",
  },
  2: {
    bg: "from-green-400 to-green-600",
    text: "text-white",
    accent: "bg-green-500",
    bottomColor: "bg-green-600",
  },
  3: {
    bg: "from-purple-400 to-purple-600",
    text: "text-white",
    accent: "bg-purple-500",
    bottomColor: "bg-purple-600",
  },
  4: {
    bg: "from-pink-400 to-pink-600",
    text: "text-white",
    accent: "bg-pink-500",
    bottomColor: "bg-pink-600",
  },
  5: {
    bg: "from-orange-400 to-orange-600",
    text: "text-white",
    accent: "bg-orange-500",
    bottomColor: "bg-orange-600",
  },
  6: {
    bg: "from-yellow-400 to-yellow-600",
    text: "text-white",
    accent: "bg-yellow-500",
    bottomColor: "bg-yellow-600",
  },
};

const NurseryFlow = ({ onTopicSelect }: NurseryFlowProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicsRef = useRef<HTMLDivElement>(null);
  const { width } = useWindowSize();

  // Get selected subject from URL
  const selectedSubject =
    searchParams && searchParams.get("subject")
      ? parseInt(searchParams.get("subject")!)
      : null;

  // Fetch subjects for nursery grade (assuming grade 1 is nursery)
  const { subjects, subjectsLoading } = useSubjects(
    (searchParams && searchParams.get("curc")) || "TET",
    16 // Nursery grade ID
  );

  const { topics, topicsLoading } = useTopics(
    (searchParams && searchParams.get("curc")) || "TET",
    selectedSubject || undefined,
    16 // Nursery grade ID
  );

  // Scroll to topics section when a subject is selected
  useEffect(() => {
    if (selectedSubject && topicsRef.current && width < 768) {
      // Small delay to ensure the topics section has rendered
      setTimeout(() => {
        const element = topicsRef.current;
        if (element) {
          const navbarHeight = 100; // Adjust this value based on your navbar height
          const elementPosition =
            element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [selectedSubject, topicsLoading]);

  const handleSubjectSelect = (subject: any, index: number) => {
    const url = new URL(window.location.href);

    if (selectedSubject === subject.id) {
      // Deselect - remove subject and topic from URL
      url.searchParams.delete("subject");
      url.searchParams.delete("topic");
    } else {
      // Select new subject
      url.searchParams.set("subject", subject.id.toString());
      url.searchParams.delete("topic"); // Clear topic when changing subject
    }

    router.push(url.pathname + "?" + url.searchParams.toString());
  };

  const handleTopicSelect = (topicId: number, subjectId: string) => {
    onTopicSelect(topicId, subjectId);
  };

  const getSubjectColor = (subjectId: number) => {
    return (
      subjectColors[subjectId as keyof typeof subjectColors] || subjectColors[1]
    );
  };

  const getSubjectIcon = (subjectId: number) => {
    return subjectIcons[subjectId as keyof typeof subjectIcons] || Book;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 md:gap-0 md:flex-row md:items-center py-6 mb-6"
      >
        <Button
          href={`/activities${
            searchParams.get("curc") ? `?curc=${searchParams.get("curc")}` : ""
          }`}
          className="w-fit"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <div className="md:text-center flex-1">
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl md:text-4xl font-bold text-picton-blue-900"
          >
            Choose Subject!
          </motion.h1>
        </div>
      </motion.div>

      <div className=" md:px-4">
        {subjectsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-picton-blue-500 border-r-transparent">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Subject Selection - Single Row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex flex-wrap justify-center gap-4">
                {subjects?.map((subject, index) => {
                  const colors = getSubjectColor(index + 1);
                  const IconComponent = getSubjectIcon(subject.id);
                  const isActive = selectedSubject === subject.id;

                  return (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: "easeOut",
                      }}
                      whileHover={
                        !isActive
                          ? {
                              scale: isActive ? 1.02 : 1.05,
                              y: -3,
                              transition: { duration: 0.2 },
                            }
                          : {}
                      }
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSubjectSelect(subject, index + 1)}
                      className="group cursor-pointer"
                    >
                      <div
                        className={cn(
                          "relative rounded-2xl h-32 w-56 shadow-lg overflow-visible transition-all duration-300",
                          "bg-gradient-to-b",
                          colors.bg,
                          isActive ? "md:rounded-b-none" : "hover:shadow-xl"
                        )}
                      >
                        <div className="relative h-full p-4 flex flex-col items-center justify-center text-center">
                          <motion.div
                            whileHover={{ rotate: 10, scale: 1.1 }}
                            transition={{ duration: 0.3 }}
                            className="mb-2"
                          >
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                              <IconComponent
                                size={20}
                                className={colors.text}
                              />
                            </div>
                          </motion.div>

                          <h3
                            className={cn(
                              "font-bold group-hover:scale-105 transition-transform duration-300",
                              colors.text
                            )}
                          >
                            {subject.subjectName}
                          </h3>
                        </div>

                        {/* Connecting Element */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 32 }}
                              exit={{ height: 0 }}
                              transition={{
                                duration: 0.3,
                                ease: "easeOut",
                                delay: 0.3,
                              }}
                              className={cn(
                                "hidden md:block absolute top-full left-0 w-full",
                                colors.bottomColor
                              )}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Topics Section - Merged with Selected Subject */}
            <AnimatePresence>
              {selectedSubject && subjects && (
                <motion.div
                  ref={topicsRef}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      "rounded-3xl p-4 md:p-8 shadow-2xl",
                      getSubjectColor(
                        subjects.findIndex((s) => s.id === selectedSubject) + 1
                      ).bottomColor
                    )}
                  >
                    {topicsLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-picton-blue-500 border-r-transparent">
                          <span className="sr-only">Loading topics...</span>
                        </div>
                      </div>
                    ) : topics?.length === 0 ? (
                      <div className="text-center py-12">
                        <h3 className="text-xl font-bold text-white mb-2">
                          No Topics Available
                        </h3>
                        <p className="text-white/80">
                          Please select a different subject to see topics
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Topics Grid */}
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {topics?.map((topic, index) => (
                            <motion.div
                              key={topic.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                duration: 0.4,
                                delay: index * 0.05,
                                ease: "easeOut",
                              }}
                              whileHover={{
                                scale: 1.03,
                                y: -2,
                                transition: { duration: 0.2 },
                              }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() =>
                                handleTopicSelect(
                                  topic.id,
                                  searchParams && searchParams.get("subject")
                                    ? searchParams.get("subject")!
                                    : "1"
                                )
                              }
                              className="group cursor-pointer"
                            >
                              <div className="relative rounded-2xl h-36 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex items-center justify-center">
                                {/* Topic Image */}
                                {/* <div className="absolute inset-0 p-3">
                                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                                  <motion.div
                                    whileHover={{ scale: 1.1, rotate: 3 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-12 h-12 relative"
                                  >
                                    <Image
                                      src={getTopicImage(index)}
                                      alt={topic.topicName}
                                      fill
                                      className="object-contain filter drop-shadow-md"
                                    />
                                  </motion.div>
                                </div>
                              </div> */}

                                <h4 className="font-bold text-center leading-tight text-lg px-2">
                                  {topic.topicName}
                                </h4>

                                {/* Topic Name */}
                                {/* <div className="absolute bottom-0 left-0 right-0 p-3">
                                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-sm">
                                  <h4 className="text-xs font-bold text-gray-800 text-center leading-tight group-hover:scale-105 transition-transform duration-300">
                                    {topic.topicName}
                                  </h4>
                                </div>
                              </div> */}

                                {/* Hover Effect */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                  <div className="absolute inset-0 bg-white/10 rounded-2xl" />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default NurseryFlow;
