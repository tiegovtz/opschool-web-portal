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
          v-else-if="isImagePart(part) && part.url"
          class="mt-2"
        >
          <img
            :src="part.url"
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

  return "";
};

const getAttachmentMeta = (part: any) => {
  if (part?.type === "data-attachment") {
    const inferredMediaType =
      part.data?.mediaType || inferMediaTypeFromFilename(part.data?.filename);

    return {
      filename: part.data?.filename,
      mediaType: inferredMediaType,
    };
  }

  const inferredMediaType =
    part?.mediaType || inferMediaTypeFromFilename(part?.filename);

  return {
    filename: part?.filename,
    mediaType: inferredMediaType,
  };
};

const attachmentName = (part: any) =>
  getAttachmentMeta(part).filename || "Attachment";

const isImagePart = (part: any) =>
  getAttachmentMeta(part).mediaType?.startsWith("image/");

const attachmentLabel = (part: any) => {
  const { mediaType } = getAttachmentMeta(part);

  if (mediaType === "application/pdf") return "PDF document";
  if (typeof mediaType === "string" && mediaType.startsWith("image/")) {
    return "Image attachment";
  }

  return "Attachment";
};

const attachmentIcon = (part: any) =>
  getAttachmentMeta(part).mediaType === "application/pdf"
    ? "heroicons:document-text"
    : "heroicons:photo";
</script>
