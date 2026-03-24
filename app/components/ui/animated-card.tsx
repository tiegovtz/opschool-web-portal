// components/Animated.tsx
import { defineComponent, withDirectives } from "vue";
import { MotionComponent } from "@vueuse/motion";

// Animated Card
export const AnimatedCard = defineComponent({
  name: "AnimatedCard",
  props: {
    class: String,
  },
  setup(props, { slots }) {
    return () =>
      withDirectives(
        <div class={props.class}>
          {slots.default?.()}
        </div>,
        [
          [
            MotionComponent,
            {
              initial: { opacity: 0, y: 20 },
              enter: { opacity: 1, y: 0 },
              transition: { duration: 300 }, // ms
            },
          ],
        ]
      );
  },
});

// Animated Button
export const AnimatedButton = defineComponent({
  name: "AnimatedButton",
  props: {
    class: String,
  },
  setup(props, { slots }) {
    return () =>
      withDirectives(
        <button class={props.class}>
          {slots.default?.()}
        </button>,
        [
          [
            MotionComponent,
            {
              hover: { scale: 1.05 },
              tap: { scale: 0.95 },
            },
          ],
        ]
      );
  },
});