<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
const contentLayoutLanguage = useContentLayoutLanguage();
const isSwahili = computed(() => contentLayoutLanguage.value === "kiswahili");

const props = defineProps<{
  chat: any;
  draftMessage?: string;
  draftVersion?: number;
}>();

const input = ref("");
const files = ref<FileList>();
const fileInputRef = ref<HTMLInputElement | null>(null);
const messageInputRef = ref<HTMLTextAreaElement | null>(null);
const validationError = ref("");

const MAX_FILE_COUNT = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_DOCUMENT_BYTES = 1 * 1024 * 1024;
const MIN_TEXTAREA_HEIGHT = 48;
const MAX_TEXTAREA_HEIGHT = 144;

const emit = defineEmits<{
  sendMessage: [payload: { message: string; files?: FileList }];
}>();

const isBusy = computed(() => props.chat?.status !== "ready");
const selectedFiles = computed(() =>
  files.value ? Array.from(files.value) : [],
);
const canSend = computed(
  () =>
    !isBusy.value &&
    !validationError.value &&
    (Boolean(input.value.trim()) || selectedFiles.value.length > 0),
);
const selectedFilePreviewUrls = ref<Record<string, string>>({});
const labels = computed(() => ({
  formLabel: isSwahili.value ? "Uliza swali kwa mwalimu wa AI" : "Ask a question to AI teacher",
  inputLabel: isSwahili.value ? "Uliza Mwalimu wa AI wa TIE" : "Ask TIE AI Teacher",
  removeFile: isSwahili.value ? "Ondoa" : "Remove",
  attachFile: isSwahili.value ? "Ambatisha faili" : "Attach a file",
  placeholder: isSwahili.value ? "Uliza chochote" : "Ask anything",
  sendPrompt: isSwahili.value ? "Tuma swali kwa mwalimu wa AI" : "Send prompt to AI teacher",
  questionHelp: isSwahili.value
    ? "Bonyeza Enter kutuma swali lako. Bonyeza Shift Enter kuanza mstari mpya. Unaweza pia kuambatisha faili za PDF, maandishi, JSON, markdown, au picha."
    : "Press Enter to submit your question. Press Shift Enter to start a new line. You can also attach PDF, text, JSON, markdown, or image files.",
}));

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
  if (lowerName.endsWith(".txt")) return "text/plain";
  if (lowerName.endsWith(".md")) return "text/markdown";
  if (lowerName.endsWith(".json")) return "application/json";

  return declaredType;
};

const isSupportedMediaType = (mediaType: string) =>
  mediaType === "application/pdf" ||
  mediaType === "text/plain" ||
  mediaType === "text/markdown" ||
  mediaType === "application/json" ||
  mediaType === "image/jpeg" ||
  mediaType === "image/png" ||
  mediaType === "image/webp";

const fileIcon = (file: Pick<File, "name" | "type">) =>
  inferSelectedFileMediaType(file).startsWith("image/")
    ? "heroicons:photo"
    : "heroicons:document-text";

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getPreviewKey = (file: Pick<File, "name" | "size" | "lastModified">) =>
  `${file.name}-${file.size}-${file.lastModified}`;

const cloneFiles = (fileList?: FileList): FileList | undefined => {
  if (!fileList?.length) return undefined;

  const transfer = new DataTransfer();
  Array.from(fileList).forEach((file) => transfer.items.add(file));
  return transfer.files;
};

const syncPreviewUrls = (nextFiles: File[]) => {
  const nextPreviewUrls: Record<string, string> = {};

  for (const file of nextFiles) {
    if (!inferSelectedFileMediaType(file).startsWith("image/")) continue;

    const key = getPreviewKey(file);
    nextPreviewUrls[key] =
      selectedFilePreviewUrls.value[key] || URL.createObjectURL(file);
  }

  for (const [key, url] of Object.entries(selectedFilePreviewUrls.value)) {
    if (!nextPreviewUrls[key]) {
      URL.revokeObjectURL(url);
    }
  }

  selectedFilePreviewUrls.value = nextPreviewUrls;
};

const getPreviewUrl = (file: File) =>
  selectedFilePreviewUrls.value[getPreviewKey(file)] || "";

const resizeTextarea = () => {
  if (!messageInputRef.value) return;

  messageInputRef.value.style.height = "0px";
  const nextHeight = Math.min(
    messageInputRef.value.scrollHeight,
    MAX_TEXTAREA_HEIGHT,
  );
  messageInputRef.value.style.height = `${Math.max(nextHeight, MIN_TEXTAREA_HEIGHT)}px`;
};

watch(
  () => [props.draftMessage, props.draftVersion],
  ([draftMessage]) => {
    if (typeof draftMessage === "string" && draftMessage.trim()) {
      input.value = draftMessage;
      nextTick(() => {
        resizeTextarea();
      });
    }
  },
  { immediate: true }
);

watch(
  selectedFiles,
  (nextFiles) => {
    syncPreviewUrls(nextFiles);
  },
  { immediate: true },
);

watch(
  input,
  () => {
    nextTick(() => {
      resizeTextarea();
    });
  },
  { immediate: true },
);

const validateFiles = (nextFiles?: FileList): string => {
  if (!nextFiles || nextFiles.length === 0) return "";
  if (nextFiles.length > MAX_FILE_COUNT) {
    return isSwahili.value
      ? `Unaweza kuambatisha hadi faili ${MAX_FILE_COUNT} kwa wakati mmoja.`
      : `You can attach up to ${MAX_FILE_COUNT} files at a time.`;
  }

  for (const file of Array.from(nextFiles)) {
    const mediaType = inferSelectedFileMediaType(file);

    if (!isSupportedMediaType(mediaType)) {
      return isSwahili.value
        ? "Ni faili za PDF, TXT, MD, JSON, JPG, PNG, na WEBP pekee zinazoruhusiwa."
        : "Only PDF, TXT, MD, JSON, JPG, PNG, and WEBP files are supported.";
    }

    if (
      mediaType === "application/pdf" &&
      file.size > MAX_PDF_BYTES
    ) {
      return isSwahili.value
        ? "Kila faili la PDF linapaswa kuwa 10MB au chini."
        : "Each PDF must be 10MB or smaller.";
    }

    if (
      mediaType.startsWith("image/") &&
      file.size > MAX_IMAGE_BYTES
    ) {
      return isSwahili.value
        ? "Kila picha inapaswa kuwa 5MB au chini."
        : "Each image must be 5MB or smaller.";
    }

    if (
      (mediaType === "text/plain" ||
        mediaType === "text/markdown" ||
        mediaType === "application/json") &&
      file.size > MAX_TEXT_DOCUMENT_BYTES
    ) {
      return isSwahili.value
        ? "Kila faili la maandishi linapaswa kuwa 1MB au chini."
        : "Each text document must be 1MB or smaller.";
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

  const filesSnapshot = cloneFiles(files.value);

  emit("sendMessage", {
    message: input.value,
    files: filesSnapshot,
  });

  input.value = "";
  nextTick(() => {
    resizeTextarea();
  });
  files.value = undefined;
  validationError.value = "";
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const handleMessageKeydown = (event: KeyboardEvent) => {
  if (event.isComposing || event.key !== "Enter" || event.shiftKey) {
    return;
  }

  event.preventDefault();
  handleSubmit(event);
};

onBeforeUnmount(() => {
  Object.values(selectedFilePreviewUrls.value).forEach((url) => {
    URL.revokeObjectURL(url);
  });
});
</script>

<template>
  <form
    id="main-container"
    tabindex="-1"
    class="w-full border-t border-gray-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:px-5 sm:pt-5"
    role="form"
    :aria-label="labels.formLabel"
    @submit.prevent="handleSubmit"
  >
    <input
      ref="fileInputRef"
      class="hidden"
      type="file"
      accept=".pdf,.txt,.md,.json,.jpg,.jpeg,.png,.webp,application/pdf,text/plain,text/markdown,application/json,image/jpeg,image/png,image/webp"
      multiple
      @change="handleFileChange"
    />

    <p
      v-if="validationError"
      class="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600 shadow-sm"
      role="alert"
    >
      {{ validationError }}
    </p>

    <div class="rounded-[2rem] border border-slate-200/90 bg-white px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.08)] sm:px-4 sm:py-2.5">
      <label for="question-input" class="sr-only">
        {{ labels.inputLabel }}
      </label>

      <div
        v-if="selectedFiles.length > 0"
        class="mb-2 flex flex-wrap gap-2"
      >
        <div
          v-for="(file, index) in selectedFiles"
          :key="`${file.name}-${index}`"
          class="inline-flex max-w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 px-2.5 py-1.5 text-xs text-slate-700"
        >
          <img
            v-if="getPreviewUrl(file)"
            :src="getPreviewUrl(file)"
            :alt="file.name"
            class="h-8 w-8 rounded-lg border border-slate-200 object-cover"
          >
          <div
            v-else
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white"
          >
            <Icon
              :name="fileIcon(file)"
              class="h-4 w-4 text-oceanBlue"
              aria-hidden="true"
            />
          </div>
          <div class="min-w-0">
            <p class="truncate font-medium text-slate-800">
              {{ file.name }}
            </p>
            <p class="text-[11px] text-slate-500">
              {{ formatFileSize(file.size) }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
            :aria-label="`${labels.removeFile} ${file.name}`"
            @click="removeFile(index)"
          >
            <Icon name="heroicons:x-mark" class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isBusy"
          :aria-label="labels.attachFile"
          @click="openFilePicker"
        >
          <Icon
            name="heroicons:plus"
            class="h-6 w-6"
            aria-hidden="true"
          />
        </button>

        <div class="min-w-0 flex-1">
          <textarea
            id="question-input"
            ref="messageInputRef"
            v-model="input"
            rows="1"
            :placeholder="labels.placeholder"
            class="w-full resize-none border-0 bg-transparent px-1 py-[11px] text-base leading-6 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            :disabled="isBusy"
            aria-describedby="question-help"
            @keydown="handleMessageKeydown"
          />
        </div>

        <button
          type="submit"
          class="group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-oceanBlue text-white shadow-[0_10px_20px_rgba(18,95,167,0.22)] transition-all hover:-translate-y-0.5 hover:bg-oceanBlue/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          :disabled="!canSend"
          :aria-label="labels.sendPrompt"
        >
          <Icon
            name="heroicons:arrow-up"
            class="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </button>
      </div>

      <span id="question-help" class="sr-only">
        {{ labels.questionHelp }}
      </span>
    </div>
  </form>
</template>
