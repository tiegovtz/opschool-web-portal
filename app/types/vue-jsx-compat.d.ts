import "vue";
import "@vue/runtime-dom";
import type { ClassValue } from "@vue/runtime-dom";
import type { Directive } from "vue";

declare module "@vue/runtime-dom" {
  interface HTMLAttributes {
    className?: ClassValue;
  }

  interface SVGAttributes {
    className?: ClassValue;
  }
}

declare module "vue" {
  interface ComponentCustomProps {
    className?: any;
  }

  interface GlobalDirectives {
    vMathjax: Directive<HTMLElement, string>;
  }
}
