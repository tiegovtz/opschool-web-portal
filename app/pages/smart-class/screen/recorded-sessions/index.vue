<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionsSetup } from "../../../../composables/usesSessions.js";
import apiDocs from '~/utilities/apiDocs.js';

const router = useRouter();
const route = useRoute();
const pageLanguage = useHubPageLanguage();
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
  'Authorization': `Bearer ${token}`,
};

function getDuration(start, end) {
  if (!start || !end) return 'Unknown duration';

  const startDate = new Date(`1970-01-01T${start}`);  // Assuming time strings only
  const endDate = new Date(`1970-01-01T${end}`);
  if (isNaN(startDate) || isNaN(endDate)) return 'Unknown duration';

  let diffMs = endDate - startDate;
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;  // handle overnight sessions

  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;

  return `${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
}


// Form validation
const formValid = ref(false)
const uploadForm = ref(null)

// Form data
const classData = reactive({
  title: '',
  instructor: '',
  category: '',
  duration: '',
  description: '',
  video: [],
  thumbnail: []
})

// Upload states
const uploading = ref(false)
const uploadProgress = ref(0)
const videoPreview = ref(null)
const thumbnailPreview = ref(null)

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
  icon: 'mdi-check-circle'
})

// Form options
const categories = [
  'Fitness & Wellness',
  'Technology',
  'Business',
  'Arts & Design',
  'Music',
  'Language Learning',
  'Cooking',
  'Photography',
  'Marketing',
  'Personal Development'
]

const durations = [
  '15 minutes',
  '30 minutes',
  '45 minutes',
  '1 hour',
  '1.5 hours',
  '2 hours',
  '2+ hours'
]

// Validation rules
const titleRules = [
  v => !!v || 'Class title is required',
  v => (v && v.length >= 5) || 'Title must be at least 5 characters long',
  v => (v && v.length <= 100) || 'Title must be less than 100 characters'
]

const instructorRules = [
  v => !!v || 'Instructor name is required',
  v => (v && v.length >= 2) || 'Name must be at least 2 characters long'
]

const categoryRules = [
  v => !!v || 'Please select a category'
]

const durationRules = [
  v => !!v || 'Please select duration'
]

const descriptionRules = [
  v => !!v || 'Description is required',
  v => (v && v.length >= 20) || 'Description must be at least 20 characters long',
  v => (v && v.length <= 1000) || 'Description must be less than 1000 characters'
]

const videoRules = [
  v => !!(v && v.length > 0) || 'Video file is required',
  v => {
    if (!v || v.length === 0) return true
    const file = v[0]
    return file.size < 500000000 || 'Video file must be less than 500MB'
  }
]

const thumbnailRules = [
  v => !!(v && v.length > 0) || 'Thumbnail image is required',
  v => {
    if (!v || v.length === 0) return true
    const file = v[0]
    return file.size < 5000000 || 'Image file must be less than 5MB'
  }
]

// File upload handlers
const handleVideoUpload = (event) => {
  const files = event.target.files || event
  if (files && files.length > 0) {
    const file = files[0]
    videoPreview.value = URL.createObjectURL(file)
  }
}

const handleThumbnailUpload = (event) => {
  const files = event.target.files || event
  if (files && files.length > 0) {
    const file = files[0]
    thumbnailPreview.value = URL.createObjectURL(file)
  }
}

// Form submission
const submitForm = async () => {
  if (!uploadForm.value) return

  const { valid } = await uploadForm.value.validate()
  if (!valid) return

  uploading.value = true
  uploadProgress.value = 0

  try {
    // Simulate upload progress
    const interval = setInterval(() => {
      uploadProgress.value += Math.random() * 10
      if (uploadProgress.value >= 100) {
        clearInterval(interval)
        uploadProgress.value = 100

        setTimeout(() => {
          uploading.value = false
          showSnackbar('Class uploaded successfully!', 'success', 'mdi-check-circle')
          resetForm()
        }, 500)
      }
    }, 200)

    // Here you would implement actual upload logic
    console.log('Uploading class data:', classData)

  } catch (error) {
    uploading.value = false
    showSnackbar('Upload failed. Please try again.', 'error', 'mdi-alert-circle')
    console.error('Upload error:', error)
  }
}

// Reset form
const resetForm = () => {
  if (uploadForm.value) {
    uploadForm.value.reset()
  }

  Object.assign(classData, {
    title: '',
    instructor: '',
    category: '',
    duration: '',
    description: '',
    video: [],
    thumbnail: []
  })

  videoPreview.value = null
  thumbnailPreview.value = null
  uploadProgress.value = 0
}

// Show snackbar
const showSnackbar = (message, color = 'success', icon = 'mdi-check-circle') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.icon = icon
  snackbar.show = true
}
const recordedSubjectThemes = {
  chemistry: { icon: '⚗️', gradient: ['#3B82F6', '#6366F1'], color: '#1D4ED8' },
  biology: { icon: '🧬', gradient: ['#10B981', '#059669'], color: '#047857' },
  mathematics: { icon: '∑', gradient: ['#F97316', '#FDE68A'], color: '#EA580C' },
  physics: { icon: '🔭', gradient: ['#6366F1', '#14B8A6'], color: '#0F766E' },
  history: { icon: '📜', gradient: ['#D97706', '#FDE68A'], color: '#92400E' },
  english: { icon: '📝', gradient: ['#EC4899', '#F472B6'], color: '#BE185D' },
  default: { icon: '🎓', gradient: ['#0EA5E9', '#6366F1'], color: '#1E3A8A' },
};

const getSubjectTheme = (subject = 'Recorded') => {
  const key = subject.toString().toLowerCase().replace(/[^a-z]/g, '');
  return recordedSubjectThemes[key] || recordedSubjectThemes.default;
};

const buildIconPattern = (icon, color) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='28' font-family='"Segoe UI", sans-serif' fill='${color}'>${icon}</text></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

const recordedHostUrl = apiDocs.baseURL.replace(/\/v1\/?$/, '');
const buildAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${recordedHostUrl}/${path.replace(/^\//, '')}`;
};

const mapRecordedSessionToCard = (session) => {
  const video = session?.video || {}
  const classLabel = session?.schoolClass?.name || session?.school_class?.name || session?.school_class || session?.class || 'Recorded'
  const subjectLabel = typeof session?.subject === 'object'
    ? session.subject?.name
    : session?.subject || classLabel
  const timestamp = session?.createdAt || session?.updatedAt || video?.createdAt || video?.updatedAt
  const theme = getSubjectTheme(subjectLabel)
  const thumbnail = buildAssetUrl(video?.thumbnail) || ''

  return {
    id: session?._id ?? session?.videoId ?? session?.id,
    title: session?.title || video?.name || 'Recorded Session',
    meet_link: video?.videoFileUrl || session?.recordingUrl || session?.meet_link || '',
    recordingUrl: buildAssetUrl(video?.videoFileUrl) || session?.recordingUrl || session?.meet_link || '',
    instructor: session?.teacher?.name || session?.teacherName || session?.teacher_name || 'SomaKwanza Teacher',
    category: classLabel,
    subject: subjectLabel,
    thumbnail,
    scheduledTime: timestamp ? new Date(timestamp) : null,
    duration: session?.duration || video?.duration || 'Recorded',
    viewers: session?.viewers ?? Math.floor(Math.random() * 400 + 50),
    rating: session?.rating ?? (Math.random() * 2 + 3).toFixed(1),
    isLive: false,
    isSubscribed: false,
    description: session?.description || session?.details || video?.description || 'Replay available',
    details: session?.description || session?.details || video?.description || '',
    iconSymbol: theme.icon,
    iconPattern: buildIconPattern(theme.icon, theme.color),
    gradient: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
  }
}

const normalizeRecordedResponse = (payload) => {
  if (!payload) return { items: [], total: 0, page: recordedPage.value };
  if (Array.isArray(payload)) return { items: payload, total: payload.length, page: recordedPage.value };
  const items = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.data)
      ? payload.data
      : [];
  const total = payload.total ?? items.length;
  const page = payload.page ?? recordedPage.value;
  return { items, total, page };
};

const buildRecordedQuery = () => {
  const params = new URLSearchParams()
  const addParam = (key, value) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value)
    }
  }

  addParam('q', searchQuery.value?.trim())
  addParam('class', selectedCategory.value)
  addParam('subject', selectedSubject.value)
  params.set('isRecorded', 'true')
  params.set('limit', recordedLimit.toString())
  params.set('page', recordedPage.value.toString())

  return params.toString() ? `?${params.toString()}` : ''
}

const loadClasses = async () => {
  try {
    const query = buildRecordedQuery()
    const response = await getDataList(`live-classrooms/recorded-sessions${query}`)
    const normalized = normalizeRecordedResponse(response)
    recordedTotal.value = normalized.total
    recordedPage.value = normalized.page
    classes.value = normalized.items.map(mapRecordedSessionToCard)
  } catch (error) {
    console.error('Error fetching recorded sessions:', error)
    handleUnauthorized(error)
    classes.value = []
  }
}



// Refs and reactive state
const searchQuery = ref('');
const selectedCategory = ref(null);
const selectedSubject = ref(null);
const selectedClassItem = ref(null);
const modalContent = ref(null);
const meetingModalContent = ref(null);
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


// const categories = ref(['Programming', 'Design', 'Business', 'Marketing', 'Photography']);

const classes = ref([]);
const recordedPage = ref(1);
const recordedLimit = 6;
const recordedTotal = ref(0);
const recordedTotalPages = computed(() => Math.max(1, Math.ceil(recordedTotal.value / recordedLimit)));

// Import your composable
const { postData, loading, error, getDataList } = useSessionsSetup();
// Show toast function (replace with your UI lib's toast/snackbar)



// Computed


// Validation rules
const required = v => !!v || 'This field is required';
const minLength = min => v => (v && v.length >= min) || `Min ${min} characters`;

// Form submit
// Submit handler
const submit = async () => {
  console.log("Sdsfe");
  // if (!isValid.value) {
  //   showToast('Please fill the form correctly.', 'error');
  //   return;
  // }

  try {
    const payload = JSON.parse(JSON.stringify(formData)); // deep clone, usually unnecessary here


    try {
      // Call API
      await postData(payload, token);

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
  nextTick(() => {
    try {
      if (modalContent.value && typeof modalContent.value.focus === 'function') {
        modalContent.value.focus();
      } else {
        const el = document.querySelector('.modal-content');
        if (el) el.focus();
      }
    } catch (e) {
      // ignore
    }
  });
};

const focusMain = () => {
  nextTick(() => {
    const el = document.getElementById('main-content');
    if (el) el.focus();
  });
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
//  :name="$router.currentRoute.value.fullPath.includes('header-less') ?'normal':'home-layout'"> 
//};

const joinClass = (selectedClassItem) => {
  localStorage.setItem('classData', JSON.stringify(selectedClassItem));
  router.push({
    path: '/smart-class/screen/live-view',
    query: router.currentRoute.value.fullPath.includes('header-less') ? { 'header-less': 'true' } : {}
  });
};



const onCreate = () => {
  dialog.value = true;
};

const formatTime = (date) => {
  if (!date) return 'N/A';  // or '' or '--:--', whatever you prefer as fallback
  const d = new Date(date);
  if (isNaN(d)) return 'Invalid Date';  // in case date is malformed
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const showToast = (message, type = 'info') => {
  const toast = { id: Date.now(), message, type };
  toasts.value.push(toast);
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== toast.id);
  }, 3000);
};

const meetingVideoPattern = /\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i;
const meetingModalItem = ref(null);

const isVideoMeetingLink = (link) => {
  if (!link) return false;
  return meetingVideoPattern.test(link);
};

const meetingModalLink = computed(() => meetingModalItem.value?.meet_link || '');
const meetingModalIsVideo = computed(() => isVideoMeetingLink(meetingModalLink.value));

const openMeetingModal = (classItem) => {
  const link = classItem?.meet_link?.trim();
  if (!link) {
    showToast('Meeting link unavailable for this session.', 'info');
    return;
  }
  meetingModalItem.value = classItem;
  nextTick(() => {
    if (meetingModalContent.value && typeof meetingModalContent.value.focus === 'function') {
      meetingModalContent.value.focus();
    }
  });
};

const closeMeetingModal = () => {
  meetingModalItem.value = null;
};

const openMeetingInNewTab = () => {
  const link = meetingModalLink.value;
  if (!link) return;
  if (typeof window !== 'undefined') {
    window.open(link, '_blank');
  }
};


const { data: classLevels, status: clsStatus } = useAsyncData('class-levels', () => $fetch(apiDocs.levels.getLevels, { headers }).then((response) => {
  if (response)
    return response.map((c) => ({ id: c?._id, name: c?.name }));
}))

const { data: pubSubject, status: subStatus } = useAsyncData('public-subjects', () => $fetch(apiDocs.subjects.getPublicSubjects, { headers }).then((response) => {
  if (response)
    return response.map((c) => ({ id: c?._id, name: c?.name }));
}))

const filteredClasses = computed(() => classes.value);

let filterTimeout = null;
const scheduleRecordedLoad = () => {
  if (filterTimeout) clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => {
    loadClasses();
  }, 400);
};

watch([searchQuery, selectedCategory, selectedSubject], () => {
  recordedPage.value = 1;
  scheduleRecordedLoad();
});

onBeforeUnmount(() => {
  if (filterTimeout) clearTimeout(filterTimeout);
});

const previousRecordedPage = () => {
  if (recordedPage.value > 1) {
    recordedPage.value -= 1;
    loadClasses();
  }
};

const nextRecordedPage = () => {
  if (recordedPage.value < recordedTotalPages.value) {
    recordedPage.value += 1;
    loadClasses();
  }
};


loadClasses();


</script>




<template>
  <!-- Dialog Container  -->
  <div v-if="dialog"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 overflow-auto">
    <div
      class=" rounded-lg shadow-lg w-full max-w-4xl p-6 bg-transparent backdrop-blur-md overflow-y-scroll scrollbar-none">

      <form @submit.prevent="submitForm" ref="uploadForm" class="space-y-6">

        <!-- Class Title -->
        <div>
          <label class="block text-sm text-white font-medium">Class Title</label>
          <div class="relative mt-1">
            <input v-model="classData.title" type="text" placeholder="Enter an engaging title for your class"
              class="w-full border border-gray-300 text-white rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
              required />
          </div>
        </div>

        <!-- Instructor Name -->
        <div>
          <label class="block text-sm font-medium text-white">Instructor Name</label>
          <div class="relative mt-1">
            <input v-model="classData.instructor" type="text" placeholder="Your name or instructor name"
              class="w-full border border-gray-300 text-white rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
              required />
          </div>
        </div>

        <!-- Class Category -->
        <div>
          <label class="block text-sm font-medium text-white">Class Category</label>
          <CustomDropDownList @update-model-value="classData.category = $event"
            :placeholder="clsStatus === 'pending' ? 'Loading' : clsStatus === 'success' ? 'Select class' : 'something went wrong'"
            class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent"
            :list="classLevels ?? [{ id: 0, name: '' }]" />
        </div>

        <!-- Class Duration -->
        <div>
          <label class="block text-sm font-medium text-white">Class Duration</label>
          <CustomDropDownList @update-model-value="classData.duration = durations[$event]"
            :placeholder="'Select duration'"
            class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent"
            :list="durations.map((d, i) => ({ id: i, name: d })) ?? [{ id: 0, name: '' }]" />
        </div>

        <!-- Class Description -->
        <div>
          <label class="block text-sm font-medium text-white">Class Description</label>
          <textarea v-model="classData.description" rows="4"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-white"
            placeholder="Describe what students will learn..." required></textarea>
        </div>

        <!-- Video Upload -->
        <div>
          <label class="text-sm font-medium text-white flex items-center gap-2">
            <i class="mdi mdi-video text-blue-500"></i> Class Video
          </label>
          <input type="file" @change="handleVideoUpload" accept="video/*"
            class="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 text-white" required />
          <div v-if="videoPreview" class="mt-4">
            <video :src="videoPreview" controls class="w-full rounded shadow"></video>
          </div>
        </div>

        <!-- Thumbnail Upload -->
        <div>
          <label class="text-sm font-medium text-white flex items-center gap-2">
            <i class="mdi mdi-image text-green-500"></i> Class Thumbnail
          </label>
          <input type="file" @change="handleThumbnailUpload" accept="image/*"
            class="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 tw" required />
          <div v-if="thumbnailPreview" class="mt-4">
            <img :src="thumbnailPreview" alt="Thumbnail preview" class="w-full rounded shadow" />
          </div>
        </div>

        <!-- Progress Bar -->
        <div v-if="uploading" class="w-full bg-gray-200 rounded-full h-3">
          <div class="bg-blue-600 h-3 rounded-full" :style="{ width: uploadProgress + '%' }"></div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-4">
          <button type="button" @click="resetForm"
            class="border border-gray-40 px-4 py-2 text-white rounded hover:bg-gray-100">
            <i class="mdi mdi-refresh mr-2"></i> Reset
          </button>
          <button type="submit" :disabled="!formValid || uploading"
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
            <i class="mdi mdi-cloud-upload"></i>
            {{ uploading ? 'Uploading...' : 'Upload Class' }}
          </button>
        </div>
      </form>

    </div>
  </div>

  <!-- Snackbar -->
  <div v-if="snackbar.show" role="status" aria-live="polite" aria-atomic="true"
    :class="['fixed top-4 right-4 px-4 py-3 rounded shadow text-white flex items-center gap-2', snackbar.color === 'success' ? 'bg-green-600' : 'bg-red-600']">
    <i :class="['mdi', snackbar.icon]"></i>
    <span :aria-label="snackbar.message">{{ snackbar.message }}</span>
  </div>

  <NuxtLayout
    :name="route.fullPath.includes('header-less') ? 'normal' : 'home-layout'"
    :language="route.fullPath.includes('header-less') ? undefined : pageLanguage"
  >
    <a class="skip-link" href="#main-container" @click.prevent="focusMain">Skip to main content</a>

    <div id="main-container" tabindex="-1" class="live-classes" role="main" aria-label="Recorded sessions main content">
      <!-- Header Section -->
      <div class="header">
        <div class="header-content">
          <h1 class="title">Recorded Sessions</h1>
          <p class="subtitle">Discover amazing live streaming sessions</p>
        </div>
        <div class="header-gradient"></div>
      </div>

      <!-- Filter Section -->
      <div class="filters-section relative z-50" role="region" aria-label="Search and filter controls">
        <!-- Create Button -->
        <div v-if="userToken?.roles.includes('TeacherAdmin')" class="flex justify-end mb-4 px-2">
          <button type="button" @click="onCreate" @keyup.enter="onCreate" @keyup.space.prevent="onCreate"
            aria-label="Create new recorded session" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <i class="mdi mdi-plus" aria-hidden="true"></i>
            <span>Create</span>
          </button>
        </div>

        <!-- Filter Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-2  max-w-screen-xl mx-auto">
          <!-- Search Field -->
          <div>
            <label for="search-sessions" class="block text-sm font-medium text-white mb-1">Search classes</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400" aria-hidden="true">
                <i class="mdi mdi-magnify"></i>
              </span>
              <input id="search-sessions" v-model="searchQuery" type="text"
                placeholder="Search by title, instructor, or category..." aria-label="Search recorded sessions"
                aria-describedby="search-help"
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent focus:outline-none" />
              <small id="search-help" class="sr-only">Type to filter sessions by title, instructor name, or
                category.</small>
            </div>
          </div>

          <!-- Category Dropdown 1 -->
          <div>
            <label for="class-filter" class="block text-sm font-medium text-white mb-1">Class</label>
            <CustomDropDownList id="class-filter" v-model="selectedCategory"
              :placeholder="clsStatus === 'pending' ? 'Loading' : clsStatus === 'success' ? 'Select class' : 'something went wrong'"
              class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent"
              :list="classLevels ?? [{ id: 0, name: '' }]" aria-label="Filter recorded sessions by class level"
              aria-describedby="class-filter-help" />
            <small id="class-filter-help" class="sr-only">Select a class level to filter displayed sessions, or leave
              blank to show all classes.</small>
          </div>

          <!-- Category Dropdown 2 -->
          <div>
            <label for="subject-filter" class="block text-sm font-medium text-white mb-1">Subject</label>
            <CustomDropDownList id="subject-filter" v-model="selectedSubject"
              :placeholder="subStatus === 'pending' ? 'Loading' : subStatus === 'success' ? 'Select subject' : 'something went wrong'"
              class="w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-14 bg-transparent"
              :list="pubSubject ?? [{ id: 0, name: '' }]" aria-label="Filter recorded sessions by subject"
              aria-describedby="subject-filter-help" />
            <small id="subject-filter-help" class="sr-only">Select a subject to filter displayed sessions, or leave
              blank to show all subjects.</small>
          </div>
        </div>
      </div>

      <!-- Classes Grid -->
      <div class="classes-container" role="region" aria-label="Recorded sessions list" aria-live="polite"
        aria-atomic="false">
        <div class="classes-grid" role="list">
          <div v-for="classItem in filteredClasses" :key="classItem.id" class="class-card group" role="listitem"
            :aria-label="`${classItem.title} with ${classItem.instructor}, Category: ${classItem.category}, Duration: ${classItem.duration}. Press Enter or click to view details`"
            tabindex="0" @click="selectClass(classItem)" @keydown.enter.prevent="selectClass(classItem)"
            @keydown.space.prevent="selectClass(classItem)">
            <div class="card-image">
              <div v-if="classItem.thumbnail" class="card-image__photo"
                :style="{ backgroundImage: `url(${classItem.thumbnail})` }"></div>
              <div v-else class="card-image__pattern" :style="{
                backgroundImage: `${classItem.iconPattern}, ${classItem.gradient}`,
                backgroundSize: '80px 80px, cover',
              }" aria-hidden="true">
                <span class="pattern-icon">{{ classItem.iconSymbol }}</span>
              </div>
              <div class="card-overlay">
                <div class="live-badge" v-if="classItem.isLive">
                  <span class="live-dot"></span>
                  LIVE
                </div>
                <div class="duration-badge">{{ classItem.duration }}</div>
              </div>
              <div class="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/70 bg-slate-900/60 p-0 opacity-0 scale-90 shadow-[0_15px_30px_rgba(0,0,0,0.45)] transition duration-300 group-hover:opacity-100 group-hover:scale-100 pointer-events-none">
                <Icon name="fa-solid:play-circle" class="h-10 w-10 text-white" aria-hidden="true" />
              </div>
              <div class="absolute bottom-4 right-4 flex gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <button
                  class="action-btn play-btn"
                  type="button"
                  :aria-label="`Open meeting for ${classItem.title}`"
                  @click.stop="openMeetingModal(classItem)"
                  @keydown.enter.prevent="openMeetingModal(classItem)"
                >
                  <Icon name="fa-solid:play-circle" class="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  class="action-btn subscribe-btn"
                  @click.stop="toggleSubscription(classItem)"
                  :class="{ subscribed: classItem.isSubscribed }"
                  :aria-pressed="classItem.isSubscribed"
                  :aria-label="classItem.isSubscribed ? `You are subscribed to ${classItem.title}. Press to unsubscribe` : `Subscribe to ${classItem.title} to get notifications about future sessions`"
                >
                  <Icon name="fa-solid:heart" class="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div class="card-content">
              <h3 class="class-title">{{ classItem.title }}</h3>
              <p class="class-instructor">{{ classItem.instructor }}</p>
              <div class="class-meta">
                <span class="class-category">{{ classItem.category }}</span>
                <span class="class-time">{{ formatTime(classItem.scheduledTime) }}</span>
              </div>
              <div class="class-stats">
                <span class="viewers">{{ classItem.viewers }} viewers</span>
              </div>
            </div>
          </div>
        </div>
        <div class="pagination-controls recorded" aria-label="Recorded sessions pagination">
          <button class="pagination-btn" :disabled="recordedPage <= 1" @click="previousRecordedPage"
            aria-label="Previous page">Previous</button>
          <span class="pagination-info">Page {{ recordedPage }} of {{ recordedTotalPages }}</span>
          <button class="pagination-btn" :disabled="recordedPage >= recordedTotalPages" @click="nextRecordedPage"
            aria-label="Next page">Next</button>
        </div>
      </div>

      <!-- Class Modal -->
      <div v-if="selectedClassItem" class="modal-overlay" @click="closeModal" @keydown.escape="closeModal"
        role="presentation">
        <div ref="modalContent" class="modal-content" @click.stop role="dialog" aria-modal="true"
          :aria-labelledby="'modal-title-' + selectedClassItem.id" tabindex="-1">
          <button class="close-btn" @click="closeModal" aria-label="Close class details dialog"
            title="Press Escape to close dialog">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>

          <div class="modal-header">
            <img :src="selectedClassItem.thumbnail" :alt="'Thumbnail for ' + selectedClassItem.title" />
            <div class="modal-info">
              <h2 :id="'modal-title-' + selectedClassItem.id">{{ selectedClassItem.title }}</h2>
              <p class="modal-instructor" id="modal-instructor">with {{ selectedClassItem.instructor }}</p>
              <div class="modal-meta">
                <span class="modal-category" aria-label="Category">{{ selectedClassItem.category }}</span>
                <span class="modal-time" aria-label="Scheduled time">{{ formatTime(selectedClassItem.scheduledTime)
                  }}</span>
                <span class="modal-duration" aria-label="Session duration">{{ selectedClassItem.duration }}</span>
              </div>
            </div>
          </div>

          <div class="modal-description">
            <p>{{ selectedClassItem.description }}</p> <br>
            <p>{{ selectedClassItem.details }}</p>
          </div>

          <div class="modal-actions">
            <button class="primary-btn" @click="joinClass(selectedClassItem)" aria-label="Play this recorded session">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </button>
            <button class="secondary-btn" @click="toggleSubscription(selectedClassItem)"
              :class="{ subscribed: selectedClassItem.isSubscribed }" :aria-pressed="selectedClassItem.isSubscribed"
              :aria-label="selectedClassItem.isSubscribed ? `You are subscribed. Press to unsubscribe` : `Subscribe to this session to get notifications`">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {{ selectedClassItem.isSubscribed ? 'Subscribed' : 'Subscribe' }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="meetingModalItem"
        class="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-2xl"
        @click="closeMeetingModal" @keydown.escape="closeMeetingModal" role="presentation">
        <div ref="meetingModalContent"
          class="w-full max-w-[1100px] max-h-[90vh] overflow-hidden rounded-[24px] border border-white/10 bg-[#080920]/95 p-6 flex flex-col gap-6 shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
          @click.stop role="dialog" aria-modal="true" :aria-labelledby="'meeting-title-' + meetingModalItem.id"
          tabindex="-1">
          <button class="close-btn" type="button" @click="closeMeetingModal" aria-label="Close meeting preview">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>

          <div class="flex flex-col gap-1">
            <p class="text-[0.65rem] uppercase tracking-[0.25em] text-white/60">Live meeting</p>
            <h3 :id="'meeting-title-' + meetingModalItem.id" class="text-2xl font-semibold text-white">{{
              meetingModalItem.title }}</h3>
            <p class="text-sm text-white/70">with {{ meetingModalItem.instructor }}</p>
          </div>

          <div class="flex-1 flex items-center justify-center">
            <video v-if="meetingModalIsVideo" :src="meetingModalLink" controls autoplay playsinline
              class="w-full h-[min(60vh,480px)] rounded-[18px] border border-white/10 bg-black object-cover"></video>
            <iframe v-else :src="meetingModalLink"
              class="w-full h-[min(60vh,480px)] rounded-[18px] border border-white/10" loading="lazy"
              :title="`${meetingModalItem.title} meeting preview`"></iframe>
          </div>

          <div class="flex flex-wrap justify-end gap-3">
            <button class="primary-btn" type="button" :disabled="!meetingModalLink" @click="openMeetingInNewTab"
              aria-label="Open meeting link in a new tab">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v2H7v10h10v-5h2v7H5V5h7z" />
              </svg>
              Open on web
            </button>
            <button class="secondary-btn" type="button" @click="closeMeetingModal" aria-label="Close meeting preview">
              Close
            </button>
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

/* Screen reader only - hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Skip link - hidden but visible on focus */
.skip-link {
  position: absolute;
  left: -999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.skip-link:focus {
  left: 1rem;
  top: 1rem;
  width: auto;
  height: auto;
  padding: 0.5rem 1rem;
  background: #fff;
  color: #111;
  z-index: 2000;
  border-radius: 4px;
  text-decoration: none;
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
  background: url('../../../../public/images/background3.webp') center/cover;
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
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3), 0 0 0 3px rgba(102, 126, 234, 0.2);
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

.class-card:focus {
  outline: 3px solid #ffd93d;
  outline-offset: 2px;
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

.duration-badge {
  background: rgba(0, 0, 0, 0.7);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  backdrop-filter: blur(10px);
}

.pattern-icon {
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 10px 20px rgba(15, 23, 42, 0.4);
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

.action-btn:focus {
  outline: 2px solid #ffd93d;
  outline-offset: 2px;
}

.play-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.play-btn:hover {
  background: white;
  transform: scale(1.1);
}

.play-btn:focus {
  outline: 2px solid #ffd93d;
  outline-offset: 2px;
}

.subscribe-btn {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.subscribe-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(1.1);
}

.subscribe-btn:focus {
  outline: 2px solid #ffd93d;
  outline-offset: 2px;
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
  background: rgba(255, 255, 255, 0.15);
}

.close-btn:focus {
  outline: 2px solid #ffd93d;
  outline-offset: 2px;
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

.primary-btn:focus {
  outline: 2px solid #ffd93d;
  outline-offset: 2px;
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.4);
}

.secondary-btn:focus {
  outline: 2px solid #ffd93d;
  outline-offset: 2px;
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

.primary-btn:focus,
.secondary-btn:focus {
  outline: 3px solid #ffd93d;
  outline-offset: 3px;
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







.live-classes-upload {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Header Styles */
.header {
  position: relative;
  height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.header-content {
  text-align: center;
  z-index: 2;
  position: relative;
}

.title {
  font-size: 3.5rem;
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
  font-size: 1.3rem;
  opacity: 0.9;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  color: white;
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

/* Container Styles */
.upload-container {
  padding: 3rem 2rem;
  position: relative;
  z-index: 3;
}

.upload-card {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
}

/* Custom Input Styles */
:deep(.custom-input .v-field) {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 2px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

:deep(.custom-input .v-field:hover) {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(102, 126, 234, 0.5) !important;
}

:deep(.custom-input .v-field--focused) {
  background: rgba(255, 255, 255, 0.15) !important;
  border-color: #667eea !important;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3) !important;
}

:deep(.custom-input .v-field__input) {
  color: white !important;
  font-size: 1rem;
}

:deep(.custom-input .v-label) {
  color: rgba(255, 255, 255, 0.7) !important;
  font-weight: 500;
}

:deep(.custom-input .v-field__prepend-inner .v-icon) {
  color: rgba(255, 255, 255, 0.6) !important;
}

/* Custom Select Styles */
:deep(.custom-select .v-field) {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 2px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

:deep(.custom-select .v-field:hover) {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(102, 126, 234, 0.5) !important;
}

:deep(.custom-select .v-field--focused) {
  background: rgba(255, 255, 255, 0.15) !important;
  border-color: #667eea !important;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3) !important;
}

:deep(.custom-select .v-field__input) {
  color: white !important;
}

:deep(.custom-select .v-label) {
  color: rgba(255, 255, 255, 0.7) !important;
  font-weight: 500;
}

:deep(.custom-select .v-field__prepend-inner .v-icon) {
  color: rgba(255, 255, 255, 0.6) !important;
}

/* Custom Textarea Styles */
:deep(.custom-textarea .v-field) {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 2px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

:deep(.custom-textarea .v-field:hover) {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(102, 126, 234, 0.5) !important;
}

:deep(.custom-textarea .v-field--focused) {
  background: rgba(255, 255, 255, 0.15) !important;
  border-color: #667eea !important;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3) !important;
}

:deep(.custom-textarea .v-field__input) {
  color: white !important;
}

:deep(.custom-textarea .v-label) {
  color: rgba(255, 255, 255, 0.7) !important;
  font-weight: 500;
}

:deep(.custom-textarea .v-field__prepend-inner .v-icon) {
  color: rgba(255, 255, 255, 0.6) !important;
}

/* File Input Styles */
:deep(.custom-file-input .v-field) {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 2px dashed rgba(255, 255, 255, 0.3) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  min-height: 80px;
}

:deep(.custom-file-input .v-field:hover) {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(102, 126, 234, 0.6) !important;
  transform: translateY(-2px);
}

:deep(.custom-file-input .v-field__input) {
  color: white !important;
  padding: 1rem;
}

:deep(.custom-file-input .v-label) {
  color: rgba(255, 255, 255, 0.7) !important;
  font-weight: 500;
}

:deep(.custom-file-input .v-field__prepend-inner .v-icon) {
  color: rgba(255, 255, 255, 0.6) !important;
  font-size: 1.5rem;
}

/* Upload Section Styles */
.upload-section {
  padding: 2rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.upload-section-title {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}

.upload-section-title .v-icon {
  color: #667eea;
}

/* File Chip Styles */
.file-chip {
  background: linear-gradient(45deg, #667eea, #764ba2) !important;
  color: white !important;
  font-weight: 500;
  border-radius: 20px !important;
}

/* Preview Styles */
.video-preview {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-video {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.thumbnail-preview {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-thumbnail {
  max-width: 300px;
  max-height: 200px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  object-fit: cover;
}

/* Button Styles */
.upload-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

:deep(.primary-btn.v-btn) {
  background: linear-gradient(45deg, #667eea, #764ba2) !important;
  color: white !important;
  border-radius: 30px !important;
  padding: 0 2rem !important;
  font-weight: 600;
  text-transform: none;
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3) !important;
  transition: all 0.3s ease;
}

:deep(.primary-btn.v-btn:hover) {
  background: linear-gradient(45deg, #5a6fd8, #6a42a0) !important;
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4) !important;
}

:deep(.secondary-btn.v-btn) {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 30px !important;
  padding: 0 2rem !important;
  font-weight: 600;
  text-transform: none;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

:deep(.secondary-btn.v-btn:hover) {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  transform: translateY(-2px);
}

/* Progress Bar Styles */
:deep(.v-progress-linear) {
  border-radius: 10px !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

:deep(.v-progress-linear__determinate) {
  background: linear-gradient(45deg, #667eea, #764ba2) !important;
}

/* Error Message Styles */
:deep(.v-messages__message) {
  color: #ff6b6b !important;
  font-size: 0.875rem;
}

/* Dropdown Menu Styles */
:deep(.v-overlay__content .v-list) {
  background: rgba(15, 15, 35, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px !important;
}

:deep(.v-list-item) {
  color: white !important;
}

:deep(.v-list-item:hover) {
  background: rgba(102, 126, 234, 0.2) !important;
}

:deep(.v-list-item--active) {
  background: linear-gradient(45deg, #667eea, #764ba2) !important;
  color: white !important;
}

/* Snackbar Styles */
:deep(.v-snackbar .v-snackbar__wrapper) {
  background: rgba(15, 15, 35, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
}

:deep(.v-snackbar .v-snackbar__content) {
  color: white !important;
  font-weight: 500;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .title {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1.1rem;
  }

  .upload-container {
    padding: 2rem 1rem;
  }

  .upload-card {
    margin: 0 0.5rem;
  }

  :deep(.upload-card .v-card-text) {
    padding: 2rem 1.5rem !important;
  }

  .upload-section {
    padding: 1.5rem;
  }

  .upload-actions {
    flex-direction: column;
  }

  :deep(.primary-btn.v-btn),
  :deep(.secondary-btn.v-btn) {
    width: 100%;
    margin: 0.5rem 0;
  }

  .header {
    height: 35vh;
  }
}
</style>
