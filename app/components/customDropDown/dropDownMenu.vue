<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue";
import debounce from "lodash/debounce";
import apiDocs from "~/utilities/apiDocs";
import type { educationLevel } from "~/types/educationlevel.interface";
import type { ClassLevel } from "~/types/classlevel.interface";
import type { Subjects } from "~/types/subject.interface";

// Auth headers
const token = useCookie("signInAccessToken").value;
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

// Loading state
const isLoading = ref(true);

// Server data
const { data: educationLevels } = useFetch<educationLevel[]>(apiDocs.educationLevel.getEducationLevels, { headers });
const { data: classes } = useFetch<ClassLevel[]>(apiDocs.levels.getLevels, { headers });
const { data: subjects } = useFetch<Subjects[]>(apiDocs.subjects.getPublicSubjects, { headers });

// Simulate skeleton time
setTimeout(() => (isLoading.value = false), 500);

// Dropdown open status
const openMenus = ref<number[]>([0]);

// Model
const selected = reactive({
  level: "",
  class: "",
  subject: "",
});

const liveMessage = ref("");

// Emits
const emit = defineEmits(["emitUpdateFilterValue"]);

// Props
const props = defineProps({
  activeTab: String,
});

// Reset all filters
const resetFilters = async () => {
  selected.level = "";
  selected.class = "";
  selected.subject = "";
  await nextTick();
  liveMessage.value = "All filters reset.";
  emitUpdate();
};

// Level select
const selectLevel = async (name: string) => {
  selected.level = name;
  selected.class = "";
  selected.subject = "";
  await nextTick();
  liveMessage.value = `Level selected: ${name}`;
  emitUpdate();
};

// Class select
const selectClass = async (name: string) => {
  selected.class = name;
  selected.subject = "";
  await nextTick();
  liveMessage.value = `Class selected: ${name}`;
  emitUpdate();
};

// Subject select
const selectSubject = async (name: string) => {
  selected.subject = name;
  await nextTick();
  liveMessage.value = `Subject selected: ${name}`;
  emitUpdate();
};

// Emit formatted API object
const emitUpdate = debounce(() => {
  const q: Record<string, any> = {};

  if (selected.level) q.educationLevel = selected.level.toLowerCase();
  if (selected.class) q.level = selected.class.toLowerCase();
  if (selected.subject) q.subject = selected.subject.toLowerCase();

  emit("emitUpdateFilterValue", q);
}, 100);

// Build available filters
const filterGroups = computed(() => {
  if (isLoading.value) return [];

  const groups: any[] = [];

  // Level
  if (educationLevels.value?.length) {
    groups.push({
      name: "level",
      inputType: "radio",
      items: educationLevels.value.map((lvl) => lvl.name),
    });
  }

  // Class
  if (classes.value?.length && selected.level?.trim() !== '') {
    groups.push({
      name: "class",
      inputType: "radio",
      items: classes.value
        .filter((cls) => {
          const lvl = (cls as any).educationLevel?.name;
          return lvl?.toLowerCase() === selected.level?.toLowerCase();
        })
        .map((cls) => cls.name),
    });
  }

  // Subject
  if (subjects.value && props.activeTab?.toLowerCase() !== "home" && selected.class?.trim() !== "") {
    groups.push({
      name: "subject",
      inputType: "radio",
      items: subjects.value.map((s: Subjects) => s.name),
    });
  }

  return groups;
});

// Open all visible groups on tab change or level change compare old and new
watch(
  [() => props.activeTab, () => selected.level],
  ([newTab, newLevel], [oldTab, oldLevel]) => {
    openMenus.value = filterGroups.value.map((_, i) => i);

    if (newTab !== oldTab) {
      resetFilters();
    }
  }
);

</script>
<template>
  <!-- Loading State -->
  <div v-if="isLoading" role="status" aria-live="polite" aria-busy="true">
    <p class="text-gray-400 animate-pulse">Loading filters…</p>
  </div>

  <!-- Filters Form -->
  <form v-else class="flex flex-col w-full bg-white divide-y rounded-md" @reset="resetFilters"
    aria-label="Content filters" role="search">
    <span class="sr-only" aria-live="polite" aria-atomic="true">{{ liveMessage }}</span>
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-gray-50 border-b">
      <h2 id="filter-heading" class="font-bold text-gray-700">
        Filter
      </h2>

      <button type="reset" aria-label="Reset all filters"
        class="px-3 py-1 text-sm border border-oceanBlue text-oceanBlue rounded-md transition hover:bg-oceanBlue hover:text-white">
        Reset
      </button>
    </div>

    <!-- Filter Groups -->
    <div v-for="(group, i) in filterGroups" :key="group.name" class="p-4" role="region"
      :aria-labelledby="`filter-group-${i}`">
      
      <!-- Accordion Header -->
      <button type="button" class="flex items-center justify-between w-full text-left" :id="`filter-group-${i}`"
        :aria-expanded="openMenus.includes(i)" :aria-controls="`filter-panel-${i}`" @click="() => {
          const pos = openMenus.indexOf(i);
          pos > -1 ? openMenus.splice(pos, 1) : openMenus.push(i);
        }">
        <h3 class="capitalize font-semibold">
          {{ group.name }}
        </h3>

        <Icon :name="openMenus.includes(i)
          ? 'lets-icons:remove-duotone'
          : 'lets-icons:add-duotone'" class="text-oceanBlue" aria-hidden="true" />
      </button>

      <!-- Options Panel -->
      <transition name="fade">
        <div v-if="openMenus.includes(i)" :id="`filter-panel-${i}`" class="mt-3 ml-2 space-y-2" role="group"
          :aria-labelledby="`filter-group-${i}`">
          <label v-for="item in group.items" :key="item" class="flex items-center gap-2">
            <input :type="group.inputType" :name="group.name" :value="item"
              :checked="selected[group.name as keyof typeof selected] === item" @change="
                group.name === 'level'
                  ? selectLevel(item)
                  : group.name === 'class'
                    ? selectClass(item)
                    : selectSubject(item)
                " />
            <span>{{ item }}</span>
          </label>
        </div>
      </transition>

      <!-- <transition name="fade">
        <div v-if="openMenus.includes(i)" :id="`filter-panel-${i}`" class="mt-3 ml-2" role="group"
          :aria-labelledby="`filter-group-${i}`">
          <ul class="space-y-2" role="list">
            <li v-for="item in group.items" :key="item" role="listitem">
              <label class="flex items-center gap-2 cursor-pointer">
                <input :type="group.inputType" :name="group.name" :value="item"
                  :checked="selected[group.name as keyof typeof selected] === item" @change="
                    group.name === 'level'
                      ? selectLevel(item)
                      : group.name === 'class'
                        ? selectClass(item)
                        : selectSubject(item)
                    " />
                <span>{{ item }}</span>
              </label>
            </li>
          </ul>
        </div>
      </transition> -->

    </div>
  </form>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
