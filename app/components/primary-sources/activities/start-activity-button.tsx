"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useBackendAuth } from "@/providers/BackendAuthProvider";

interface StartActivityButtonProps extends ButtonProps {
  activityId: string;
  children: React.ReactNode;
  queryParams?: string;
}

export default function StartActivityButton({
  activityId,
  children,
  queryParams,
  ...props
}: StartActivityButtonProps) {
  const { isAuthenticated } = useBackendAuth();

  return (
    <Button
      {...props}
      href={
        isAuthenticated
          ? `/activities/${activityId}${queryParams ? `?${queryParams}` : ""}`
          : `/login?redirectTo=/activities/${activityId}${
              queryParams ? `?${queryParams}` : ""
            }`
      }
    >
      {children}
    </Button>
  );
}
