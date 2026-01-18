<template>
  <NuxtLayout :name="$router.currentRoute.value.fullPath.includes('header-less') ? 'normal' :'home-layout'">
    <div
        v-if="dialog"
        class="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-50"
    >
      <div class="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-xl font-bold text-gray-800">Create Session</h3>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="submit" ref="formRef" class="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">

          <!-- Select Class -->
          <div>
            <label class="block mb-1 text-sm font-medium">Select Class</label>
            <CustomDropDownList
                v-model="formData.school_class"
                placeholder="Select class"
                class="w-full !text-sm border border-gray-300 rounded-md shadow-sm h-14 bg-white placeholder-gray-500"
                :list="schoolClasses"
            />
          </div>

          <!-- Select Subject -->
          <div>
            <label class="block mb-1 text-sm font-medium">Subject</label>
            <CustomDropDownList
                v-model="formData.subject"
                placeholder="Select subject"
                class="w-full !text-sm border border-gray-300 rounded-md shadow-sm h-14 bg-white placeholder-gray-500"
                :list="schoolSubjects"
            />
          </div>

          <!-- Start Time -->
          <div>
            <label class="block mb-1 text-sm font-medium">Start Time</label>
            <input
                type="datetime-local"
                v-model="formData.start_time"
                required
                class="w-full border border-gray-300 rounded-md px-3 py-2 h-14 bg-white text-gray-800 placeholder-gray-500 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <!-- End Time -->
          <div>
            <label class="block mb-1 text-sm font-medium">End Time</label>
            <input
                type="datetime-local"
                v-model="formData.end_time"
                required
                class="w-full border border-gray-300 rounded-md px-3 py-2 h-14 bg-white text-gray-800 placeholder-gray-500 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <!-- Topic -->
          <div>
            <label class="block mb-1 text-sm font-medium">Topic</label>
            <input
                type="text"
                v-model="formData.topic"
                required
                placeholder="Enter topic"
                class="w-full border border-gray-300 rounded-md px-3 py-2 h-14 bg-white text-gray-800 placeholder-gray-500 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <!-- Room Name -->
          <div>
            <label class="block mb-1 text-sm font-medium">Room Name</label>
            <input
                type="text"
                v-model="formData.room_name"
                required
                placeholder="Enter room name"
                class="w-full border border-gray-300 rounded-md px-3 py-2 h-14 bg-white text-gray-800 placeholder-gray-500 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <!-- Details (full width) -->
          <div class="md:col-span-2">
            <label class="block mb-1 text-sm font-medium">Details</label>
            <input
                type="text"
                v-model="formData.details"
                required
                placeholder="Enter details"
                class="w-full border border-gray-300 rounded-md px-3 py-2 h-14 bg-white text-gray-800 placeholder-gray-500 focus:ring-blue-500 focus:outline-none"
            />
          </div>

        </form>

        <!-- Footer -->
        <div class="px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button
              type="button"
              @click="dialog = false"
              class="px-5 py-2 rounded-md border border-red-500 text-white bg-red-500 hover:bg-red-600"
          >
            Cancel
          </button>
          <button
              type="submit"
              @click="submit"
              class="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
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
      <div class="filters-section relative z-50">
        <!-- <v-container fluid class="filters-section pa-4" elevation="1">
          <v-row>
            <v-col cols="12" class="d-flex justify-end">
              <v-btn color="primary" prepend-icon="mdi-plus" @click="onCreate">
                Create
              </v-btn>
            </v-col>
          </v-row>
          <v-row dense align="center" class="pa-2"> -->
            <!-- Search Field -->
            <!-- <v-col cols="12" sm="6" md="4" lg="3">
              <v-text-field v-model="searchQuery" label="Search classes..." prepend-inner-icon="mdi-magnify"
                variant="outlined" dense clearable hide-details />
            </v-col> -->

            <!-- Category Dropdown 1 -->
            <!-- <v-col cols="12" sm="6" md="4" lg="3">
              <v-select v-model="selectedClass" :items="['all', ...categories]" label="Category" variant="outlined"
                dense hide-details />
            </v-col> -->

            <!-- Category Dropdown 2 -->
            <!-- <v-col cols="12" sm="6" md="4" lg="3">
              <v-select v-model="selectedClass" :items="['all', ...categories]" label="Category" variant="outlined"
                dense hide-details />
            </v-col> -->

            <!-- Category Dropdown 3 -->
            <!-- <v-col cols="12" sm="6" md="4" lg="3">
              <v-select v-model="selectedClass" :items="['all', ...categories]" label="Category" variant="outlined"
                dense hide-details />
            </v-col>

            <br>

          </v-row>
        </v-container> -->

        <div class="p-4">
          <!-- Create Button " -->
          <div v-if="userToken?.type.toLowerCase() === 'teacher'"  class="flex justify-end mb-4">
            <button @click="onCreate"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create
            </button>
          </div>

          <!-- Filter Section -->
          <div class="flex flex-wrap gap-4 justify-center">
            <!-- Search Field -->
            <div class="w-full md:w-1/3 lg:w-1/4">
              <div class="relative">
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Search classes..."
                  @keyup.enter.prevent="triggerSearch"
                  class="w-full border border-gray-300 rounded-md px-10 py-2 pr-28 focus:outline-none bg-transparent focus:ring-2 focus:ring-blue-500 h-14"
                />
                <svg class="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor"
                  stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
                <button
                  type="button"
                  class="absolute inset-y-1 right-1 flex items-center gap-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-md shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  @click="triggerSearch"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                  <span>Search</span>
                </button>
              </div>
            </div>

            <!-- Classes Dropdowns -->
            <div class="w-full md:w-1/3 lg:w-1/4">
               <CustomDropDownList v-model="selectedClass" placeholder="Select class" class="w-full !text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="schoolClasses"/>
            </div>

            <!-- subject Dropdowns -->
            <div class="w-full md:w-1/3 lg:w-1/4">
               <CustomDropDownList v-model="selectedSubject" placeholder="Select subject" class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="schoolSubjects"/>
            </div>

            <!-- Teacher Dropdown -->
            <div class="w-full md:w-1/3 lg:w-1/4">
               <CustomDropDownList v-model="selectedTeacher" placeholder="Select teacher" class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="teacherOptions"/>
            </div>

            <!-- School Dropdown -->
            <div class="w-full md:w-1/3 lg:w-1/4">
               <CustomDropDownList v-model="selectedSchool" placeholder="Select school" class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="schoolOptions"/>
            </div>

            <!-- Session Start Dropdown -->
            <div class="w-full md:w-1/3 lg:w-1/4">
               <CustomDropDownList v-model="selectedSessionStart" placeholder="Session start" class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="sessionStartOptions"/>
            </div>

            <!-- Session End Dropdown -->
            <div class="w-full md:w-1/3 lg:w-1/4">
               <CustomDropDownList v-model="selectedSessionEnd" placeholder="Session end" class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent" :list="sessionEndOptions"/>
            </div>

            <!-- Clear Filters Button -->
            <div class="w-full md:w-auto flex justify-center items-center">
              <button type="button" @click="clearFilters"
                class="px-6 py-3 w-full md:w-auto bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200 transition h-14">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>


      <!-- Classes Grid -->
      <div class="classes-container">
        <div class="classes-grid">
          <div v-for="classItem in filteredClasses" :key="classItem?.id ?? classItem?._id" class="class-card"
            @click="selectClass(classItem)">
            <div class="card-image">
              <img :src="classItem.thumbnail"
                :alt="classItem.title" />
              <div class="card-overlay">
                <div class="live-badge" v-if="classItem.isLive">
                  <span class="live-dot"></span>
                  LIVE
                </div>
                <div class="duration-badge">{{ classItem.duration }}</div>
              </div>
              <div class="hover-actions">
                <button class="action-btn play-btn">
                  <svg viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <button class="action-btn subscribe-btn" @click.stop="toggleSubscription(classItem)"
                  :class="{ subscribed: classItem.isSubscribed }">
                  <svg viewBox="0 0 24 24">
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
      </div>

      <!-- Class Modal -->
      <div v-if="selectedClassItem" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <button class="close-btn" @click="closeModal">
            <svg viewBox="0 0 24 24">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>

          <div class="modal-header">
            <img :src="selectedClassItem.thumbnail" :alt="selectedClassItem.title" />
            <div class="modal-info">
              <h2>{{ selectedClassItem.title }}</h2>
              <p class="modal-instructor">with {{ selectedClassItem.instructor }}</p>
              <div class="modal-meta">
                <span class="modal-category">{{ selectedClassItem.class ?? selectedClassItem?.class  }}</span>
                <span class="modal-time">{{ formatTime(selectedClassItem.scheduledTime) }}</span>
                <span class="modal-duration">{{ selectedClassItem.duration }}</span>
              </div>
            </div>
          </div>

          <div class="modal-description">
            <p>{{ selectedClassItem.description }}</p> <br>
            <p>{{ selectedClassItem.details }}</p>
          </div>

          <div class="modal-actions">
            <button class="primary-btn max-w-xs mx-auto" @click="joinClass(selectedClassItem)">
              <svg viewBox="0 0 24 24">
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
      <div class="toast-container">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
          {{ toast.message }}
        </div>
      </div>
    </div>

  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionsSetup } from "../../../../composable/usesSessions.js";
import apiDocs from "../../../../utilities/apiDocs.js";

const router = useRouter();
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

const mapSessionToClass = (session) => {
  const teacherReference = session?.teacher || session?.teacherInfo || {};
  const teacherId = teacherReference?._id || teacherReference?.id || session?.teacherId || session?.teacher_id;
  const teacherName = teacherReference?.name || session?.teacher_name || session?.teacherName || session?.instructor || 'Unknown Instructor';
  const schoolReference = session?.school || session?.schoolInfo || {};
  const schoolRegistrationNumber = schoolReference?.registration_number || schoolReference?.registrationNumber || session?.school_registration_number || session?.schoolRegistrationNumber;
  const schoolName = schoolReference?.name || session?.school_name || session?.schoolName || '';

  return {
  id: session.id ?? session._id,
  title: session?.topic || 'Untitled Session',
  details: session.details || 'Karibu  sana',
  meet_link: session.meet_link || 'https://tv.somakwanza.tz',
  subject:session?.subject?.name ?? session?.subject ??  'General',
  thumbnail: 'https://images.unsplash.com/photo-1716654718430-c7f54c3125c8?w=400&h=225&fit=crop',
  scheduledTime: session?.start_time ? new Date(session?.start_time) : null, // or session.start_time if valid ISO
  duration: getDuration(session?.start_time, session?.end_time),
  viewers: Math.floor(Math.random() * 1000),
  rating: (Math.random() * 2 + 3).toFixed(1),
  isLive: session?.session_start ? new Date(session?.session_start) > new Date() : false,
  isSubscribed: false,
  class:session?.school_class?.name ?? session?.school_class ?? 'Form 1',
  description: `Room: ${session?.room_name || 'N/A'}${session?.meet_link ? ', Meet Link available' : ''}`,
  instructor: teacherName,
  teacherId,
  teacherName,
  schoolRegistrationNumber,
  schoolName,
};
};

const buildFilterQuery = () => {
  const params = new URLSearchParams();
  let hasFilters = false;

  const addParam = (key, value) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      params.set(key, value);
      hasFilters = true;
    }
  };

  addParam('q', searchQuery.value?.trim());
  addParam('class', selectedClass.value);
  addParam('subject', selectedSubject.value);
  addParam('teacher', selectedTeacher.value);
  addParam('school', selectedSchool.value);
  addParam('session_start', selectedSessionStart.value);
  addParam('session_end', selectedSessionEnd.value);

  return hasFilters ? `?${params.toString()}` : '';
};

const normalizeSessions = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const loadClasses = async () => {
  loading.value = true;
  try {
    const query = buildFilterQuery();
    const sessions = await $fetch(`${apiDocs.baseURL}/live-classrooms/sessions${query}`, {
      headers,
    });
    const normalizedSessions = normalizeSessions(sessions);
    classes.value = normalizedSessions.map(mapSessionToClass);
  } catch (error) {
    console.error('Error fetching sessions:', error);
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
  scheduleFilteredLoad();
});

watch(searchQuery, () => {
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
  loadClasses();
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
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
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

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.class-card:hover .card-image img {
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
  color: rgba(255, 255, 255, 0.7);
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
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.class-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.6);
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
  border: none;
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
  background: rgba(255, 255, 255, 0.1);
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
  color: rgba(255, 255, 255, 0.7);
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
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.modal-description {
  margin-bottom: 2rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
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

.secondary-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
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
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.action-btn:focus {
  outline: 2px solid #667eea;
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
