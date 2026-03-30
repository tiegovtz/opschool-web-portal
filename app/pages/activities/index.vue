<script setup lang="ts">
import { Button } from "~/components/ui/button";
import { ActivityType } from "~/types/activity-types";
import apiDocs from "~/utilities/apiDocs";
import {
  activityAuthHeaders,
  extractActivitiesFromPayload,
  normalizeActivity,
} from "~/utilities/activitiesApi";

type ActivityPreview = {
  id: number | string;
  activityName: string;
  description: string;
  activityDescription: string;
  subTopic: string;
};

type ActivityByTypeItem = {
  type: string;
  activity: ActivityPreview;
};

type ActivitiesByTypeResponse = {
  success: boolean;
  totalActivities: number;
  totalTypes: number;
  matchedTypes: number;
  missingTypes: string[];
  items: ActivityByTypeItem[];
};

const searchTerm = ref("");

const {
  data: rawActivities,
  pending,
  error,
  refresh,
} = await useFetch<unknown>(apiDocs.activities.getActivities, {
  headers: activityAuthHeaders(),
  key: "activities-one-per-type",
  default: () => [],
});

definePageMeta({
  middleware: "auth",
})

function buildActivitiesByTypeResponse(
  activities: Array<NonNullable<ReturnType<typeof normalizeActivity>>>,
): ActivitiesByTypeResponse {
  const byType = new Map<string, ActivityByTypeItem>();

  activities.forEach((activity) => {
    const type = String(activity.description || "").trim();
    if (!type || byType.has(type)) return;

    byType.set(type, {
      type,
      activity: {
        id: activity.activityId || activity.id,
        activityName: activity.activityName,
        description: type,
        activityDescription: activity.activityDescription,
        subTopic: activity.subTopic,
      },
    });
  });

  const knownTypes = Object.values(ActivityType);
  const matchedTypeSet = new Set(byType.keys());
  const orderedItems = [
    ...knownTypes
      .map((type) => byType.get(type))
      .filter((item): item is ActivityByTypeItem => Boolean(item)),
    ...Array.from(byType.entries())
      .filter(
        ([type]) =>
          !matchedTypeSet.has(type) ||
          !knownTypes.includes(type as ActivityType),
      )
      .map(([, item]) => item),
  ];

  return {
    success: true,
    totalActivities: activities.length,
    totalTypes: knownTypes.length,
    matchedTypes: byType.size,
    missingTypes: knownTypes.filter((type) => !matchedTypeSet.has(type)),
    items: orderedItems,
  };
}

const data = computed<ActivitiesByTypeResponse>(() => {
  const normalizedActivities = extractActivitiesFromPayload(
    rawActivities.value as any,
  )
    .map((activity) => normalizeActivity(activity))
    .filter(
      (
        activity,
      ): activity is NonNullable<ReturnType<typeof normalizeActivity>> =>
        activity !== null,
    );

  return buildActivitiesByTypeResponse(normalizedActivities);
});

const items = computed(() => data.value?.items ?? []);

const filteredItems = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase();
  if (!keyword) return items.value;

  return items.value.filter((item) => {
    const values = [
      item.type,
      item.activity?.activityName,
      item.activity?.activityDescription,
      item.activity?.subTopic,
      String(item.activity?.id ?? ""),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return values.includes(keyword);
  });
});

const openActivityPage = (item: ActivityByTypeItem) => {
  navigateTo(`/activities/${encodeURIComponent(String(item.activity.id))}`);
};
</script>

<template>
  <div class="min-h-screen bg-sky-100">
    <div
      class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-6 md:py-10"
    >
      <section
        class="rounded-[1.5rem] border border-oceanBlue/10 bg-white/90 p-5 shadow-[0_24px_80px_-48px_rgba(1,61,96,0.55)] backdrop-blur sm:rounded-[2rem] sm:p-6 md:p-8"
      >
        <div
          class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div class="max-w-3xl space-y-3">
            <p
              class="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600"
            >
              Activities Test Page
            </p>
            <h1
              class="text-3xl font-black tracking-tight text-oceanBlue md:text-5xl"
            >
              Preview One Activity Per Type
            </h1>
            <p class="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              This page pulls activities from the external
              <code>/v1/activities</code> endpoint, normalizes the new payload
              shape, and opens the selected activity in a popup renderer.
            </p>
          </div>

          <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <input
              v-model="searchTerm"
              type="search"
              placeholder="Search by type, activity name, or id"
              class="h-11 min-w-0 flex-1 rounded-2xl border border-oceanBlue/15 bg-sky-50 px-4 text-sm text-slate-700 outline-none ring-0 transition focus:border-oceanBlue/35 sm:w-[320px]"
            />
            <Button
              variant="outline-brand"
              @click="refresh()"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div class="mt-7 grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl bg-sky-50 p-4">
            <p
              class="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"
            >
              Matched Types
            </p>
            <p class="mt-2 text-3xl font-black text-oceanBlue">
              {{ data?.matchedTypes ?? 0 }}
            </p>
          </div>
          <div class="rounded-2xl bg-amber-50 p-4">
            <p
              class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700"
            >
              Missing Types
            </p>
            <p class="mt-2 text-3xl font-black text-oceanBlue">
              {{ data?.missingTypes?.length ?? 0 }}
            </p>
          </div>
          <div class="rounded-2xl bg-emerald-50 p-4">
            <p
              class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700"
            >
              Visible Cards
            </p>
            <p class="mt-2 text-3xl font-black text-oceanBlue">
              {{ filteredItems.length }}
            </p>
          </div>
        </div>
      </section>

      <section
        v-if="pending"
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="index in 6"
          :key="index"
          class="min-h-[210px] animate-pulse rounded-[1.5rem] border border-oceanBlue/10 bg-white"
        />
      </section>

      <section
        v-else-if="error"
        class="rounded-[1.75rem] border border-red-200 bg-red-50 p-6 text-red-700"
      >
        <p class="text-lg font-semibold">Unable to load activity test data.</p>
        <p class="mt-2 text-sm">{{ error.message }}</p>
      </section>

      <section
        v-else
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <button
          v-for="item in filteredItems"
          :key="`${item.type}-${item.activity.id}`"
          type="button"
          class="group flex min-h-[220px] h-full flex-col rounded-[1.5rem] border border-oceanBlue/10 bg-white p-5 text-left shadow-[0_20px_70px_-52px_rgba(1,61,96,0.7)] transition duration-200 hover:-translate-y-1 hover:border-oceanBlue/25 hover:shadow-[0_28px_80px_-46px_rgba(1,61,96,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/35"
          @click="openActivityPage(item)"
        >
          <div class="flex items-start justify-between gap-4">
            <span
              class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700"
            >
              {{ item.type }}
            </span>
            <span
              class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              #{{ item.activity.id }}
            </span>
          </div>

          <div class="mt-5 flex-1 space-y-3">
            <h2 class="text-xl font-black leading-tight text-oceanBlue">
              {{ item.activity.activityName }}
            </h2>
            <p
              class="line-clamp-3 text-sm leading-6 text-slate-600"
              v-html="
                item.activity.activityDescription ||
                `No activity description available.`
              "
            ></p>
          </div>

          <div
            class="mt-auto flex items-center justify-between border-t border-slate-100 pt-4"
          >
            <p class="max-w-[70%] truncate text-sm font-medium text-slate-500">
              {{ item.activity.subTopic || "No sub-topic" }}
            </p>
            <span
              class="text-sm font-semibold text-oceanBlue transition group-hover:translate-x-1"
            >
              Open
            </span>
          </div>
        </button>
      </section>
    </div>
  </div>
</template>
