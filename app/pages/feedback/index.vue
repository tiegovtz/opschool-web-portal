<script setup lang="ts">
import SupportInbox from "~/components/support/SupportInbox.vue";
import type { LanguageSupport } from "~/types/language.interface";
import { normalizeLanguageSupport } from "~/utilities/educationRoute";

definePageMeta({ middleware: 'auth' });

const { data: demoFeedback } = await useFetch<{ demo: boolean; examples: { id: string; subject: string; educationLevel: string; language: string; status: string; body: string }[] }>("/api/feedback");
const supportVisited = ref(false);
const activeTab = ref<"feedback" | "support">("feedback");
watch(activeTab, tab => { if (tab === "support") supportVisited.value = true; });
function onInboxTabKey(event: KeyboardEvent) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  activeTab.value = event.key === "Home" ? "feedback" : event.key === "End" ? "support" : activeTab.value === "feedback" ? "support" : "feedback";
  nextTick(() => document.getElementById(`${activeTab.value}-tab`)?.focus());
}
const route = useRoute();
const router = useRouter();
const hubHeaderLang = useHubHeaderLanguage();
const ENGLISH_FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSecDe7azgD2sESzgwmWJNROSioBjrMEsFChY9QFLQT0kqrQqA/viewform?embedded=true";
const KISWAHILI_FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScpKgdC-jcp1jvN1oA95lBjGJJgr5mtI34eEWwFSSzGPE7Tuw/viewform?embedded=true";

watch(
  () => route.query.lang,
  (lang) => {
    hubHeaderLang.value = normalizeLanguageSupport(
      lang,
      hubHeaderLang.value || "english",
    );
  },
  { immediate: true },
);

const selectedLanguage = computed<LanguageSupport>(() =>
  normalizeLanguageSupport(route.query.lang || hubHeaderLang.value, "english"),
);

const content = computed(() =>
  selectedLanguage.value === "kiswahili"
    ? {
        title: "Tuma maoni yako",
        subtitle:
          "Chagua lugha unayotaka kutumia kuandika maoni yako kabla ya kujaza fomu.",
        english: "Kiingereza",
        kiswahili: "Kiswahili",
        frameTitle: "Fomu ya maoni",
        loading: "Inapakia...",
      }
    : {
        title: "Share your feedback",
        subtitle:
          "Choose the language you want to use for your feedback before filling in the form.",
        english: "English",
        kiswahili: "Kiswahili",
        frameTitle: "Feedback form",
        loading: "Loading...",
      },
);

const feedbackFormSrc = computed(() =>
  selectedLanguage.value === "kiswahili"
    ? KISWAHILI_FEEDBACK_FORM_URL
    : ENGLISH_FEEDBACK_FORM_URL,
);

watch(
  selectedLanguage,
  async (language) => {
    const nextLang = language === "kiswahili" ? "sw" : "en";
    if (route.query.lang === nextLang) return;

    await router.replace({
      query: {
        ...route.query,
        lang: nextLang,
      },
    });
  },
  { immediate: true },
);
</script>

<template>
  <NuxtLayout name="home-layout" v-bind="{ language: selectedLanguage }">
    <section id="main-container" tabindex="-1" class="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <div role="tablist" @keydown="onInboxTabKey" :aria-label="selectedLanguage === 'kiswahili' ? 'Maoni na msaada' : 'Feedback and support'" class="flex gap-2 border-b border-slate-200 pb-3">
        <button id="feedback-tab" :tabindex="activeTab === 'feedback' ? 0 : -1" type="button" role="tab" :aria-selected="activeTab === 'feedback'" aria-controls="feedback-panel" :class="['rounded-lg px-5 py-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue', activeTab === 'feedback' ? 'bg-deepBlue text-white' : 'bg-grayLight text-textGray']" @click="activeTab = 'feedback'">{{ selectedLanguage === 'kiswahili' ? 'Maoni' : 'Feedback' }}</button>
        <button id="support-tab" :tabindex="activeTab === 'support' ? 0 : -1" type="button" role="tab" :aria-selected="activeTab === 'support'" aria-controls="support-panel" :class="['rounded-lg px-5 py-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue', activeTab === 'support' ? 'bg-deepBlue text-white' : 'bg-grayLight text-textGray']" @click="activeTab = 'support'">{{ selectedLanguage === 'kiswahili' ? 'Msaada na changamoto' : 'Support & Issues' }}</button>
      </div>
      <div v-show="activeTab === 'feedback'" id="feedback-panel" role="tabpanel" aria-labelledby="feedback-tab" class="space-y-6">
      <div class="rounded-2xl bg-gray-50 p-5 shadow-sm ring-1 ring-slate-200">
        <h1 class="text-2xl font-semibold text-darkBlue">
          {{ content.title }}
        </h1>
        <!-- <p class="mt-2 text-sm text-slate-600">
          {{ content.subtitle }}
        </p> -->
      </div>

      <details v-if="demoFeedback?.demo" class="rounded-lg border border-slate-200 p-4 text-sm text-textGray">
        <summary class="cursor-pointer font-medium">{{ selectedLanguage === 'kiswahili' ? 'Mifano ya maoni ya majaribio' : 'Demo feedback examples' }}</summary>
        <p class="mt-3 text-xs">{{ selectedLanguage === 'kiswahili' ? 'Mifano hii inaonekana pia kwenye upande wa admin. Fomu ya Google hapa chini haijabadilishwa.' : 'These fictional examples also appear in the admin inbox. The Google Form below is unchanged.' }}</p>
        <ul class="mt-3 divide-y divide-slate-100"><li v-for="item in demoFeedback.examples" :key="item.id" class="py-3"><p class="font-medium">{{ item.subject }}</p><p class="mt-1 text-xs capitalize">{{ item.educationLevel }} · {{ item.language === 'sw' ? 'Kiswahili' : 'English' }} · {{ item.status }}</p><p class="mt-2">{{ item.body }}</p></li></ul>
      </details>
      <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <iframe
          :key="selectedLanguage"
          :title="content.frameTitle"
          :src="feedbackFormSrc"
          frameborder="0"
          marginheight="0"
          marginwidth="0"
          class="min-h-[1200px] w-full"
        >
          {{ content.loading }}
        </iframe>


      </div>
      </div>
      <div v-show="activeTab === 'support'" id="support-panel" role="tabpanel" aria-labelledby="support-tab">
        <SupportInbox v-if="supportVisited" :language="selectedLanguage" />
      </div>
    </section>
  </NuxtLayout>
</template>
