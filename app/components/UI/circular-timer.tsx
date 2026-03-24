"use client";

import { Clock } from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";

export type TimerState = "idle" | "normal" | "warning" | "critical" | "ended";

export type CircularTimerProps = {
  timeLeft: number;
  totalTimeLimit: number;
  isTimerActive: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  position?: "fixed-top-left" | "inline";
  onTimeUp?: () => void;
  playTimerSounds?: boolean;
  soundTriggerType?: "single-question" | "full-activity";
  warningThreshold?: number; // Seconds when warning starts
  criticalThreshold?: number; // Seconds when critical starts
  onStateChange?: (state: TimerState) => void;
};

const sizeConfig = {
  sm: {
    container: "w-16 h-16",
    icon: "w-4 h-4",
    text: "text-sm",
    strokeWidth: "8",
    radius: 28,
  },
  md: {
    container: "w-24 h-24",
    icon: "w-6 h-6",
    text: "text-2xl",
    strokeWidth: "10",
    radius: 50,
  },
  lg: {
    container: "w-32 h-32",
    icon: "w-8 h-8",
    text: "text-3xl",
    strokeWidth: "12",
    radius: 60,
  },
};

export const CircularTimer = ({
  timeLeft,
  totalTimeLimit,
  isTimerActive,
  className = "",
  size = "md",
  position = "fixed-top-left",
  onTimeUp,
  playTimerSounds = false,
  soundTriggerType = "single-question",
  warningThreshold,
  criticalThreshold,
  onStateChange,
}: CircularTimerProps) => {
  const {
    playSound,
    playLoopingSound,
    stopLoopingSound,
    updateLoopingPlaybackRate,
    soundEnabled,
  } = useSoundEffects();

  const [currentState, setCurrentState] = useState<TimerState>("idle");
  const hasPlayedWarningSound = useRef(false);
  const hasPlayedCriticalSound = useRef(false);
  const hasPlayedEndSound = useRef(false);
  const previousTimeLeft = useRef(timeLeft);

  const config = sizeConfig[size];
  const radius = config.radius;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, (timeLeft / totalTimeLimit) * circumference);
  const percentage = Math.max(0, (timeLeft / totalTimeLimit) * 100);

  // Calculate thresholds based on sound trigger type and props
  const getThresholds = () => {
    if (soundTriggerType === "single-question") {
      return {
        warning: warningThreshold ?? Math.max(10, totalTimeLimit * 0.4),
        critical: criticalThreshold ?? Math.max(5, totalTimeLimit * 0.2),
      };
    } else {
      // full-activity
      return {
        warning: warningThreshold ?? 30,
        critical: criticalThreshold ?? 10,
      };
    }
  };

  const thresholds = getThresholds();

  // Determine current timer state
  const determineTimerState = (): TimerState => {
    if (timeLeft <= 0) return "ended";
    if (!isTimerActive) return "idle";
    if (timeLeft <= thresholds.critical) return "critical";
    if (timeLeft <= thresholds.warning) return "warning";
    return "normal";
  };

  // Get colors based on current state
  const getTimerColor = () => {
    switch (currentState) {
      case "critical":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "ended":
        return "text-red-600";
      default:
        return "text-picton-blue-500";
    }
  };

  const getTimerStrokeColor = () => {
    switch (currentState) {
      case "critical":
        return "#ef4444"; // red-500
      case "warning":
        return "#f59e0b"; // yellow-500
      case "ended":
        return "#dc2626"; // red-600
      default:
        return "#3b82f6"; // picton-blue-500
    }
  };

  // Animation variants
  const timerVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut",
      },
    },
    shake: {
      x: [-1, 1, -1, 1, 0],
      y: [-1, 1, -1, 1, 0],
      transition: {
        duration: 0.4,
        repeat: Infinity,
        repeatDelay: 0.1,
      },
    },
    bounce: {
      scale: [1, 1.1, 0.95, 1],
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // Handle state changes and sound effects
  useEffect(() => {
    const newState = determineTimerState();

    if (newState !== currentState) {
      const prevState = currentState;
      setCurrentState(newState);

      // Notify parent of state change
      if (onStateChange) {
        onStateChange(newState);
      }

      // Handle sound effects with dynamic playback rates
      if (playTimerSounds && soundEnabled) {
        // Calculate urgency for dynamic playback rates
        const urgency = Math.max(0, Math.min(1, 1 - timeLeft / totalTimeLimit));

        switch (newState) {
          case "normal":
            // Stop any looping sounds when returning to normal
            if (prevState === "warning" || prevState === "critical") {
              stopLoopingSound();
            }
            break;

          case "warning":
            if (prevState !== "warning") {
              // Play one-time warning sound
              if (!hasPlayedWarningSound.current) {
                playSound("click");
                hasPlayedWarningSound.current = true;
              }
              // Start warning loop sound with dynamic rate
              const warningRate = 1.0 + urgency * 0.5; // 1.0x to 1.5x
              playLoopingSound("timerTick", { playbackRate: warningRate });
            }
            break;

          case "critical":
            if (prevState !== "critical") {
              // Play one-time critical sound
              if (!hasPlayedCriticalSound.current) {
                // playSound("failure");
                hasPlayedCriticalSound.current = true;
              }
              // Start critical loop sound with dynamic rate
              const criticalRate = 1.5 + urgency * 1.0; // 1.5x to 2.5x
              playLoopingSound("timerEnd", { playbackRate: criticalRate });
            } else {
              // Update playback rate for ongoing critical state
              const criticalRate = 1.5 + urgency * 1.0;
              if (typeof updateLoopingPlaybackRate === "function") {
                updateLoopingPlaybackRate(criticalRate);
              }
            }
            break;

          case "ended":
            // Stop all looping sounds
            stopLoopingSound();

            // Play end sound once
            if (!hasPlayedEndSound.current && timeLeft <= 0) {
              if (soundTriggerType === "single-question") {
                playSound("ding");
              } else {
                playSound("failure");
              }
              hasPlayedEndSound.current = true;

              // Call onTimeUp callback
              if (onTimeUp) {
                onTimeUp();
              }
            }
            break;

          case "idle":
            stopLoopingSound();
            break;
        }
      }
    }
  }, [
    timeLeft,
    isTimerActive,
    currentState,
    playTimerSounds,
    soundEnabled,
    soundTriggerType,
    thresholds.warning,
    thresholds.critical,
    playSound,
    playLoopingSound,
    stopLoopingSound,
    onTimeUp,
    onStateChange,
  ]);

  // Reset sound flags when timer resets or starts
  useEffect(() => {
    if (timeLeft > previousTimeLeft.current || timeLeft === totalTimeLimit) {
      hasPlayedWarningSound.current = false;
      hasPlayedCriticalSound.current = false;
      hasPlayedEndSound.current = false;
      if (timeLeft === totalTimeLimit) {
        stopLoopingSound();
        setCurrentState("idle");
      }
    }
    previousTimeLeft.current = timeLeft;
  }, [timeLeft, totalTimeLimit, stopLoopingSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLoopingSound();
    };
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Get animation variant based on state
  const getAnimationVariant = () => {
    if (!isTimerActive) return {};

    switch (currentState) {
      case "critical":
        return "shake";
      case "warning":
        return "pulse";
      case "ended":
        return "bounce";
      default:
        return {};
    }
  };

  // Container classes
  const containerClasses = cn(
    config.container,
    position === "fixed-top-left" && "fixed top-20 left-4 z-50",
    position === "inline" && "relative",
    className,
  );

  return (
    <motion.div
      className={containerClasses}
      animate={getAnimationVariant()}
      variants={timerVariants}
    >
      <div className="relative w-full h-full">
        {/* Background Circle */}
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${(radius + 10) * 2} ${(radius + 10) * 2}`}
        >
          <circle
            cx={radius + 10}
            cy={radius + 10}
            r={radius}
            fill="none"
            stroke="#e5e7eb" // gray-200
            strokeWidth={config.strokeWidth}
          />

          {/* Progress Circle */}
          <motion.circle
            cx={radius + 10}
            cy={radius + 10}
            r={radius}
            fill="none"
            stroke={getTimerStrokeColor()}
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform={`rotate(-90 ${radius + 10} ${radius + 10})`}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference - progress,
              stroke: getTimerStrokeColor(),
            }}
            transition={{
              strokeDashoffset: { duration: 0.5, ease: "linear" },
              stroke: { duration: 0.2 },
            }}
          />
        </svg>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Clock className={cn(config.icon, getTimerColor())} />
          <div className={cn(config.text, "font-bold", getTimerColor())}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Warning indicator for critical state */}
        {currentState === "critical" && (
          <motion.div
            className="absolute -inset-1 rounded-full border-2 border-red-500"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
            }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default CircularTimer;
