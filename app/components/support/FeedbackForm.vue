<script setup lang="ts">
import Input from '~/components/ui/inputs/input.vue';
import { feedbackQuestions } from '~~/shared/feedback/questions';
import type { LanguageSupport } from '~/types/language.interface';
const props = defineProps<{ language: LanguageSupport; educationLevel: 'primary' | 'secondary' }>();
const sw = computed(() => props.language === 'kiswahili');
const questions = computed(() => feedbackQuestions[sw.value ? 'sw' : 'en'].slice(0, sw.value ? 10 : 9));
const answers = ref(Array<string>(10).fill(''));
const contact = reactive({ name: '', email: '', phone: '' });
const busy = ref(false), error = ref(''), success = ref('');
const attempted = ref(false);
const required = (index: number) => !!questions.value[index]?.required && (index !== 4 || answers.value[3] === '1');
const field = 'mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-darkBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40';
async function submit() {
  error.value = ''; success.value = '';
  attempted.value = true;
  const missing = questions.value.findIndex((_,i) => required(i) && !answers.value[i]?.trim());
  if (missing !== -1) { error.value = sw.value ? 'Jibu maswali yote yanayohitajika.' : 'Please answer all required questions.'; await nextTick(); (document.getElementById(`answer-${missing}`) || document.querySelector<HTMLInputElement>(`input[name="feedback-answer-${missing}"]`))?.focus(); return; }
  busy.value = true;
  try {
    await $fetch('/api/feedback', { method: 'POST', body: { language: sw.value ? 'sw' : 'en', educationLevel: props.educationLevel, contact, answers: questions.value.map((question,i) => ({ question: i === questions.value.length - 1 ? (sw.value ? 'Ungependa nini kiboreshwe?' : 'What would you like improved?') : question.label, answer: question.options.length ? question.options[Number(answers.value[i])-1] || answers.value[i] || '' : answers.value[i] || '' })) } });
    success.value = sw.value ? 'Asante. Maoni yako yametumwa.' : 'Thank you. Your feedback has been submitted.';
    attempted.value = false; answers.value = Array<string>(10).fill(''); Object.assign(contact, { name: '', email: '', phone: '' });
  } catch (value: any) { error.value = value?.statusCode === 401 || value?.status === 401 ? (sw.value ? 'Huduma inahitaji uingie ili kutuma maoni. Majibu yako yamehifadhiwa kwenye fomu hii.' : 'The service requires sign-in to submit feedback. Your answers are still in this form.') : sw.value ? 'Maoni hayajatumwa. Tafadhali jaribu tena.' : 'Your feedback could not be submitted. Please try again.'; }
  finally { busy.value = false; }
}
</script>
<template>
  <form :aria-busy="busy" aria-describedby="feedback-form-help" class="space-y-6 rounded-xl border border-slate-200 bg-white p-5 text-base text-darkBlue md:p-7" @submit.prevent="submit">
    <p id="feedback-form-help" class="text-sm text-gray-600">{{ sw ? 'Maswali yenye * yanahitaji jibu. Unaweza kutumia kibodi au kisoma skrini kujaza fomu hii.' : 'Questions marked * require an answer. You can complete this form using a keyboard or screen reader.' }}</p>
    <fieldset v-for="(question,index) in questions" :key="index" class="min-w-0 rounded-xl border border-slate-200 p-4 md:p-5" :aria-describedby="index === 2 || (index === 7 && !sw) ? `question-help-${index}` : undefined">
      <legend class="float-left mb-4 flex w-full gap-2 text-base font-semibold leading-relaxed">
        <span class="shrink-0 text-deepBlue">{{ index + 1 }}.</span>
        <span>{{ index === questions.length - 1 ? (sw ? 'Ungependa nini kiboreshwe?' : 'What would you like improved?') : question.label }} <span v-if="required(index)" class="text-red-700" aria-hidden="true">*</span><span v-if="required(index)" class="sr-only">{{ sw ? '(lazima)' : '(required)' }}</span></span>
      </legend>
      <div class="clear-both">
        <div v-if="question.options.length" :class="question.options.every(option => /^\d+$/.test(option)) ? 'flex items-center justify-between gap-2' : 'space-y-2'">
          <label v-for="(option,optionIndex) in question.options" :key="optionIndex" :class="question.options.every(value => /^\d+$/.test(value)) ? 'relative flex min-h-11 min-w-11 cursor-pointer items-center justify-center' : 'relative flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-sky-50 px-4 py-3 hover:border-oceanBlue'">
            <input v-model="answers[index]" type="radio" :name="`feedback-answer-${index}`" :value="String(optionIndex + 1)" :required="required(index)" :disabled="busy" :aria-invalid="attempted && required(index) && !answers[index]" :class="question.options.every(value => /^\d+$/.test(value)) ? 'peer sr-only' : 'h-5 w-5 shrink-0 accent-deepBlue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepBlue'" />
            <span :class="question.options.every(value => /^\d+$/.test(value)) ? 'flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-sky-50 peer-checked:border-deepBlue peer-checked:bg-deepBlue peer-checked:font-semibold peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-deepBlue peer-disabled:opacity-50' : 'peer-checked:font-semibold'">{{ option }}</span>
          </label>
        </div>
        <textarea v-else :id="`answer-${index}`" v-model="answers[index]" :aria-label="question.label" :required="required(index)" :aria-invalid="attempted && required(index) && !answers[index]" :disabled="busy" :placeholder="sw ? 'Jibu lako' : 'Your answer'" rows="4" maxlength="5000" :class="field" />
        <p v-if="index === 2 || (index === 7 && !sw)" :id="`question-help-${index}`" class="mt-3 text-sm">{{ index === 2 ? (sw ? '1 = Ngumu sana · 5 = Rahisi sana' : '1 = Very difficult · 5 = Very easy') : '1 = Very unlikely · 5 = Very likely' }}</p>
        <p v-if="index === questions.length - 1" class="mt-3 text-sm">{{ sw ? 'Unaweza pia kupendekeza vipengele vipya.' : 'You can also suggest new features here.' }}</p>
      </div>
    </fieldset>
    <fieldset aria-describedby="feedback-contact-help" class="grid gap-4 sm:grid-cols-2"><legend class="mb-3 text-base font-medium">{{ sw ? 'Mawasiliano (si lazima)' : 'Contact details (optional)' }}</legend>
      <label>{{ sw ? 'Jina' : 'Name' }}<Input v-model="contact.name" class="mt-2 text-base text-darkBlue" maxlength="100" :disabled="busy" autocomplete="name" /></label>
      <label>{{ sw ? 'Namba ya simu' : 'Phone number' }}<Input v-model="contact.phone" class="mt-2 text-base text-darkBlue" type="tel" maxlength="30" :disabled="busy" autocomplete="tel" /></label>
      <label>{{ sw ? 'Barua pepe' : 'Email' }}<Input v-model="contact.email" class="mt-2 text-base text-darkBlue" type="email" maxlength="254" :disabled="busy" autocomplete="email" /></label>
    </fieldset>
    <p id="feedback-contact-help" class="text-sm leading-relaxed text-gray-600">{{ sw ? 'Ikiwa huwezi kuingia kwenye akaunti yako, tunapendekeza uweke namba ya simu au barua pepe ili timu ya msaada iweze kuwasiliana nawe. Mawasiliano si lazima.' : 'If you cannot log in, we recommend entering a phone number or email so the support team can contact you. Contact details are optional.' }}</p>
    <p v-if="error" role="alert" class="text-red-700">{{ error }}</p><p v-if="success" role="status" class="text-green-700">{{ success }}</p>
    <button :disabled="busy" class="rounded-md bg-deepBlue px-5 py-3 text-base font-medium text-white hover:bg-primary-dark disabled:opacity-50">{{ busy ? (sw ? 'Inatuma…' : 'Sending…') : (sw ? 'Tuma maoni' : 'Submit feedback') }}</button>
  </form>
</template>
