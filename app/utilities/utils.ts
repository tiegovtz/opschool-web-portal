import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const shuffle = (array: any[]) => {
  const arrayCopy = [...array];
  for (let i = arrayCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
  }
  return arrayCopy;
};

export const getRandomItems = (array: any[], count: number) => {
  const arrayCopy = [...array];
  const shuffledArray = shuffle(arrayCopy);
  return shuffledArray.slice(0, count);
};

export function getInitials(fullName: string): string {
  const names = fullName.trim().split(/\s+/); // Split by whitespace
  const firstInitial = names[0]?.charAt(0).toUpperCase() || ""; // First name initial
  const lastInitial = names[names.length - 1]?.charAt(0).toUpperCase() || ""; // Last name initial
  return `${firstInitial}${lastInitial}`;
}

export const getGradeName = (
  gradeId?: string,
  grades?: { gradeId: number; gradeName: string; description: string }[]
) => {
  if (!gradeId || !grades) return "";
  const grade = grades.find((g) => g.gradeId === parseInt(gradeId));
  return grade ? grade.description : "";
};

export const getCommonSeparator = (text: string | undefined): string => {
  if (!text) return ",";
  const separators = [",", ";", "/", "|", ":", " "];
  const foundSeparators = separators.filter((sep) => text.includes(sep));
  return foundSeparators.length > 0 ? foundSeparators[0] ?? "," : ",";
};

export const toRoman = (num: number): string => {
  const romanMap: [string, number][] = [
    ["m", 1000],
    ["cm", 900],
    ["d", 500],
    ["cd", 400],
    ["c", 100],
    ["xc", 90],
    ["l", 50],
    ["xl", 40],
    ["x", 10],
    ["ix", 9],
    ["v", 5],
    ["iv", 4],
    ["i", 1],
  ];

  let result = "";
  for (const [roman, value] of romanMap) {
    while (num >= value) {
      result += roman;
      num -= value;
    }
  }
  return result;
};

// utils/extractKatex.js
export const extractKatexSegments = (text: string) => {
  const segments = [];
  let buffer = "";
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === "\\") {
      buffer += ch;
      i++; // skip next character
      if (i < text.length) buffer += text[i];
      continue;
    }

    if (ch === "{") {
      if (depth === 0) {
        // flush normal text before brace
        if (buffer) {
          segments.push({ type: "text", value: buffer });
          buffer = "";
        }
      } else {
        buffer += ch;
      }
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;
      if (depth === 0) {
        // close math block
        segments.push({ type: "math", value: buffer });
        buffer = "";
      } else if (depth < 0) {
        depth = 0; // unbalanced
      } else {
        buffer += ch;
      }
      continue;
    }

    buffer += ch;
  }

  if (buffer) {
    segments.push({ type: "text", value: buffer });
  }

  return segments;
};

export const isFractionorMixedFraction = (
  value: string
): {
  isFraction: boolean;
  isMixedFraction: boolean;
  isFractionOrMixedFraction: boolean;
} => {
  const isFraction = /^frac\((\d+\/\d+)\)$/.test(value);
  const isMixedFraction = /^frac\((\d+\/\d+\/\d+)\)$/.test(value);

  return {
    isFraction,
    isMixedFraction,
    isFractionOrMixedFraction: isFraction || isMixedFraction,
  };
};
