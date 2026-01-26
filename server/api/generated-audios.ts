import { defineEventHandler, getQuery, getCookie } from "h3";
import type { Chapter } from "~/types/chapter.interface";
import type { Audios } from "~/types/audio.interface";
import type { AudioFileInfo } from "~/types/audio.interface";
import apiDocs from "~/utilities/apiDocs";

// Get base URL - use process.env on server side, fallback to apiDocs
// NO FALLBACKS - use exactly what's in the environment
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

function extractAudioFromChapters(chapters: any[], requestId?: string): ChapterAudio[] {
  const audios: ChapterAudio[] = [];
  
  for (const chapter of chapters) {
    const chapterId = chapter.id || chapter._id;
    const chapterName = chapter.name || chapter.title || chapter.chapterName || '';
    
    if (requestId) {
      console.log(`[generated-audios] [${requestId}] Extracting audios from chapter:`, {
        chapterId: chapterId,
        chapterName: chapterName,
        hasAudio: !!chapter.audio,
        audioType: chapter.audio ? typeof chapter.audio : 'none',
        hasAudios: Array.isArray(chapter.audios),
        audiosLength: Array.isArray(chapter.audios) ? chapter.audios.length : 0,
        hasAudioFiles: Array.isArray(chapter.audioFiles),
        audioFilesLength: Array.isArray(chapter.audioFiles) ? chapter.audioFiles.length : 0,
        allKeys: Object.keys(chapter).filter(k => k.toLowerCase().includes('audio'))
      });
    }
    
    // Check for single audio object
    if (chapter.audio && typeof chapter.audio === 'object') {
      if (requestId) {
        console.log(`[generated-audios] [${requestId}] Found single audio object:`, {
          audioId: chapter.audio.id || chapter.audio._id,
          audioKeys: Object.keys(chapter.audio)
        });
      }
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
      if (requestId) {
        console.log(`[generated-audios] [${requestId}] Processing audios array (length: ${chapter.audios.length}):`, 
          chapter.audios.length > 0 ? chapter.audios.slice(0, 2).map((a: any) => ({
            id: a.id || a._id,
            keys: Object.keys(a),
            hasUrl: !!(a.url || a.audioFileUrl || a.filepath || a.audio_url)
          })) : 'Array is empty'
        );
      }
      
      chapter.audios.forEach((audio: any, index: number) => {
        if (requestId && index < 3) {
          console.log(`[generated-audios] [${requestId}] Audio item ${index}:`, {
            id: audio.id || audio._id,
            name: audio.name || audio.title,
            url: audio.url || audio.audioFileUrl || audio.filepath || audio.audio_url,
            allKeys: Object.keys(audio)
          });
        }
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
      if (requestId) {
        console.log(`[generated-audios] [${requestId}] Processing audioFiles array (length: ${chapter.audioFiles.length}):`,
          chapter.audioFiles.length > 0 ? chapter.audioFiles.slice(0, 2).map((a: any) => ({
            id: a.id || a._id,
            keys: Object.keys(a)
          })) : 'Array is empty'
        );
      }
      
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
    
    // Check for other potential audio-related fields
    const audioRelatedKeys = Object.keys(chapter).filter(k => 
      k.toLowerCase().includes('audio') && 
      !['audio', 'audios', 'audioFiles'].includes(k)
    );
    
    if (audioRelatedKeys.length > 0 && requestId) {
      console.log(`[generated-audios] [${requestId}] Found additional audio-related keys:`, audioRelatedKeys);
      audioRelatedKeys.forEach(key => {
        const value = chapter[key];
        if (requestId) {
          console.log(`[generated-audios] [${requestId}] Key "${key}":`, {
            type: typeof value,
            isArray: Array.isArray(value),
            length: Array.isArray(value) ? value.length : 'N/A',
            value: typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : value
          });
        }
      });
    }
  }
  
  if (requestId) {
    console.log(`[generated-audios] [${requestId}] Total audios extracted: ${audios.length}`);
  }
  
  return audios;
}

function transformAudioData(audio: ChapterAudio, chapterMap?: Map<string, { id: string; name: string }>, requestId?: string): AudioFileInfo {
  const id = audio.id || audio._id || `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Check multiple possible URL fields - filepath is the primary one from the API
  const url = audio.filepath || audio.url || audio.audio_url || audio.audioFileUrl || '';
  
  if (requestId && !url) {
    console.warn(`[generated-audios] [${requestId}] Audio ${id} has no URL field:`, {
      audioKeys: Object.keys(audio),
      hasFilepath: !!audio.filepath,
      hasUrl: !!audio.url,
      hasAudioUrl: !!audio.audio_url,
      hasAudioFileUrl: !!audio.audioFileUrl
    });
  }
  
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
  
  if (requestId) {
    console.log(`[generated-audios] [${requestId}] Transforming audio:`, {
      id: id,
      name: name,
      url: url ? `${url.substring(0, 50)}...` : 'NO URL',
      voiceType: voiceType,
      chapterId: chapterId
    });
  }
  
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
  const requestStartTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[generated-audios] [${requestId}] ===== REQUEST START =====`);
    console.log(`[generated-audios] [${requestId}] Request URL: ${event.node.req.url}`);
    console.log(`[generated-audios] [${requestId}] Request method: ${event.node.req.method}`);
    console.log(`[generated-audios] [${requestId}] Timestamp: ${new Date().toISOString()}`);
    
    // Log environment variable status
    const envBaseUrl = process.env.VITE_API_BASE_URL;
    const apiDocsBaseUrl = apiDocs.baseURL;
    const resolvedBaseUrl = getBaseURL();
    console.log(`[generated-audios] [${requestId}] Environment check:`, {
      processEnv: envBaseUrl || 'NOT SET',
      apiDocsBaseUrl: apiDocsBaseUrl || 'NOT SET',
      resolvedBaseUrl: resolvedBaseUrl,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('API') || k.includes('BASE')).slice(0, 10)
    });
    
    const authToken = await getAuthToken(event);
    const hasAuthToken = !!authToken;
    const tokenLength = authToken ? authToken.length : 0;
    
    console.log(`[generated-audios] [${requestId}] Authentication check:`, {
      hasToken: hasAuthToken,
      tokenLength: tokenLength,
      tokenPreview: authToken ? `${authToken.substring(0, 10)}...` : 'none'
    });
    
    if (!authToken) {
      console.warn(`[generated-audios] [${requestId}] Authentication failed - no token found`);
      return {
        error: "Authentication required",
        audios: [],
        count: 0,
      };
    }
    
    const query = getQuery(event);
    let chapterId = query.chapterId as string | undefined;
    const voiceType = query.voiceType as string | undefined; // "male" or "female"
    
    console.log(`[generated-audios] [${requestId}] Query parameters:`, {
      chapterId: chapterId,
      voiceType: voiceType,
      allParams: Object.keys(query)
    });
    
    // Require chapterId - no fallbacks
    if (!chapterId) {
      console.error(`[generated-audios] [${requestId}] Missing chapterId parameter`);
      return {
        error: "chapterId is required",
        audios: [],
        count: 0,
      };
    }
    
    // Normalize chapterId - ensure it's a string and trim whitespace
    const originalChapterId = chapterId;
    chapterId = String(chapterId).trim();
    
    if (originalChapterId !== chapterId) {
      console.log(`[generated-audios] [${requestId}] ChapterId normalized: "${originalChapterId}" -> "${chapterId}"`);
    }
    
    if (!chapterId || chapterId.length === 0) {
      console.error(`[generated-audios] [${requestId}] ChapterId is empty after normalization`);
      return {
        error: "chapterId cannot be empty",
        audios: [],
        count: 0,
      };
    }
    
    console.log(`[generated-audios] [${requestId}] Processing request for chapterId: ${chapterId}, voiceType: ${voiceType || 'all'}`);
    
    let allAudios: ChapterAudio[] = [];
    let chaptersMap = new Map<string, { id: string; name: string }>();
    
    // Directly fetch from /chapters/{id} - no fallbacks
    try {
      // Based on Swagger, audios are included by default, so try WITHOUT populate first
      // The populate parameter might be causing the API to return empty arrays
      // Use apiDocs.chapters.getChapterId as per PR comments, but replace base URL with server-side value
      const baseUrl = getBaseURL();
      const chapterUrl = apiDocs.chapters.getChapterId
        .replace(apiDocs.baseURL || '', baseUrl)
        .replace(":id", chapterId);
      
      console.log(`[generated-audios] [${requestId}] Base URL: ${baseUrl}`);
      console.log(`[generated-audios] [${requestId}] Full chapter URL: ${chapterUrl}`);
      console.log(`[generated-audios] [${requestId}] Fetch start time: ${new Date().toISOString()}`);
      console.log(`[generated-audios] [${requestId}] Auth token present: ${!!authToken} (length: ${authToken?.length || 0})`);
      
      const fetchStartTime = Date.now();
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
      
      const fetchDuration = Date.now() - fetchStartTime;
      console.log(`[generated-audios] [${requestId}] Chapter fetch completed in ${fetchDuration}ms`);
      console.log(`[generated-audios] [${requestId}] Response status: ${chapterResponse.status} ${chapterResponse.statusText}`);
      
      if (!chapterResponse.ok) {
        const errorText = await chapterResponse.text().catch(() => 'Unknown error');
        console.error(`[generated-audios] [${requestId}] Chapter fetch failed:`, {
          status: chapterResponse.status,
          statusText: chapterResponse.statusText,
          errorPreview: errorText.substring(0, 200)
        });
        throw new Error(`Chapter fetch failed with status ${chapterResponse.status}: ${errorText}`);
      }
      
      // Safely read response as text first
      const responseText = await chapterResponse.text().catch(() => '');
      const responseSize = responseText.length;
      
      console.log(`[generated-audios] [${requestId}] Response received:`, {
        size: responseSize,
        sizeKB: (responseSize / 1024).toFixed(2),
        contentType: chapterResponse.headers.get('content-type') || 'unknown'
      });
      
      // Handle empty response
      if (!responseText || responseText.trim().length === 0) {
        console.warn(`[generated-audios] [${requestId}] Empty response for chapter ${chapterId}`);
        return {
          error: "Chapter returned empty response - no audios available",
          audios: [],
          count: 0,
        };
      }
      
      // Check content-type if available
      const contentType = chapterResponse.headers.get('content-type') || '';
      if (contentType && !contentType.includes('application/json') && !contentType.includes('text/')) {
        console.warn(`[generated-audios] [${requestId}] Unexpected content-type: ${contentType} for chapter ${chapterId}`);
        // Still try to parse as JSON in case content-type is wrong
      }
      
      // Safely parse JSON
      let chapterData: any;
      const parseStartTime = Date.now();
      try {
        chapterData = JSON.parse(responseText) as any;
        const parseDuration = Date.now() - parseStartTime;
        console.log(`[generated-audios] [${requestId}] JSON parsed successfully in ${parseDuration}ms`);
        
        // Log the full structure to understand where audio data is
        console.log(`[generated-audios] [${requestId}] Full chapter data structure:`, {
          allKeys: Object.keys(chapterData),
          totalKeys: Object.keys(chapterData).length,
          hasId: !!chapterData.id || !!chapterData._id,
          hasName: !!chapterData.name || !!chapterData.title,
          // Log all keys that might contain audio
          audioRelatedKeys: Object.keys(chapterData).filter(k => 
            k.toLowerCase().includes('audio') || 
            k.toLowerCase().includes('sound') ||
            k.toLowerCase().includes('media')
          ),
          // Log array fields
          arrayFields: Object.keys(chapterData).filter(k => 
            Array.isArray(chapterData[k])
          ).map(k => ({
            key: k,
            length: chapterData[k].length,
            sampleItem: chapterData[k].length > 0 ? Object.keys(chapterData[k][0]) : []
          })),
          // Log object fields that might contain nested audio
          objectFields: Object.keys(chapterData).filter(k => 
            typeof chapterData[k] === 'object' && 
            !Array.isArray(chapterData[k]) && 
            chapterData[k] !== null
          ).map(k => ({
            key: k,
            nestedKeys: Object.keys(chapterData[k]).slice(0, 10)
          }))
        });
        
        // If response is large, log a sample of the structure
        if (responseSize > 10000) {
          console.log(`[generated-audios] [${requestId}] Large response detected (${(responseSize / 1024).toFixed(2)}KB), logging sample structure`);
          // Try to find audio-related data in the response
          const responseLower = responseText.toLowerCase();
          const audioMatches = [
            responseLower.includes('"audio'),
            responseLower.includes('"audios'),
            responseLower.includes('"audiofile'),
            responseLower.includes('"generatedaudio'),
            responseLower.includes('"audio_url'),
            responseLower.includes('"audiofileurl')
          ];
          console.log(`[generated-audios] [${requestId}] Audio-related strings in response:`, {
            hasAudio: audioMatches[0],
            hasAudios: audioMatches[1],
            hasAudioFile: audioMatches[2],
            hasGeneratedAudio: audioMatches[3],
            hasAudioUrl: audioMatches[4],
            hasAudioFileUrl: audioMatches[5]
          });
        }
      } catch (parseError) {
        console.error(`[generated-audios] [${requestId}] Invalid JSON for chapter ${chapterId}:`, {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          responsePreview: responseText.substring(0, 200)
        });
        return {
          error: `Invalid response format from chapter endpoint`,
          audios: [],
          count: 0,
        };
      }
      
      // Validate that we got valid chapter data
      if (!chapterData || (typeof chapterData !== 'object')) {
        console.warn(`[generated-audios] [${requestId}] Invalid chapter data structure for ${chapterId}:`, {
          type: typeof chapterData,
          isNull: chapterData === null,
          keys: chapterData && typeof chapterData === 'object' ? Object.keys(chapterData) : 'N/A'
        });
        return {
          error: "Invalid chapter data structure",
          audios: [],
          count: 0,
        };
      }
      
      const chapterIdValue = chapterData.id || chapterData._id || chapterId;
      const chapterName = chapterData.name || chapterData.title || chapterData.chapterName || '';
      
      // Log detailed chapter structure for debugging
      const audioRelatedKeys = Object.keys(chapterData).filter(k => 
        k.toLowerCase().includes('audio')
      );
      
      console.log(`[generated-audios] [${requestId}] Chapter data extracted:`, {
        chapterId: chapterIdValue,
        chapterName: chapterName,
        hasAudio: !!chapterData.audio,
        audioType: chapterData.audio ? typeof chapterData.audio : 'none',
        hasAudios: Array.isArray(chapterData.audios),
        audiosCount: Array.isArray(chapterData.audios) ? chapterData.audios.length : 0,
        hasAudioFiles: Array.isArray(chapterData.audioFiles),
        audioFilesCount: Array.isArray(chapterData.audioFiles) ? chapterData.audioFiles.length : 0,
        audioRelatedKeys: audioRelatedKeys,
        allTopLevelKeys: Object.keys(chapterData).slice(0, 20) // First 20 keys to see structure
      });
      
      // If audios array exists but is empty, log a sample of the array structure
      if (Array.isArray(chapterData.audios) && chapterData.audios.length === 0) {
        console.log(`[generated-audios] [${requestId}] audios array exists but is empty`);
      } else if (Array.isArray(chapterData.audios) && chapterData.audios.length > 0) {
        console.log(`[generated-audios] [${requestId}] audios array sample (first item):`, {
          keys: Object.keys(chapterData.audios[0]),
          hasId: !!(chapterData.audios[0].id || chapterData.audios[0]._id),
          hasUrl: !!(chapterData.audios[0].url || chapterData.audios[0].audioFileUrl || chapterData.audios[0].filepath),
          sample: JSON.stringify(chapterData.audios[0]).substring(0, 300)
        });
      }
      
      // Check for nested structures that might contain audio
      if (chapterData.content && typeof chapterData.content === 'object') {
        const contentAudioKeys = Object.keys(chapterData.content).filter(k => 
          k.toLowerCase().includes('audio')
        );
        if (contentAudioKeys.length > 0) {
          console.log(`[generated-audios] [${requestId}] Found audio-related keys in content:`, contentAudioKeys);
        }
      }
      
      if (chapterData.metadata && typeof chapterData.metadata === 'object') {
        const metadataAudioKeys = Object.keys(chapterData.metadata).filter(k => 
          k.toLowerCase().includes('audio')
        );
        if (metadataAudioKeys.length > 0) {
          console.log(`[generated-audios] [${requestId}] Found audio-related keys in metadata:`, metadataAudioKeys);
        }
      }
      
      // Store chapter info for name lookup
      if (chapterIdValue) {
        chaptersMap.set(chapterIdValue.toString(), { 
          id: chapterIdValue.toString(), 
          name: chapterName 
        });
      }
      
      // Extract audios from this specific chapter
      const extractStartTime = Date.now();
      allAudios = extractAudioFromChapters([chapterData], requestId);
      const extractDuration = Date.now() - extractStartTime;
      
      console.log(`[generated-audios] [${requestId}] Audio extraction completed:`, {
        duration: `${extractDuration}ms`,
        extractedCount: allAudios.length,
        audioIds: allAudios.map(a => a.id || a._id || 'no-id').slice(0, 5)
      });
    } catch (error) {
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join(' | ')
      } : { error: String(error) };
      
      console.error(`[generated-audios] [${requestId}] Failed to fetch chapter ${chapterId}:`, errorDetails);
      return {
        error: error instanceof Error ? error.message : "Failed to fetch chapter",
        audios: [],
        count: 0,
      };
    }
    
    // Transform audio data
    const transformStartTime = Date.now();
    let transformedAudios = allAudios.map(audio => transformAudioData(audio, chaptersMap, requestId));
    const transformDuration = Date.now() - transformStartTime;
    
    console.log(`[generated-audios] [${requestId}] Audio transformation completed:`, {
      duration: `${transformDuration}ms`,
      transformedCount: transformedAudios.length
    });
    
    // Filter by chapterId if provided
    const beforeChapterFilter = transformedAudios.length;
    if (chapterId) {
      transformedAudios = transformedAudios.filter(audio => 
        audio.chapterId === chapterId || 
        audio.chapterId?.toString() === chapterId.toString()
      );
      console.log(`[generated-audios] [${requestId}] Chapter filter applied:`, {
        before: beforeChapterFilter,
        after: transformedAudios.length,
        filtered: beforeChapterFilter - transformedAudios.length
      });
    }
    
    // Filter by voiceType if provided
    const beforeVoiceFilter = transformedAudios.length;
    if (voiceType) {
      console.log(`[generated-audios] [${requestId}] Applying voice type filter:`, {
        requestedVoiceType: voiceType,
        availableVoiceTypes: [...new Set(transformedAudios.map(a => a.voiceType).filter(Boolean))],
        beforeFilter: transformedAudios.length,
        sampleAudios: transformedAudios.slice(0, 3).map(a => ({
          id: a.id,
          voiceType: a.voiceType,
          name: a.name
        }))
      });
      
      transformedAudios = transformedAudios.filter(audio => {
        const audioVoiceType = audio.voiceType?.toLowerCase();
        const requestedVoiceType = voiceType.toLowerCase();
        const matches = audioVoiceType === requestedVoiceType;
        
        if (requestId && !matches && transformedAudios.indexOf(audio) < 3) {
          console.log(`[generated-audios] [${requestId}] Audio filtered out:`, {
            audioId: audio.id,
            audioVoiceType: audioVoiceType,
            requestedVoiceType: requestedVoiceType,
            matches: matches
          });
        }
        
        return matches;
      });
      
      console.log(`[generated-audios] [${requestId}] Voice type filter applied:`, {
        voiceType: voiceType,
        before: beforeVoiceFilter,
        after: transformedAudios.length,
        filtered: beforeVoiceFilter - transformedAudios.length
      });
    }
    
    // Sort by updatedAt date (newest first)
    const sortStartTime = Date.now();
    transformedAudios.sort((a, b) => {
      const dateA = new Date(a.modified || a.created).getTime();
      const dateB = new Date(b.modified || b.created).getTime();
      return dateB - dateA;
    });
    const sortDuration = Date.now() - sortStartTime;
    
    const totalDuration = Date.now() - requestStartTime;
    
    console.log(`[generated-audios] [${requestId}] Sorting completed:`, {
      duration: `${sortDuration}ms`,
      sortedCount: transformedAudios.length
    });
    
    console.log(`[generated-audios] [${requestId}] ===== REQUEST SUCCESS =====`);
    console.log(`[generated-audios] [${requestId}] Total request duration: ${totalDuration}ms`);
    console.log(`[generated-audios] [${requestId}] Returning ${transformedAudios.length} audio(s) for chapterId: ${chapterId}`);
    console.log(`[generated-audios] [${requestId}] Audio IDs:`, transformedAudios.slice(0, 5).map(a => a.id));
    
    return {
      audios: transformedAudios,
      count: transformedAudios.length,
    };
  } catch (error: any) {
    const totalDuration = Date.now() - requestStartTime;
    const errorDetails = {
      message: error.message || "Unknown error",
      stack: error.stack?.split('\n').slice(0, 5).join(' | '),
      duration: `${totalDuration}ms`
    };
    
    console.error(`[generated-audios] [${requestId}] ===== REQUEST ERROR =====`);
    console.error(`[generated-audios] [${requestId}] Error details:`, errorDetails);
    
    return {
      error: error.message || "Failed to fetch audio files",
      audios: [],
      count: 0,
    };
  }
});

