<script setup lang="ts">
import type { SupportTicket } from '../../../shared/support/contracts';
import { supportStatusTone } from '~/utilities/supportPresentation';
defineProps<{ status: SupportTicket['status']; label: string }>();
</script>
<template>
  <span :class="supportStatusTone[status]" class="inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-sm font-semibold">{{ label }}</span>
</template>
