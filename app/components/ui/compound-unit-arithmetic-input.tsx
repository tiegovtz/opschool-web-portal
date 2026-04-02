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
      return { border: "border-picton-blue-500", bg: "bg-transparent" };
    });

    return () => (
      <div class="flex gap-2 items-end my-2">
        {Array.from({ length: props.columnCount }).map((_, index) => (
          <div key={`col-${index}`} class="flex flex-col items-start">
            {units.value[index] && (
              <span class="font-medium ml-1">{units.value[index]}</span>
            )}

            <Input
              type="text"
              modelValue={userValues.value[index] || ""}
              onUpdate:modelValue={(val: string) =>
                handleChange(index, val)
              }
              disabled={props.disabled}
              class={cn(
                "w-20 h-10 px-2 text-center border-2 rounded",
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

export const detectCompoundUnitArithmeticPattern = (answer: string) => {
  const pattern = /^cua\((.*?)\)$/;
  const match = answer.match(pattern);

  if (!match) return { isCompoundUnitArithmetic: false, columnCount: 0 };

  const separator = match[1]?.includes("|") ? "|" : ",";
  const parts = match[1]?.split(separator);

  return {
    isCompoundUnitArithmetic: true,
    columnCount: parts?.length,
  };
};

export const getEmptyCompoundUnitArithmeticValue = (columnCount: number) => {
  return `cua(${Array(columnCount).fill("").join(",")})`;
};