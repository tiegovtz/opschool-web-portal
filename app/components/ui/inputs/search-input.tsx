// components/SearchInput.tsx
import { defineComponent } from "vue";
import { Icon } from "@iconify/vue";
import clsx from "clsx";

// Local imports
import { cn } from "~/utilities/utils";
import Input from "./input";
import { Button } from "../button";

export default defineComponent({
  name: "SearchInput",
  props: {
    icon: {
      type: Boolean,
      default: true,
    },
    containerClass: String,
  },
  setup(props, { attrs }) {
    return () => (
      <div
        class={cn(
          "relative flex-1 min-w-[50%] max-h-[48px]",
          props.containerClass
        )}
      >
        {props.icon && (
          <Button
            variant="brand-lemon"
            class="flex items-center gap-1 sm:min-h-12 absolute -translate-y-1/2 right-0 top-1/2 rounded-l-none"
          >
            <Icon icon="mdi:magnify" class="w-4" />
            <span>Tafuta</span>
          </Button>
        )}

        <Input
          {...props} 
          class={clsx(
            "border border-neutral-200 pl-2 pr-8 text-sm",
            attrs.class as string | undefined,
          )}
        />
      </div>
    );
  },
});
