"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useBackendAuth } from "@/providers/BackendAuthProvider";

interface StartExamButtonProps extends ButtonProps {
  examId: string;
  children: React.ReactNode;
  queryParams?: string;
}

export default function StartExamButton({
  examId,
  children,
  queryParams,
  ...props
}: StartExamButtonProps) {
  const { isAuthenticated } = useBackendAuth();

  return (
    <Button
      href={
        isAuthenticated
          ? `/exams/${examId}${queryParams ? `?${queryParams}` : ""}`
          : `/login?redirectTo=/exams/${examId}${
              queryParams ? `?${queryParams}` : ""
            }`
      }
      {...props}
    >
      {children}
    </Button>
  );
}
