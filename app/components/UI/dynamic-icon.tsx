import { defineComponent } from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "~/utilities/utils";

const iconMap: Record<string, string> = {
  ArrowUpDown: "lucide:arrow-up-down",
  BookOpen: "lucide:book-open",
  Brain: "lucide:brain",
  Calculator: "lucide:calculator",
  CheckSquare: "lucide:check-square",
  Eye: "lucide:eye",
  FileText: "lucide:file-text",
  Gamepad2: "lucide:gamepad-2",
  Grid3X3: "lucide:grid-3x3",
  Hash: "lucide:hash",
  Image: "lucide:image",
  Layers: "lucide:layers",
  Link: "lucide:link",
  ListOrdered: "lucide:list-ordered",
  MessageCircle: "lucide:message-circle",
  Network: "lucide:network",
  Puzzle: "lucide:puzzle",
  Search: "lucide:search",
  Target: "lucide:target",
  Users: "lucide:users",
};

const DynamicIcon = defineComponent({
  name: "DynamicIcon",
  props: {
    name: {
      type: String,
      required: true,
    },
    class: String,
    className: {
      type: String,
      default: "h-4 w-4",
    },
    size: Number,
  },
  setup(props) {
    return () => (
      <Icon
        icon={iconMap[props.name] || iconMap.Target}
        width={props.size}
        height={props.size}
        class={cn(props.className, props.class)}
      />
    );
  },
});

export { DynamicIcon };
export default DynamicIcon;
