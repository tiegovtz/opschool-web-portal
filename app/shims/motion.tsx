import { defineComponent, h } from "vue";
import { cn } from "~/utilities/utils";

const dropMotionProps = (props: Record<string, unknown>) => {
  const cloned = { ...props };
  const ignored = [
    "animate",
    "initial",
    "exit",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
    "layout",
    "layoutId",
    "drag",
    "dragConstraints",
    "dragElastic",
    "dragMomentum",
  ];

  for (const key of ignored) {
    delete cloned[key];
  }

  return cloned;
};

const createMotionComponent = (tag: string) =>
  defineComponent({
    name: `Motion${tag[0]?.toUpperCase()}${tag.slice(1)}`,
    inheritAttrs: false,
    props: {
      class: String,
      className: String,
    },
    setup(props, { attrs, slots }) {
      return () =>
        h(
          tag,
          {
            ...dropMotionProps(attrs as Record<string, unknown>),
            class: cn(
              props.class,
              props.className,
              attrs.class as string | undefined,
              (attrs as { className?: string }).className,
            ),
          },
          slots.default?.(),
        );
    },
  });

export const div = createMotionComponent("div");
export const nav = createMotionComponent("nav");
export const button = createMotionComponent("button");
export const h1 = createMotionComponent("h1");
export const h2 = createMotionComponent("h2");
export const h3 = createMotionComponent("h3");
export const p = createMotionComponent("p");
export const span = createMotionComponent("span");
export const img = createMotionComponent("img");
export const section = createMotionComponent("section");

export const motion = {
  div,
  nav,
  button,
  h1,
  h2,
  h3,
  p,
  span,
  img,
  section,
};

export const AnimatePresence = defineComponent({
  name: "AnimatePresence",
  setup(_, { slots }) {
    return () => slots.default?.();
  },
});

export type Variants = Record<string, Record<string, unknown>>;
