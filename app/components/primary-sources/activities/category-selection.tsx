"use client";

import { motion } from "motion/react";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Baby,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import CurriculumIndicator from "@/app/(learning-activities)/curriculum-indicator";

interface CategorySelectionProps {
  onCategorySelect: (category: "nursery" | "primary" | "secondary") => void;
}

const categories = [
  {
    id: "nursery" as const,
    title: "Nursery",
    subtitle: "Ages 3-5",
    description:
      "Fun and colorful learning activities for our youngest learners",
    backgroundImage: "/images/website/nursery.webp",
    cambridgeImage: "/images/website/Cambridge nursery.webp",
    icon: Baby,
    gradient: "from-pink-400 via-purple-400 to-pink-500",
    textColor: "text-white",
    delay: 0.1,
  },
  {
    id: "primary" as const,
    title: "Primary",
    subtitle: "Ages 6-11",
    description: "Interactive learning experiences to build strong foundations",
    backgroundImage: "/images/website/primary.webp",
    cambridgeImage: "/images/website/Cambridge primary.webp",
    icon: BookOpen,
    gradient: "from-blue-400 via-cyan-400 to-blue-500",
    textColor: "text-white",
    delay: 0.2,
  },
  {
    id: "secondary" as const,
    title: "Secondary",
    subtitle: "Ages 12+",
    description: "Advanced activities to challenge and engage older students",
    backgroundImage: "/images/website/secondary.webp",
    cambridgeImage: "/images/website/Cambridge secondary.webp",
    icon: GraduationCap,
    gradient: "from-green-400 via-emerald-400 to-green-500",
    textColor: "text-white",
    delay: 0.3,
  },
];

const CategorySelection = ({ onCategorySelect }: CategorySelectionProps) => {
  const searchParams = useSearchParams();
  const curriculum = searchParams.get("curc");

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="container mx-auto px-0 md:px-4 py-6 md:py-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-16 space-y-4"
      >
        <div className="flex items-center justify-between mb-4">
          <Button href="/" className="w-fit xl:hidden">
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>

          <CurriculumIndicator />
        </div>
        <h1 className="text-center text-4xl md:text-6xl font-bold text-picton-blue-900 mb-4">
          Choose Your Learning Level
        </h1>
        <p
          className="text-lg text-center md:text-xl text-picton-blue-600 max-w-2xl mx-auto"
          style={{ fontFamily: "var(--font-shaky-hand-some-comic)" }}
        >
          Select the category that matches your age group for the best learning
          experience
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: category.delay,
              ease: "easeOut",
            }}
            whileHover={{
              scale: 1.05,
              y: -10,
              transition: { duration: 0.3, ease: "easeOut" },
            }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer"
            onClick={() => onCategorySelect(category.id)}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-3xl h-96 shadow-2xl transition-all duration-500",
                "hover:shadow-3xl group-hover:shadow-4xl",
              )}
            >
              {/* Background Image */}
              <div className="absolute inset-0 opacity-70">
                <Image
                  src={
                    curriculum === "Cambridge"
                      ? category.cambridgeImage
                      : category.backgroundImage
                  }
                  alt={category.title}
                  fill
                  className="object-cover object-center"
                />
              </div>

              {/* Gradient Overlay */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/70 to-black/30",
                )}
              />

              {/* Content */}
              <div className="relative h-full p-8 flex flex-col justify-between">
                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="self-start"
                >
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-all duration-300">
                    <category.icon size={32} className={category.textColor} />
                  </div>
                </motion.div>

                {/* Text Content */}
                <div className="space-y-3">
                  <div>
                    <h3
                      className={cn(
                        "text-3xl font-bold mb-2 group-hover:scale-105 transition-transform duration-300",
                        category.textColor,
                      )}
                    >
                      {category.title}
                    </h3>
                    <p
                      className={cn(
                        "text-lg font-medium opacity-90",
                        category.textColor,
                      )}
                    >
                      {category.subtitle}
                    </p>
                  </div>

                  <p
                    className={cn(
                      "text-sm opacity-80 leading-relaxed",
                      category.textColor,
                    )}
                  >
                    {category.description}
                  </p>

                  {/* CTA Button */}
                  <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center space-x-2 pt-4"
                  >
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        category.textColor,
                      )}
                    >
                      Start Learning
                    </span>
                    <ArrowRight
                      size={16}
                      className={cn(
                        category.textColor,
                        "group-hover:translate-x-1 transition-transform duration-300",
                      )}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Hover Effect Shimmer */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Decorative Elements */}
      {/* <div className="absolute top-20 left-10 w-20 h-20 bg-lemon-200 rounded-full opacity-20 animate-bounce" />
      <div
        className="absolute top-40 right-20 w-16 h-16 bg-picton-blue-300 rounded-full opacity-20 animate-bounce"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute bottom-40 left-20 w-12 h-12 bg-pink-300 rounded-full opacity-20 animate-bounce"
        style={{ animationDelay: "1s" }}
      /> */}
    </motion.div>
  );
};

export default CategorySelection;
