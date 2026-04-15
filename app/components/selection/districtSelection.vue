<script setup lang="ts">
import { reactive, watch, computed, type PropType } from "vue";
import { CustomDropDownList } from "#components";
import apiDocs from "~/utilities/apiDocs";
import type { LanguageSupport } from "~/types/language.interface";

const props = defineProps({
  region: String,
  district: String,
  error: String,
  language: {
    type: String as PropType<LanguageSupport>,
    default: "english",
  },
});

type statusType = "idle" | "pending" | "success" | "error";

const data = reactive<{ district: any[], status: statusType, error: any }>({
  district: [],
  status: "idle",
  error: null,
});

const emit = defineEmits(["updateDistrict"]);

const isSwahili = computed(() => props.language === "kiswahili");
const content = computed(() => ({
  label: isSwahili.value ? "Chagua wilaya:" : "Select district:",
  selectRegionFirst: isSwahili.value ? "Chagua mkoa kwanza" : "Select a region first",
  loading: isSwahili.value ? "Inapakia wilaya…" : "Loading districts…",
  selectDistrict: isSwahili.value ? "Chagua wilaya" : "Select a district",
}));

const districtValue = computed({
  get: () => props.district,
  set: (value) => {
    emit("updateDistrict", value);
  }
});

const fetchDistricts = async (region: string) => {
  data.status = "pending";
  data.error = null;
  data.district = [];

  try {
    const response = await $fetch<any[]>(apiDocs.school.getSchoolDistricts(region));

    data.status = "success";
    data.district = response;
  } catch (err) {
    data.status = "error";
    data.error = (err as any).message;
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
    <label for="district-select" class="font-semibold capitalize text-oceanBlue text-extraSmall">
      {{ content.label }}
    </label>

    <CustomDropDownList id="district-select" v-model="districtValue" :list="districtOptions"
      @update-model-value="emit('updateDistrict', $event);" aria-describedby="district-status district-error"
      :placeholder="!props.region
        ? content.selectRegionFirst
        : data.status === 'pending'
          ? content.loading
          : content.selectDistrict
        " :disabled="isDisabled" :aria-invalid="!!error" />

    <!-- Status / helper text -->
    <!-- <div id="district-status" class="w-full mt-1" aria-live="polite">
      <p v-if="data.status === 'pending'" class="text-sm text-gray-400" role="status">
        Loading districts…
      </p>
      <p v-else-if="data.status === 'error'" class="text-sm text-red-500" role="alert">
        {{ data.error || "Unable to load districts. Please try again." }}
      </p>
      <p v-else-if="!props.region" class="text-sm text-gray-400">
        Select a region first.
      </p>
    </div> -->

    <!-- Validation error from parent -->
    <small v-if="error" id="district-error" class="w-full mt-1 text-red-500 text-smallest" role="alert">
      {{ error }}
    </small>
  </div>
</template>
