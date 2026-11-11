<script setup lang="ts">
import SupportInbox from '~/components/support/SupportInbox.vue';
import FeedbackForm from '~/components/support/FeedbackForm.vue';
import { normalizeLanguageSupport, getEducationHubBucket, getHubPath, getEducationRouteQuery } from '~/utilities/educationRoute';
const route = useRoute();
const token = useCookie('signInAccessToken');
const hub = useHubEducationLevel();
const headerLanguage = useHubHeaderLanguage();
const language = computed(() => normalizeLanguageSupport(route.query.lang || headerLanguage.value, 'english'));
const educationLevel = computed(() => getEducationHubBucket(route.query.educationLevel || route.query.edl) || hub.value);
const subjectsLink = computed(() => ({ path: getHubPath(educationLevel.value), query: getEducationRouteQuery(educationLevel.value, { section: 'subjects' }, language.value) }));
const activeTab = ref('feedback');
const contentScroller = ref<HTMLElement | null>(null);
watch(activeTab, () => nextTick(() => contentScroller.value?.scrollTo({ top: 0 })));
const tabs = computed(() => [{ id: 'feedback', label: language.value === 'kiswahili' ? 'Maoni' : 'Feedback' }, { id: 'support', label: language.value === 'kiswahili' ? 'Msaada wa kiufundi' : 'Technical Support' }, { id: 'requests', label: language.value === 'kiswahili' ? 'Maombi yangu' : 'My Requests' }]);
onMounted(() => { if (route.query.tab === 'requests' && token.value) activeTab.value = 'requests'; });
watch(token, value => { if (!value && activeTab.value === 'requests') activeTab.value = 'feedback'; });
function choose(id: string) { if (id === 'requests' && !token.value) { navigateTo({ path: '/auth', query: { redirect: `/feedback?${new URLSearchParams({ lang: language.value === 'kiswahili' ? 'sw' : 'en', tab: 'requests', educationLevel: educationLevel.value })}` } }); return; } activeTab.value = id; }
function onKey(event: KeyboardEvent) { const keys = ['ArrowLeft','ArrowRight','Home','End']; if (!keys.includes(event.key)) return; event.preventDefault(); const index = tabs.value.findIndex(tab => tab.id === activeTab.value); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3; choose(tabs.value[next]!.id); nextTick(() => document.getElementById(`${tabs.value[next]!.id}-tab`)?.focus()); }
</script>
<template>
  <NuxtLayout name="home-layout" v-bind="{ language, educationLevel }">
    <section id="main-container" :lang="language === 'kiswahili' ? 'sw' : 'en'" tabindex="-1" class="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-4 text-base leading-relaxed text-darkBlue p-2 pr-8 md:p-6 md:pr-8">
      <h1 class="sr-only">{{ language === 'kiswahili' ? 'Maoni na msaada' : 'Feedback and support' }}</h1>
      <NuxtLink :to="subjectsLink" class="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg px-3 py-2 text-base font-medium text-deepBlue hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-deepBlue"><span aria-hidden="true">←</span>{{ language === 'kiswahili' ? 'Rudi kwenye masomo' : 'Back to subjects' }}</NuxtLink>
      <div role="tablist" aria-label="Feedback and support" class="z-10 flex shrink-0 gap-2 overflow-x-auto border-b border-gray-200 bg-white" @keydown="onKey">
        <button v-for="tab in tabs" :id="`${tab.id}-tab`" :key="tab.id" type="button" role="tab" :aria-controls="`${tab.id}-panel`" :aria-selected="activeTab === tab.id" :tabindex="activeTab === tab.id ? 0 : -1" :class="['inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-5 py-3 text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-oceanBlue', activeTab === tab.id ? 'border-oceanBlue bg-sky-50 text-deepBlue' : 'border-transparent text-gray-600 hover:bg-gray-50']" @click="choose(tab.id)">{{ tab.label }}<span v-if="tab.id === 'requests' && !token" class="ml-2 text-sm">{{ language === 'kiswahili' ? '(Ingia)' : '(Sign in)' }}</span></button>
      </div>
      <div ref="contentScroller" class="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue" role="region" tabindex="0" :aria-label="tabs.find(tab => tab.id === activeTab)?.label">
      <div v-show="activeTab === 'feedback'" id="feedback-panel" role="tabpanel" aria-labelledby="feedback-tab"><FeedbackForm :language="language" :education-level="educationLevel" /></div>
      <SupportInbox :language="language" :education-level="educationLevel" :view="activeTab" />
      </div>
    </section>
  </NuxtLayout>
</template>
