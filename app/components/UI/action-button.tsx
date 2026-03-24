import { defineComponent, type PropType } from "vue";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/vue";

interface ActionButtonProps {
  status?: "idle" | "pending" | "success" | "error";
  backHref?: string;
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "brand"
    | "brand-lemon"
    | null
    | undefined;
}

const ActionButton = defineComponent({
  name: "ActionButton",
  props: {
    status: String as PropType<ActionButtonProps["status"]>,
    label: {
      type: String,
      required: true,
    },
    isLoading: Boolean,
    disabled: Boolean,
    variant: String as PropType<ActionButtonProps["variant"]>,
  },
  setup(props) {
    return () => (
      <Button
        disabled={props.status === "pending" || props.isLoading || props.disabled}
        type="submit"
        class="w-full"
        variant={props.variant || "default"}
      >
        {props.status === "pending" || props.isLoading ? (
          <Icon
            icon="svg-spinners:90-ring-with-bg"
            class="mr-2 inline-block h-5 w-5"
          />
        ) : null}
        {props.status === "pending" || props.isLoading ? "Please wait" : props.label}
      </Button>
    );
  },
});

export default ActionButton;
