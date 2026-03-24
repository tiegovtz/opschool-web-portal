import React from "react";
import { Button } from "@/components/ui/button";
import { MutationStatus } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface ActionButtonProps {
  status?: MutationStatus;
  backHref?: string;
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "brand"
    | "brand-lemon"
    | null
    | undefined;
}
const ActionButton = ({ status, label, variant, disabled }: ActionButtonProps) => {
  return (
    <Button
      disabled={status === "pending" || disabled}
      type="submit"
      className="w-full"
      variant={variant || "default"}
    >
      {status === "pending" ? (
        <Loader2 className="inline-block mr-2 h-5 w-5 animate-spin cursor-not-allowed" />
      ) : null}
      {status === "pending" ? "Please wait" : label}
    </Button>
  );
};

export default ActionButton;
