<script setup lang="ts">
import type { LanguageSupport } from "~/types/language.interface";
import { normalizeLanguageSupport } from "~/utilities/educationRoute";

const route = useRoute();
const router = useRouter();
const hubHeaderLang = useHubHeaderLanguage();
const ENGLISH_FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSecDe7azgD2sESzgwmWJNROSioBjrMEsFChY9QFLQT0kqrQqA/viewform?embedded=true";
const KISWAHILI_FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSecDe7azgD2sESzgwmWJNROSioBjrMEsFChY9QFLQT0kqrQqA/viewform?embedded=true";

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
  normalizeLanguageSupport(hubHeaderLang.value || route.query.lang, "english"),
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
  <NuxtLayout name="home-layout" :language="selectedLanguage">
    <section id="main-container" tabindex="-1" class="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <div class="rounded-2xl bg-slate-50 p-5 shadow-sm ring-1 ring-slate-200">
        <h1 class="text-2xl font-bold text-slate-900">
          {{ content.title }}
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          {{ content.subtitle }}
        </p>
      </div>

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
    </section>
  </NuxtLayout>
</template>
