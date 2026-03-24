import React, { PropsWithChildren } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BackButtonProps {
  backHref?: string;
  label?: string;
  href?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null
    | undefined;
}
const BackButton = ({
  label,
  backHref,
  variant,
  children,
}: PropsWithChildren<BackButtonProps>) => {
  return (
    <Button
      className="w-full"
      size="sm"
      variant={variant || "link"}
      href={backHref ? backHref : "#"}
    >
      {label || children}
      {/* {backHref && (
        <Link href={backHref} className="text-sm !text-gray-600">
        </Link>
      )} */}
    </Button>
  );
};

export default BackButton;
