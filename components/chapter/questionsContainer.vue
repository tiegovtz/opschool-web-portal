<script setup>
import questionsAnswers from './questionsAnswers.vue';
defineProps({
    questions: {
        type: Array,
        required: true,
    }
})
</script>

<template>
    <section class="">
        <h1 class="text-large" v-if="questions.length >0">Chapter Questions</h1>
        <questionsAnswers v-for="(question, index) in questions" :key="index"
            :question-type="question.questionType"
            :true-answer="question.answer"
            :choices="question.choices"
            :question="question.question"
            :number="`${index + 1}`.toString()"
        />
    </section>
</template>