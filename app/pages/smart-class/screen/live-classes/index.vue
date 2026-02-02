<template>
  <NuxtLayout :name="$router.currentRoute.value.fullPath.includes('header-less') ? 'normal' :'home-layout'">
    <div
        v-if="dialog"
        class="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-50"
        role="presentation"
        @keydown.escape="dialog = false"
    >
      <div class="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]" role="dialog" aria-modal="true" aria-labelledby="create-session-title">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 id="create-session-title" class="text-xl font-bold text-gray-800">Create Session</h3>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="submit" ref="formRef" class="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800" aria-labelledby="create-session-title">

          <!-- Select Class -->
          <div>
            <label for="form-school-class" class="block mb-1 text-sm font-medium">Select Class</label>
            <CustomDropDownList
                id="form-school-class"
                v-model="formData.school_class"
                placeholder="Select class"
                class="w-full !text-sm border border-gray-300 rounded-md shadow-sm h-14 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                :list="schoolClasses"
                aria-label="Select the school class for this session"
                aria-required="true"
                aria-describedby="class-help"
            />
            <small id="class-help" class="sr-only">This field is required. Choose the class where this live session will be held.</small>
          </div>

          <!-- Select Subject -->
          <div>
            <label for="form-subject" class="block mb-1 text-sm font-medium">Subject</label>
            <CustomDropDownList
                id="form-subject"
                v-model="formData.subject"
                placeholder="Select subject"
                class="w-full !text-sm border border-gray-300 rounded-md shadow-sm h-14 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                :list="schoolSubjects"
                aria-label="Select the subject for this session"
                aria-required="true"
                aria-describedby="subject-help"
            />
            <small id="subject-help" class="sr-only">This field is required. Choose the subject that will be taught in this session.</small>
          </div>

          <!-- Start Time -->
          <div>
            <label for="form-start-time" class="block mb-1 text-sm font-medium">Start Time</label>
            <input
                id="form-start-time"
                type="datetime-local"
                v-model="formData.start_time"
                required
                class="w-full border border-gray-300 rounded-md px-3 py-2 h-14 bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="Select the session start date and time"
                aria-required="true"
                aria-describedby="start-time-help"
            />
            <small id="start-time-help" class="sr-only">This field is required. Enter the date and time when the live session will begin.</small>
          </div>

          <!-- End Time -->
          <div>
            <label for="form-end-time" class="block mb-1 text-sm font-medium">End Time</label>
            <input
                id="form-end-time"
                type="datetime-local"
                v-model="formData.end_time"
                required
                class="w-full border border-gray-300 rounded-md px-3 py-2 h-14 bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="Select the session end date and time"
                aria-required="true"
                aria-describedby="end-time-help"
            />
            <small id="end-time-help" class="sr-only">This field is required. Enter the date and time when the live session will end.</small>
          </div>

          <!-- Topic -->
          <div>
            <label for="form-topic" class="block mb-1 text-sm font-medium">Topic</label>
            <input
                id="form-topic"
                type="text"
                v-model="formData.topic"
                required
                placeholder="Enter topic"
                class="w-full border border-gray-300 rounded-md px-3 py-2 h-14 bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="Enter the session topic or title"
                aria-required="true"
                aria-describedby="topic-help"
            />
            <small id="topic-help" class="sr-only">This field is required. Enter a descriptive title or topic for this session.</small>
          </div>

          <!-- Room Name -->
          <div>
            <label for="form-room-name" class="block mb-1 text-sm font-medium">Room Name</label>
            <input
                id="form-room-name"
                type="text"
                v-model="formData.room_name"
                required
                placeholder="Enter room name"
                class="w-full border border-gray-300 rounded-md px-3 py-2 h-14 bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="Enter the meeting room name or identifier"
                aria-required="true"
                aria-describedby="room-help"
            />
            <small id="room-help" class="sr-only">This field is required. Enter the name of the room where the session will be held.</small>
          </div>

          <!-- Details (full width) -->
          <div class="md:col-span-2">
            <label for="form-details" class="block mb-1 text-sm font-medium">Details</label>
            <input
                id="form-details"
                type="text"
                v-model="formData.details"
                required
                placeholder="Enter details"
                class="w-full border border-gray-300 rounded-md px-3 py-2 h-14 bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="Enter additional session details or description"
                aria-required="true"
                aria-describedby="details-help"
            />
            <small id="details-help" class="sr-only">This field is required. Provide additional information about the session that students should know.</small>
          </div>

        </form>

        <!-- Footer -->
        <div class="px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button
              type="button"
              @click="dialog = false"
              class="px-5 py-2 rounded-md border border-red-500 text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              aria-label="Close dialog without saving"
          >
            Cancel
          </button>
          <button
              type="submit"
              @click="submit"
              class="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
              aria-label="Submit and create the new session"
          >
            Submit
          </button>
        </div>
      </div>
    </div>




    <div id="main-container" tabindex="-1" class="live-classes">
      <!-- Header Section -->
      <div class="header">
        <div class="header-content">
          <h1 class="title">Live Classes</h1>
          <p class="subtitle">Discover amazing live streaming sessions</p>
        </div>
        <div class="header-gradient"></div>
      </div>

      <!-- Filter Section -->
      <div class="filters-section relative z-50" role="region" aria-label="Search and filter controls">
        <div class="p-4">
          <!-- Create Button " -->
          <div v-if="userToken?.roles.includes('TeacherAdmin')" class="flex justify-end mb-4">
            <button @click="onCreate"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
              aria-label="Create new live class session">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create
            </button>
          </div>

          <!-- Filter Section -->
          <div class="flex flex-wrap gap-4 justify-center">
            <!-- Search Field -->
            <div class="w-full md:w-1/3 lg:w-1/4">
              <label for="search-field" class="sr-only">Search classes</label>
              <div class="relative">
                <input
                  id="search-field"
                  type="text"
                  v-model="searchQuery"
                  placeholder="Search classes..."
                  @keyup.enter.prevent="triggerSearch"
                  class="w-full border border-gray-300 rounded-md px-10 py-2 pr-28 focus:outline-none bg-transparent focus:ring-2 focus:ring-blue-500 h-14"
                  aria-label="Search for live classes by title, instructor, or category"
                  aria-describedby="search-help"
                />
                <svg class="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor"
                  stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
                <button
                  type="button"
                  class="absolute inset-y-1 right-1 flex items-center gap-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-md shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  @click="triggerSearch"
                  aria-label="Execute search for live classes"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                  <span>Search</span>
                </button>
              </div>
              <small id="search-help" class="sr-only">Type to filter classes by title, instructor name, or category. Press Enter or click Search to filter.</small>
            </div>

            <!-- Classes Dropdowns -->
            <div class="w-full md:w-1/3 lg:w-1/4">
              <label for="class-filter" class="sr-only">Filter by class</label>
               <CustomDropDownList id="class-filter" v-model="selectedClass" placeholder="Select class" class="w-full !text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="schoolClasses" aria-label="Filter classes by class level" aria-describedby="class-filter-help"/>
               <small id="class-filter-help" class="sr-only">Select a class level to filter displayed sessions, or leave blank to show all classes.</small>
            </div>

            <!-- subject Dropdowns -->
            <div class="w-full md:w-1/3 lg:w-1/4">
              <label for="subject-filter" class="sr-only">Filter by subject</label>
               <CustomDropDownList id="subject-filter" v-model="selectedSubject" placeholder="Select subject" class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="schoolSubjects" aria-label="Filter classes by subject" aria-describedby="subject-filter-help"/>
               <small id="subject-filter-help" class="sr-only">Select a subject to filter displayed sessions, or leave blank to show all subjects.</small>
            </div>

            <!-- Teacher Dropdown
            <div class="w-full md:w-1/3 lg:w-1/4">
               <CustomDropDownList v-model="selectedTeacher" placeholder="Select teacher" class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="teacherOptions"/>
            </div>

            School Dropdown
            <div class="w-full md:w-1/3 lg:w-1/4">
               <CustomDropDownList v-model="selectedSchool" placeholder="Select school" class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="schoolOptions"/>
            </div> -->

            <!-- Session Start Dropdown -->
            <div class="w-full md:w-1/3 lg:w-1/4">
              <label for="session-start-filter" class="sr-only">Filter by session start status</label>
               <CustomDropDownList id="session-start-filter" v-model="selectedSessionStart" placeholder="Session start" class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="sessionStartOptions" aria-label="Filter classes by session start status" aria-describedby="session-start-help"/>
               <small id="session-start-help" class="sr-only">Filter to show started or not-yet-started sessions.</small>
            </div>

            <!-- Session End Dropdown -->
            <div class="w-full md:w-1/3 lg:w-1/4">
              <label for="session-end-filter" class="sr-only">Filter by session end status</label>
               <CustomDropDownList id="session-end-filter" v-model="selectedSessionEnd" placeholder="Session end" class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="sessionEndOptions" aria-label="Filter classes by session end status" aria-describedby="session-end-help"/>
               <small id="session-end-help" class="sr-only">Filter to show ended or ongoing sessions.</small>
            </div>

            <!-- Clear Filters Button -->
            <div class="w-full md:w-auto flex justify-center items-center">
              <button type="button" @click="clearFilters"
                class="px-6 py-3 w-full md:w-auto bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200 transition h-14 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                aria-label="Clear all search and filter settings">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>


      <!-- Classes Grid -->
      <div class="classes-container" role="region" aria-label="Live classes list" aria-live="polite" aria-atomic="false">
        <div class="classes-grid" role="list">
          <div v-for="classItem in filteredClasses" :key="classItem?.id ?? classItem?._id" class="class-card" role="listitem" tabindex="0"
            :aria-label="`${classItem.title} with ${classItem.instructor}, Class: ${classItem.class}, Subject: ${classItem.subject}, ${classItem.isLive ? 'Currently live, ' : ''}${classItem.viewers} viewers. Press Enter or click to view details`"
            @click="selectClass(classItem)"
            @keydown.enter.prevent="selectClass(classItem)"
            @keydown.space.prevent="selectClass(classItem)">
            <div class="card-image">
              <div
                v-if="classItem.thumbnail"
                class="card-image__photo"
                :style="{ backgroundImage: `url(${classItem.thumbnail})` }"
                :aria-label="`thumbnail for ${classItem.title}`"
              ></div>
              <div
                v-else
                class="card-image__pattern"
                :style="{
                  backgroundImage: `${classItem.iconPattern}, ${classItem.gradient}`,
                  backgroundSize: '80px 80px, cover',
                }"
                aria-hidden="true"
              >
                <span class="pattern-icon">{{ classItem.iconSymbol }}</span>
              </div>
              <div class="card-overlay">
                <div class="live-badge" v-if="classItem.isLive">
                  <span class="live-dot"></span>
                  LIVE
                </div>
                <div class="duration-badge">{{ classItem.duration }}</div>
              </div>
              <div class="hover-actions">
                <button class="action-btn play-btn" :aria-label="`Play ${classItem.title}. Current status: ${classItem.isLive ? 'LIVE' : 'Not started'}`" @click.stop="joinClass(classItem)" @keydown.enter.prevent="joinClass(classItem)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <button class="action-btn subscribe-btn" @click.stop="toggleSubscription(classItem)"
                  :class="{ subscribed: classItem.isSubscribed }"
                  :aria-pressed="classItem.isSubscribed"
                  :aria-label="classItem.isSubscribed ? `You are subscribed to ${classItem.title}. Press to unsubscribe` : `Subscribe to ${classItem.title} to get notifications about future sessions`">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="card-content">
              <h3 class="class-title">{{ classItem.title }}</h3>
              <p class="class-instructor">{{ classItem.instructor }}</p>

              <div class="class-meta">
                <span class="class-category"> {{ classItem?.class || classItem?.class }}  </span>
                {{classItem.subject}}
                <span class="class-time">{{ formatTime(classItem.scheduledTime || classItem?.start_time) }}</span>
              </div>
              <div class="class-stats">
                <span class="viewers">{{ classItem.viewers }} viewers</span>
                <!-- <span class="rating">
                  <svg class="star-icon" viewBox="0 0 24 24">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {{ classItem.rating }}
                </span> -->
              </div>
            </div>
          </div>
        </div>
        <div class="pagination-controls" aria-label="Live classes pagination">
          <button class="pagination-btn" :disabled="livePage <= 1" @click="previousLivePage" aria-label="Previous page">Previous</button>
          <span class="pagination-info">Page {{ livePage }} of {{ liveTotalPages }}</span>
          <button class="pagination-btn" :disabled="livePage >= liveTotalPages" @click="nextLivePage" aria-label="Next page">Next</button>
        </div>
      </div>

      <!-- Class Modal -->
      <div v-if="selectedClassItem" class="modal-overlay" @click="closeModal" @keydown.escape="closeModal" role="presentation">
        <div class="modal-content" @click.stop role="dialog" aria-modal="true" :aria-labelledby="'modal-title-' + (selectedClassItem?.id ?? selectedClassItem?._id)">
          <button class="close-btn" @click="closeModal" aria-label="Close class details dialog" title="Press Escape to close dialog">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>

          <div class="modal-header">
            <img :src="selectedClassItem.thumbnail" :alt="'Thumbnail for ' + selectedClassItem.title" />
            <div class="modal-info">
              <h2 :id="'modal-title-' + (selectedClassItem?.id ?? selectedClassItem?._id)">{{ selectedClassItem.title }}</h2>
              <p class="modal-instructor" id="modal-instructor">with {{ selectedClassItem.instructor }}</p>
              <div class="modal-meta">
                <span class="modal-category" aria-label="Class level">{{ selectedClassItem.class ?? selectedClassItem?.class  }}</span>
                <span class="modal-time" aria-label="Scheduled time">{{ formatTime(selectedClassItem.scheduledTime) }}</span>
                <span class="modal-duration" aria-label="Session duration">{{ selectedClassItem.duration }}</span>
              </div>
            </div>
          </div>

          <div class="modal-description">
            <p>{{ selectedClassItem.description }}</p> <br>
            <p>{{ selectedClassItem.details }}</p>
          </div>

          <div class="modal-actions">
            <button class="primary-btn max-w-xs mx-auto" @click="joinClass(selectedClassItem)" aria-label="Join this class session now">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              Join Class
            </button>
            <!-- <button class="secondary-btn" @click="toggleSubscription(selectedClassItem)"
              :class="{ subscribed: selectedClassItem.isSubscribed }">
              <svg viewBox="0 0 24 24">
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {{ selectedClassItem.isSubscribed ? 'Subscribed' : 'Subscribe' }}
            </button> -->
          </div>
        </div>
      </div>

      <!-- Toast Notifications -->
      <div class="toast-container" role="status" aria-live="polite" aria-atomic="true">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type" :aria-label="toast.message">
          {{ toast.message }}
        </div>
      </div>
    </div>

  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionsSetup } from "../../../../composables/usesSessions.js";
import apiDocs from "../../../../utilities/apiDocs.js";

const router = useRouter();

const authAccessToken = useCookie('signInAccessToken');
const authUserToken = useCookie('signInUserToken');
const handleUnauthorized = (error) => {
  const status = error?.status || (error?.response?.status ?? null);
  if (status === 401) {
    authAccessToken.value = null;
    authUserToken.value = null;
    router.push('/auth/login');
  }
};
const userToken = useCookie("signInUserToken");
const token = useCookie('signInAccessToken').value;
const headers = {
  'Content-Type': 'application/json',
  'accept': '*/*',
  'Authorization': `Bearer ${token}`,
};

// Import your composable
const { postData, loading, error } = useSessionsSetup();
// Show toast function (replace with your UI lib's toast/snackbar)


definePageMeta({
  middleware: 'auth'
})

function getDuration(start, end) {
  if (!start || !end) return 'Unknown duration';

  const startDate = new Date(start); 
  const endDate = new Date(end);
  if (isNaN(startDate) || isNaN(endDate)) return 'Unknown duration';

  let diffMs = endDate - startDate;
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; 

  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;

  return `${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
}

const subjectThemes = {
  chemistry: { icon: '⚗️', gradient: ['#3B82F6', '#6366F1'], color: '#1D4ED8' },
  biology: { icon: '🧬', gradient: ['#10B981', '#059669'], color: '#047857' },
  mathematics: { icon: '∑', gradient: ['#F97316', '#FDE68A'], color: '#EA580C' },
  physics: { icon: '🔭', gradient: ['#6366F1', '#14B8A6'], color: '#0F766E' },
  history: { icon: '📜', gradient: ['#D97706', '#FDE68A'], color: '#92400E' },
  english: { icon: '📝', gradient: ['#EC4899', '#F472B6'], color: '#BE185D' },
  default: { icon: '🎓', gradient: ['#0EA5E9', '#6366F1'], color: '#1E3A8A' },
};

const getSubjectTheme = (subject = 'General') => {
  const key = subject.toString().toLowerCase().replace(/[^a-z]/g, '');
  return subjectThemes[key] || subjectThemes.default;
};

const buildIconPattern = (icon, color) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='28' font-family='"Segoe UI", sans-serif' fill='${color}'>${icon}</text></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

const mapSessionToClass = (session) => {
  const teacherReference = session?.teacher || session?.teacherInfo || {};
  const teacherId = teacherReference?._id || teacherReference?.id || session?.teacherId || session?.teacher_id;
  const teacherName = teacherReference?.name || session?.teacher_name || session?.teacherName || session?.instructor || 'Unknown Instructor';
  const schoolReference = session?.school || session?.schoolInfo || {};
  const schoolRegistrationNumber = schoolReference?.registration_number || schoolReference?.registrationNumber || session?.school_registration_number || session?.schoolRegistrationNumber;
  const schoolName = schoolReference?.name || session?.school_name || session?.schoolName || '';
  const subjectLabel = session?.subject?.name ?? session?.subject ?? 'General';
  const classLabel = session?.school_class?.name ?? session?.school_class ?? session?.schoolClass ?? 'General';
  const theme = getSubjectTheme(subjectLabel);

  return {
    id: session.id ?? session._id,
    title: session?.topic || 'Untitled Session',
    details: session.details || 'Karibu sana',
    meet_link: session.meet_link || 'https://tv.somakwanza.tz',
    subject: subjectLabel,
    thumbnail: session?.thumbnail || '',
    scheduledTime: session?.start_time ? new Date(session?.start_time) : null,
    duration: getDuration(session?.start_time, session?.end_time),
    viewers: Math.floor(Math.random() * 1000),
    rating: (Math.random() * 2 + 3).toFixed(1),
    isLive: session?.session_start ? new Date(session?.session_start) > new Date() : false,
    isSubscribed: false,
    class: classLabel,
    description: `Room: ${session?.room_name || 'N/A'}${session?.meet_link ? ', Meet Link available' : ''}`,
    instructor: teacherName,
    teacherId,
    teacherName,
    schoolRegistrationNumber,
    schoolName,
    iconSymbol: theme.icon,
    iconPattern: buildIconPattern(theme.icon, theme.color),
    gradient: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
  };
};

const buildFilterQuery = () => {
  const params = new URLSearchParams();

  const addParam = (key, value) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      params.set(key, value);
    }
  };

  addParam('q', searchQuery.value?.trim());
  addParam('class', selectedClass.value);
  addParam('subject', selectedSubject.value);
  addParam('teacher', selectedTeacher.value);
  addParam('school', selectedSchool.value);
  addParam('session_start', selectedSessionStart.value);
  addParam('session_end', selectedSessionEnd.value);
  params.set('limit', liveLimit.toString());
  params.set('page', livePage.value.toString());

  return `?${params.toString()}`;
};

const normalizeSessionPayload = (payload) => {
  if (!payload) return { items: [], total: 0 };
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  if (Array.isArray(payload?.items)) return { items: payload.items, total: payload.total ?? payload.items.length };
  if (Array.isArray(payload?.data)) return { items: payload.data, total: payload.total ?? payload.data.length };
  return { items: [], total: 0 };
};

const loadClasses = async () => {
  loading.value = true;
  try {
    const query = buildFilterQuery();
    const sessions = await $fetch(`${apiDocs.liveClassrooms.sessions}${query}`, {
      headers,
    });
    const { items, total } = normalizeSessionPayload(sessions);
    liveTotal.value = total;
    classes.value = items.map(mapSessionToClass);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    handleUnauthorized(error);
  } finally {
    loading.value = false;
  }
};

// Refs and reactive state
const searchQuery = ref('');
const selectedClass = ref('');
const selectedSubject = ref('');
const selectedTeacher = ref('');
const selectedSchool = ref('');
const selectedSessionStart = ref('');
const selectedSessionEnd = ref('');
const selectedClassItem = ref(null);
const dialog = ref(false);
const toasts = ref([]);
const isValid = ref(false);

// Form state
const formData = reactive({
  school_class: null,
  subject: null,
  school_registration_number: '',
  start_time: '',
  end_time: '',
  topic: '',
  details: '',
  room_name: '',
  meet_link: '',
  session_start: false,
  session_end: false
});


const categories = ref(['Form 1', 'Form 2']);

const classes = ref([]);
const livePage = ref(1);
const liveLimit = 6;
const liveTotal = ref(0);
const liveTotalPages = computed(() => Math.max(1, Math.ceil(liveTotal.value / liveLimit)));

const teacherOptions = computed(() => {
  const map = new Map();
  classes.value.forEach((cls) => {
    if (cls.teacherId) {
      map.set(cls.teacherId, cls.teacherName || 'Teacher');
    }
  });
  return [{ id: '', name: 'All teachers' }, ...Array.from(map.entries()).map(([id, name]) => ({ id, name }))];
});

const schoolOptions = computed(() => {
  const map = new Map();
  classes.value.forEach((cls) => {
    if (cls.schoolRegistrationNumber) {
      map.set(cls.schoolRegistrationNumber, cls.schoolName || cls.schoolRegistrationNumber);
    }
  });
  return [{ id: '', name: 'All schools' }, ...Array.from(map.entries()).map(([id, name]) => ({ id, name }))];
});

const sessionStartOptions = [
  { id: '', name: 'All start states' },
  { id: 'true', name: 'Started' },
  { id: 'false', name: 'Not started' }
];

const sessionEndOptions = [
  { id: '', name: 'All end states' },
  { id: 'true', name: 'Ended' },
  { id: 'false', name: 'Ongoing' }
];

// Computed
const filteredClasses = computed(() => classes.value);

let filterTimeout = null;
const scheduleFilteredLoad = () => {
  if (filterTimeout) clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => {
    loadClasses();
  }, 400);
};

watch([selectedClass, selectedSubject, selectedTeacher, selectedSchool, selectedSessionStart, selectedSessionEnd], () => {
  livePage.value = 1;
  scheduleFilteredLoad();
});

watch(searchQuery, () => {
  livePage.value = 1;
  scheduleFilteredLoad();
});

const triggerSearch = () => {
  if (filterTimeout) clearTimeout(filterTimeout);
  filterTimeout = null;
  loadClasses();
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedClass.value = '';
  selectedSubject.value = '';
  selectedTeacher.value = '';
  selectedSchool.value = '';
  selectedSessionStart.value = '';
  selectedSessionEnd.value = '';
  if (filterTimeout) clearTimeout(filterTimeout);
  filterTimeout = null;
  livePage.value = 1;
  loadClasses();
};

const previousLivePage = () => {
  if (livePage.value > 1) {
    livePage.value -= 1;
    loadClasses();
  }
};

const nextLivePage = () => {
  if (livePage.value < liveTotalPages.value) {
    livePage.value += 1;
    loadClasses();
  }
};

onBeforeUnmount(() => {
  if (filterTimeout) clearTimeout(filterTimeout);
});

loadClasses();


// Validation rules
const required = v => !!v || 'This field is required';
const minLength = min => v => (v && v.length >= min) || `Min ${min} characters`;

// Form submit
// Submit handler
const submit = async () => {

  if(formData.details === null || formData.details.trim() === ''){
    isValid.value === true;
  }

   if(formData.school_class === null || formData.school_class.trim() === ''){
    isValid.value === true;
  }

   if(formData.details === null || formData.details.trim() === ''){
    isValid.value === true;
  }

    if(formData.end_time === null || formData.start_time === null || formData.start_time.trim() === '' || formData.end_time.trim() === ''){
    isValid.value === true;
  }

  if (isValid.value) {
    showToast('Please fill the form correctly.', 'error');
    return;
  }

  try {
    const payload = JSON.parse(JSON.stringify({...formData,teacherId:userToken?.value?._id,teacherName:userToken.value?.name})); 

    try {
      // Call API
      await postData(payload,'live-classrooms/session');

      showToast('Session created successfully!', 'success');
      // dialog.value = false;

      // Reset form
      Object.assign(formData.value, {
        school_class: null,
        subject: null,
        school_registration_number: '',
        start_time: '',
        end_time: '',
        details: '',
        topic: '',
        room_name: '',
        meet_link: '',
        session_start: false,
        session_end: false,
      });


      if (response.data) {


      }
    } catch (error) {
      // Handle error and show failure message
      // alertType.value = 'error';
      // alertMessage.value = error.response.data.message || 'Login failed. Please try again.';
    }


    loadClasses();

    dialog.value = false;
  } catch (err) {
    showToast(error.value || 'Failed to create session.', 'error');
  }
};


const selectClass = (classItem) => {
  selectedClassItem.value = classItem;
};

const closeModal = () => {
  selectedClassItem.value = null;
};

const toggleSubscription = (classItem) => {
  classItem.isSubscribed = !classItem.isSubscribed;
  showToast(
    classItem.isSubscribed ? 'Subscribed successfully!' : 'Unsubscribed',
    classItem.isSubscribed ? 'success' : 'info'
  );
};

// const joinClass = (selectedClassItem) => {
//   router.push({ path: '/main/live-view' });
// };

const joinClass = (selectedClassItem) => {
  //router.push({ path: '/smart-class/screen/live-view' });
  window.open(selectedClassItem?.meet_link, '_blank');

  localStorage.setItem('classData', JSON.stringify(selectedClassItem));
  router.push({ path: '/smart-class/screen/live-view' });
};


const onCreate = () => {
  dialog.value = true;
};

const formatTime = (date) => {
  if (!date) return 'N/A';  // or '' or '--:--', whatever you prefer as fallback
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const showToast = (message, type = 'info') => {
  const toast = { id: Date.now(), message, type };
  toasts.value.push(toast);
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== toast.id);
  }, 3000);
};


  const { data:schoolSubjects,status:sStatus } = await useAsyncData('public-subjects',()=>$fetch(apiDocs.subjects.getPublicSubjects, { headers }).then((res)=>{
    if(res){
    const mapped = res.map(s=>({id:s?._id,name:s?.name}));
    return [{id:'',name:'all'},...mapped]
    }
  }));
 

  const { data:schoolClasses,status:clStatus } = await useAsyncData('class-levels',()=>$fetch(apiDocs.levels.getLevels, { headers }).then((res)=>{
    if(res){
    const mapped = res.map(c=>({id:c?._id,name:c?.name}));
    return [{id:'',name:'all'},...mapped]
    }
  }));

</script>


<style scoped>
* {
  box-sizing: border-box;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.live-classes {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Header Styles */
.header {
  position: relative;
  height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('https://images.unsplash.com/photo-1567057419565-4349c49d8a04?w=1200&h=600&fit=crop') center/cover;
  opacity: 0.3;
  z-index: 1;
}

.header-content {
  text-align: center;
  z-index: 2;
  position: relative;
}

.title {
  font-size: 4rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  background: linear-gradient(45deg, #ff6b6b, #ffd93d, #6bcf7f, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 3s ease-in-out infinite;
}

@keyframes gradient-shift {

  0%,
  100% {
    filter: hue-rotate(0deg);
  }

  50% {
    filter: hue-rotate(180deg);
  }
}

.subtitle {
  font-size: 1.5rem;
  opacity: 0.9;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.header-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(transparent, #0f0f23);
  z-index: 2;
}

/* Filter Styles */
.filters-section {
  padding: 2rem 0;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.filters-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.search-bar {
  position: relative;
  max-width: 500px;
  margin: 0 auto 2rem auto;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  stroke: rgba(255, 255, 255, 0.5);
  stroke-width: 2;
  fill: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.search-input:focus {
  outline: none;
  border-color: #ffd93d;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 20px rgba(255, 217, 61, 0.5);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.filter-chips {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.filter-chip:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.filter-chip.active {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-color: #667eea;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
}

/* Classes Grid */
.classes-container {
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.pagination-controls {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.pagination-btn {
  background: #1d4ed8;
  color: white;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 600;
}

.class-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.class-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.1);
}

.card-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.card-image__photo {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: transform 0.3s ease;
}

.card-image__pattern {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-repeat: repeat;
}

.class-card:hover .card-image__photo {
  transform: scale(1.1);
}

.card-overlay {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 59, 48, 0.9);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

.live-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.pattern-icon {
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 10px 20px rgba(15, 23, 42, 0.4);
}

.duration-badge {
  background: rgba(0, 0, 0, 0.7);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  backdrop-filter: blur(10px);
}

.hover-actions {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: all 0.3s ease;
}

.class-card:hover .hover-actions {
  opacity: 1;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.play-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.play-btn:hover {
  background: white;
  transform: scale(1.1);
}

.subscribe-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.subscribe-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.subscribe-btn.subscribed {
  background: #ff6b6b;
  color: white;
}

.action-btn:focus {
  outline: 3px solid #ffd93d;
  outline-offset: 2px;
}

.action-btn svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

.subscribe-btn.subscribed svg {
  fill: currentColor;
}

.card-content {
  padding: 1.5rem;
}

.class-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: white;
}

.class-instructor {
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
}

.class-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.class-category {
  background: linear-gradient(45deg, #667eea, #764ba2);
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
}

.class-time {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.class-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
}

.rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.star-icon {
  width: 16px;
  height: 16px;
  fill: #ffd93d;
  stroke: none;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.modal-content {
  background: rgba(15, 15, 35, 0.95);
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: 2px solid transparent;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.close-btn:focus {
  outline: 3px solid #ffd93d;
  outline-offset: 2px;
}

.close-btn svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 2;
}

.modal-header {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.modal-header img {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 10px;
}

.modal-info h2 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}

.modal-instructor {
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 1rem 0;
}

.modal-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.modal-category {
  background: linear-gradient(45deg, #667eea, #764ba2);
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
}

.modal-time,
.modal-duration {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.modal-description {
  margin-bottom: 2rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.95);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 30px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 150px;
  justify-content: center;
}

.primary-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.primary-btn:hover {
  background: linear-gradient(45deg, #5a6fd8, #6a42a0);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.primary-btn:focus {
  outline: 3px solid #ffd93d;
  outline-offset: 3px;
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.secondary-btn:focus {
  outline: 3px solid #ffd93d;
  outline-offset: 3px;
}

.secondary-btn.subscribed {
  background: #ff6b6b;
  border-color: #ff6b6b;
}

.primary-btn svg,
.secondary-btn svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

.secondary-btn.subscribed svg {
  fill: currentColor;
}

/* Toast Styles */
.toast-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toast {
  background: rgba(15, 15, 35, 0.95);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideIn 0.3s ease;
}

.toast.success {
  border-left: 4px solid #6bcf7f;
}

.toast.info {
  border-left: 4px solid #4ecdc4;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .title {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1.2rem;
  }

  .classes-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .classes-container {
    padding: 2rem 1rem;
  }

  .filters-container {
    padding: 0 1rem;
  }

  .filter-chips {
    gap: 0.5rem;
  }

  .filter-chip {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  .modal-overlay {
    padding: 1rem;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .modal-header {
    flex-direction: column;
    gap: 1rem;
  }

  .modal-header img {
    width: 100%;
    height: 120px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .primary-btn,
  .secondary-btn {
    min-width: auto;
  }

  .toast-container {
    top: 1rem;
    right: 1rem;
    left: 1rem;
  }

  .header {
    height: 50vh;
  }

  .card-content {
    padding: 1rem;
  }

  .class-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .search-input {
    font-size: 0.9rem;
  }

  .class-card {
    margin: 0 0.5rem;
  }

  .classes-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0;
  }

  .classes-container {
    padding: 1rem 0.5rem;
  }

  .filters-container {
    padding: 0 0.5rem;
  }

  .modal-content {
    padding: 1rem;
    margin: 0.5rem;
  }

  .header {
    height: 40vh;
  }
}

/* Loading Animation */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }

  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.loading-shimmer {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}

/* Scrollbar Styles */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Custom Focus Styles */
.class-card:focus {
  outline: 3px solid #ffd93d;
  outline-offset: 2px;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .class-card {
    border: 2px solid white;
  }

  .filter-chip {
    border: 2px solid white;
  }

  .search-input {
    border: 2px solid white;
  }
}
</style>
