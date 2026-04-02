import { defineComponent, h } from "vue";
import { cn } from "~/utilities/utils";

const withBase = (name: string, tag: string, baseClass: string) =>
  defineComponent({
    name,
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
            ...attrs,
            class: cn(
              baseClass,
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

const Card: any = withBase(
  "Card",
  "div",
  "rounded-2xl border border-oceanBlue/15 bg-white text-slate-900 shadow-sm",
);

const CardHeader: any = withBase("CardHeader", "div", "flex flex-col space-y-1.5 p-6");

const CardTitle: any = withBase(
  "CardTitle",
  "h3",
  "text-2xl font-semibold leading-none tracking-tight text-oceanBlue",
);

const CardDescription: any = withBase(
  "CardDescription",
  "p",
  "text-sm text-slate-500",
);

const CardContent: any = withBase("CardContent", "div", "p-6 pt-0");

const CardFooter: any = withBase("CardFooter", "div", "flex items-center p-6 pt-0");

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
