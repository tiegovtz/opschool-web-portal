<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{
  chat: any;
  draftMessage?: string;
  draftVersion?: number;
}>();

const input = ref("");
const files = ref<FileList>();
const fileInputRef = ref<HTMLInputElement | null>(null);
const validationError = ref("");

const MAX_FILE_COUNT = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

const emit = defineEmits<{
  sendMessage: [payload: { message: string; files?: FileList }];
}>();

const isBusy = computed(() => props.chat?.status !== "ready");
const selectedFiles = computed(() =>
  files.value ? Array.from(files.value) : [],
);

const inferSelectedFileMediaType = (file: Pick<File, "name" | "type">): string => {
  const declaredType = typeof file.type === "string" ? file.type.trim().toLowerCase() : "";
  if (declaredType && declaredType !== "application/octet-stream") {
    return declaredType;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".webp")) return "image/webp";

  return declaredType;
};

const isSupportedMediaType = (mediaType: string) =>
  mediaType === "application/pdf" ||
  mediaType === "image/jpeg" ||
  mediaType === "image/png" ||
  mediaType === "image/webp";

const fileIcon = (file: Pick<File, "name" | "type">) =>
  inferSelectedFileMediaType(file) === "application/pdf"
    ? "heroicons:document-text"
    : "heroicons:photo";

watch(
  () => [props.draftMessage, props.draftVersion],
  ([draftMessage]) => {
    if (typeof draftMessage === "string" && draftMessage.trim()) {
      input.value = draftMessage;
    }
  },
  { immediate: true }
);

const validateFiles = (nextFiles?: FileList): string => {
  if (!nextFiles || nextFiles.length === 0) return "";
  if (nextFiles.length > MAX_FILE_COUNT) {
    return `You can attach up to ${MAX_FILE_COUNT} files at a time.`;
  }

  for (const file of Array.from(nextFiles)) {
    const mediaType = inferSelectedFileMediaType(file);

    if (!isSupportedMediaType(mediaType)) {
      return "Only PDF, JPG, PNG, and WEBP files are supported.";
    }

    if (
      mediaType === "application/pdf" &&
      file.size > MAX_PDF_BYTES
    ) {
      return "Each PDF must be 10MB or smaller.";
    }

    if (
      mediaType.startsWith("image/") &&
      file.size > MAX_IMAGE_BYTES
    ) {
      return "Each image must be 5MB or smaller.";
    }
  }

  return "";
};

const setFiles = (nextFiles?: FileList) => {
  const error = validateFiles(nextFiles);
  validationError.value = error;
  files.value = error || !nextFiles?.length ? undefined : nextFiles;
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  setFiles(target?.files ?? undefined);
};

const openFilePicker = () => {
  fileInputRef.value?.click();
};

const removeFile = (index: number) => {
  if (!files.value) return;

  const remainingFiles = Array.from(files.value).filter(
    (_, fileIndex) => fileIndex !== index,
  );

  if (remainingFiles.length === 0) {
    files.value = undefined;
    validationError.value = "";
    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
    return;
  }

  const transfer = new DataTransfer();
  remainingFiles.forEach((file) => transfer.items.add(file));
  setFiles(transfer.files);
};

const handleSubmit = (e: Event) => {
  e.preventDefault();
  if (validationError.value) return;
  if (!input.value.trim() && !files.value?.length) return;

  emit("sendMessage", {
    message: input.value,
    files: files.value,
  });

  input.value = "";
  files.value = undefined;
  validationError.value = "";
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};
</script>

<template>
  <form id="main-container" tabindex="-1"  @submit.prevent="handleSubmit" class="w-full border-t border-gray-200 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:px-5 sm:pt-5" role="form"
    aria-label="Ask a question to AI teacher">
    <input
      ref="fileInputRef"
      class="hidden"
      type="file"
      accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
      multiple
      @change="handleFileChange"
    />

    <div v-if="selectedFiles.length > 0" class="mb-3 flex flex-wrap gap-2">
      <div
        v-for="(file, index) in selectedFiles"
        :key="`${file.name}-${index}`"
        class="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700"
      >
        <Icon
          :name="fileIcon(file)"
          class="h-4 w-4 text-oceanBlue"
          aria-hidden="true"
        />
        <span class="max-w-[12rem] truncate">{{ file.name }}</span>
        <button
          type="button"
          class="text-gray-400 transition hover:text-gray-700"
          :aria-label="`Remove ${file.name}`"
          @click="removeFile(index)"
        >
          <Icon name="heroicons:x-mark" class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <p
      v-if="validationError"
      class="mb-3 text-xs text-red-600"
      role="alert"
    >
      {{ validationError }}
    </p>

    <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:p-2">
      <button
        type="button"
        class="flex h-12 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-700 transition hover:border-oceanBlue hover:text-oceanBlue disabled:cursor-not-allowed disabled:opacity-60 sm:h-14"
        :disabled="isBusy"
        @click="openFilePicker"
      >
        <Icon name="heroicons:paper-clip" class="h-5 w-5" aria-hidden="true" />
        <span>Attach</span>
      </button>

      <div class="relative h-12 flex-1 sm:h-14">
        <!-- Screen-reader label -->
        <label for="question-input" class="sr-only">
          Type your question
        </label>

        <input  id="question-input" v-model="input" type="text" placeholder="Type your question here..."
          class="h-full w-full rounded-2xl border-gray-200 bg-gray-50 px-4 pr-12 text-sm transition-all focus:border-oceanBlue focus:outline-none focus:ring focus:ring-oceanBlue sm:px-5"
          :disabled="isBusy"
          aria-describedby="question-help" autocomplete="off" />

        <!-- Helper text (screen readers only) -->
        <span id="question-help" class="sr-only">
          Press Enter or click Send to submit your question. You can also attach PDF documents or images.
        </span>
      </div>

      <button type="submit"
        class="flex items-center justify-center gap-2 rounded-2xl bg-oceanBlue px-5 py-3 font-semibold text-white shadow-lg transition-all group hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-3.5"
        :disabled="isBusy || Boolean(validationError) || (!input.trim() && selectedFiles.length === 0)"
        aria-label="Send prompt to AI teacher">
        <span>Send</span>
        <Icon name="heroicons:arrow-up-right" class="w-5 h-5 transition transform group-hover:translate-x-1"
          aria-hidden="true" />
      </button>
    </div>
  </form>
</template>
