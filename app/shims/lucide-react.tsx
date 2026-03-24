import { defineComponent } from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "~/utilities/utils";

const toKebabCase = (value: string) =>
  value
    .replace(/Icon$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

const createLucideIcon = (name: string) =>
  defineComponent({
    name,
    props: {
      class: String,
      className: String,
      size: [String, Number],
    },
    setup(props) {
      return () => (
        <Icon
          icon={`lucide:${toKebabCase(name)}`}
          width={props.size}
          height={props.size}
          class={cn(props.class, props.className)}
        />
      );
    },
  });

export const AlertCircle = createLucideIcon("AlertCircle");
export const AlertTriangle = createLucideIcon("AlertTriangle");
export const ArrowDown = createLucideIcon("ArrowDown");
export const ArrowLeft = createLucideIcon("ArrowLeft");
export const ArrowLeftRight = createLucideIcon("ArrowLeftRight");
export const ArrowRight = createLucideIcon("ArrowRight");
export const ArrowUp = createLucideIcon("ArrowUp");
export const ArrowUpDown = createLucideIcon("ArrowUpDown");
export const Baby = createLucideIcon("Baby");
export const Book = createLucideIcon("Book");
export const BookOpen = createLucideIcon("BookOpen");
export const Brain = createLucideIcon("Brain");
export const Calculator = createLucideIcon("Calculator");
export const Check = createLucideIcon("Check");
export const CheckIcon = createLucideIcon("Check");
export const CheckSquare = createLucideIcon("CheckSquare");
export const ChevronDown = createLucideIcon("ChevronDown");
export const ChevronDownIcon = createLucideIcon("ChevronDown");
export const ChevronLeft = createLucideIcon("ChevronLeft");
export const ChevronRight = createLucideIcon("ChevronRight");
export const ChevronUp = createLucideIcon("ChevronUp");
export const Circle = createLucideIcon("Circle");
export const Clock = createLucideIcon("Clock");
export const Eye = createLucideIcon("Eye");
export const EyeOff = createLucideIcon("EyeOff");
export const FileIcon = createLucideIcon("File");
export const FileImage = createLucideIcon("FileImage");
export const FileText = createLucideIcon("FileText");
export const Filter = createLucideIcon("Filter");
export const Gamepad2 = createLucideIcon("Gamepad2");
export const Globe = createLucideIcon("Globe");
export const GraduationCap = createLucideIcon("GraduationCap");
export const Grid3X3 = createLucideIcon("Grid3X3");
export const GripHorizontal = createLucideIcon("GripHorizontal");
export const GripVertical = createLucideIcon("GripVertical");
export const Hash = createLucideIcon("Hash");
export const Heart = createLucideIcon("Heart");
export const HelpCircle = createLucideIcon("HelpCircle");
export const Home = createLucideIcon("Home");
export const Image = createLucideIcon("Image");
export const ImageIcon = createLucideIcon("Image");
export const Info = createLucideIcon("Info");
export const Layers = createLucideIcon("Layers");
export const LayoutGrid = createLucideIcon("LayoutGrid");
export const Link = createLucideIcon("Link");
export const ListChecks = createLucideIcon("ListChecks");
export const ListOrdered = createLucideIcon("ListOrdered");
export const Loader2 = createLucideIcon("LoaderCircle");
export const Lock = createLucideIcon("Lock");
export const MessageCircle = createLucideIcon("MessageCircle");
export const Music = createLucideIcon("Music");
export const Network = createLucideIcon("Network");
export const Palette = createLucideIcon("Palette");
export const PenLine = createLucideIcon("PenLine");
export const Plus = createLucideIcon("Plus");
export const Puzzle = createLucideIcon("Puzzle");
export const Rocket = createLucideIcon("Rocket");
export const Search = createLucideIcon("Search");
export const Target = createLucideIcon("Target");
export const ToggleLeft = createLucideIcon("ToggleLeft");
export const ToggleRight = createLucideIcon("ToggleRight");
export const Type = createLucideIcon("Type");
export const Unlock = createLucideIcon("Unlock");
export const Upload = createLucideIcon("Upload");
export const Users = createLucideIcon("Users");
export const WandSparkles = createLucideIcon("WandSparkles");
export const X = createLucideIcon("X");
export const XCircle = createLucideIcon("XCircle");
export const XIcon = createLucideIcon("X");
export type LucideIcon = ReturnType<typeof createLucideIcon>;
