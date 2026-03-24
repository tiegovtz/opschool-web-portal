"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/inputs/input";

export interface CompoundUnitArithmeticInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isChecked?: boolean;
  colorScheme?: "blue" | "yellow" | "green" | "red";
  readOnly?: boolean;
  columnCount: number;
  correctAnswer: string;
}

/**
 * CompoundUnitArithmeticInput Component
 *
 * Renders input fields for compound unit arithmetic answers
 *
 * @param value - Current value in format "cua(1,2,3)" where each number corresponds to a column
 * @param onChange - Callback when value changes
 * @param disabled - Whether inputs are disabled
 * @param isChecked - Whether answer has been checked (affects styling)
 * @param colorScheme - Color scheme for borders and styling
 * @param readOnly - Whether inputs are read-only (for display purposes)
 * @param columnCount - Number of input columns to render
 * @param correctAnswer - The correct answer string to extract units from (e.g., "cua(49km,392g,21dg)")
 *
 * @example
 * <CompoundUnitArithmeticInput
 *   value="cua(49,392,21)"
 *   onChange={(val) => setValue(val)}
 *   columnCount={3}
 *   correctAnswer="cua(49km,392g,21dg)"
 * />
 */
export const CompoundUnitArithmeticInput = memo(
  ({
    value,
    onChange,
    disabled = false,
    isChecked = false,
    colorScheme = "blue",
    readOnly = false,
    columnCount,
    correctAnswer,
  }: CompoundUnitArithmeticInputProps) => {
    // Extract units from correct answer: cua(49km,392g,21dg) -> ["km", "g", "dg"]
    const extractUnits = (answer: string): string[] => {
      const match = answer.match(/cua\((.*?)\)/);
      if (!match) return Array(columnCount).fill("");
      const separator = match[1].includes("|") ? "|" : ",";
      const parts = match[1].split(separator);

      return parts.map((part) => {
        // Extract only the unit part (e.g., "49km" -> "km")
        const unitMatch = part.match(/^(\d*)([a-zA-Z]+)$/);
        return unitMatch ? unitMatch[2] : "";
      });
    };

    // Parse user's current input value: cua(49,392,21) -> ["49", "392", "21"]
    const parseUserValues = (val: string): string[] => {
      const match = val.match(/cua\((.*?)\)/);
      if (!match) return Array(columnCount).fill("");
      const separator = match[1].includes("|") ? "|" : ",";
      const parts = match[1].split(separator);

      return parts.map((part) => {
        // Extract only the numeric part (e.g., "49km" or "49" -> "49")
        const valueMatch = part.match(/^(\d*)([a-zA-Z]*)$/);
        return valueMatch ? valueMatch[1] : part;
      });
    };

    const units = extractUnits(correctAnswer);
    const userValues = parseUserValues(value);

    const handleChange = (index: number, val: string) => {
      const newValues = [...userValues];
      newValues[index] = val;
      // Reconstruct with units from correct answer
      const newValue = `cua(${newValues.map((v, i) => `${v}${units[i] || ""}`).join(",")})`;
      onChange(newValue);
    };

    // Get color classes based on color scheme and checked state
    const getColorClasses = () => {
      if (colorScheme === "green") {
        return {
          border: "border-green-500",
          bg: "bg-green-50",
        };
      }
      if (colorScheme === "red") {
        return {
          border: "border-red-500",
          bg: "bg-red-50",
        };
      }
      if (isChecked || colorScheme === "yellow") {
        return {
          border: "border-lemon-500",
          bg: "bg-lemon-50",
        };
      }
      return {
        border: "border-picton-blue-500",
        bg: "bg-transparent",
      };
    };

    const colors = getColorClasses();

    return (
      <div className="flex gap-2 items-end my-2">
        {Array.from({ length: columnCount }).map((_, index) => (
          <div key={`col-${index}`} className="flex flex-col items-start">
            {units[index] && (
              <span className="font-medium ml-1">{units[index]}</span>
            )}
            <Input
              type="text"
              value={userValues[index] || ""}
              onChange={(e) => handleChange(index, e.target.value)}
              disabled={disabled}
              readOnly={readOnly}
              className={cn(
                "w-20 h-10 px-2 text-center border-2 rounded",
                colors.border,
                colors.bg,
                {
                  "cursor-not-allowed": disabled || readOnly,
                },
              )}
            />
          </div>
        ))}
      </div>
    );
  },
);

CompoundUnitArithmeticInput.displayName = "CompoundUnitArithmeticInput";

/**
 * Helper function to detect if an answer string is a compound unit arithmetic pattern
 * @param answer - The answer string to check
 * @returns Object with detection result and column count
 */
export const detectCompoundUnitArithmeticPattern = (answer: string) => {
  const pattern = /^cua\((.*?)\)$/;
  const match = answer.match(pattern);

  if (!match) return { isCompoundUnitArithmetic: false, columnCount: 0 };

  // Support both comma and pipe separators
  const separator = match[1].includes("|") ? "|" : ",";
  const parts = match[1].split(separator);

  return {
    isCompoundUnitArithmetic: true,
    columnCount: parts.length,
  };
};

/**
 * Helper function to get initial empty compound unit arithmetic value
 * @param columnCount - Number of columns
 * @returns Empty value string
 */
export const getEmptyCompoundUnitArithmeticValue = (columnCount: number) => {
  const emptyValues = Array(columnCount).fill("");
  return `cua(${emptyValues.join(",")})`;
};
