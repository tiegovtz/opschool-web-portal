<script setup lang="ts">
import type { LanguageSupport } from '~/types/language.interface';
import type { SupportCategory, SupportTicket } from '../../../shared/support/contracts';
import { getEducationHubBucket } from '~/utilities/educationRoute';

const props = defineProps<{ language: LanguageSupport }>();
const sw = computed(() => props.language === 'kiswahili');
const text = computed(() => sw.value ? {
  title: 'Msaada na changamoto', description: 'Chagua msaada wa kiufundi kuripoti tatizo au pendekeza kipengele kipya. Fuatilia majibu hapa.',
  technical: 'Msaada wa kiufundi', feature: 'Pendekeza kipengele', support: 'Maombi ya msaada',
  newRequest: 'Tuma ombi jipya', createTicket: 'Fungua tiketi ya msaada', suggestFeature: 'Pendekeza kipengele kipya', technicalHint: 'Pata msaada kuhusu matatizo ya kutumia jukwaa.', featureHint: 'Tuambie kipengele kipya unachotaka kuona.', issue: 'Eleza tatizo', featureDetails: 'Eleza pendekezo lako', featurePlaceholder: 'Eleza kipengele unachopendekeza na jinsi kitakavyokusaidia.', requests: 'Maombi yangu', search: 'Tafuta maombi yako…', all: 'Hali zote',
  new: 'Jipya', in_review: 'Linashughulikiwa', resolved: 'Limetatuliwa', category: 'Aina ya ombi', level: 'Ngazi ya elimu inayohusika',
  chooseLevel: 'Chagua ngazi ya elimu', primary: 'Msingi', secondary: 'Sekondari', subject: 'Kichwa cha ombi', message: 'Ujumbe',
  subjectHint: 'Eleza ombi lako kwa kifupi', messageHint: 'Eleza kilichotokea, hatua ulizofuata na msaada unaohitaji.',
  cancel: 'Ghairi', submit: 'Tuma ombi', sending: 'Inatuma…', reply: 'Jibu lako', sendReply: 'Tuma jibu',
  empty: 'Hakuna maombi bado', emptyHint: 'Tuma ombi ili kuwasiliana na timu ya msaada.', noMatch: 'Hakuna maombi yanayolingana.',
  select: 'Chagua ombi ili kusoma mazungumzo.', loading: 'Inapakia…', team: 'Timu ya msaada', you: 'Wewe',
  previous: 'Nyuma', next: 'Mbele', refresh: 'Onyesha upya', close: 'Funga',
  created: 'Ombi limetumwa. Unaweza kufuatilia majibu hapa.', replied: 'Jibu limetumwa.',
  unavailable: 'Huduma ya msaada bado haijaunganishwa. Kutuma na kusoma maombi kutapatikana baada ya kuunganishwa.',
  failed: 'Imeshindikana kuwasiliana na huduma ya msaada. Jaribu tena.',
  retryLogin: 'Ingia tena ili kuendelea',
} : {
  title: 'Support & Issues', description: 'Choose technical support to report an issue, or suggest a new feature. Follow replies from our team here.',
  technical: 'Technical Support', feature: 'Feature Request', support: 'Support Requests',
  newRequest: 'New request', createTicket: 'Create support ticket', suggestFeature: 'Suggest a feature', technicalHint: 'Get help with a problem using the platform.', featureHint: 'Tell us what new functionality you would like.', issue: 'Describe the issue', featureDetails: 'Describe your suggestion', featurePlaceholder: 'Explain the feature you would like and how it would help you.', requests: 'My requests', search: 'Search your requests…', all: 'All statuses',
  new: 'New', in_review: 'In review', resolved: 'Resolved', category: 'Request category', level: 'Education level this concerns',
  chooseLevel: 'Choose an education level', primary: 'Primary', secondary: 'Secondary', subject: 'Subject', message: 'Message',
  subjectHint: 'Summarize what you need help with', messageHint: 'Describe what happened, the steps you took, and what you need help with.',
  cancel: 'Cancel', submit: 'Submit request', sending: 'Sending…', reply: 'Your reply', sendReply: 'Send reply',
  empty: 'No requests yet', emptyHint: 'Create a request to start a conversation with the support team.', noMatch: 'No matching requests.',
  select: 'Select a request to read the conversation.', loading: 'Loading…', team: 'Support team', you: 'You',
  previous: 'Previous', next: 'Next', refresh: 'Refresh', close: 'Close',
  created: 'Request submitted. You can follow replies here.', replied: 'Reply sent.',
  unavailable: 'Support is not connected yet. Sending and reading requests will be available after the service is connected.',
  failed: 'Unable to reach support. Please try again.',
  retryLogin: 'Sign in again to continue',
});
const categories: SupportCategory[] = ['technical', 'feature'];
const category = ref<SupportCategory>('technical');
const status = ref('');
const search = ref('');
const debouncedSearch = ref('');
const page = ref(1);
const items = ref<SupportTicket[]>([]);
const total = ref(0);
const counts = ref<Record<SupportCategory, { total: number; new: number }> | null>(null);
const selected = ref<SupportTicket | null>(null);
const createOpen = ref(true);
const loading = ref(true);
const busy = ref(false);
const error = ref('');
const notice = ref('');
const setupRequired = ref(false);
const authRequired = ref(false);
const user = useCookie<Record<string, any> | null>('signInUserToken');
const accountLevel = computed(() => {
  const value = user.value?.educationLevel ?? user.value?.level;
  return getEducationHubBucket(typeof value === 'object' ? value?.name : value);
});
const draft = reactive({ category: 'technical' as SupportCategory, educationLevel: '', subject: '', body: '' });
const savedDrafts: Partial<Record<SupportCategory, { subject: string; body: string; educationLevel: string }>> = {};
const reply = ref('');
const route = useRoute();
const signInLink = computed(() => ({ path: '/auth', query: { redirect: route.fullPath } }));
let controller: AbortController | undefined;
let searchTimer: ReturnType<typeof setTimeout>;
let active = true;
function showError(value: any) {
  if (!active) return;
  setupRequired.value = !!(value?.data?.data?.setupRequired || value?.data?.setupRequired);
  authRequired.value = value?.statusCode === 401 || value?.status === 401;
  error.value = setupRequired.value ? text.value.unavailable : text.value.failed;
}
async function load() {
  controller?.abort(); controller = new AbortController(); const current = controller;
  loading.value = true; error.value = ''; authRequired.value = false;
  try {
    const data = await $fetch<{ items: SupportTicket[]; total: number; counts: typeof counts.value }>('/api/support/tickets', { query: { category: category.value, status: status.value || undefined, search: debouncedSearch.value || undefined, page: page.value, limit: 10 }, signal: current.signal });
    if (current.signal.aborted || !active) return;
    items.value = data.items; total.value = data.total; counts.value = data.counts; setupRequired.value = false;
  } catch (value: any) {
    if (!current.signal.aborted && active) { items.value = []; total.value = 0; counts.value = null; showError(value); }
  } finally { if (!current.signal.aborted && active) loading.value = false; }
}
function choose(value: SupportCategory) {
  if (busy.value) return;
  if (category.value !== value) {
    savedDrafts[draft.category] = { subject: draft.subject, body: draft.body, educationLevel: draft.educationLevel };
    Object.assign(draft, savedDrafts[value] || { subject: '', body: '', educationLevel: accountLevel.value || '' }, { category: value });
  }
  category.value = value; page.value = 1; selected.value = null; notice.value = ''; createOpen.value = true;
}
function startRequest() {
  draft.category = category.value; draft.educationLevel = accountLevel.value || ''; createOpen.value = true; selected.value = null; notice.value = '';
}
async function openTicket(ticket: SupportTicket) {
  busy.value = true; error.value = ''; notice.value = ''; reply.value = ''; selected.value = null; createOpen.value = false;
  try { const data = await $fetch<SupportTicket>(`/api/support/tickets/${encodeURIComponent(ticket.id)}`); if (active) selected.value = data; }
  catch (value) { showError(value); } finally { if (active) busy.value = false; }
}
async function submit() {
  busy.value = true; error.value = ''; notice.value = '';
  try {
    const ticket = await $fetch<SupportTicket>('/api/support/tickets', { method: 'POST', body: { ...draft, educationLevel: accountLevel.value || draft.educationLevel, subject: draft.subject.trim(), body: draft.body.trim(), language: sw.value ? 'sw' : 'en' } });
    if (!active) return;
    category.value = ticket.category; page.value = 1; status.value = ''; search.value = ''; debouncedSearch.value = ''; clearTimeout(searchTimer); createOpen.value = false; selected.value = ticket;
    draft.subject = ''; draft.body = ''; delete savedDrafts[draft.category]; notice.value = text.value.created; await load();
  } catch (value) { showError(value); } finally { if (active) busy.value = false; }
}
async function sendReply() {
  if (!selected.value || !reply.value.trim()) return; busy.value = true; error.value = ''; notice.value = '';
  try {
    const ticket = await $fetch<SupportTicket>(`/api/support/tickets/${encodeURIComponent(selected.value.id)}/messages`, { method: 'POST', body: { body: reply.value.trim() } });
    if (!active) return;
    selected.value = ticket; reply.value = ''; notice.value = text.value.replied; await load();
  } catch (value) { showError(value); } finally { if (active) busy.value = false; }
}
const date = (value: string) => new Date(value).toLocaleString(sw.value ? 'sw-TZ' : 'en-GB', { timeZone: 'Africa/Dar_es_Salaam', dateStyle: 'medium', timeStyle: 'short' });
watch(search, value => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { debouncedSearch.value = value; page.value = 1; }, 300); });
watch(status, () => { page.value = 1; });
watch([category, status, debouncedSearch, page], load);
onMounted(load);
onBeforeUnmount(() => { active = false; controller?.abort(); clearTimeout(searchTimer); });
</script>

<template>
  <section aria-labelledby="support-title" class="space-y-5 text-sm font-normal text-textGray">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div><h2 id="support-title" class="text-2xl font-semibold text-darkBlue">{{ text.title }}</h2><p class="mt-2 max-w-2xl text-sm leading-6 text-textGray">{{ text.description }}</p></div>
      <button v-if="!createOpen" type="button" :disabled="busy" class="support-primary" @click="startRequest">＋ {{ category === 'technical' ? text.createTicket : text.suggestFeature }}</button>
    </div>
    <div role="group" :aria-label="text.category" class="grid gap-3 sm:grid-cols-2">
      <button v-for="item in categories" :key="item" type="button" :aria-pressed="category === item" :disabled="busy" :class="['flex items-start gap-3 rounded-xl border p-4 text-left transition-colors', category === item ? 'border-deepBlue bg-oceanBlue/10 ring-1 ring-oceanBlue' : 'border-slate-200 bg-white hover:bg-gray-50']" @click="choose(item)">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-oceanBlue/10 text-deepBlue" aria-hidden="true">
          <svg v-if="item === 'technical'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18a2.1 2.1 0 0 0 3 3l5.3-5.3a5 5 0 0 0 6.4-6.4l-3 3-3-3 3-3Z" /></svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6m-5 3h4M8.5 14.5a6 6 0 1 1 7 0c-.9.6-1.5 1.6-1.5 2.5h-4c0-.9-.6-1.9-1.5-2.5Z" /></svg>
        </span>
        <span><span class="block text-sm font-medium">{{ text[item] }}</span><span class="mt-1 block text-xs leading-5 text-textGray">{{ item === 'technical' ? text.technicalHint : text.featureHint }}</span><span class="mt-1 block text-2xl font-semibold text-darkBlue">{{ counts?.[item]?.total ?? '—' }}</span><span class="text-xs text-textGray">{{ counts ? `${counts[item].new} ${text.new.toLowerCase()}` : '—' }}</span></span>
      </button>
    </div>
    <div v-if="error" role="alert" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{{ error }} <NuxtLink v-if="authRequired" :to="signInLink" class="ml-2 underline">{{ text.retryLogin }}</NuxtLink><button v-else type="button" class="ml-3 underline" :disabled="busy || loading" @click="load">{{ text.refresh }}</button></div>
    <p v-if="notice" role="status" class="rounded-lg bg-green-50 p-3 text-sm text-green-800">{{ notice }}</p>
    <form v-if="createOpen" class="rounded-2xl border border-slate-200 bg-white p-5 md:p-7" @submit.prevent="submit">
      <h3 class="mb-5 text-lg font-semibold text-darkBlue">{{ draft.category === 'technical' ? text.createTicket : text.suggestFeature }}</h3>
      <div class="grid gap-5 md:grid-cols-2">
        <label class="support-label">{{ text.level }}<select :value="accountLevel || draft.educationLevel" required :disabled="busy || !!accountLevel" class="support-field" @change="draft.educationLevel = ($event.target as HTMLSelectElement).value"><option disabled value="">{{ text.chooseLevel }}</option><option value="primary">{{ text.primary }}</option><option value="secondary">{{ text.secondary }}</option></select></label>
      </div>
      <label class="support-label mt-5">{{ text.subject }}<input v-model="draft.subject" required maxlength="150" :disabled="busy" class="support-field" :placeholder="text.subjectHint" /></label>
      <label class="support-label mt-5">{{ draft.category === 'technical' ? text.issue : text.featureDetails }}<textarea v-model="draft.body" required maxlength="5000" rows="6" :disabled="busy" class="support-field" :placeholder="draft.category === 'technical' ? text.messageHint : text.featurePlaceholder" /></label>
      <div class="mt-5 flex flex-wrap gap-3"><button type="submit" :disabled="busy || loading || setupRequired || authRequired || !draft.subject.trim() || !draft.body.trim()" class="support-primary">{{ busy ? text.sending : draft.category === 'technical' ? text.createTicket : text.suggestFeature }}</button><button type="button" :disabled="busy" class="support-secondary" @click="createOpen = false">{{ text.cancel }}</button></div>
    </form>
    <section :aria-label="text.requests" class="space-y-4">
      <h3 class="text-lg font-semibold text-darkBlue">{{ text.requests }}</h3>
      <div class="flex flex-wrap gap-3"><input v-model="search" :disabled="busy" :aria-label="text.search" :placeholder="text.search" class="support-field min-w-48 flex-1" /><select v-model="status" :disabled="busy" :aria-label="text.all" class="support-field !w-auto"><option value="">{{ text.all }}</option><option value="new">{{ text.new }}</option><option value="in_review">{{ text.in_review }}</option><option value="resolved">{{ text.resolved }}</option></select><button type="button" :disabled="busy || loading" class="support-secondary" @click="load">{{ text.refresh }}</button></div>
      <div class="grid overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
        <section class="min-w-0 border-b border-slate-200 lg:border-b-0 lg:border-r" :aria-label="text.requests">
          <h3 class="border-b border-slate-100 p-4 text-sm font-semibold">{{ text.requests }} <span class="font-normal text-textGray">({{ total }})</span></h3>
          <p v-if="loading" role="status" class="p-6 text-sm text-textGray">{{ text.loading }}</p>
          <ul v-else-if="items.length" class="divide-y divide-slate-100"><li v-for="ticket in items" :key="ticket.id"><button type="button" :disabled="busy" :class="['w-full p-4 text-left hover:bg-oceanBlue/10', selected?.id === ticket.id ? 'bg-oceanBlue/10' : '']" @click="openTicket(ticket)"><div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-textGray"><span>{{ date(ticket.createdAt) }} EAT</span><span class="rounded-full bg-grayLight px-2 py-1">{{ text[ticket.status] }}</span></div><p class="break-words text-sm font-semibold text-darkBlue">{{ ticket.subject }}</p><p class="mt-1 line-clamp-2 break-words text-xs leading-5 text-textGray">{{ ticket.body }}</p></button></li></ul>
          <div v-else class="p-8 text-center"><p class="font-semibold">{{ search || status ? text.noMatch : text.empty }}</p><p class="mt-2 text-sm leading-6 text-textGray">{{ text.emptyHint }}</p></div>
          <div class="flex items-center justify-between gap-2 border-t border-slate-100 p-3 text-xs"><button type="button" :disabled="page <= 1 || busy || loading" class="support-secondary" @click="page--">{{ text.previous }}</button><span>{{ page }} / {{ Math.max(1, Math.ceil(total / 10)) }}</span><button type="button" :disabled="page * 10 >= total || busy || loading" class="support-secondary" @click="page++">{{ text.next }}</button></div>
        </section>
        <article class="min-w-0 p-5 md:p-6">
          <template v-if="selected">
            <div class="flex items-center justify-between gap-3"><span class="rounded-full bg-oceanBlue/10 px-3 py-1 text-xs font-semibold text-deepBlue">{{ text[selected.status] }}</span><button type="button" :disabled="busy" class="support-secondary" @click="selected = null">{{ text.close }}</button></div>
            <p class="mt-5 break-all text-xs text-textGray">{{ selected.id }}</p><h3 class="mt-2 break-words text-xl font-semibold text-darkBlue">{{ selected.subject }}</h3><p class="mt-2 text-xs text-textGray">{{ date(selected.createdAt) }} EAT</p><p class="my-6 whitespace-pre-wrap break-words text-sm leading-7">{{ selected.body }}</p>
            <div class="space-y-3"><div v-for="message in selected.messages" :key="message.id" :class="['rounded-xl p-4', message.sender === 'admin' ? 'bg-oceanBlue/10' : 'bg-gray-50']"><p class="mb-2 text-xs font-semibold text-textGray">{{ message.sender === 'admin' ? text.team : text.you }} · {{ date(message.createdAt) }} EAT</p><p class="whitespace-pre-wrap break-words text-sm leading-6">{{ message.body }}</p></div></div>
            <form class="mt-6 border-t border-slate-100 pt-5" @submit.prevent="sendReply"><label class="support-label">{{ text.reply }}<textarea v-model="reply" required maxlength="5000" rows="4" :disabled="busy" class="support-field" /></label><button type="submit" :disabled="busy || !reply.trim() || authRequired" class="support-primary mt-3">{{ busy ? text.sending : text.sendReply }}</button></form>
          </template>
          <p v-else class="flex min-h-60 items-center justify-center text-center text-sm text-textGray">{{ busy ? text.loading : text.select }}</p>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.support-field {
  @apply mt-2 block w-full rounded-lg border border-textGray/40 bg-gray-50 px-3 py-3 text-sm font-normal text-textGray transition-colors;
  font-family: inherit;
}
.support-field:focus { @apply outline-none ring-2 ring-oceanBlue/50 border-deepBlue; }
.support-label { @apply block text-xs font-medium text-textGray; }
.support-primary {
  @apply inline-flex min-h-10 items-center justify-center rounded-md bg-oceanBlue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-deepBlue;
  font-family: inherit;
}
.support-secondary {
  @apply min-h-10 rounded-md border border-textGray/40 bg-white px-3 py-2 text-sm font-normal text-textGray transition-colors hover:bg-gray-50;
  font-family: inherit;
}
button:disabled { cursor: not-allowed; opacity: .5; }
button:focus-visible { @apply outline-none ring-2 ring-oceanBlue ring-offset-2; }
</style>
