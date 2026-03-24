import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import BackButton from "@/components/back-button";
import { cn } from "@/lib/utils";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  cardDescription?: string;
  backButtonLabel?: string;
  backButtonHref?: string;
  className?: string;
}

const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  cardDescription,
  className,
}: CardWrapperProps) => {
  return (
    <div className="md:p-4 xl:px-32 size-full flex items-center justify-center w-full">
      <Card className={cn("md:min-w-[450px] shadow-md", className)}>
        <CardHeader>
          <CardTitle className="text-3xl text-picton-blue-900">
            {headerLabel}
          </CardTitle>
          {cardDescription && (
            <CardDescription className="text-picton-blue-600">
              {cardDescription}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {backButtonLabel && (
          <CardFooter>
            <BackButton label={backButtonLabel} backHref={backButtonHref} />
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default CardWrapper;
