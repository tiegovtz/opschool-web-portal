import "vue";
import "@vue/runtime-dom";
import type { ClassValue } from "@vue/runtime-dom";

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
}
