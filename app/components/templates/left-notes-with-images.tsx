import { defineComponent } from "vue";
import { cn } from "~/utilities/utils";

export default defineComponent({
  name: "LeftNotesWithImages",
  props: {
    notes: {
      type: String,
      default: "",
    },
    image: String,
    className: String,
  },
  setup(props) {
    return () => (
      <aside
        class={cn(
          "h-full rounded-2xl border border-oceanBlue/15 bg-white p-4 shadow-sm",
          props.className,
        )}
      >
        <div class="space-y-4">
          {props.image ? (
            <div class="overflow-hidden rounded-xl border border-oceanBlue/10 bg-sky-50">
              <img
                src={props.image}
                alt="Activity note"
                class="h-auto max-h-72 w-full object-contain"
              />
            </div>
          ) : null}
          {props.notes ? (
            <div class="whitespace-pre-line text-base leading-7 text-slate-700">
              {props.notes}
            </div>
          ) : null}
        </div>
      </aside>
    );
  },
});
