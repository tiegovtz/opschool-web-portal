import "vue";
import "@vue/runtime-dom";

declare module "@vue/runtime-dom" {
  interface HTMLAttributes {
    className?: any;
    [key: string]: any;
  }

  interface SVGAttributes {
    className?: any;
    [key: string]: any;
  }

  interface ImgHTMLAttributes {
    className?: any;
    [key: string]: any;
  }

  interface InputHTMLAttributes {
    className?: any;
    [key: string]: any;
  }

  interface TextareaHTMLAttributes {
    className?: any;
    [key: string]: any;
  }
}

declare module "vue" {
  interface ComponentCustomProps {
    className?: any;
  }
}
