# Image List Implementation - Step by Step

## Overview
The `/api/image-list` endpoint extracts images from the simulations API (`https://opschool.tie.go.tz:5001/v1/simulations`) and makes them available for display on the `/image-list` page and for use by the AI teacher.

---

## Step-by-Step Implementation

### **Step 1: API Request Setup**
**Location:** `server/api/image-list.ts` (lines 142-197)

1. **Get Authentication Token**
   - Retrieves `signInAccessToken` from cookies using `getCookie(event, "signInAccessToken")`
   - This token is required for the simulations API

2. **Build Request Headers**
   ```typescript
   headers: {
     'Content-Type': 'application/json',
     'Accept': 'application/json',
     'Authorization': `Bearer ${auth_token}` // If token exists
   }
   ```

3. **Make API Call**
   - Uses Nuxt's `$fetch` utility to call `https://opschool.tie.go.tz:5001/v1/simulations`
   - Timeout: 30 seconds
   - No automatic retries
   - Handles SSL certificate errors gracefully

### **Step 2: Parse API Response**
**Location:** `server/api/image-list.ts` (lines 199-218)

1. **Handle Response Structure**
   - API may return:
     - Direct array: `[{simulation1}, {simulation2}, ...]`
     - Wrapped object: `{data: [{simulation1}, {simulation2}, ...]}`
   - Code handles both: `Array.isArray(simulationsData) ? simulationsData : simulationsData.data || []`

2. **Log Response Structure**
   - Logs the first simulation's keys to understand the API structure
   - Checks for image fields and description fields

### **Step 3: Extract Images from Each Simulation**
**Location:** `server/api/image-list.ts` (lines 220-326)

For each simulation object, the code extracts images in **two ways**:

#### **Method A: Direct Image Fields** (lines 222-295)
Checks for image paths in these fields (in priority order):
- `simulation.simulationFileUrl` / `simulation.simulation_file_url` / `simulation.simulationFileURL` (primary)
- `simulation.image`
- `simulation.thumbnail`
- `simulation.preview`
- `simulation.imageUrl` / `simulation.image_url`
- `simulation.coverImage` / `simulation.cover_image`
- `simulation.poster`
- `simulation.icon`

**For each image found:**
1. **Create Shortcode from Description**
   - **Primary**: Uses description text to generate shortcode
   - **Fallback**: Uses alt text (name/title/label) if no description
   - **Final Fallback**: Uses filename if neither description nor alt text available
   - Sanitizes text: converts to lowercase, removes special chars, replaces spaces with underscores
   - Limits to 50 characters for readability
   - Prefixes with category (e.g., `biology_`, `physics_`, `simulation_`)
   - Ensures uniqueness by appending numbers if duplicate (`shortcode_1`, `shortcode_2`, etc.)
   - Examples:
     - Description: "Cell structure diagram showing organelles" → `biology_cell_structure_diagram_showing`
     - No description, alt: "Cell Structure" → `biology_cell_structure`
     - No description/alt, path: `/images/cell.jpg` → `biology_cell_jpg`

2. **Determine Category**
   - Searches entire simulation object (JSON stringified) for keywords:
     - **Biology**: "biology", "bio", "cell"
     - **Physics**: "physics", "wave", "circuit"
     - **Chemistry**: "chemistry", "molecule"
     - **Mathematics**: "math", "geometry"
     - **General**: default if no match

3. **Extract Description**
   - Checks these fields (in priority order):
     - `simulation.description`
     - `simulation.desc`
     - `simulation.summary`
     - `simulation.about`
     - `simulation.details`
   - **Cleans HTML tags** using regex: `/<[^>]*>/g`
   - **Limits length** to 500 characters (adds "..." if truncated)

4. **Extract Metadata**
   - **Alt text**: `simulation.name` || `simulation.title` || `simulation.label` || "Simulation image"
   - **Chapter name**: `simulation.chapterName` || `simulation.chapter_name`
   - **Topic name**: `simulation.topicName` || `simulation.topic_name` || `simulation.subject`

#### **Method B: Embedded Images in HTML Content** (lines 297-325)
If simulation has HTML content, extracts `<img>` tags:

1. **Check Content Fields**
   - `simulation.content`
   - `simulation.description`
   - `simulation.html`
   - `simulation.body`

2. **Extract Images from HTML**
   - Uses regex: `/<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi`
   - Skips data URIs and invalid paths
   - Creates shortcodes: `chapter_{sanitized_path}`
   - Uses same category detection logic
   - Inherits description from simulation object

### **Step 4: Apply Filters**
**Location:** `server/api/image-list.ts` (lines 387-412)

1. **Category Filter**
   - Filters by: `biology`, `physics`, `chemistry`, `mathematics`, `general`
   - Applied if `?category=biology` is in query string

2. **Keyword Filter**
   - Searches in:
     - `image.alt`
     - `image.path`
     - `image.shortcode`
     - `image.description` ✨ (newly added)
     - `image.chapterName`
     - `image.topicName`
   - Case-insensitive partial match
   - Applied if `?keyword=cell` is in query string

3. **Limit**
   - Limits results to N items
   - Applied if `?limit=20` is in query string

### **Step 5: Group by Category**
**Location:** `server/api/image-list.ts` (lines 414-421)

Creates separate arrays for each category:
- `byCategory.biology`
- `byCategory.physics`
- `byCategory.chemistry`
- `byCategory.mathematics`
- `byCategory.general`

### **Step 6: Return Response**
**Location:** `server/api/image-list.ts` (lines 423-442)

Returns JSON with:
```typescript
{
  success: true,
  total: number,           // Total images found
  filtered: number,        // Images after filters
  filters: {
    category: string,
    keyword: string | null,
    limit: number | null
  },
  byCategory: {
    biology: number,
    physics: number,
    chemistry: number,
    mathematics: number,
    general: number
  },
  images: Array<ImageItem>, // Filtered images
  categories: {              // Full categorized lists
    biology: Array<ImageItem>,
    physics: Array<ImageItem>,
    // ...
  }
}
```

**ImageItem Structure:**
```typescript
{
  path: string,              // Image URL/path
  alt: string,               // Alt text (name/title/label)
  shortcode: string,         // e.g., "simulation_cell_diagram"
  category: string,          // biology|physics|chemistry|mathematics|general
  description?: string,      // Cleaned description (HTML stripped, max 500 chars)
  chapterName?: string,      // Chapter name if available
  topicName?: string         // Topic name if available
}
```

---

## Expected API Fields from `/v1/simulations`

Based on the implementation, the API should return an array of simulation objects with the following fields:

### **Image Fields** (checked in priority order):
- `simulationFileUrl` / `simulation_file_url` / `simulationFileURL` - **Primary field** for simulation file/image URL
- `image` - Fallback image path
- `thumbnail` - Thumbnail image path
- `preview` - Preview image path
- `imageUrl` or `image_url` - Alternative image URL
- `coverImage` or `cover_image` - Cover image
- `poster` - Poster image
- `icon` - Icon image

### **Description Fields** (checked in priority order):
- `description` - Main description
- `desc` - Short description
- `summary` - Summary text
- `about` - About text
- `details` - Details text

### **Content Fields** (for HTML extraction):
- `content` - HTML content with embedded images
- `html` - HTML markup
- `body` - Body content

### **Metadata Fields**:
- `name` - Simulation name (used for alt text)
- `title` - Simulation title (fallback for alt text)
- `label` - Simulation label (fallback for alt text)
- `chapterName` or `chapter_name` - Chapter name
- `topicName` or `topic_name` - Topic name
- `subject` - Subject name (fallback for topic name)

### **Response Structure**:
The API can return either:
1. **Direct Array:**
   ```json
   [
     {
       "name": "Cell Structure",
       "image": "/images/cell.jpg",
       "description": "A diagram showing cell structure",
       "chapterName": "Biology Basics",
       "topicName": "Cells"
     },
     ...
   ]
   ```

2. **Wrapped Object:**
   ```json
   {
     "data": [
       {
         "name": "Cell Structure",
         "image": "/images/cell.jpg",
         ...
       },
       ...
     ]
   }
   ```

---

## Shortcode Persistence

**Location:** `server/data/image-shortcodes.json`

All dynamically generated shortcodes are automatically saved to a JSON file after extraction. The file structure:

```json
{
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "total": 150,
  "byCategory": {
    "biology": 45,
    "physics": 38,
    "chemistry": 32,
    "mathematics": 25,
    "general": 10
  },
  "shortcodes": {
    "biology_cell_structure_diagram": {
      "path": "/images/simulations/cell.jpg",
      "alt": "Cell Structure",
      "category": "biology",
      "description": "A detailed diagram showing cell structure",
      "chapterName": "Cell Biology",
      "topicName": "Cell Structure"
    },
    ...
  },
  "images": [
    // Full array of all images with complete metadata
  ]
}
```

**When it's saved:**
- Automatically saved after successful extraction from simulations API
- Updated each time `/api/image-list` is called and images are found
- Non-blocking: If file write fails, the API still returns successfully

**File location:** `server/data/image-shortcodes.json`

---

## Frontend Display (`/image-list` page)

**Location:** `app/pages/image-list.vue`

1. **Fetches Data**
   - Uses `useFetch('/api/image-list')` to get images
   - Supports query parameters: `?category=biology&keyword=cell&limit=20`

2. **Displays Images**
   - Grid layout with image cards
   - Each card shows:
     - Image thumbnail
     - Category badge (color-coded)
     - Title (alt text)
     - **Description** (with left border, "Description:" label, max 3 lines)
     - Shortcode (copyable)
     - Chapter name (if available)
     - Topic name (if available)

3. **Filtering UI**
   - Category dropdown filter
   - Keyword search input
   - Results count display

---

## Error Handling

1. **No Authentication Token**
   - Returns empty result with error message
   - Does not throw 500 error

2. **API Request Fails**
   - Logs detailed error information
   - Returns empty result with error message
   - No database fallback (as per user requirement)

3. **No Images Found**
   - Returns success response with empty array
   - Includes helpful message

4. **Invalid Response Structure**
   - Handles both array and object responses
   - Defaults to empty array if structure is unexpected

---

## Logging

The implementation includes extensive logging:
- API request start/completion
- Response structure analysis
- First simulation's field structure
- Description extraction success
- Total images extracted
- Error details with stack traces

Check server console logs when accessing `/image-list` to see:
- What fields are actually in the API response
- Whether descriptions are being found
- Any errors during extraction

