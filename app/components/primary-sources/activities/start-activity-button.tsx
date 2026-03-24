"use client";

import { defineComponent, computed } from "vue";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useBackendAuth } from "@/providers/BackendAuthProvider";

interface StartActivityButtonProps extends ButtonProps {
  activityId: string;
  queryParams?: string;
}

export default defineComponent({
  name: "StartActivityButton",
  props: {
    activityId: {
      type: String,
      required: true,
    },
    queryParams: String,
    href: String,
    variant: String,
    size: String,
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const { isAuthenticated } = useBackendAuth();
    const href = computed(() =>
      isAuthenticated.value
        ? `/activities/${props.activityId}${props.queryParams ? `?${props.queryParams}` : ""}`
        : `/login?redirectTo=/activities/${props.activityId}${props.queryParams ? `?${props.queryParams}` : ""}`,
    );

    return () => (
      <Button
        {...attrs}
        href={href.value}
        variant={props.variant as ButtonProps["variant"]}
        size={props.size as ButtonProps["size"]}
        class={props.class}
        className={props.className}
      >
        {slots.default?.()}
      </Button>
    );
  },
});
