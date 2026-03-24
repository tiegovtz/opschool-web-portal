import { defineComponent } from "vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import BackButton from "@/components/back-button";
import { cn } from "~/utilities/utils";

interface CardWrapperProps {
  headerLabel: string;
  cardDescription?: string;
  backButtonLabel?: string;
  backButtonHref?: string;
  className?: string;
}

const CardWrapper = defineComponent({
  name: "CardWrapper",
  props: {
    headerLabel: {
      type: String,
      required: true,
    },
    cardDescription: String,
    backButtonLabel: String,
    backButtonHref: String,
    className: String,
  },
  setup(props, { slots }) {
    return () => (
      <div class="size-full w-full items-center justify-center md:p-4 xl:px-32">
        <Card class={cn("mx-auto md:min-w-[450px] shadow-md", props.className)}>
          <CardHeader>
            <CardTitle class="text-3xl text-oceanBlue">{props.headerLabel}</CardTitle>
            {props.cardDescription ? (
              <CardDescription>{props.cardDescription}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>{slots.default?.()}</CardContent>
          {props.backButtonLabel ? (
            <CardFooter>
              <BackButton
                label={props.backButtonLabel}
                backHref={props.backButtonHref}
              />
            </CardFooter>
          ) : null}
        </Card>
      </div>
    );
  },
});

export default CardWrapper;
