import { defineComponent } from "vue";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { cn } from "~/utilities/utils";

interface ImageModalProps {
  src: string;
  alt: string;
  className?: string;
  class?: string;
}

const ImageModal = defineComponent({
  name: "ImageModal",
  props: {
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      required: true,
    },
    class: String,
    className: String,
  },
  setup(props, { slots }) {
    return () => (
      <Dialog>
        <DialogTrigger asChild>
          {slots.default?.() || (
            <button class="cursor-pointer transition-opacity hover:opacity-80">
              <img
                src={props.src}
                alt={props.alt}
                class={cn(
                  "h-auto w-full max-w-md rounded-2xl border border-oceanBlue/10 bg-white object-cover shadow-sm",
                  props.class,
                  props.className,
                )}
              />
            </button>
          )}
        </DialogTrigger>
        <DialogContent class="max-h-[95vh] w-auto max-w-[95vw] overflow-hidden border-0 bg-transparent p-0 shadow-none">
          <DialogTitle class="sr-only">Image preview</DialogTitle>
          <div class="relative flex items-center justify-center">
            <img
              src={props.src}
              alt={props.alt}
              class="h-auto max-h-[90vh] w-auto max-w-full cursor-pointer rounded-2xl object-contain shadow-2xl"
              onClick={(event: MouseEvent) => event.stopPropagation()}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  },
});

export { ImageModal };
