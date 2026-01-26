import { defineEventHandler, getQuery, getCookie } from "h3";
import type { Chapter } from "~/types/chapter.interface";
import type { Audios } from "~/types/audio.interface";
import type { AudioFileInfo } from "~/types/audio.interface";
import apiDocs from "~/utilities/apiDocs";

// Get base URL - use process.env on server side, fallback to apiDocs if not set
const getBaseURL = () => {
  // Use process.env first (server-side)
  const envUrl = process.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback to apiDocs only if env is not set
  if (apiDocs.baseURL) {
    return apiDocs.baseURL;
  }
  
  // Error if neither is set
  throw new Error("VITE_API_BASE_URL is not set and apiDocs.baseURL is not available");
};

interface ChapterAudio extends Partial<Audios> {
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

async function getAuthToken(event: any): Promise<string | null> {
  // Use cookies only as per PR comments
  // $fetch automatically sends cookies for same-origin requests
  return getCookie(event, "token") || getCookie(event, "signInAccessToken") || null;
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
  
  // Check multiple possible URL fields - filepath is the primary one from the API
  const url = audio.filepath || audio.url || audio.audio_url || audio.audioFileUrl || '';
  
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
  const updatedAt = audio.updatedAt || audio.updated || created;
  
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
  
  // Map 'type' field to 'voiceType' - the API uses 'type' for voice gender
  const voiceType = audio.type || audio.voiceType || undefined;
  
  return {
    id,
    filename,
    name,
    created,
    modified: updatedAt, // Use updatedAt for modified field
    url,
    downloadUrl: url,
    type,
    audioFileUrl: url,
    chapterId: chapterId,
    chapterName: chapterName,
    voiceType: voiceType,
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
    const voiceType = query.voiceType as string | undefined;
    
    // Require chapterId - no fallbacks
    if (!chapterId) {
      return {
        error: "chapterId is required",
        audios: [],
        count: 0,
      };
    }
    
    // Normalize chapterId - ensure it's a string and trim whitespace
    chapterId = String(chapterId).trim();
    
    if (!chapterId || chapterId.length === 0) {
      return {
        error: "chapterId cannot be empty",
        audios: [],
        count: 0,
      };
    }
    
    let allAudios: ChapterAudio[] = [];
    let chaptersMap = new Map<string, { id: string; name: string }>();
    
    // Directly fetch from /chapters/{id} - no fallbacks
    try {
      const baseUrl = getBaseURL();
      const chapterUrl = apiDocs.chapters.getChapterId
        .replace(apiDocs.baseURL || '', baseUrl)
        .replace(":id", chapterId);
      
      const chapterResponse = await fetchWithTimeout(
        chapterUrl,
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
        return {
          error: "Chapter returned empty response - no audios available",
          audios: [],
          count: 0,
        };
      }
      
      // Safely parse JSON
      let chapterData: any;
      try {
        chapterData = JSON.parse(responseText) as any;
      } catch (parseError) {
        return {
          error: `Invalid response format from chapter endpoint`,
          audios: [],
          count: 0,
        };
      }
      
      // Validate that we got valid chapter data
      if (!chapterData || (typeof chapterData !== 'object')) {
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
    } catch (error) {
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
      transformedAudios = transformedAudios.filter(audio => {
        const audioVoiceType = audio.voiceType?.toLowerCase();
        const requestedVoiceType = voiceType.toLowerCase();
        return audioVoiceType === requestedVoiceType;
      });
    }
    
    // Sort by updatedAt date (newest first)
    transformedAudios.sort((a, b) => {
      const dateA = new Date(a.modified || a.created).getTime();
      const dateB = new Date(b.modified || b.created).getTime();
      return dateB - dateA;
    });
    
    return {
      audios: transformedAudios,
      count: transformedAudios.length,
    };
  } catch (error: any) {
    return {
      error: error.message || "Failed to fetch audio files",
      audios: [],
      count: 0,
    };
  }
});

