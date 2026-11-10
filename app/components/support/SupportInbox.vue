<script setup lang="ts">
import type { LanguageSupport } from '~/types/language.interface';
import type { SupportCategory, SupportTicket } from '../../../shared/support/contracts';
import DropDown from '~/components/customDropDown/dropDownList.vue';
import Input from '~/components/ui/inputs/input.vue';

const fieldClass = 'mt-2 block w-full rounded-lg border border-textGray/40 bg-gray-50 px-3 py-3 text-sm font-normal text-textGray transition-colors [font-family:inherit] focus:outline-none focus:ring-2 focus:ring-oceanBlue/50 focus:border-deepBlue';
const labelClass = 'block text-xs font-medium text-textGray';
const primaryClass = 'inline-flex min-h-10 items-center justify-center rounded-md bg-oceanBlue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-deepBlue [font-family:inherit]';
const secondaryClass = 'min-h-10 rounded-md border border-textGray/40 bg-white px-3 py-2 text-sm font-normal text-textGray transition-colors hover:bg-gray-50 [font-family:inherit]';


const props = defineProps<{ language: LanguageSupport; educationLevel: 'primary' | 'secondary'; view: string }>();
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
  title: 'Support & Issues', description: 'Get help with a problem using the platform.',
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
const accountLevel = computed(() => props.educationLevel);
const accessToken = useCookie('signInAccessToken');
const contact = reactive({ name: '', email: '', phone: '' });
const attachments = ref<{ name: string; type: string; data: string }[]>([]);
async function addScreenshots(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  if (files.length + attachments.value.length > 3 || files.some(file => !['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024)) { error.value = sw.value ? 'Chagua hadi picha 3, kila moja isizidi MB 2.' : 'Choose up to 3 screenshots, PNG, JPEG or WebP, at most 2 MB each.'; input.value = ''; return; }
  const added = await Promise.all(files.map(file => new Promise<{ name: string; type: string; data: string }>((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, type: file.type, data: String(reader.result) }); reader.onerror = reject; reader.readAsDataURL(file); })));
  attachments.value.push(...added); input.value = '';
}
const requestCounts = ref({ submitted: 0, pending: 0, solved: 0 });
async function loadCounts() {
  const statuses = ['new','in_review','resolved'];
  const totals = await Promise.all(statuses.map(status => $fetch<{ total: number }>('/api/support/tickets', { query: { status, limit: 1 } })));
  requestCounts.value = { submitted: totals.reduce((sum,item) => sum + item.total, 0), pending: totals[0]!.total + totals[1]!.total, solved: totals[2]!.total };
}
const draft = reactive({ category: 'technical' as SupportCategory, educationLevel: '', subject: '', body: '' });
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
  error.value = authRequired.value ? (sw.value ? 'Huduma inahitaji uingie. Ujumbe wako haujatumwa.' : 'The service requires sign-in. Your message has not been submitted.') : text.value.failed;
}
async function load() {
  if (!accessToken.value || props.view !== 'requests') { loading.value = false; return; }
  controller?.abort(); controller = new AbortController(); const current = controller;
  loading.value = true; error.value = ''; authRequired.value = false;
  try {
    const data = await $fetch<{ items: SupportTicket[]; total: number; counts: typeof counts.value; summary?: typeof requestCounts.value }>('/api/support/tickets', { query: { status: status.value || undefined, search: debouncedSearch.value || undefined, page: page.value, limit: 10 }, signal: current.signal });
    if (current.signal.aborted || !active) return;
    if (data.summary) requestCounts.value = data.summary; else await loadCounts();
    if (current.signal.aborted || !active) return;
    items.value = data.items; total.value = data.total; counts.value = data.counts; setupRequired.value = false;
  } catch (value: any) {
    if (!current.signal.aborted && active) { items.value = []; total.value = 0; counts.value = null; showError(value); }
  } finally { if (!current.signal.aborted && active) loading.value = false; }
}
async function openTicket(ticket: SupportTicket) {
  busy.value = true; error.value = ''; notice.value = ''; reply.value = ''; selected.value = null; createOpen.value = false;
  try { const data = await $fetch<SupportTicket>(`/api/support/tickets/${encodeURIComponent(ticket.id)}`); if (active) selected.value = data; }
  catch (value) { showError(value); } finally { if (active) busy.value = false; }
}
async function submit() {
  busy.value = true; error.value = ''; notice.value = '';
  try {
    const ticket = await $fetch<SupportTicket>('/api/support/tickets', { method: 'POST', body: { ...draft, contact, attachments: attachments.value, educationLevel: accountLevel.value || draft.educationLevel, subject: draft.subject.trim(), body: draft.body.trim(), language: sw.value ? 'sw' : 'en' } });
    if (!active) return;
    category.value = ticket.category; page.value = 1; status.value = ''; search.value = ''; debouncedSearch.value = ''; clearTimeout(searchTimer); createOpen.value = false; selected.value = ticket;
    draft.subject = ''; draft.body = ''; attachments.value = []; Object.assign(contact, { name: '', email: '', phone: '' }); notice.value = accessToken.value ? text.value.created : (sw.value ? 'Ombi lako limetumwa.' : 'Your support ticket has been submitted.'); await load();
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
watch([status, debouncedSearch, page, () => props.view, accessToken], load);
onMounted(load);
onBeforeUnmount(() => { active = false; controller?.abort(); clearTimeout(searchTimer); });
</script>

<template>
  <section v-show="view !== 'feedback'" :aria-label="view === 'requests' ? text.requests : text.technical" class="space-y-5 text-sm font-normal text-textGray [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-50 [&_button:focus-visible]:outline-none [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-oceanBlue [&_button:focus-visible]:ring-offset-2">

    <div v-show="view === 'support'" id="support-panel" role="tabpanel" aria-labelledby="support-tab" class="space-y-4">
      <p>{{ text.technicalHint }}</p>
    </div>
    <div v-if="error" role="alert" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{{ error }} <NuxtLink v-if="authRequired" :to="signInLink" class="ml-2 underline">{{ text.retryLogin }}</NuxtLink><button v-else type="button" class="ml-3 underline" :disabled="busy || loading" @click="load">{{ text.refresh }}</button></div>
    <p v-if="notice" role="status" class="rounded-lg bg-green-50 p-3 text-sm text-green-800">{{ notice }}</p>
    <form v-show="view === 'support'" class="rounded-2xl border border-slate-200 bg-white p-5 md:p-7" @submit.prevent="submit">
      <h3 class="mb-5 text-lg font-semibold text-darkBlue">{{ draft.category === 'technical' ? text.createTicket : text.suggestFeature }}</h3>
      <label :class="[labelClass, 'mt-5']">{{ text.subject }}<input v-model="draft.subject" required maxlength="150" :disabled="busy" :class="fieldClass" :placeholder="text.subjectHint" /></label>
      <label :class="[labelClass, 'mt-5']">{{ draft.category === 'technical' ? text.issue : text.featureDetails }}<textarea v-model="draft.body" required maxlength="5000" rows="6" :disabled="busy" :class="fieldClass" :placeholder="draft.category === 'technical' ? text.messageHint : text.featurePlaceholder" /></label>
      <fieldset class="mt-5 grid gap-4 sm:grid-cols-2"><legend class="mb-3 font-medium">{{ sw ? 'Mawasiliano (si lazima)' : 'Contact details (optional)' }}</legend>
        <label>{{ sw ? 'Jina' : 'Name' }}<Input v-model="contact.name" maxlength="100" :disabled="busy" class="mt-2" autocomplete="name" /></label>
        <label>{{ sw ? 'Namba ya simu' : 'Phone number' }}<Input v-model="contact.phone" type="tel" maxlength="30" :disabled="busy" class="mt-2" autocomplete="tel" /></label>
        <label>{{ sw ? 'Barua pepe' : 'Email' }}<Input v-model="contact.email" type="email" maxlength="254" :disabled="busy" class="mt-2" autocomplete="email" /></label>
      </fieldset>
      <label :class="[labelClass, 'mt-5']">{{ sw ? 'Ambatisha picha za skrini (si lazima)' : 'Attach screenshots (optional)' }}<input type="file" multiple accept="image/png,image/jpeg,image/webp" :disabled="busy" :class="fieldClass" @change="addScreenshots" /></label>
      <p class="mt-2 text-xs">{{ sw ? 'Hadi picha 3, MB 2 kila moja. Ondoa taarifa za siri kabla ya kutuma.' : 'Up to 3 images, 2 MB each. Remove passwords and private information before sending.' }}</p>
      <ul class="mt-3 flex flex-wrap gap-3"><li v-for="(file,index) in attachments" :key="index" class="rounded-lg border p-2"><img :src="file.data" :alt="file.name" class="h-24 w-32 object-contain" /><p class="max-w-32 truncate text-xs">{{ file.name }}</p><button type="button" :disabled="busy" class="text-xs underline" @click="attachments.splice(index,1)">{{ sw ? 'Ondoa' : 'Remove' }}</button></li></ul>
      <div class="mt-5 flex flex-wrap gap-3"><button type="submit" :disabled="busy || !draft.subject.trim() || !draft.body.trim()" :class="primaryClass">{{ busy ? text.sending : draft.category === 'technical' ? text.createTicket : text.suggestFeature }}</button></div>
    </form>
    <section v-if="view === 'requests' && accessToken" id="requests-panel" role="tabpanel" aria-labelledby="requests-tab" :aria-label="text.requests" class="space-y-4">
      <div class="grid grid-cols-3 gap-3"><div v-for="item in [{ key: 'submitted', label: sw ? 'Yaliyotumwa' : 'Submitted' }, { key: 'pending', label: sw ? 'Yanasubiri' : 'Pending' }, { key: 'solved', label: sw ? 'Yaliyotatuliwa' : 'Solved' }]" :key="item.key" class="rounded-xl border border-slate-200 p-4"><p>{{ item.label }}</p><p class="mt-2 text-2xl font-semibold text-darkBlue">{{ requestCounts[item.key as keyof typeof requestCounts] }}</p></div></div>
      <div class="grid grid-cols-[minmax(0,1fr)_minmax(100px,180px)_auto] items-center gap-2 sm:gap-3"><input v-model="search" :disabled="busy" :aria-label="text.search" :placeholder="text.search" :class="[fieldClass, '!mt-0 h-10 min-w-0']" /><div class="min-w-0"><DropDown v-model="status" :list="[{ id: 'all', name: text.all }, { id: 'new', name: text.new }, { id: 'in_review', name: text.in_review }, { id: 'resolved', name: text.resolved }]" :placeholder="text.all" :disabled="busy" :button-class="secondaryClass + ' h-10 w-full'" @update-model-value="value => status = value === 'all' ? '' : String(value)" /></div><button type="button" :disabled="busy || loading" :class="secondaryClass" @click="load">{{ text.refresh }}</button></div>
      <div class="grid overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
        <section class="min-w-0 border-b border-slate-200 lg:border-b-0 lg:border-r" :aria-label="text.requests">
          <p v-if="loading" role="status" class="p-6 text-sm text-textGray">{{ text.loading }}</p>
          <ul v-else-if="items.length" class="divide-y divide-slate-100"><li v-for="ticket in items" :key="ticket.id"><button type="button" :disabled="busy" :class="['w-full p-4 text-left hover:bg-oceanBlue/10', selected?.id === ticket.id ? 'bg-oceanBlue/10' : '']" @click="openTicket(ticket)"><div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-textGray"><span>{{ date(ticket.createdAt) }} EAT</span><span class="rounded-full bg-grayLight px-2 py-1">{{ text[ticket.status] }}</span></div><p class="break-words text-sm font-semibold text-darkBlue">{{ ticket.subject }}</p><p class="mt-1 line-clamp-2 break-words text-xs leading-5 text-textGray">{{ ticket.body }}</p></button></li></ul>
          <div v-else class="p-8 text-center"><p class="font-semibold">{{ search || status ? text.noMatch : text.empty }}</p><p class="mt-2 text-sm leading-6 text-textGray">{{ text.emptyHint }}</p></div>
          <div class="flex items-center justify-between gap-2 border-t border-slate-100 p-3 text-xs"><button type="button" :disabled="page <= 1 || busy || loading" :class="secondaryClass" @click="page--">{{ text.previous }}</button><span>{{ page }} / {{ Math.max(1, Math.ceil(total / 10)) }}</span><button type="button" :disabled="page * 10 >= total || busy || loading" :class="secondaryClass" @click="page++">{{ text.next }}</button></div>
        </section>
        <article class="min-w-0 p-5 md:p-6">
          <template v-if="selected">
            <div class="flex items-center justify-between gap-3"><span class="rounded-full bg-oceanBlue/10 px-3 py-1 text-xs font-semibold text-deepBlue">{{ text[selected.status] }}</span><button type="button" :disabled="busy" :class="secondaryClass" @click="selected = null">{{ text.close }}</button></div>
            <p class="mt-5 break-all text-xs text-textGray">{{ selected.id }}</p><h3 class="mt-2 break-words text-xl font-semibold text-darkBlue">{{ selected.subject }}</h3><p class="mt-2 text-xs text-textGray">{{ date(selected.createdAt) }} EAT</p><p class="my-6 whitespace-pre-wrap break-words text-sm leading-7">{{ selected.body }}</p>
            <div v-if="selected.attachments.length" class="mb-5 flex flex-wrap gap-3"><a v-for="file in selected.attachments" :key="file.name" :href="file.data" :download="file.name" class="rounded-lg border p-2"><img v-if="file.data" :src="file.data" :alt="file.name" class="h-28 w-40 object-contain" /><span class="text-xs">{{ file.name }}</span></a></div>
            <div class="space-y-3"><div v-for="message in selected.messages" :key="message.id" :class="['rounded-xl p-4', message.sender === 'admin' ? 'bg-oceanBlue/10' : 'bg-gray-50']"><p class="mb-2 text-xs font-semibold text-textGray">{{ message.sender === 'admin' ? text.team : text.you }} · {{ date(message.createdAt) }} EAT</p><p class="whitespace-pre-wrap break-words text-sm leading-6">{{ message.body }}</p></div></div>
            <form class="mt-6 border-t border-slate-100 pt-5" @submit.prevent="sendReply"><label :class="labelClass">{{ text.reply }}<textarea v-model="reply" required maxlength="5000" rows="4" :disabled="busy" :class="fieldClass" /></label><button type="submit" :disabled="busy || !reply.trim() || authRequired" :class="[primaryClass, 'mt-3']">{{ busy ? text.sending : text.sendReply }}</button></form>
          </template>
          <p v-else class="flex min-h-60 items-center justify-center text-center text-sm text-textGray">{{ busy ? text.loading : text.select }}</p>
        </article>
      </div>
    </section>
  </section>
</template>
