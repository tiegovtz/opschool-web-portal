declare module "react" {
  const React: any;
  export default React;
  export const Fragment: any;
  export const memo: any;
  export const forwardRef: any;
  export const createContext: any;
  export const useContext: any;
  export const useState: any;
  export const useEffect: any;
  export const useMemo: any;
  export const useRef: any;
  export const useCallback: any;
  export const useImperativeHandle: any;
  export type ReactNode = any;
  export type PropsWithChildren<T = {}> = T & { children?: any };
  export type ComponentProps<T = any> = any;
  export type ComponentPropsWithoutRef<T = any> = any;
  export type ElementRef<T = any> = any;
  export type HTMLAttributes<T = any> = any;
  export type TdHTMLAttributes<T = any> = any;
  export type ThHTMLAttributes<T = any> = any;
  export type TextareaHTMLAttributes<T = any> = any;
  export type ButtonHTMLAttributes<T = any> = any;
  export type InputHTMLAttributes<T = any> = any;
  export type MutableRefObject<T = any> = any;
  export namespace React {
    type ReactNode = any;
    type FC<T = any> = any;
    type HTMLAttributes<T = any> = any;
    type ButtonHTMLAttributes<T = any> = any;
    type TextareaHTMLAttributes<T = any> = any;
    type InputHTMLAttributes<T = any> = any;
    type TdHTMLAttributes<T = any> = any;
    type ThHTMLAttributes<T = any> = any;
    type MutableRefObject<T = any> = any;
    type ComponentProps<T = any> = any;
    type ComponentPropsWithoutRef<T = any> = any;
    type ElementRef<T = any> = any;
  }
}

declare module "next/link" {
  const Link: any;
  export default Link;
  export type LinkProps = any;
}

declare module "next/image" {
  const Image: any;
  export default Image;
}

declare module "next/navigation" {
  export const useRouter: any;
  export const usePathname: any;
  export const useSearchParams: any;
  export const redirect: any;
  export const notFound: any;
}

declare module "next/dynamic" {
  const dynamic: any;
  export default dynamic;
}

declare module "motion/react" {
  export const motion: any;
  export const AnimatePresence: any;
  export type Variants = any;
}

declare module "motion/react-client" {
  export const div: any;
  export const nav: any;
  export const button: any;
  export const h1: any;
  export const p: any;
  export const span: any;
  export const img: any;
  export const section: any;
}

declare module "framer-motion" {
  export const motion: any;
  export const AnimatePresence: any;
  export type Variants = any;
}

declare module "@dnd-kit/core" {
  export type DragEndEvent = any;
  export type DragMoveEvent = any;
  export type DragStartEvent = any;
  export const useDraggable: any;
  export const useDroppable: any;
  export const DndContext: any;
}

declare module "@dnd-kit/modifiers" {
  export const restrictToHorizontalAxis: any;
  export const restrictToVerticalAxis: any;
  export const restrictToWindowEdges: any;
}

declare module "@dnd-kit/utilities" {
  export const CSS: any;
}

declare module "react-hook-form" {
  export const useForm: any;
  export const useFieldArray: any;
  export const Controller: any;
  export const FormProvider: any;
  export const useFormContext: any;
  export type ControllerProps<T = any> = any;
  export type FieldPath<T = any> = any;
  export type FieldValues = any;
}

declare module "@hookform/resolvers/zod" {
  export const zodResolver: any;
}

declare module "sonner" {
  export const toast: any;
  export const Toaster: any;
}

declare module "react-dropzone" {
  export const useDropzone: any;
}

declare module "cmdk" {
  export const Command: any;
}

declare module "vaul" {
  export const Drawer: any;
}

declare module "react-day-picker" {
  export const DayPicker: any;
}

declare module "embla-carousel-react" {
  const embla: any;
  export default embla;
}

declare module "lucide-react" {
  export type LucideIcon = any;
  export const AlertCircle: any;
  export const AlertTriangle: any;
  export const ArrowDown: any;
  export const ArrowLeft: any;
  export const ArrowLeftRight: any;
  export const ArrowRight: any;
  export const ArrowUp: any;
  export const ArrowUpDown: any;
  export const Baby: any;
  export const Book: any;
  export const BookOpen: any;
  export const Brain: any;
  export const Calculator: any;
  export const Check: any;
  export const CheckIcon: any;
  export const CheckSquare: any;
  export const ChevronDown: any;
  export const ChevronDownIcon: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const ChevronUp: any;
  export const Circle: any;
  export const Clock: any;
  export const Eye: any;
  export const EyeOff: any;
  export const FileIcon: any;
  export const FileImage: any;
  export const FileText: any;
  export const Filter: any;
  export const Gamepad2: any;
  export const Globe: any;
  export const GraduationCap: any;
  export const Grid3X3: any;
  export const GripHorizontal: any;
  export const GripVertical: any;
  export const Hash: any;
  export const Heart: any;
  export const HelpCircle: any;
  export const Home: any;
  export const Image: any;
  export const ImageIcon: any;
  export const Info: any;
  export const Layers: any;
  export const LayoutGrid: any;
  export const Link: any;
  export const ListChecks: any;
  export const ListOrdered: any;
  export const Loader2: any;
  export const Lock: any;
  export const MessageCircle: any;
  export const Music: any;
  export const Network: any;
  export const Palette: any;
  export const PenLine: any;
  export const Plus: any;
  export const Puzzle: any;
  export const Rocket: any;
  export const Search: any;
  export const Target: any;
  export const ToggleLeft: any;
  export const ToggleRight: any;
  export const Type: any;
  export const Unlock: any;
  export const Upload: any;
  export const Users: any;
  export const WandSparkles: any;
  export const X: any;
  export const XCircle: any;
  export const XIcon: any;
}
