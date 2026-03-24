// MultiSelect.tsx
import { defineComponent, ref, computed, watch } from "vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

export const MultiSelect = defineComponent({
  name: "MultiSelect",
  props: {
    options: {
      type: Array as () => {
        label: string;
        value: string;
        icon?: any;
      }[],
      required: true,
    },
    modelValue: {
      type: Array as () => string[],
      default: () => [],
    },
    placeholder: {
      type: String,
      default: "Select options",
    },
    maxCount: {
      type: Number,
      default: 3,
    },
    animation: {
      type: Number,
      default: 0,
    },
    modalPopover: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const isPopoverOpen = ref(false);
    const isAnimating = ref(false);

    const selectedValues = computed({
      get: () => props.modelValue,
      set: (vals: string[]) => emit("update:modelValue", vals),
    });

    const toggleOption = (val: string) => {
      const newValues = selectedValues.value.includes(val)
        ? selectedValues.value.filter((v) => v !== val)
        : [...selectedValues.value, val];
      selectedValues.value = newValues;
    };

    const handleClear = () => (selectedValues.value = []);

    const clearExtraOptions = () => {
      selectedValues.value = selectedValues.value.slice(0, props.maxCount);
    };

    const toggleAll = () => {
      if (selectedValues.value.length === props.options.length) handleClear();
      else selectedValues.value = props.options.map((o) => o.value);
    };

    return () => (
      // modal={props.modalPopover} 
      <Popover open={isPopoverOpen.value} 
      onOpenChange={(v: boolean) => (isPopoverOpen.value = v)}>
        <PopoverTrigger asChild>
          <Button
            class={cn(
              "flex w-full p-1 rounded-md border border-picton-blue-300 min-h-10 items-center justify-between bg-inherit hover:bg-inherit"
            )}
            onClick={() => (isPopoverOpen.value = !isPopoverOpen.value)}
          >
            {selectedValues.value.length > 0 ? (
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-wrap items-center">
                  {selectedValues.value.slice(0, props.maxCount).map((val) => {
                    const opt = props.options.find((o) => o.value === val);
                    const Icon = opt?.icon;
                    return (
                      <Badge key={val} variant="picton" class={cn(isAnimating.value ? "animate-bounce" : "")}>
                        {Icon && <Icon class="h-4 w-4 mr-2" />}
                        {opt?.label}
                        <span
                          class="ml-2 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOption(val);
                          }}
                        >
                          ✕
                        </span>
                      </Badge>
                    );
                  })}
                  {selectedValues.value.length > props.maxCount && (
                    <Badge variant="picton" class="bg-transparent text-foreground border-foreground/1">
                      {`+ ${selectedValues.value.length - props.maxCount} more`}
                      <span
                        class="ml-2 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearExtraOptions();
                        }}
                      >
                        ✕
                      </span>
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <span class="text-sm text-picton-blue-400 mx-3">{props.placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent class="w-auto p-0">
          <Command>
            <CommandInput />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={toggleAll}>Select All</CommandItem>
                {props.options.map((opt) => (
                  <CommandItem key={opt.value} onSelect={() => toggleOption(opt.value)}>
                    <div class={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border", selectedValues.value.includes(opt.value) ? "bg-primary text-primary-foreground" : "opacity-50")}>
                      ✓
                    </div>
                    {opt.icon && <opt.icon class="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{opt.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                {selectedValues.value.length > 0 && <CommandItem onSelect={handleClear}>Clear</CommandItem>}
                <CommandItem onSelect={() => (isPopoverOpen.value = false)}>Close</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
});