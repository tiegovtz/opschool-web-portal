<script setup lang="ts">
import { CustomDropDownList } from "#components";
import { reactive, ref, watch, computed, type PropType } from "vue";
import apiDocs from "~/utilities/apiDocs";
import type { LanguageSupport } from "~/types/language.interface";

const props = defineProps({
  region: String,
  district: String,
  error: String,   // validation error from parent
  school: String,  // currently selected school id (optional)
  language: {
    type: String as PropType<LanguageSupport>,
    default: "english",
  },
});

type statusType = "idle" | "pending" | "success" | "error";

const data = reactive<{ schools: any[], status: statusType, error: any }>({
  schools: [],
  status: "idle",
  error: null,
});

const emit = defineEmits(["updateSchool"]);

const isSwahili = computed(() => props.language === "kiswahili");
const content = computed(() => ({
  label: isSwahili.value ? "Chagua shule:" : "Select school:",
  placeholder: isSwahili.value ? "Chagua shule" : "Choose a school",
  selectRegionAndDistrictFirst: isSwahili.value
    ? "Chagua mkoa na wilaya kwanza."
    : "Select region and district first.",
  loading: isSwahili.value ? "Inapakia shule…" : "Loading schools…",
  empty: isSwahili.value
    ? "Hakuna shule zilizopatikana kwa mkoa na wilaya uliyochagua."
    : "No schools found for the selected region and district.",
}));

// local v-model for dropdown
const selectedSchool = ref<string | null | any>(props.school ?? null);

// Emit to parent whenever dropdown changes
// watch(selectedSchool, (val) => {
//   emit("updateSchool", val);
// });

// watch school prop changes to update local selectedSchool (e.g. when parent resets form)
watch(() => props.school, (newVal) => {
  selectedSchool.value = newVal ?? null;
});

// Fetch schools function
const fetchSchools = async (region: string, district: string) => {
  data.status = "pending";
  data.error = null;

  if (!region || !district || region === "" || district === "") {
    data.status = "idle";
    data.schools = [];
    return;
  }

  try {
    const response = await $fetch<any[]>(apiDocs.school.get,
      {
        query: {
          region,
          district,
        }
      }
    );

    data.status = "success";
    data.schools = response;

    // emit school to make it similar form of uid by taking it label 
    // if passed as label instead of uid
    if (props.school && typeof props.school === "string") {
      const matchedSchool = response.find(school => school._id === props.school || school.name === props.school);
      if (matchedSchool) {
        emit("updateSchool", matchedSchool._id);
      } else {
        // If no match found, reset selection        emit("updateSchool", null);
      }
    }
  } catch (err) {
    data.status = "error";
    data.error = err;
  }
};

// Watch for changes in region or district (School)
watch(
  () => props.district,
  (district) => {
    if (district) {
      fetchSchools(props.region as string, district);
    } else {
      data.status = "idle";
      data.schools = [];
    }
  }
);

watch(
  () => props.region,
  (region) => {
    if (region) {
      fetchSchools(region, props.district as any);
    } else {
      data.status = "idle";
      data.schools = [];
    }
  }
);
</script>

<template>
  <div class="flex flex-col items-start w-full">
    <!-- Label correctly linked to dropdown via id -->
    <label for="school" class="font-semibold capitalize text-oceanBlue text-extraSmall">
      {{ content.label }}
    </label>

    <!-- Accessible dropdown -->
    <CustomDropDownList v-if="data.status === 'success' && data.schools.length" id="school" v-model="selectedSchool"
      :list="data.schools.map((school) => ({ id: school._id, name: school.name }))" :placeholder="content.placeholder"
      :aria-invalid="!!error" aria-describedby="school-error" @update-model-value="emit('updateSchool', $event)" />

    <!-- Status / helper messages (live region) -->
    <div v-else class="mt-2 text-textGray/40" role="status" aria-live="polite">
      <span v-if="data.status === 'idle'">
        {{ content.selectRegionAndDistrictFirst }}
      </span>
      <span v-else-if="data.status === 'pending'">
        {{ content.loading }}
      </span>
      <span v-else-if="data.status === 'error'" class="text-red-500">
        {{ data.error }}
      </span>
      <span v-else-if="data.status === 'success' && !data.schools.length">
        {{ content.empty }}
      </span>
    </div>

    <!-- Validation error from parent -->
    <small v-if="error" id="school-error" class="w-full mt-1 text-red-500 text-smallest" role="alert">
      {{ error }}
    </small>
  </div>
</template>
