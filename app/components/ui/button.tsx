import { defineComponent, resolveComponent, type PropType } from "vue";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utilities/utils";
import { Icon } from "@iconify/vue";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#084063] text-white hover:bg-[#084063]/90 focus-visible:ring-oceanBlue",
        brand:
          "bg-[#084063] text-white hover:bg-[#084063]/90",
        "brand-lemon":
          "bg-[#084063] text-white hover:bg-[#084063]/90 focus-visible:ring-oceanBlue",
        destructive:
          "bg-red-500 text-white hover:bg-red-500/90",
        "outline-brand":
          "border border-oceanBlue/25 bg-white text-oceanBlue hover:bg-sky-50 focus-visible:ring-oceanBlue",
        outline:
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-oceanBlue",
        secondary:
          "bg-sky-100 text-oceanBlue hover:bg-sky-200",
        ghost:
          "hover:bg-sky-50 hover:text-oceanBlue",
        link: "text-oceanBlue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  href?: string;
  to?: string;
  target?: string;
  rel?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  class?: string;
  className?: string;
  onClick?: (event: MouseEvent) => void;
}

const Button = defineComponent({
  name: "Button",
  inheritAttrs: false,
  props: {
    asChild: Boolean,
    href: String,
    to: String,
    target: String,
    rel: String,
    disabled: Boolean,
    type: {
      type: String as PropType<ButtonProps["type"]>,
      default: "button",
    },
    variant: {
      type: String as PropType<ButtonProps["variant"]>,
      default: "default",
    },
    size: {
      type: String as PropType<ButtonProps["size"]>,
      default: "default",
    },
    class: String,
    className: String,
    onClick: Function as PropType<ButtonProps["onClick"]>,
  },
  setup(props, { attrs, slots }) {
    return () => {
      const slotContent = slots.default?.();
      const normalizedSlotNodes = Array.isArray(slotContent)
        ? slotContent
        : slotContent
          ? [slotContent]
          : [];

      const slotText = normalizedSlotNodes
        .map((node: any) => {
          if (typeof node === "string") return node;
          if (node && typeof node?.children === "string") return node.children;
          return "";
        })
        .join(" ")
        .trim();

      const hasIconAlready = normalizedSlotNodes.some((node: any) => {
        if (!node) return false;
        if (node?.type === Icon) return true;
        const iconProp = node?.props?.icon as string | undefined;
        return typeof iconProp === "string" && iconProp.includes("sparkles");
      });

      const isCheckAnswersButton =
        !hasIconAlready &&
        (slotText.includes("Check Answers") ||
          slotText.includes("Answers Checked") ||
          slotText.includes("Checking..."));

      const className = cn(
        buttonVariants({
          variant: props.variant,
          size: props.size,
        }),
        props.class,
        props.className,
        isCheckAnswersButton ? "gap-2" : "",
        attrs.class as string | undefined,
        (attrs as { className?: string }).className,
      );

      const sharedProps = {
        ...attrs,
        class: className,
        target:
          props.target ??
          ((props.href || props.to)?.startsWith("http") ? "_blank" : undefined),
        rel: props.rel,
        onClick: props.onClick,
      };

      if (props.href || props.to) {
        const NuxtLink = resolveComponent("NuxtLink") as any;

        return (
          <NuxtLink to={props.href || props.to || "#"} {...sharedProps}>
            {isCheckAnswersButton ? (
              <>
                <Icon
                  icon="heroicons:sparkles"
                  width="18"
                  height="18"
                  class="text-white/90 animate-pulse"
                />
                {slotContent || props.variant}
              </>
            ) : (
              slotContent || props.variant
            )}
          </NuxtLink>
        );
      }

      return (
        <button {...sharedProps} disabled={props.disabled} type={props.type}>
          {isCheckAnswersButton ? (
            <>
              <Icon
                icon="heroicons:sparkles"
                width="18"
                height="18"
                class="text-white/90 animate-pulse"
              />
              {slotContent || props.variant}
            </>
          ) : (
            slotContent || props.variant
          )}
        </button>
      );
    };
  },
});

export { Button, buttonVariants };
