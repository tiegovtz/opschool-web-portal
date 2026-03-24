import { defineComponent, resolveComponent } from "vue";
import { cn } from "~/utilities/utils";

export default defineComponent({
  name: "NextLinkShim",
  inheritAttrs: false,
  props: {
    href: String,
    to: String,
    class: String,
    className: String,
    target: String,
    rel: String,
  },
  setup(props, { attrs, slots }) {
    return () => {
      const href = props.href || props.to || "#";
      const className = cn(
        props.class,
        props.className,
        attrs.class as string | undefined,
        (attrs as { className?: string }).className,
      );

      if (href.startsWith("http")) {
        return (
          <a
            {...attrs}
            href={href}
            target={props.target ?? "_blank"}
            rel={props.rel ?? "noreferrer"}
            class={className}
          >
            {slots.default?.()}
          </a>
        );
      }

      const NuxtLink = resolveComponent("NuxtLink") as any;
      return (
        <NuxtLink {...attrs} to={href} class={className}>
          {slots.default?.()}
        </NuxtLink>
      );
    };
  },
});
