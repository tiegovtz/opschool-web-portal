<script setup lang="ts">
import { CustomDropDownList } from "#components";
import { reactive, ref, watch } from "vue";
import apiDocs from "~/utilities/apiDocs";

const props = defineProps({
  region: String,
  district: String,
  error: String,   // validation error from parent
  school: String,  // currently selected school id (optional)
});

const data = reactive<{ schools: any[], status: 'idle' | 'pending' | 'success' | 'error', error: any }>({
  schools: [],
  status: "idle",  // 'idle' | 'pending' | 'success' | 'error'
  error: null,
});

const emit = defineEmits(["updateSchool"]);

// local v-model for dropdown
const selectedSchool = ref<string | null | any>(props.school ?? null);

// Emit to parent whenever dropdown changes
watch(selectedSchool, (val) => {
  emit("updateSchool", val);
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
      Select school:
    </label>

    <!-- Accessible dropdown -->
    <CustomDropDownList v-if="data.status === 'success' && data.schools.length" id="school" v-model="selectedSchool"
      :list="data.schools.map((school) => ({ id: school._id, name: school.name }))" placeholder="Choose a school"
      :aria-invalid="!!error" aria-describedby="school-error" />

    <!-- Status / helper messages (live region) -->
    <div v-else class="mt-2 text-textGray/40" role="status" aria-live="polite">
      <span v-if="data.status === 'idle'">
        Select region and district first.
      </span>
      <span v-else-if="data.status === 'pending'">
        Loading schools…
      </span>
      <span v-else-if="data.status === 'error'" class="text-red-500">
        {{ data.error }}
      </span>
      <span v-else-if="data.status === 'success' && !data.schools.length">
        No schools found for the selected region and district.
      </span>
    </div>

    <!-- Validation error from parent -->
    <small v-if="error" id="school-error" class="w-full mt-1 text-red-500 text-smallest" role="alert">
      {{ error }}
    </small>
  </div>
</template>