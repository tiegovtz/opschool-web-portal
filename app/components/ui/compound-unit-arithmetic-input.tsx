// CompoundUnitArithmeticInput.tsx
import { defineComponent, computed } from "vue";
import { cn } from "@/lib/utils";
import Input from "@/components/ui/inputs/input.vue";

export default defineComponent({
  name: "CompoundUnitArithmeticInput",
  props: {
    modelValue: { type: String, required: true },
    disabled: Boolean,
    isChecked: Boolean,
    colorScheme: {
      type: String as () => "blue" | "yellow" | "green" | "red",
      default: "blue",
    },
    readOnly: Boolean,
    columnCount: { type: Number, required: true },
    correctAnswer: { type: String, required: true },
  },
  emits: ["update:modelValue"],

  setup(props, { emit }) {
    // 🔍 Extract units
    const extractUnits = (answer: string): string[] => {
      const match = answer.match(/cua\((.*?)\)/);
      if (!match) return Array(props.columnCount).fill("");

      const separator = match[1]?.includes("|") ? "|" : ",";
      const parts = match[1]?.split(separator);

      return parts?.map((part) => {
        const unitMatch = part.match(/^(\d*)([a-zA-Z]+)$/);
        return unitMatch ? unitMatch[2] : "";
      }) as string[];
    };

    // 🔍 Parse user values
    const parseUserValues = (val: string): string[] => {
      const match = val.match(/cua\((.*?)\)/);
      if (!match) return Array(props.columnCount).fill("");

      const separator = match[1]?.includes("|") ? "|" : ",";
      const parts = match[1]?.split(separator);

      return parts?.map((part) => {
        const valueMatch = part.match(/^(\d*)([a-zA-Z]*)$/);
        return valueMatch ? valueMatch[1] : part;
      }) as string[];
    };

    const units = computed(() => extractUnits(props.correctAnswer));
    const userValues = computed(() => parseUserValues(props.modelValue));

    // ✏️ Handle input change
    const handleChange = (index: number, val: string) => {
      const newValues = [...userValues.value];
      newValues[index] = val;

      const newValue = `cua(${newValues
        .map((v, i) => `${v}${units.value[i] || ""}`)
        .join(",")})`;

      emit("update:modelValue", newValue);
    };

    // 🎨 Colors
    const colors = computed(() => {
      if (props.colorScheme === "green") {
        return { border: "border-green-500", bg: "bg-green-50" };
      }
      if (props.colorScheme === "red") {
        return { border: "border-red-500", bg: "bg-red-50" };
      }
      if (props.isChecked || props.colorScheme === "yellow") {
        return { border: "border-lemon-500", bg: "bg-lemon-50" };
      }
      return { border: "border-picton-blue-500", bg: "bg-white" };
    });

    return () => (
      <div class="compound-unit-arithmetic-input flex flex-row flex-wrap items-end justify-start gap-2 sm:gap-3">
        {Array.from({ length: props.columnCount }).map((_, index) => (
          <div
            key={`col-${index}`}
            class="flex flex-col items-center gap-1 min-w-[4.25rem]"
          >
            {units.value[index] ? (
              <span class="text-sm font-semibold text-picton-blue-700 font-sans tracking-tight">
                {units.value[index]}
              </span>
            ) : (
              <span class="text-sm font-sans min-h-[1.25rem]" aria-hidden="true">
                &nbsp;
              </span>
            )}

            <Input
              type="text"
              inputmode="numeric"
              modelValue={userValues.value[index] || ""}
              onUpdate:modelValue={(val: string) =>
                handleChange(index, val)
              }
              disabled={props.disabled}
              class={cn(
                "w-[4.25rem] h-10 px-2 text-center text-base font-sans border-2 rounded-md shadow-sm",
                colors.value.border,
                colors.value.bg,
                {
                  "cursor-not-allowed":
                    props.disabled || props.readOnly,
                }
              )}
            />
          </div>
        ))}
      </div>
    );
  },
});

/**
 * True only for metric-style compound answers like `cua(11km,6dam,2m)` or `cua(4)`.
 * Backend may wrap comparison answers as `cua(>)` / `cua(<)` — those are not compound
 * unit inputs; treat them as plain text blanks so fill detection and inputs work.
 */
export const detectCompoundUnitArithmeticPattern = (answer: string) => {
  const pattern = /^cua\((.*?)\)$/i;
  const match = answer.match(pattern);

  if (!match) return { isCompoundUnitArithmetic: false, columnCount: 0 };

  const separator = match[1]?.includes("|") ? "|" : ",";
  const parts = match[1]?.split(separator);

  const isCompoundUnitArithmetic =
    (parts?.length ?? 0) > 0 &&
    parts!.every((part) => {
      const p = part.trim();
      if (!p) return false;
      return /^\d+[a-zA-Z]*$/i.test(p);
    });

  if (!isCompoundUnitArithmetic) {
    return { isCompoundUnitArithmetic: false, columnCount: 0 };
  }

  return {
    isCompoundUnitArithmetic: true,
    columnCount: parts?.length ?? 0,
  };
};

export const getEmptyCompoundUnitArithmeticValue = (columnCount: number) => {
  return `cua(${Array(columnCount).fill("").join(",")})`;
};