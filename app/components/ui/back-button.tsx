import { defineComponent, type PropType } from "vue";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  backHref?: string;
  label?: string;
  href?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null
    | undefined;
}
const BackButton = defineComponent({
  name: "BackButton",
  props: {
    label: String,
    backHref: String,
    href: String,
    variant: String as PropType<BackButtonProps["variant"]>,
  },
  setup(props, { slots }) {
    return () => (
      <Button
        class="w-full"
        size="sm"
        variant={props.variant || "link"}
        href={props.backHref || props.href || "#"}
      >
        {props.label || slots.default?.()}
      </Button>
    );
  },
});

export default BackButton;
