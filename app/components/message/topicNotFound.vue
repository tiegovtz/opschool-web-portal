<script setup>
import { computed } from "vue";

const contentLayoutLanguage = useContentLayoutLanguage();

const props = defineProps({
  message: {
    type: String,
    default: "",
  },
});

const isKiswahili = computed(() => contentLayoutLanguage.value === "kiswahili");

const uiText = computed(() => {
  const defaultMessage = isKiswahili.value
    ? "Maudhui haya yataongezwa hivi karibuni"
    : "This content will be updated soon";

  const normalizedMessage = props.message.trim().toLowerCase();
  const fallbackMessages = new Set([
    "this page will be updated soon",
    "this activity will be updated soon",
    "this activitiy will be updated soon",
  ]);
  const message = !props.message || fallbackMessages.has(normalizedMessage)
    ? defaultMessage
    : props.message;

  return isKiswahili.value
    ? {
        title: "Tunaandaa maudhui bora kwa ajili yako.",
        message,
        suffix: "Endelea kutembelea ukurasa huu kwa nyenzo mpya za kujifunzia.",
      }
    : {
        title: "We're working hard to bring you the best content!",
        message,
        suffix: "Stay tuned for new and exciting learning materials.",
      };
});
</script>

<template>
    <div class="w-full flex flex-col items-center justify-center gap-2">
        <Icon name="uiw:information-o" size="30" class="text-oceanBlue" />
        <p class="text-medium font-medium text-textGray text-center">
            {{ uiText.title }}
        </p>
        <p class="text-base text-gray-500 text-center">
            {{ uiText.message }} - {{ uiText.suffix }}
        </p>
    </div>
</template>
