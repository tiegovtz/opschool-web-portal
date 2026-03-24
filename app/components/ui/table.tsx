import { defineComponent, h } from "vue";
import { cn } from "~/utilities/utils";

const createTableComponent = (name: string, tag: string, baseClass: string) =>
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

const Table = defineComponent({
  name: "Table",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <div class="relative w-full overflow-auto">
        <table
          {...attrs}
          class={cn(
            "w-full caption-bottom text-sm",
            props.class,
            props.className,
            attrs.class as string | undefined,
            (attrs as { className?: string }).className,
          )}
        >
          {slots.default?.()}
        </table>
      </div>
    );
  },
});

const TableHeader = createTableComponent("TableHeader", "thead", "[&_tr]:border-b");
const TableBody = createTableComponent(
  "TableBody",
  "tbody",
  "[&_tr:last-child]:border-0",
);
const TableFooter = createTableComponent(
  "TableFooter",
  "tfoot",
  "border-t bg-sky-50 font-medium [&>tr]:last:border-b-0",
);
const TableRow = createTableComponent(
  "TableRow",
  "tr",
  "border-b transition-colors hover:bg-sky-50",
);
const TableHead = createTableComponent(
  "TableHead",
  "th",
  "h-12 px-4 text-left align-middle font-medium text-slate-500",
);
const TableCell = createTableComponent(
  "TableCell",
  "td",
  "p-4 align-middle",
);
const TableCaption = createTableComponent(
  "TableCaption",
  "caption",
  "mt-4 text-sm text-slate-500",
);

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
