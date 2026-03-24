"use client";

import { motion } from "motion/react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("flex items-center space-x-2 text-sm", className)}
      aria-label="Breadcrumb navigation"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center space-x-1 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all duration-200"
      >
        <Home size={14} className="text-picton-blue-600" />
      </motion.div>

      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="flex items-center space-x-2"
        >
          <ChevronRight size={14} className="text-gray-400" />

          {item.onClick ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={item.onClick}
              className={cn(
                "px-3 py-1.5 rounded-full transition-all duration-200 font-medium",
                item.active
                  ? "bg-picton-blue-100 text-picton-blue-800 shadow-sm"
                  : "text-gray-600 hover:text-picton-blue-700 hover:bg-white/40 backdrop-blur-sm"
              )}
            >
              {item.label}
            </motion.button>
          ) : (
            <span
              className={cn(
                "px-3 py-1.5 rounded-full font-medium",
                item.active
                  ? "bg-picton-blue-600 text-white shadow-md"
                  : "text-gray-500"
              )}
            >
              {item.label}
            </span>
          )}
        </motion.div>
      ))}
    </motion.nav>
  );
};

export default Breadcrumb;
