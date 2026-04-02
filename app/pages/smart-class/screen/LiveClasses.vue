<template>

  <NuxtLayout
    :name="route.fullPath.includes('header-less') ? 'normal' : 'home-layout'"
    :language="route.fullPath.includes('header-less') ? undefined : pageLanguage"
  >
    <a class="skip-link" href="#main-content" @click.prevent="focusMain">Skip to main content</a>

  <v-dialog v-model="dialog" max-width="600px">
    <v-card>
      <v-card-title id="create-session-title">Create Session</v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="isValid" aria-labelledby="create-session-title">
          <v-row>
            <v-col cols="12" sm="6">
              <v-select
                  v-model="formData.school_class"
                  :items="[
                { id: 1, name: 'Form One' },
                { id: 2, name: 'Form Two' }
              ]"
                  item-title="name"
                  item-value="id"
                  label="Select Class"
                  :rules="[v => !!v || 'Class is required']"
                  aria-label="Select the school class for this session"
                  aria-required="true"
                  aria-describedby="class-error"
              />
              <small id="class-error" class="sr-only-text">This field is required. Choose the class where this live session will be held.</small>
            </v-col>

            <v-col cols="12" sm="6">
              <v-select
                  v-model="formData.subject"
                  :items="[
                { id: 1, name: 'Geography' },
                { id: 2, name: 'Physics' }
              ]"
                  item-title="name"
                  item-value="id"
                  label="Subject"
                  :rules="[v => !!v || 'Subject is required']"
                  aria-label="Select the subject for this session"
                  aria-required="true"
                  aria-describedby="subject-error"
              />
              <small id="subject-error" class="sr-only-text">This field is required. Choose the subject that will be taught in this session.</small>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                  v-model="formData.start_time"
                  label="Start Time"
                  type="time"
                  :rules="[v => !!v || 'Required']"
                  aria-label="Select the session start time"
                  aria-required="true"
                  aria-describedby="start-time-error"
              />
              <small id="start-time-error" class="sr-only-text">This field is required. Enter the time when the live session will begin.</small>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                  v-model="formData.end_time"
                  label="End Time"
                  type="time"
                  :rules="[v => !!v || 'Required']"
                  aria-label="Select the session end time"
                  aria-required="true"
                  aria-describedby="end-time-error"
              />
              <small id="end-time-error" class="sr-only-text">This field is required. Enter the time when the live session will end.</small>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                  v-model="formData.topic"
                  label="Topic"
                  :rules="[v => !!v || 'Required']"
                  aria-label="Enter the session topic or title"
                  aria-required="true"
                  aria-describedby="topic-error"
              />
              <small id="topic-error" class="sr-only-text">This field is required. Enter a descriptive title or topic for this session.</small>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                  v-model="formData.room_name"
                  label="Room Name"
                  :rules="[v => !!v || 'Required']"
                  aria-label="Enter the meeting room name or identifier"
                  aria-required="true"
                  aria-describedby="room-error"
              />
              <small id="room-error" class="sr-only-text">This field is required. Enter the name of the room where the session will be held.</small>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="12">
              <v-text-field
                  v-model="formData.details"
                  label="Details"
                  :rules="[v => !!v || 'Required']"
                  aria-label="Enter additional session details or description"
                  aria-required="true"
                  aria-describedby="details-error"
              />
              <small id="details-error" class="sr-only-text">This field is required. Provide additional information about the session that students should know.</small>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn 
          color="blue darken-1" 
          text 
          @click="dialog = false"
          aria-label="Close dialog without saving"
        >
          Cancel
        </v-btn>
        <v-btn 
          color="blue darken-1" 
          text 
          @click="submit"
          aria-label="Submit and create the new session"
        >
          Submit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div id="main-content" class="live-classes" role="main" tabindex="-1" aria-label="Live Classes main content">
    <!-- Header Section -->
    <div class="header">
      <div class="header-content">
        <h1 class="title">Live Classes</h1>
        <p class="subtitle">Discover amazing live streaming sessions</p>
      </div>
      <div class="header-gradient"></div>
    </div>

    <!-- Filter Section -->
     <div class="filters-section" role="region" aria-label="Search and filter controls">
       <v-container fluid class="filters-section pa-4" elevation="1">
         <v-row>
           <v-col cols="12" class="d-flex justify-end">
             <v-btn 
               color="primary" 
               prepend-icon="mdi-plus" 
               @click="onCreate"
               aria-label="Create new live class session"
             >
               Create
             </v-btn>
           </v-col>
         </v-row>
         <v-row dense align="center" class="pa-2">
           <!-- Search Field -->
           <v-col cols="12" sm="6" md="4" lg="3">
             <label for="search-field" class="sr-only-label">Search classes</label>
             <v-text-field
                 id="search-field"
                 v-model="searchQuery"
                 label="Search classes..."
                 prepend-inner-icon="mdi-magnify"
                 variant="outlined"
                 dense
                 clearable
                 hide-details
                 aria-label="Search for live classes by title, instructor, or category"
                 aria-describedby="search-help"
                 @keydown.enter="$event.target.blur()"
             />
             <small id="search-help" class="sr-only-text">
               Type to filter classes by title, instructor name, or category. Results update as you type.
             </small>
           </v-col>

           <!-- Category Dropdown 1 -->
           <v-col cols="12" sm="6" md="4" lg="3">
             <label for="category-filter-1" class="sr-only-label">Filter by first category</label>
             <v-select
                 id="category-filter-1"
                 v-model="selectedCategory"
                 :items="['all', ...categories]"
                 label="Category"
                 variant="outlined"
                 dense
                 hide-details
                 aria-label="Filter classes by category (first filter)"
                 aria-describedby="category-help-1"
             />
             <small id="category-help-1" class="sr-only-text">
               Select a category to filter displayed classes, or select 'all' to show all categories.
             </small>
           </v-col>

           <!-- Category Dropdown 2 -->
           <v-col cols="12" sm="6" md="4" lg="3">
             <label for="category-filter-2" class="sr-only-label">Filter by second category</label>
             <v-select
                 id="category-filter-2"
                 v-model="selectedCategory"
                 :items="['all', ...categories]"
                 label="Category"
                 variant="outlined"
                 dense
                 hide-details
                 aria-label="Filter classes by category (second filter)"
                 aria-describedby="category-help-2"
             />
             <small id="category-help-2" class="sr-only-text">
               Select a category to filter displayed classes, or select 'all' to show all categories.
             </small>
           </v-col>

           <!-- Category Dropdown 3 -->
           <v-col cols="12" sm="6" md="4" lg="3">
             <label for="category-filter-3" class="sr-only-label">Filter by third category</label>
             <v-select
                 id="category-filter-3"
                 v-model="selectedCategory"
                 :items="['all', ...categories]"
                 label="Category"
                 variant="outlined"
                 dense
                 hide-details
                 aria-label="Filter classes by category (third filter)"
                 aria-describedby="category-help-3"
             />
             <small id="category-help-3" class="sr-only-text">
               Select a category to filter displayed classes, or select 'all' to show all categories.
             </small>
           </v-col>

         </v-row>
       </v-container>
     </div>


    <!-- Classes Grid -->
    <div class="classes-container" role="region" aria-label="Live classes list" aria-live="polite" aria-atomic="false">
      <div class="classes-grid" role="list">
        <div
          v-for="classItem in filteredClasses"
          :key="classItem.id"
          class="class-card"
          role="listitem"
          :aria-label="`${classItem.title} with ${classItem.instructor}, Category: ${classItem.category}, ${classItem.isLive ? 'Currently live, ' : ''}${classItem.viewers} viewers`"
          tabindex="0"
          @click="selectClass(classItem)"
          @keydown.enter.prevent="selectClass(classItem)"
          @keydown.space.prevent="selectClass(classItem)"
        >
          <div class="card-image">
            <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop" :alt="classItem.title" />
            <div class="card-overlay">
              <div class="live-badge" v-if="classItem.isLive">
                <span class="live-dot"></span>
                LIVE
              </div>
              <div class="duration-badge">{{ classItem.duration }}</div>
            </div>
            <div class="hover-actions">
              <button 
                class="action-btn play-btn" 
                :aria-label="`Play ${classItem.title}. Current status: ${classItem.isLive ? 'LIVE' : 'Not started'}`"
                @keydown.enter.prevent="joinClass(classItem)"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
                <button
                  class="action-btn subscribe-btn"
                  @click.stop="toggleSubscription(classItem)"
                  :class="{ subscribed: classItem.isSubscribed }"
                  :aria-pressed="classItem.isSubscribed"
                  :aria-label="classItem.isSubscribed ? `You are subscribed to ${classItem.title}. Press to unsubscribe` : `Subscribe to ${classItem.title} to get notifications about future sessions`"
                >
                
                <svg viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
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
              <span class="rating">
                <svg class="star-icon" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {{ classItem.rating }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Class Modal -->
      <div v-if="selectedClassItem" class="modal-overlay" @click="closeModal" @keydown.escape="closeModal">
      <div ref="modalContent" class="modal-content" @click.stop role="dialog" aria-modal="true" :aria-labelledby="'modal-title-' + selectedClassItem.id">
        <button 
          class="close-btn" 
          @click="closeModal" 
          aria-label="Close class details dialog"
          title="Press Escape to close dialog (Ctrl+Alt+W)"
        >
          <svg viewBox="0 0 24 24">
            <path d="M6 6l12 12M6 18L18 6"/>
          </svg>
        </button>

        <div class="modal-header">
          <img :src="selectedClassItem.thumbnail" :alt="'Thumbnail for ' + selectedClassItem.title" />
          <div class="modal-info">
            <h2 :id="'modal-title-' + selectedClassItem.id">{{ selectedClassItem.title }}</h2>
            <p class="modal-instructor" id="modal-instructor">with {{ selectedClassItem.instructor }}</p>
            <div class="modal-meta">
              <span class="modal-category" aria-label="Category">{{ selectedClassItem.category }}</span>
              <span class="modal-time" aria-label="Scheduled time">{{ formatTime(selectedClassItem.scheduledTime) }}</span>
              <span class="modal-duration" aria-label="Session duration">{{ selectedClassItem.duration }}</span>
            </div>
          </div>
        </div>

        <div class="modal-description">
          <p>{{ selectedClassItem.description }}</p>  <br>
          <p>{{ selectedClassItem.details }}</p>
        </div>

        <div class="modal-actions">
          <button 
            class="primary-btn" 
            @click="joinClass(selectedClassItem)" 
            aria-label="Join this class session now"
          >
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Join Class
          </button>
            <button
              class="secondary-btn"
              @click="toggleSubscription(selectedClassItem)"
              :class="{ subscribed: selectedClassItem.isSubscribed }"
              :aria-pressed="selectedClassItem.isSubscribed"
              :aria-label="selectedClassItem.isSubscribed ? `You are subscribed. Click to unsubscribe from ${selectedClassItem.title}` : `Subscribe to ${selectedClassItem.title} to receive future session notifications`"
            >
            <svg viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {{ selectedClassItem.isSubscribed ? 'Subscribed' : 'Subscribe' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container" role="status" aria-live="polite" aria-atomic="true">
      <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="toast.type"
          :aria-label="toast.message"
        >
        {{ toast.message }}
      </div>
    </div>
  </div>
  </NuxtLayout>
</template>

<script setup >
import {ref, reactive, computed, onMounted, nextTick} from 'vue';
import { useRouter } from 'vue-router';
import axios from "axios";
import {useSessionsSetup} from "../../../composables/usesSessions.js";

const router = useRouter();
const route = useRoute();
const pageLanguage = useHubPageLanguage();

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

const mapSessionToClass = (session) => ({
  id: session.id,
  title: session.topic || 'Untitled Session',
    details: session.details || 'Karibu  sana',

  meet_link: session.meet_link || 'https://tv.somakwanza.tz',
  instructor: session.teacher ? `Instructor ${session.teacher}` : 'Unknown Instructor',
  category: session.subject ? `${session.subject.name}` : 'General',
  thumbnail: 'https://via.placeholder.com/400x225.png?text=Class+Thumbnail',
  scheduledTime: session.start_time ? new Date(session.created_at) : null, // or session.start_time if valid ISO
  duration: getDuration(session.start_time, session.end_time),
  viewers: Math.floor(Math.random() * 1000),
  rating: (Math.random() * 2 + 3).toFixed(1),
  isLive: session.session_start || false,
  isSubscribed: false,
  description: `Room: ${session.room_name || 'N/A'}${session.meet_link ? ', Meet Link available' : ''}`
});

const loadClasses = async () => {
  loading.value = true;
  try {
    const tokenRes = await axios.post('/api/auth/token/', {
      username: 'Nick',
      password: 1234
    });
    const { access } = tokenRes.data;

    const sessions = await getData(access);
    if (Array.isArray(sessions)) {
      classes.value = sessions.map(mapSessionToClass);
    } else {
      console.error('Expected array of sessions but got:', sessions);
      classes.value = [];
    }
  } catch (error) {
    console.error('Error fetching sessions:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
   loadClasses();
});

// Refs and reactive state
const searchQuery = ref('');
const selectedCategory = ref('all');
const selectedClassItem = ref(null);
const modalContent = ref(null);
const dialog = ref(false);
const toasts = ref([]);
const school_classes = ref([]);
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

// Sample data
const schoolClasses = ref([
  { id: 1, name: 'Class 1' },
  { id: 2, name: 'Class 2' }
]);

const subjects = ref([
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'Science' }
]);

const categories = ref(['Programming', 'Design', 'Business', 'Marketing', 'Photography']);

const classes = ref([
  {
    id: 1,
    title: 'TET SomaKwanza TV',
    instructor: '',
    category: 'Programming',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    duration: '2h 30m',
    viewers: 1247,
    rating: 4.9,
    isLive: true,
    isSubscribed: false,
    description: 'Deep dive into advanced Vue.js concepts including composition API, custom directives, and performance optimization techniques.'
  },
 
]);

// Import your composable
const { postData, loading, error ,getData} = useSessionsSetup();
// Show toast function (replace with your UI lib's toast/snackbar)



// Computed
const filteredClasses = computed(() => {
  let filtered = classes.value;

  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(cls => cls.category === selectedCategory.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(cls =>
        cls.title.toLowerCase().includes(query) ||
        cls.instructor.toLowerCase().includes(query) ||
        cls.category.toLowerCase().includes(query)
    );
  }

  return filtered;
});

// Validation rules
const required = v => !!v || 'This field is required';
const minLength = min => v => (v && v.length >= min) || `Min ${min} characters`;

// Form submit
// Submit handler
const submit = async () => {

  try {
    const payload = JSON.parse(JSON.stringify(formData)); // deep clone, usually unnecessary here
    try {
      const response = await axios.post('/api/auth/token/', {
        username: 'Nick',
        password: 1234
      });


      const { access } = response.data;
      // Call API
      await postData(payload,access);

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
      // ignore focus errors
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
// };

const joinClass = (selectedClassItem) => {
  localStorage.setItem('classData', JSON.stringify(selectedClassItem));
  router.push({ path: '/main/live-view' });
};



const onCreate = () => {
  console.log("Sdefdsdf");
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

/* Screen reader only text - for accessibility hints */
.sr-only-label,
.sr-only-text {
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

/* Enhanced focus indicators for keyboard navigation */
.class-card:focus,
.action-btn:focus,
.primary-btn:focus,
.secondary-btn:focus,
.filter-chip:focus,
.search-input:focus,
.v-text-field:focus-within,
.v-select:focus-within {
  outline: 3px solid #ffd93d;
  outline-offset: 2px;
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
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  background: linear-gradient(45deg, #ff6b6b, #ffd93d, #6bcf7f, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 3s ease-in-out infinite;
}

@keyframes gradient-shift {
  0%, 100% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(180deg); }
}

.subtitle {
  font-size: 1.5rem;
  opacity: 0.9;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
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
  background: rgba(255,255,255,0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.1);
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
  stroke: rgba(255,255,255,0.5);
  stroke-width: 2;
  fill: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 50px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.search-input:focus {
  outline: none;
  border-color: #ffd93d;
  background: rgba(255,255,255,0.15);
  box-shadow: 0 0 20px rgba(255, 217, 61, 0.5);
}

.search-input::placeholder {
  color: rgba(255,255,255,0.5);
}

.filter-chips {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 0.75rem 1.5rem;
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 30px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.filter-chip:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-2px);
}

.filter-chip.active {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-color: #667eea;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
}

.filter-chip:focus {
  outline: 3px solid #ffd93d;
  outline-offset: 2px;
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
  background: rgba(255,255,255,0.05);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
}

.class-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  background: rgba(255,255,255,0.1);
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
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.duration-badge {
  background: rgba(0,0,0,0.7);
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
  background: rgba(255,255,255,0.9);
  color: #333;
}

.play-btn:hover {
  background: white;
  transform: scale(1.1);
}

.subscribe-btn {
  background: rgba(255,255,255,0.2);
  color: white;
}

.subscribe-btn:hover {
  background: rgba(255,255,255,0.3);
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
  color: rgba(255,255,255,0.85);
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
  color: rgba(255,255,255,0.8);
  font-size: 0.9rem;
}

.class-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255,255,255,0.85);
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
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.modal-content {
  background: rgba(15,15,35,0.95);
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
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
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.3);
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
  color: rgba(255,255,255,0.85);
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

.modal-time, .modal-duration {
  color: rgba(255,255,255,0.8);
  font-size: 0.9rem;
}

.modal-description {
  margin-bottom: 2rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.95);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.primary-btn, .secondary-btn {
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
  background: rgba(255,255,255,0.1);
  color: white;
  border: 2px solid rgba(255,255,255,0.2);
}

.secondary-btn:hover {
  background: rgba(255,255,255,0.2);
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

.primary-btn svg, .secondary-btn svg {
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
  background: rgba(15,15,35,0.95);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
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

  .primary-btn, .secondary-btn {
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
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.loading-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}

/* Scrollbar Styles */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.3);
  border-radius: 10px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.5);
}

/* Custom Focus Styles */
.class-card:focus {
  outline: 3px solid #ffd93d;
  outline-offset: 2px;
}

.action-btn:focus {
  outline: 3px solid #ffd93d;
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
</style>
