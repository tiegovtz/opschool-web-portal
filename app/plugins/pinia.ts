import { createPinia, setActivePinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { toRaw } from "vue";

export default defineNuxtPlugin({
  name: "pinia",
  enforce: "pre",
  setup(nuxtApp) {
    const pinia = createPinia();

    if (process.client) {
      pinia.use(piniaPluginPersistedstate);
    }
    nuxtApp.vueApp.use(pinia);
    setActivePinia(pinia);

    const payload = nuxtApp.payload as { pinia?: Record<string, any> } | undefined;
    if (payload?.pinia) {
      pinia.state.value = payload.pinia;
    }

    return {
      provide: {
        pinia,
      },
    };
  },
  hooks: {
    "app:rendered"(nuxtApp) {
      const app = (nuxtApp ?? useNuxtApp()) as typeof nuxtApp & {
        payload?: { pinia?: Record<string, any> };
        $pinia?: ReturnType<typeof createPinia>;
      };

      if (app?.payload && app.$pinia) {
        app.payload.pinia = toRaw(app.$pinia).state.value;
      }

      setActivePinia(void 0);
    },
  },
});
