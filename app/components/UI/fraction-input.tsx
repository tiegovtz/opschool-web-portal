"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/inputs/input";

export interface FractionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isMixed: boolean;
  isChecked?: boolean;
  colorScheme?: "blue" | "yellow" | "green" | "red";
  readOnly?: boolean;
}

/**
 * FractionInput Component
 *
 * Renders input fields arranged as a fraction for math questions.
 *
 * @param value - Current value in format "frac(a/b)" or "frac(a/b/c)"
 * @param onChange - Callback when value changes
 * @param disabled - Whether inputs are disabled
 * @param isMixed - Whether to render as mixed fraction (whole number + fraction)
 * @param isChecked - Whether answer has been checked (affects styling)
 * @param colorScheme - Color scheme for borders and styling
 * @param readOnly - Whether inputs are read-only (for display purposes)
 *
 * @example
 * // Regular fraction
 * <FractionInput
 *   value="frac(3/4)"
 *   onChange={(val) => setValue(val)}
 *   isMixed={false}
 * />
 *
 * @example
 * // Mixed fraction
 * <FractionInput
 *   value="frac(1/3/4)"
 *   onChange={(val) => setValue(val)}
 *   isMixed={true}
 * />
 */
export const FractionInput = memo(
  ({
    value,
    onChange,
    disabled = false,
    isMixed,
    isChecked = false,
    colorScheme = "blue",
    readOnly = false,
  }: FractionInputProps) => {
    // Parse the value: frac(a/b) or frac(a/b/c)
    const parseFraction = (val: string) => {
      const match = val.match(/frac\(([\d/]*)\)/);
      if (!match) return isMixed ? ["", "", ""] : ["", ""];
      const parts = match[1].split("/");
      return isMixed
        ? [parts[0] || "", parts[1] || "", parts[2] || ""]
        : [parts[0] || "", parts[1] || ""];
    };

    const [whole, numerator, denominator] = isMixed
      ? parseFraction(value)
      : ["", ...parseFraction(value)];

    const handleChange = (
      part: "whole" | "numerator" | "denominator",
      val: string,
    ) => {
      // Only allow numbers
      if (val !== "" && !/^\d+$/.test(val)) return;

      let newValue;
      if (isMixed) {
        const w = part === "whole" ? val : whole;
        const n = part === "numerator" ? val : numerator;
        const d = part === "denominator" ? val : denominator;
        newValue = `frac(${w}/${n}/${d})`;
      } else {
        const n = part === "numerator" ? val : numerator;
        const d = part === "denominator" ? val : denominator;
        newValue = `frac(${n}/${d})`;
      }
      onChange(newValue);
    };

    // Get color classes based on color scheme and checked state
    const getColorClasses = () => {
      if (colorScheme === "green") {
        return {
          border: "border-green-500",
          divider: "border-green-500",
        };
      }
      if (colorScheme === "red") {
        return {
          border: "border-red-500",
          divider: "border-red-500",
        };
      }
      if (isChecked) {
        return {
          border: "border-lemon-500",
          divider: "border-lemon-500",
        };
      }
      return {
        border: "border-picton-blue-500",
        divider: "border-picton-blue-500",
      };
    };

    const colors = getColorClasses();

    return (
      <span className="inline-flex items-center gap-1 mx-1">
        {isMixed && (
          <Input
            type="text"
            value={whole}
            onChange={(e) => handleChange("whole", e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(
              "w-12 h-10 px-1 text-center bg-transparent rounded border-2",
              colors.border,
              {
                "cursor-not-allowed": disabled || readOnly,
              },
            )}
          />
        )}
        <span className="inline-flex flex-col gap-1 items-center">
          <Input
            type="text"
            value={numerator}
            onChange={(e) => handleChange("numerator", e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(
              "w-12 h-8 px-1 text-center border-2 focus:outline-none bg-transparent",
              colors.border,
              {
                "cursor-not-allowed": disabled || readOnly,
              },
            )}
          />
          <div className={cn("w-full border-b-2", colors.divider)} />
          <Input
            type="text"
            value={denominator}
            onChange={(e) => handleChange("denominator", e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(
              "w-12 h-8 px-1 text-center border-2 focus:outline-none bg-transparent",
              colors.border,
              {
                "cursor-not-allowed": disabled || readOnly,
              },
            )}
          />
        </span>
      </span>
    );
  },
);

FractionInput.displayName = "FractionInput";

/**
 * Helper function to detect if an answer string is a fraction pattern
 * @param answer - The answer string to check
 * @returns Object with isFraction and isMixed properties
 */
export const detectFractionPattern = (answer: string) => {
  const isFraction = /^frac\((\d+\/\d+)\)$/.test(answer);
  const isMixedFraction = /^frac\((\d+\/\d+\/\d+)\)$/.test(answer);

  return {
    isFraction: isFraction || isMixedFraction,
    isMixed: isMixedFraction,
  };
};

/**
 * Helper function to get initial empty fraction value
 * @param isMixed - Whether it's a mixed fraction
 * @returns Empty fraction string
 */
export const getEmptyFractionValue = (isMixed: boolean) => {
  return isMixed ? "frac(//)" : "frac(/)";
};
