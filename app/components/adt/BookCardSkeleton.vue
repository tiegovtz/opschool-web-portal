<template>
  <div class="adt-book-skeleton relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div class="h-56 bg-slate-200/70" />
    <div class="flex flex-1 flex-col gap-3 p-5">
      <div class="w-20 rounded bg-slate-200 text-xs">&nbsp;</div>
      <div class="w-4/5 rounded bg-slate-200 text-lg leading-snug">&nbsp;</div>
      <div class="w-1/2 rounded bg-slate-100 text-sm">&nbsp;</div>
      <div class="flex flex-wrap gap-2 text-xs">
        <div class="w-16 rounded-md bg-slate-100 px-2 py-1">&nbsp;</div>
        <div class="w-20 rounded-md bg-slate-100 px-2 py-1">&nbsp;</div>
      </div>
      <div class="mt-auto inline-flex w-full items-center justify-center rounded-xl bg-sky-100 px-4 py-3 text-sm">
        <span class="h-5">&nbsp;</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.adt-book-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(100deg, transparent 20%, rgb(255 255 255 / 65%) 50%, transparent 80%);
  transform: translateX(-100%);
  animation: adt-shimmer 1.6s ease-in-out infinite;
}
@keyframes adt-shimmer {
  to { transform: translateX(100%); }
}
@media (prefers-reduced-motion: reduce) {
  .adt-book-skeleton::after { animation: none; display: none; }
}
</style>
