import { defineComponent } from "vue";
import { Icon } from "@iconify/vue";
import { Button } from "~/components/ui/button";

export default defineComponent({
  name: "ComingSoon",
  setup() {
    return () => (
      <div class="p-8">
        <div class="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,_#0f4c81,_#2b8dd8,_#ffffff)] p-8 text-center text-white shadow-xl">
          <div class="mb-4 rounded-full bg-white/15 p-5">
            <Icon icon="lucide:rocket" class="h-16 w-16 text-white" />
          </div>
          <h1 class="mb-2 text-4xl font-bold text-white">Coming Soon</h1>
          <p class="mb-6 max-w-lg text-lg text-sky-50">
            This section is being rebuilt for the Nuxt migration and the updated
            oceans blue theme.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <Button class="rounded-full bg-white text-oceanBlue hover:bg-sky-50">
              Notify Me
            </Button>
            <Button
              variant="outline-brand"
              class="rounded-full border-white/50 bg-oceanBlue/10 text-white hover:bg-oceanBlue/20"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    );
  },
});
