import { ReactNode } from "react";
import { Variants } from "motion/react";
import * as motion from "motion/react-client";

interface MotionDivProps {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  initial?: boolean;
  animate?: boolean;
}

const defaultVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export const MotionDiv = ({
  children,
  variants = defaultVariants,
  className = "",
  initial = false,
  animate = true,
}: MotionDivProps) => {
  return (
    <motion.div
      variants={variants}
      initial={initial}
      animate={animate}
      className={className}
    >
      {children}
    </motion.div>
  );
};
