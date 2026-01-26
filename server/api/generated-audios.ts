import { defineEventHandler, getQuery, getCookie } from "h3";
import { readFile } from "fs/promises";
import { join } from "path";

const EKIMA_API_BASE_URL = process.env.EKIMA_API_BASE_URL || "https://apitie.ekima.africa/v1";

async function loadSettings(): Promise<any> {
  try {
    const settingsPath = join(process.cwd(), "server", "data", "settings.json");
    const settingsContent = await readFile(settingsPath, "utf-8");
    return JSON.parse(settingsContent);
  } catch {
    return {};
  }
}

interface ChapterAudio {
  id?: string;
  _id?: string;
  chapter?: string;
  chapter_id?: string;
  chapterId?: string;
  chapterName?: string;
  title?: string;
  name?: string;
  type?: string;
  filepath?: string;
  url?: string;
  audio_url?: string;
  audioFileUrl?: string;
  created?: string;
  createdAt?: string;
  updated?: string;
  updatedAt?: string;
  description?: string;
  [key: string]: any;
}

interface AudioFileInfo {
  id: string;
  filename: string;
  name: string;
  size?: number;
  created: string;
  modified: string;
  url: string;
  downloadUrl: string;
  type: string;
  audioFileUrl: string;
  chapterId?: string;
  chapterName?: string;
  voiceType?: string;
  thumbnail?: string;
  description?: string;
}

async function getAuthToken(event: any): Promise<string | null> {
  // Priority: cookie > settings file > environment variable
  const cookieToken = getCookie(event, "token") || 
                      getCookie(event, "signInAccessToken");
  
  if (cookieToken) {
    return cookieToken;
  }
  
  // Try settings file
  try {
    const settings = await loadSettings();
    if (settings.auth_token) {
      return settings.auth_token;
    }
  } catch {
    // Settings file not found or invalid, continue
  }
  
  return process.env.AUTH_TOKEN || process.env.auth_token || null;
}

// Helper function to fetch with timeout
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

function extractAudioFromChapters(chapters: any[]): ChapterAudio[] {
  const audios: ChapterAudio[] = [];
  
  for (const chapter of chapters) {
    const chapterId = chapter.id || chapter._id;
    const chapterName = chapter.name || chapter.title || chapter.chapterName || '';
    
    // Check for single audio object
    if (chapter.audio && typeof chapter.audio === 'object') {
      audios.push({
        ...chapter.audio,
        chapter: chapterId || chapterName,
        chapter_id: chapterId,
        chapterId: chapterId,
        chapterName: chapterName,
      });
    }
    
    // Check for audios array
    if (Array.isArray(chapter.audios)) {
      chapter.audios.forEach((audio: any) => {
        audios.push({
          ...audio,
          chapter: chapterId || chapterName,
          chapter_id: chapterId,
          chapterId: chapterId,
          chapterName: chapterName,
        });
      });
    }
    
    // Check for audioFiles array
    if (Array.isArray(chapter.audioFiles)) {
      chapter.audioFiles.forEach((audio: any) => {
        audios.push({
          ...audio,
          chapter: chapterId || chapterName,
          chapter_id: chapterId,
          chapterId: chapterId,
          chapterName: chapterName,
        });
      });
    }
  }
  
  return audios;
}

function transformAudioData(audio: ChapterAudio, chapterMap?: Map<string, { id: string; name: string }>): AudioFileInfo {
  const id = audio.id || audio._id || `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const url = audio.url || audio.filepath || audio.audio_url || audio.audioFileUrl || '';
  const filename = url ? url.split('/').pop() || `audio-${id}.mp3` : `audio-${id}.mp3`;
  const name = audio.title || audio.name || filename;
  
  // Determine content type from file extension
  const extension = filename.split('.').pop()?.toLowerCase() || 'mp3';
  const contentTypeMap: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'ogg': 'audio/ogg',
    'aac': 'audio/aac',
  };
  const type = contentTypeMap[extension] || 'audio/mpeg';
  
  // Date normalization
  const created = audio.createdAt || audio.created || new Date().toISOString();
  const modified = audio.updatedAt || audio.updated || created;
  
  // Get chapter ID and name
  const chapterId = audio.chapterId || audio.chapter_id || audio.chapter;
  let chapterName = audio.chapterName;
  
  // If chapter name not in audio data, try to get from chapter map
  if (!chapterName && chapterId && chapterMap) {
    const chapterInfo = chapterMap.get(chapterId);
    if (chapterInfo) {
      chapterName = chapterInfo.name;
    }
  }
  
  return {
    id,
    filename,
    name,
    created,
    modified,
    url,
    downloadUrl: url,
    type,
    audioFileUrl: url,
    chapterId: chapterId,
    chapterName: chapterName,
    voiceType: audio.type || undefined,
    description: audio.description,
  };
}

export default defineEventHandler(async (event) => {
  try {
    const authToken = await getAuthToken(event);
    
    if (!authToken) {
      return {
        error: "Authentication required",
        audios: [],
        count: 0,
      };
    }
    
    const query = getQuery(event);
    let chapterId = query.chapterId as string | undefined;
    const voiceType = query.voiceType as string | undefined; // "male" or "female"
    
    // Require chapterId - no fallbacks
    if (!chapterId) {
      return {
        error: "chapterId is required",
        audios: [],
        count: 0,
      };
    }
    
    // Normalize chapterId - ensure it's a string and trim whitespace
    const originalChapterId = chapterId;
    chapterId = String(chapterId).trim();
    
    if (!chapterId || chapterId.length === 0) {
      return {
        error: "chapterId cannot be empty",
        audios: [],
        count: 0,
      };
    }
    
    // Log the request details for debugging
    const requestUrl = event.node.req.url;
    console.log(`[generated-audios] Request received - URL: ${requestUrl}`);
    console.log(`[generated-audios] Fetching audios for chapterId: ${chapterId}${originalChapterId !== chapterId ? ` (normalized from: ${originalChapterId})` : ''}`);
    
    let allAudios: ChapterAudio[] = [];
    let chaptersMap = new Map<string, { id: string; name: string }>();
    
    // Directly fetch from /chapters/{id} - no fallbacks
    try {
      const chapterResponse = await fetchWithTimeout(
        `${EKIMA_API_BASE_URL}/chapters/${chapterId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json',
          },
        },
        10000 // 10 second timeout
      );
      
      if (!chapterResponse.ok) {
        const errorText = await chapterResponse.text().catch(() => 'Unknown error');
        throw new Error(`Chapter fetch failed with status ${chapterResponse.status}: ${errorText}`);
      }
      
      // Safely read response as text first
      const responseText = await chapterResponse.text().catch(() => '');
      
      // Handle empty response
      if (!responseText || responseText.trim().length === 0) {
        console.warn(`[generated-audios] Empty response for chapter ${chapterId}`);
        return {
          error: "Chapter returned empty response - no audios available",
          audios: [],
          count: 0,
        };
      }
      
      // Check content-type if available
      const contentType = chapterResponse.headers.get('content-type') || '';
      if (contentType && !contentType.includes('application/json') && !contentType.includes('text/')) {
        console.warn(`[generated-audios] Unexpected content-type ${contentType} for chapter ${chapterId}`);
        // Still try to parse as JSON in case content-type is wrong
      }
      
      // Safely parse JSON
      let chapterData;
      try {
        chapterData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[generated-audios] Invalid JSON for chapter ${chapterId}:`, responseText.substring(0, 200));
        return {
          error: `Invalid response format from chapter endpoint`,
          audios: [],
          count: 0,
        };
      }
      
      // Validate that we got valid chapter data
      if (!chapterData || (typeof chapterData !== 'object')) {
        console.warn(`[generated-audios] Invalid chapter data structure for ${chapterId}`);
        return {
          error: "Invalid chapter data structure",
          audios: [],
          count: 0,
        };
      }
      
      const chapterIdValue = chapterData.id || chapterData._id || chapterId;
      const chapterName = chapterData.name || chapterData.title || chapterData.chapterName || '';
      
      // Store chapter info for name lookup
      if (chapterIdValue) {
        chaptersMap.set(chapterIdValue.toString(), { 
          id: chapterIdValue.toString(), 
          name: chapterName 
        });
      }
      
      // Extract audios from this specific chapter
      allAudios = extractAudioFromChapters([chapterData]);
      
      console.log(`[generated-audios] Found ${allAudios.length} audio(s) for chapter ${chapterId}`);
    } catch (error) {
      console.error(`[generated-audios] Failed to fetch chapter ${chapterId}:`, error);
      return {
        error: error instanceof Error ? error.message : "Failed to fetch chapter",
        audios: [],
        count: 0,
      };
    }
    
    // Transform audio data
    let transformedAudios = allAudios.map(audio => transformAudioData(audio, chaptersMap));
    
    // Filter by chapterId if provided
    if (chapterId) {
      transformedAudios = transformedAudios.filter(audio => 
        audio.chapterId === chapterId || 
        audio.chapterId?.toString() === chapterId.toString()
      );
    }
    
    // Filter by voiceType if provided
    if (voiceType) {
      transformedAudios = transformedAudios.filter(audio => 
        audio.voiceType?.toLowerCase() === voiceType.toLowerCase()
      );
    }
    
    // Sort by modified date (newest first)
    transformedAudios.sort((a, b) => {
      const dateA = new Date(a.modified).getTime();
      const dateB = new Date(b.modified).getTime();
      return dateB - dateA;
    });
    
    return {
      audios: transformedAudios,
      count: transformedAudios.length,
    };
  } catch (error: any) {
    console.error('[generated-audios] Error:', error);
    return {
      error: error.message || "Failed to fetch audio files",
      audios: [],
      count: 0,
    };
  }
});

