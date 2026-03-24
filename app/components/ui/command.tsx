// Command.tsx
import {
  defineComponent,
  ref,
  computed,
  provide,
  inject,
} from "vue";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/* ================= ROOT ================= */
export const Command = defineComponent({
  name: "Command",
  setup(_, { slots }) {
    const search = ref("");

    provide("command", {
      search,
    });

    return () => (
      <div class="flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-gray-950 dark:bg-gray-950 dark:text-gray-50">
        {slots.default?.()}
      </div>
    );
  },
});

/* ================= DIALOG ================= */
export const CommandDialog = defineComponent({
  name: "CommandDialog",
  props: {
    open: Boolean,
  },
  emits: ["update:open"],
  setup(props, { slots, emit }) {
    return () => (
      <Dialog
        open={props.open}
        onOpenChange={(v: boolean) => emit("update:open", v)}
      >
        <DialogContent class="overflow-hidden p-0 shadow-lg">
          <Command>{slots.default?.()}</Command>
        </DialogContent>
      </Dialog>
    );
  },
});

/* ================= INPUT ================= */
export const CommandInput = defineComponent({
  name: "CommandInput",
  setup(_, { attrs }) {
    const ctx = inject<any>("command");

    return () => (
      <div class="flex items-center border-b px-3">
        {/* Iconify instead of lucide */}
        <i class="icon-[mdi--magnify] mr-2 w-4 h-4 opacity-50" />

        <input
          {...attrs}
          value={ctx.search.value}
          onInput={(e: any) => (ctx.search.value = e.target.value)}
          class={cn(
            "flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-picton-blue-500 disabled:opacity-50"
          )}
        />
      </div>
    );
  },
});

/* ================= LIST ================= */
export const CommandList = defineComponent({
  name: "CommandList",
  setup(_, { slots }) {
    return () => (
      <div class="max-h-[300px] overflow-y-auto overflow-x-hidden">
        {slots.default?.()}
      </div>
    );
  },
});

/* ================= EMPTY ================= */
export const CommandEmpty = defineComponent({
  name: "CommandEmpty",
  setup(_, { slots }) {
    const ctx = inject<any>("command");

    return () =>
      ctx.search.value ? (
        <div class="py-6 text-center text-sm">
          {slots.default?.() || "No results found"}
        </div>
      ) : null;
  },
});

/* ================= GROUP ================= */
export const CommandGroup = defineComponent({
  name: "CommandGroup",
  props: {
    heading: String,
  },
  setup(props, { slots }) {
    return () => (
      <div class="p-1">
        {props.heading && (
          <div class="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            {props.heading}
          </div>
        )}
        {slots.default?.()}
      </div>
    );
  },
});

/* ================= ITEM ================= */
export const CommandItem = defineComponent({
  name: "CommandItem",
  props: {
    value: String,
  },
  emits: ["select"],
  setup(props, { slots, emit }) {
    const ctx = inject<any>("command");

    const visible = computed(() =>
      props.value
        ?.toLowerCase()
        .includes(ctx.search.value.toLowerCase())
    );

    return () =>
      visible.value ? (
        <div
          class="flex cursor-pointer gap-2 items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => emit("select", props.value)}
        >
          {slots.default?.()}
        </div>
      ) : null;
  },
});

/* ================= SEPARATOR ================= */
export const CommandSeparator = defineComponent({
  name: "CommandSeparator",
  setup() {
    return () => (
      <div class="-mx-1 h-px bg-gray-200 dark:bg-gray-800" />
    );
  },
});

/* ================= SHORTCUT ================= */
export const CommandShortcut = defineComponent({
  name: "CommandShortcut",
  setup(_, { slots }) {
    return () => (
      <span class="ml-auto text-xs tracking-widest text-gray-500 dark:text-gray-400">
        {slots.default?.()}
      </span>
    );
  },
});