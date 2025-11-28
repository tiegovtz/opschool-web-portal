<script setup>
import { CustomDropDownList } from "#components";
import axios from "axios";

// Props
const props = defineProps({
  region: String,
  district: String,
  error: String,
});

// Reactive state
const data = reactive({
  district: [],
  status: "idle",
  error: null,
});

// Emits
const emit = defineEmits(["updateDistrict"]);

// Fetch district function
const fetchDistricts = async (region) => {
  data.status = "pending";
  data.error = null;

  try {
    const response = await axios.get(
      `https://opschool.tie.go.tz:5001/v1/schools/districts/${String(
        region
      ).toUpperCase()}`
    );

    data.status = "success";
    data.district = response.data;
  } catch (err) {
    data.status = "error";
    data.error = err.message;
  }
};

// Watch for changes in region or district
watch(
  () => props.region,
  (region) => {
    if (region) {
      fetchDistricts(region);
    }
  }
);
</script>

<template>
  <div class="flex flex-col items-start w-full">
    <label for="district" class="font-semibold capitalize text-oceanBlue text-extraSmall">Select District:</label>

    <CustomDropDownList v-if="data.status === 'success'" :list="data.district.map((district) => ({ id: district, name: district }))
      " :placeholder="'Select a District'" :modelValue="props.district"
      @updateModelValue="(value) => emit('updateDistrict', value)" />

    <p v-else-if="data.status === 'pending'" class="text-sm text-gray-400">Loading districts...</p>
    <p v-else-if="data.status === 'error'" class="text-sm text-red-500">
      {{ data.error }}
    </p>
    <p v-else class="text-sm text-gray-400">Select a region first.</p>

    <!-- Error message -->
    <small v-if="error" class="w-full text-red-500 text-smallest">
      {{ error }}
    </small>
  </div>
</template>