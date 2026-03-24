"use client";

import { defineComponent, computed } from "vue";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useBackendAuth } from "@/providers/BackendAuthProvider";

interface StartExamButtonProps extends ButtonProps {
  examId: string;
  queryParams?: string;
}

export default defineComponent({
  name: "StartExamButton",
  props: {
    examId: {
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
        ? `/exams/${props.examId}${props.queryParams ? `?${props.queryParams}` : ""}`
        : `/login?redirectTo=/exams/${props.examId}${props.queryParams ? `?${props.queryParams}` : ""}`,
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
