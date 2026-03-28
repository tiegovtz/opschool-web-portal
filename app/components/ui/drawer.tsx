// Drawer.tsx
import {
  defineComponent,
  ref,
  provide,
  inject,
  Teleport,
} from "vue";
import { cn } from "@/lib/utils";

/* ================= ROOT ================= */
export const Drawer = defineComponent({
  name: "Drawer",
  props: {
    modelValue: Boolean,
  },
  emits: ["update:modelValue"],
  setup(props, { emit, slots }) {
    const open = ref(props.modelValue);

    const setOpen = (val: boolean) => {
      open.value = val;
      emit("update:modelValue", val);
    };

    provide("drawer", { open, setOpen });

    return () => <div>{slots.default?.()}</div>;
  },
});

/* ================= TRIGGER ================= */
export const DrawerTrigger = defineComponent({
  name: "DrawerTrigger",
  setup(_, { slots }) {
    const ctx = inject<any>("drawer");

    return () => (
      <div onClick={() => ctx.setOpen(true)}>
        {slots.default?.()}
      </div>
    );
  },
});

/* ================= CLOSE ================= */
export const DrawerClose = defineComponent({
  name: "DrawerClose",
  setup(_, { slots }) {
    const ctx = inject<any>("drawer");

    return () => (
      <div onClick={() => ctx.setOpen(false)}>
        {slots.default?.()}
      </div>
    );
  },
});

/* ================= OVERLAY ================= */
export const DrawerOverlay = defineComponent({
  name: "DrawerOverlay",
  props: {
    class: String,
  },
  setup(props) {
    const ctx = inject<any>("drawer");

    return () =>
      ctx.open.value ? (
        <div
          class={cn("fixed inset-0 z-50 bg-black/80", props.class)}
          onClick={() => ctx.setOpen(false)}
        />
      ) : null;
  },
});

/* ================= CONTENT ================= */
export const DrawerContent = defineComponent({
  name: "DrawerContent",
  props: {
    class: String,
  },
  setup(props, { slots }) {
    const ctx = inject<any>("drawer");

    return () =>
      ctx.open.value ? (
        <Teleport to="body">
          <DrawerOverlay />

          <div
            class={cn(
              "fixed inset-x-0 bottom-0 z-50 mt-24 flex flex-col rounded-t-[10px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950",
              props.class
            )}
          >
            {/* handle bar */}
            <div class="mx-auto mt-4 h-2 w-[100px] rounded-full bg-gray-100 dark:bg-gray-800" />

            {slots.default?.()}
          </div>
        </Teleport>
      ) : null;
  },
});

/* ================= HEADER ================= */
export const DrawerHeader = defineComponent({
  name: "DrawerHeader",
  props: { class: String },
  setup(props, { slots }) {
    return () => (
      <div class={cn("grid gap-1.5 p-4 text-center sm:text-left", props.class)}>
        {slots.default?.()}
      </div>
    );
  },
});

/* ================= FOOTER ================= */
export const DrawerFooter = defineComponent({
  name: "DrawerFooter",
  props: { class: String },
  setup(props, { slots }) {
    return () => (
      <div class={cn("mt-auto flex flex-col gap-2 p-4", props.class)}>
        {slots.default?.()}
      </div>
    );
  },
});

/* ================= TITLE ================= */
export const DrawerTitle = defineComponent({
  name: "DrawerTitle",
  props: { class: String },
  setup(props, { slots }) {
    return () => (
      <h2 class={cn("text-lg font-semibold tracking-tight", props.class)}>
        {slots.default?.()}
      </h2>
    );
  },
});

/* ================= DESCRIPTION ================= */
export const DrawerDescription = defineComponent({
  name: "DrawerDescription",
  props: { class: String },
  setup(props, { slots }) {
    return () => (
      <p class={cn("text-sm text-gray-500 dark:text-gray-400", props.class)}>
        {slots.default?.()}
      </p>
    );
  },
});