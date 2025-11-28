<script setup>
import { reactive, watch, computed } from "vue";
import { CustomDropDownList } from "#components";
import axios from "axios";

const props = defineProps({
  region: String,
  district: String,
  error: String,
});

const data = reactive({
  district: [],
  status: "idle", // idle | pending | success | error
  error: null,
});

const emit = defineEmits(["updateDistrict"]);

const districtValue = computed({
  get: () => props.district,
  set: (value) => emit("updateDistrict", value),
});

const fetchDistricts = async (region) => {
  data.status = "pending";
  data.error = null;
  data.district = [];

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

watch(
  () => props.region,
  (region) => {
    // reset selected district when region changes
    emit("updateDistrict", "");
    if (region) {
      fetchDistricts(region);
    } else {
      data.status = "idle";
      data.district = [];
      data.error = null;
    }
  },
  { immediate: true }
);

const districtOptions = computed(() =>
  data.district.map((d) => ({ id: d, name: d }))
);

const isDisabled = computed(
  () =>
    !props.region ||
    data.status === "pending" ||
    data.status === "error" ||
    !districtOptions.value.length
);
</script>

<template>
  <div class="flex flex-col items-start w-full">
    <label for="district" class="font-semibold capitalize text-oceanBlue text-extraSmall">Select District:</label>

    <CustomDropDownList id="district" v-if="data.status === 'success'"
      :aria-invalid="Boolean(props.error || data.error)"
      :disabled="!props.region || data.status === 'pending' || data.status === 'error'"
      :list="data.district.map((district) => ({ id: district, name: district }))" :placeholder="'Select a District'"
      :modelValue="props.district" @updateModelValue="(value) => emit('updateDistrict', value)" />

    <p v-else-if="data.status === 'pending'" class="text-sm text-gray-400">Loading districts...</p>
    <p v-else-if="data.status === 'error'" class="text-sm text-red-500">
      {{ data.error }}
    </p>
    <p v-else class="text-sm text-gray-400">Select a region first.</p>

    <!-- Validation error from parent -->
    <small v-if="error" id="district-error" class="w-full mt-1 text-red-500 text-smallest" role="alert">
      {{ error }}
    </small>
  </div>
</template>