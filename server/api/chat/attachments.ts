import { createError } from "h3";
import { convertToModelMessages } from "ai";

const SUPPORTED_IMAGE_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const SUPPORTED_TEXT_DOCUMENT_MEDIA_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "application/json",
]);

const SUPPORTED_ATTACHMENT_MEDIA_TYPES = new Set([
  "application/pdf",
  ...SUPPORTED_TEXT_DOCUMENT_MEDIA_TYPES,
  ...SUPPORTED_IMAGE_MEDIA_TYPES,
]);

const LOCAL_DOCUMENT_CHAR_LIMIT = 12000;
const MIN_PDF_TEXT_EXTRACTION_LENGTH = 80;

let cachedPdfParseModule: Promise<any> | null = null;

function getPdfParse() {
  if (!cachedPdfParseModule) {
    cachedPdfParseModule = import("pdf-parse").then(
      (module) => module.default || module,
    );
  }

  return cachedPdfParseModule;
}

function isUIMessageFormat(message: any): boolean {
  return (
    message &&
    (Array.isArray(message.parts) ||
      (message.id !== undefined && message.parts !== undefined))
  );
}

function inferMediaTypeFromFilename(filename?: string): string {
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
}

function getDataUrlMetadata(value: string): { mediaType: string; isBase64: boolean } | null {
  if (typeof value !== "string" || !value.startsWith("data:")) {
    return null;
  }

  const commaIndex = value.indexOf(",");
  if (commaIndex === -1) {
    return null;
  }

  const metadataParts = value.slice(5, commaIndex).split(";");
  return {
    mediaType: metadataParts[0] || "application/octet-stream",
    isBase64: metadataParts.includes("base64"),
  };
}

export function getAttachmentMediaType(part: any): string {
  const declaredMediaType =
    typeof part?.mediaType === "string" ? part.mediaType.trim().toLowerCase() : "";

  if (declaredMediaType && declaredMediaType !== "application/octet-stream") {
    return declaredMediaType;
  }

  const dataField = typeof part?.data === "string" ? part.data : undefined;
  const urlField = typeof part?.url === "string" ? part.url : undefined;

  for (const candidate of [dataField, urlField]) {
    if (!candidate) continue;

    const metadata = getDataUrlMetadata(candidate);
    if (
      metadata?.mediaType &&
      metadata.mediaType !== "application/octet-stream"
    ) {
      return metadata.mediaType;
    }
  }

  return inferMediaTypeFromFilename(part?.filename) || declaredMediaType;
}

function describeFilePart(part: any): string {
  const filename =
    typeof part?.filename === "string" && part.filename.trim()
      ? part.filename.trim()
      : "attachment";
  const mediaType = getAttachmentMediaType(part);

  if (mediaType === "application/pdf") {
    return `PDF: ${filename}`;
  }

  if (mediaType.startsWith("image/")) {
    return `Image: ${filename}`;
  }

  if (SUPPORTED_TEXT_DOCUMENT_MEDIA_TYPES.has(mediaType)) {
    return `Document: ${filename}`;
  }

  return `Attachment: ${filename}`;
}

export function extractAttachmentTextContent(parts: any[]): string {
  if (!Array.isArray(parts) || parts.length === 0) {
    return "";
  }

  const textContent = parts
    .filter((part: any) => part?.type === "text" && typeof part?.text === "string")
    .map((part: any) => part.text.trim())
    .filter(Boolean)
    .join("\n");

  const attachmentLabels = parts
    .filter((part: any) => part?.type === "file" || part?.type === "data-attachment")
    .map((part: any) =>
      part?.type === "data-attachment"
        ? describeFilePart(part.data)
        : describeFilePart(part),
    );

  if (textContent && attachmentLabels.length > 0) {
    return `${textContent}\n\n${attachmentLabels.join("\n")}`;
  }

  if (textContent) return textContent;
  if (attachmentLabels.length > 0) return attachmentLabels.join("\n");
  return "";
}

function extractOnlyTextFromParts(parts: any[]): string {
  if (!Array.isArray(parts) || parts.length === 0) {
    return "";
  }

  return parts
    .filter((part: any) => part?.type === "text" && typeof part?.text === "string")
    .map((part: any) => part.text.trim())
    .filter(Boolean)
    .join("\n");
}

function decodeDataUrl(dataUrl: string): {
  mediaType: string;
  data: Uint8Array;
} | null {
  const metadata = getDataUrlMetadata(dataUrl);
  if (!metadata) {
    return null;
  }

  const commaIndex = dataUrl.indexOf(",");
  const payload = dataUrl.slice(commaIndex + 1);

  try {
    if (metadata.isBase64) {
      const buffer = Buffer.from(payload, "base64");
      return { mediaType: metadata.mediaType, data: new Uint8Array(buffer) };
    }

    const decodedText = decodeURIComponent(payload);
    return {
      mediaType: metadata.mediaType,
      data: new TextEncoder().encode(decodedText),
    };
  } catch {
    return null;
  }
}

function getFilePartBytes(part: any): Uint8Array | null {
  if (part?.data instanceof Uint8Array) {
    return part.data;
  }

  if (typeof part?.data === "string") {
    const decoded = decodeDataUrl(part.data);
    return decoded?.data || null;
  }

  return null;
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildExtractedDocumentTextPart(
  filename: string,
  label: string,
  text: string,
): { type: "text"; text: string } {
  const normalizedText = normalizeExtractedText(text);
  if (!normalizedText) {
    return {
      type: "text",
      text: `Uploaded ${label}: ${filename}`,
    };
  }

  const truncated =
    normalizedText.length > LOCAL_DOCUMENT_CHAR_LIMIT
      ? `${normalizedText.slice(0, LOCAL_DOCUMENT_CHAR_LIMIT)}\n\n[Document content truncated for performance.]`
      : normalizedText;

  return {
    type: "text",
    text: `Uploaded ${label}: ${filename}\n\n${truncated}`,
  };
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const pdfParse = await getPdfParse();
  const result = await pdfParse(Buffer.from(bytes));
  return normalizeExtractedText(result?.text || "");
}

async function convertFilePartToOptimizedPart(part: any): Promise<any> {
  if (part?.type !== "file") {
    return part;
  }

  const mediaType = getAttachmentMediaType(part);
  const filename =
    typeof part?.filename === "string" && part.filename.trim()
      ? part.filename.trim()
      : "attachment";

  if (SUPPORTED_IMAGE_MEDIA_TYPES.has(mediaType)) {
    return part;
  }

  if (SUPPORTED_TEXT_DOCUMENT_MEDIA_TYPES.has(mediaType)) {
    const bytes = getFilePartBytes(part);
    if (!bytes) {
      return part;
    }

    const extractedText = new TextDecoder().decode(bytes);
    return buildExtractedDocumentTextPart(filename, "document", extractedText);
  }

  if (mediaType === "application/pdf") {
    const bytes = getFilePartBytes(part);
    if (!bytes) {
      return part;
    }

    try {
      const extractedText = await extractPdfText(bytes);
      if (extractedText.length >= MIN_PDF_TEXT_EXTRACTION_LENGTH) {
        return buildExtractedDocumentTextPart(filename, "PDF", extractedText);
      }
    } catch (error) {
      console.warn("[TIE AI Teacher] Failed to extract PDF text locally, using multimodal fallback:", error);
    }
  }

  return part;
}

function normalizeFilePartData(part: any) {
  if (part?.type !== "file" || typeof part?.data !== "string") {
    return part;
  }

  if (!part.data.startsWith("data:")) {
    return part;
  }

  const decoded = decodeDataUrl(part.data);
  if (!decoded) {
    return part;
  }

  return {
    ...part,
    mediaType: getAttachmentMediaType(part) || decoded.mediaType,
    data: decoded.data,
  };
}

async function normalizeModelMessages(messages: any[]): Promise<any[]> {
  return Promise.all(
    messages.map(async (message: any) => {
      if (!Array.isArray(message?.content)) {
        return message;
      }

      const normalizedContent = await Promise.all(
        message.content.map(async (part: any) => {
          const normalizedPart = normalizeFilePartData(part);
          if (message.role !== "user") {
            return normalizedPart;
          }

          return convertFilePartToOptimizedPart(normalizedPart);
        }),
      );

      return {
        ...message,
        content: normalizedContent,
      };
    }),
  );
}

export async function convertChatMessagesToModel(messages: any[]): Promise<any[]> {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  if (!messages.some(isUIMessageFormat)) {
    return messages;
  }

  try {
    const modelMessages = await convertToModelMessages(messages as any);
    return await normalizeModelMessages(modelMessages);
  } catch (error) {
    console.warn("[TIE AI Teacher] Failed to convert UI messages, falling back to original messages:", error);
    return messages;
  }
}

export function getDecisionText(message: any): string {
  if (!message) return "";

  if (Array.isArray(message.parts)) {
    const textOnly = extractOnlyTextFromParts(message.parts);
    if (textOnly) return textOnly;
  }

  if (typeof message.content === "string") {
    return message.content;
  }

  return "";
}

export function hasFileAttachments(message: any): boolean {
  return Array.isArray(message?.parts)
    ? message.parts.some((part: any) => part?.type === "file")
    : false;
}

function estimateDataUrlBytes(url: string): number | null {
  if (typeof url !== "string" || !url.startsWith("data:")) return null;

  const commaIndex = url.indexOf(",");
  if (commaIndex === -1) return null;

  const metadata = url.slice(5, commaIndex);
  const data = url.slice(commaIndex + 1);

  if (metadata.includes(";base64")) {
    const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
    return Math.max(0, Math.floor((data.length * 3) / 4) - padding);
  }

  try {
    return decodeURIComponent(data).length;
  } catch {
    return null;
  }
}

export function validateMessageAttachments(
  messages: any[],
  options: {
    maxImageBytes: number;
    maxPdfBytes: number;
    maxTextDocumentBytes: number;
    maxFilesPerMessage: number;
  },
) {
  for (const message of messages) {
    if (!Array.isArray(message?.parts)) continue;

    const fileParts = message.parts.filter((part: any) => part?.type === "file");
    if (fileParts.length > options.maxFilesPerMessage) {
      throw createError({
        statusCode: 400,
        message: `You can attach up to ${options.maxFilesPerMessage} files in a single message.`,
      });
    }

    for (const part of fileParts) {
      const mediaType = getAttachmentMediaType(part);
      const isImage = SUPPORTED_IMAGE_MEDIA_TYPES.has(mediaType);
      const isPdf = mediaType === "application/pdf";
      const isTextDocument = SUPPORTED_TEXT_DOCUMENT_MEDIA_TYPES.has(mediaType);

      if (!SUPPORTED_ATTACHMENT_MEDIA_TYPES.has(mediaType)) {
        throw createError({
          statusCode: 400,
          message: "Only PDF, TXT, MD, JSON, JPG, PNG, and WEBP files are supported.",
        });
      }

      const byteSize = estimateDataUrlBytes(part?.url || part?.data);
      if (byteSize == null) continue;

      if (isImage && byteSize > options.maxImageBytes) {
        throw createError({
          statusCode: 400,
          message: "Each image must be 5MB or smaller.",
        });
      }

      if (isPdf && byteSize > options.maxPdfBytes) {
        throw createError({
          statusCode: 400,
          message: "Each PDF must be 10MB or smaller.",
        });
      }

      if (isTextDocument && byteSize > options.maxTextDocumentBytes) {
        throw createError({
          statusCode: 400,
          message: "Each text document must be 1MB or smaller.",
        });
      }
    }
  }
}
