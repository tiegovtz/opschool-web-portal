<template>
  <div class="flex justify-end animate-fade-in">
    <div
      class="max-w-[80%] bg-oceanBlue text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-lg"
    >
      <div
        v-for="(part, idx) in message.parts"
        :key="idx"
      >
        <div
          v-if="part.type === 'text'"
          class="text-sm leading-relaxed"
        >
          {{ part.text }}
        </div>
        <div
          v-else-if="isImagePart(part) && imageSource(part)"
          class="mt-2"
        >
          <img
            :src="imageSource(part)"
            :alt="part.filename || 'Uploaded image'"
            class="max-h-56 rounded-xl border border-white/20 object-cover"
          >
        </div>
        <div
          v-else-if="isAttachmentPart(part)"
          class="mt-2 flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm"
        >
          <Icon
            :name="attachmentIcon(part)"
            class="h-5 w-5 shrink-0 text-white"
            aria-hidden="true"
          />
          <div class="min-w-0">
            <p class="truncate font-medium">
              {{ attachmentName(part) }}
            </p>
            <p class="text-xs text-blue-100">
              {{ attachmentLabel(part) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: any }>();

const isAttachmentPart = (part: any) =>
  part?.type === "file" || part?.type === "data-attachment";

const inferMediaTypeFromFilename = (filename?: string) => {
  const lowerName = typeof filename === "string" ? filename.toLowerCase() : "";

  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".webp")) return "image/webp";
  if (lowerName.endsWith(".txt")) return "text/plain";
  if (lowerName.endsWith(".md")) return "text/markdown";
  if (lowerName.endsWith(".json")) return "application/json";

  return "";
};

const getAttachmentMeta = (part: any) => {
  if (part?.type === "data-attachment") {
    const inferredMediaType =
      part.data?.mediaType || inferMediaTypeFromFilename(part.data?.filename);

    return {
      filename: part.data?.filename,
      mediaType: inferredMediaType,
      previewUrl: part.data?.previewUrl,
    };
  }

  const inferredMediaType =
    part?.mediaType || inferMediaTypeFromFilename(part?.filename);

  return {
    filename: part?.filename,
    mediaType: inferredMediaType,
    previewUrl: part?.url,
  };
};

const attachmentName = (part: any) =>
  getAttachmentMeta(part).filename || "Attachment";

const isImagePart = (part: any) =>
  getAttachmentMeta(part).mediaType?.startsWith("image/");

const imageSource = (part: any) =>
  getAttachmentMeta(part).previewUrl || "";

const attachmentLabel = (part: any) => {
  const { mediaType } = getAttachmentMeta(part);

  if (mediaType === "application/pdf") return "PDF document";
  if (typeof mediaType === "string" && mediaType.startsWith("image/")) {
    return "Image attachment";
  }
  if (
    mediaType === "text/plain" ||
    mediaType === "text/markdown" ||
    mediaType === "application/json"
  ) {
    return "Text document";
  }

  return "Attachment";
};

const attachmentIcon = (part: any) =>
  getAttachmentMeta(part).mediaType?.startsWith("image/")
    ? "heroicons:photo"
    : "heroicons:document-text";
</script>
