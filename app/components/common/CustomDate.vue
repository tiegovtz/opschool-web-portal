<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { CustomDropDownList } from "#components";
defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Select date & time",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = ref(false);
const panelRef = ref<HTMLElement | null>(null);

const pad2 = (value: number) => value.toString().padStart(2, "0");
const toDateValue = (value: string) => (value ? new Date(value) : null);

const hourOptions = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  name: pad2(index),
}));

const minuteOptions = Array.from({ length: 60 }, (_, index) => ({
  id: index,
  name: pad2(index),
}));

const formatDisplay = (value: string) => {
  const date = toDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toLocalInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const activeDate = computed(() => {
  const parsed = toDateValue(props.modelValue);
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
});

const viewMonth = ref(activeDate.value?.getMonth() ?? new Date().getMonth());
const viewYear = ref(activeDate.value?.getFullYear() ?? new Date().getFullYear());

watch(
  () => props.modelValue,
  (value) => {
    const date = toDateValue(value);
    if (date && !Number.isNaN(date.getTime())) {
      viewMonth.value = date.getMonth();
      viewYear.value = date.getFullYear();
    }
  }
);

const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear.value, viewMonth.value, 0).getDate();

  const cells: Array<{ date: Date; currentMonth: boolean }> = [];

  for (let i = startDay - 1; i >= 0; i -= 1) {
    cells.push({
      date: new Date(viewYear.value, viewMonth.value - 1, daysInPrevMonth - i),
      currentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(viewYear.value, viewMonth.value, day),
      currentMonth: true,
    });
  }

  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day += 1) {
    cells.push({
      date: new Date(viewYear.value, viewMonth.value + 1, day),
      currentMonth: false,
    });
  }

  return cells;
});

const selectedHour = computed(() => activeDate.value?.getHours() ?? 0);
const selectedMinute = computed(() => activeDate.value?.getMinutes() ?? 0);

const hourModel = computed({
  get: () => selectedHour.value,
  set: (value: number) => {
    setTime(value, selectedMinute.value);
  },
});

const minuteModel = computed({
  get: () => selectedMinute.value,
  set: (value: number) => {
    setTime(selectedHour.value, value);
  },
});

const setDate = (date: Date) => {
  const base = activeDate.value ? new Date(activeDate.value) : new Date();
  base.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  emit("update:modelValue", toLocalInputValue(base));
};

const setTime = (hour: number, minute: number) => {
  const base = activeDate.value ? new Date(activeDate.value) : new Date();
  base.setHours(hour, minute, 0, 0);
  emit("update:modelValue", toLocalInputValue(base));
};

const incrementMonth = (delta: number) => {
  const next = new Date(viewYear.value, viewMonth.value + delta, 1);
  viewMonth.value = next.getMonth();
  viewYear.value = next.getFullYear();
};

const clearValue = () => {
  emit("update:modelValue", "");
};

const toggleOpen = () => {
  if (!props.disabled) isOpen.value = !isOpen.value;
};

const handleClickOutside = (event: MouseEvent) => {
  if (panelRef.value && !panelRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="panelRef" class="relative" v-bind="$attrs">
    <button
      type="button"
      class="group flex w-full items-center justify-between gap-3 rounded-md border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50 p-2 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30"
      :class="disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-primary/60'"
      @click="toggleOpen"
    >
      <span class="flex items-center gap-3">
        <span class="grid h-6 w-6 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon name="mdi:calendar-clock" size="18" />
        </span>
        <span class="flex flex-col">
        <span :class="['text-xs font-semibold', modelValue ? 'text-gray-500' : 'text-gray-300']">
          {{ formatDisplay(modelValue) || placeholder }}
        </span>
        </span>
      </span>
      <Icon name="formkit:down" class="h-4 w-4 text-gray-400 transition group-hover:text-primary" />
    </button>

    <div
      v-if="isOpen"
      class="absolute z-30 mt-2 w-full min-w-[280px] max-h-[275px] overflow-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl flex gap-3"
    >
    <div class="w-[75%]">
      <div class="flex items-center justify-between">
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-500 hover:border-primary hover:text-primary"
          @click="incrementMonth(-1)"
        >
          Prev
        </button>
        <div class="text-sm font-semibold text-primary">
          {{ new Date(viewYear, viewMonth, 1).toLocaleString(undefined, { month: "long", year: "numeric" }) }}
        </div>
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-500 hover:border-primary hover:text-primary"
          @click="incrementMonth(1)"
        >
          Next
        </button>
      </div>

      <div class="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-400">
        <span v-for="day in daysOfWeek" :key="day">{{ day }}</span>
      </div>

      <div class="mt-2 grid grid-cols-7 gap-2 text-center">
        <button
          v-for="cell in calendarDays"
          :key="cell.date.toISOString()"
          type="button"
          class="h-9 rounded-lg text-sm transition"
          :class="[
            cell.currentMonth ? 'text-gray-700' : 'text-gray-300',
            activeDate && cell.date.toDateString() === activeDate.toDateString()
              ? 'bg-primary text-white'
              : 'hover:bg-primary/10',
          ]"
          @click="setDate(cell.date)"
        >
          {{ cell.date.getDate() }}
        </button>
      </div>

    </div>

      <div class="mt-4 flex flex-col items-center justify-center gap-2 border-l border-gray-200 bg-primary/5 px-6 py-2 w-[25%]">
        <span class="w-full text-xs font-semibold text-primary">HH</span>
        <CustomDropDownList
          v-model="hourModel"
          class="w-full min-w-14 rounded-lg text-sm p-1 focus:border-primary hover:border-primary transition ease-in-out duration-500"
          :list="hourOptions"
          placeholder="HH"
        />

        <span class="w-full text-xs font-semibold text-primary">MM</span>
        <CustomDropDownList
          v-model="minuteModel"
          class="w-full min-w-14 rounded-lg text-sm p-1 hover:border-primary transition ease-in-out duration-500"
          :list="minuteOptions"
          placeholder="MM"
        />
        <button
          v-if="clearable && modelValue && !disabled"
          type="button"
          class="rounded-md min-w-14 w-full border border-primary px-2 py-1 text-xs font-semibold text-primary transition hover:border-primary hover:text-primary"
          @click.stop="clearValue"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</template>
