"use client";

import { defineComponent } from "vue";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utilities/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = defineComponent({
  name: "Label",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <label
        {...attrs}
        class={cn(
          labelVariants(),
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      >
        {slots.default?.()}
      </label>
    );
  },
});

export { Label };
