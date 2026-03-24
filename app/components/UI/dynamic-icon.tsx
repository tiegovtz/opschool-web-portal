"use client";

import {
  ArrowUpDown,
  BookOpen,
  Brain,
  Calculator,
  CheckSquare,
  Eye,
  FileText,
  Gamepad2,
  Grid3X3,
  Hash,
  Image,
  Layers,
  Link,
  MessageCircle,
  Puzzle,
  Search,
  Target,
  Users,
  LucideIcon,
  Network,
  ListOrdered,
} from "lucide-react";

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  ArrowUpDown,
  BookOpen,
  Brain,
  Calculator,
  CheckSquare,
  Eye,
  FileText,
  Gamepad2,
  Grid3X3,
  Hash,
  Image,
  Layers,
  Link,
  MessageCircle,
  Puzzle,
  Search,
  Target,
  Users,
  Network,
  ListOrdered,
};

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  className = "h-4 w-4",
  size,
}) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    // Fallback to a default icon if the specified icon is not found
    return <Target className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
};

export default DynamicIcon;
