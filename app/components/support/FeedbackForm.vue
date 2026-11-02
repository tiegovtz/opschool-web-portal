<script setup lang="ts">
import DropDown from '~/components/customDropDown/dropDownList.vue';
import Input from '~/components/ui/inputs/input.vue';
import { feedbackQuestions } from '~~/shared/feedback/questions';
import type { LanguageSupport } from '~/types/language.interface';
const props = defineProps<{ language: LanguageSupport; educationLevel: 'primary' | 'secondary' }>();
const sw = computed(() => props.language === 'kiswahili');
const questions = computed(() => feedbackQuestions[sw.value ? 'sw' : 'en'].slice(0, sw.value ? 10 : 9));
const answers = ref(Array<string>(10).fill(''));
const contact = reactive({ name: '', email: '', phone: '' });
const busy = ref(false), error = ref(''), success = ref('');
const field = 'mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-textGray focus:outline-none focus:ring-2 focus:ring-oceanBlue/40';
async function submit() {
  error.value = ''; success.value = '';
  if (questions.value.some((q,i) => q.required && (i !== 4 || answers.value[3] === '1') && !answers.value[i]?.trim())) { error.value = sw.value ? 'Jibu maswali yote yanayohitajika.' : 'Please answer all required questions.'; return; }
  busy.value = true;
  try {
    await $fetch('/api/feedback', { method: 'POST', body: { language: sw.value ? 'sw' : 'en', educationLevel: props.educationLevel, contact, answers: questions.value.map((question,i) => ({ question: i === questions.value.length - 1 ? (sw.value ? 'Ungependa nini kiboreshwe?' : 'What would you like improved?') : question.label, answer: question.options.length ? question.options[Number(answers.value[i])-1] || answers.value[i] || '' : answers.value[i] || '' })) } });
    success.value = sw.value ? 'Asante. Maoni yako yametumwa.' : 'Thank you. Your feedback has been submitted.';
    answers.value = Array<string>(10).fill(''); Object.assign(contact, { name: '', email: '', phone: '' });
  } catch { error.value = sw.value ? 'Maoni hayajatumwa. Tafadhali jaribu tena.' : 'Your feedback could not be submitted. Please try again.'; }
  finally { busy.value = false; }
}
</script>
<template>
  <form class="space-y-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-textGray md:p-7" @submit.prevent="submit">
    <div v-for="(question,index) in questions" :key="index" class="space-y-2">
      <label :id="`question-${index}`" :for="`answer-${index}`" class="block text-sm font-medium">{{ index === questions.length - 1 ? (sw ? 'Ungependa nini kiboreshwe?' : 'What would you like improved?') : question.label }} <span v-if="question.required" aria-hidden="true">*</span></label>
      <DropDown v-if="question.options.length" :id="`answer-${index}`" v-model="answers[index]" :aria-labelledby="`question-${index}`" :list="question.options.map((name,i) => ({ id: String(i + 1), name }))" :placeholder="sw ? 'Chagua jibu' : 'Choose an answer'" :button-class="field" :disabled="busy" />
      <textarea v-else :id="`answer-${index}`" v-model="answers[index]" :required="question.required && (index !== 4 || answers[3] === '1')" :disabled="busy" rows="4" maxlength="5000" :class="field" />
      <p v-if="index === 2 || (index === 7 && !sw)" class="text-xs">{{ index === 2 ? (sw ? '1 = Ngumu sana · 5 = Rahisi sana' : '1 = Very difficult · 5 = Very easy') : (sw ? '1 = Haiwezekani kabisa · 5 = Inawezekana sana' : '1 = Very unlikely · 5 = Very likely') }}</p>
      <p v-if="index === questions.length - 1" class="text-xs">{{ sw ? 'Unaweza pia kupendekeza vipengele vipya.' : 'You can also suggest new features here.' }}</p>
    </div>
    <fieldset class="grid gap-4 sm:grid-cols-2"><legend class="mb-3 text-sm font-medium">{{ sw ? 'Mawasiliano (si lazima)' : 'Contact details (optional)' }}</legend>
      <label>{{ sw ? 'Jina' : 'Name' }}<Input v-model="contact.name" class="mt-2" maxlength="100" :disabled="busy" autocomplete="name" /></label>
      <label>{{ sw ? 'Namba ya simu' : 'Phone number' }}<Input v-model="contact.phone" class="mt-2" type="tel" maxlength="30" :disabled="busy" autocomplete="tel" /></label>
      <label>{{ sw ? 'Barua pepe' : 'Email' }}<Input v-model="contact.email" class="mt-2" type="email" maxlength="254" :disabled="busy" autocomplete="email" /></label>
    </fieldset>
    <p v-if="error" role="alert" class="text-red-700">{{ error }}</p><p v-if="success" role="status" class="text-green-700">{{ success }}</p>
    <button :disabled="busy" class="rounded-md bg-oceanBlue px-5 py-3 text-sm font-medium text-white hover:bg-deepBlue disabled:opacity-50">{{ busy ? (sw ? 'Inatuma…' : 'Sending…') : (sw ? 'Tuma maoni' : 'Submit feedback') }}</button>
  </form>
</template>
