/**
 * Script to map URLs from simulations API to shortcodes in image-shortcodes.json
 * Matches by figure number only (e.g., "Figure 1.1")
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const SIMULATIONS_API = 'https://opschool.tie.go.tz:5001/v1/simulations';
const LOGIN_API = 'https://apitie.ekima.africa/v1/auth/login';
const BIOLOGY_SUBJECT_ID = '6658658d7b076d51f6fc0381';

// Get auth token from command line argument or environment variable
// Can also pass username:password to login
const AUTH_INPUT = process.argv[2] || process.env.AUTH_TOKEN || '';

async function getAuthToken(): Promise<string> {
  // If it looks like a JWT token, use it directly
  if (AUTH_INPUT.startsWith('eyJ')) {
    return AUTH_INPUT;
  }
  
  // If it contains ':', treat as username:password
  if (AUTH_INPUT.includes(':')) {
    const [username, password] = AUTH_INPUT.split(':');
    console.log(`[map-urls] Logging in as ${username}...`);
    
    try {
      const response = await fetch(LOGIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const token = data.accessToken || data.token || data.access_token;
      
      if (token) {
        console.log('[map-urls] ✅ Login successful');
        return token;
      }
      
      throw new Error('No token in response');
    } catch (error: any) {
      console.error(`[map-urls] Login failed: ${error.message}`);
      return '';
    }
  }
  
  return AUTH_INPUT;
}

interface FigureMetadata {
  chapter: string;
  topic: string;
  figure_number: string;
  caption: string;
  description: string;
  page_number: number;
  shortcode: string;
}

interface ShortcodeEntry {
  path: string;
  alt: string;
  category: string;
  description?: string;
  chapterName?: string;
  topicName?: string;
  subjectName?: string;
  searchableText?: string;
}

async function mapUrlsToShortcodes() {
  try {
    console.log('[map-urls] Starting to map URLs to shortcodes...');
    
    const dataDir = join(process.cwd(), 'server', 'data');
    
    // Load figure-metadata.json
    const metadataPath = join(dataDir, 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    const figures: FigureMetadata[] = metadata.images || [];
    
    console.log(`[map-urls] Loaded ${figures.length} figures from figure-metadata.json`);
    
    // Load image-shortcodes.json
    const shortcodesPath = join(dataDir, 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const shortcodesData = JSON.parse(shortcodesContent);
    const shortcodes: Record<string, ShortcodeEntry> = shortcodesData.shortcodes || {};
    
    console.log(`[map-urls] Loaded ${Object.keys(shortcodes).length} shortcodes from image-shortcodes.json`);
    
    // Build a map: figure_number -> shortcode info from figure-metadata.json
    const figureToShortcode = new Map<string, { shortcode: string; chapter: string; topic: string; caption: string; description: string }>();
    for (const fig of figures) {
      if (fig.figure_number && fig.shortcode) {
        // Normalize figure number for matching (e.g., "Figure 1.1" -> "1.1")
        const normalizedFigNum = fig.figure_number.replace(/^figure\s*/i, '').trim();
        figureToShortcode.set(normalizedFigNum, {
          shortcode: fig.shortcode,
          chapter: fig.chapter,
          topic: fig.topic,
          caption: fig.caption,
          description: fig.description
        });
        console.log(`[map-urls] Registered: ${fig.figure_number} -> ${fig.shortcode}`);
      }
    }
    
    // Fetch from simulations API
    console.log(`[map-urls] Fetching from simulations API: ${SIMULATIONS_API}`);
    
    // Get auth token (either directly or via login)
    const authToken = await getAuthToken();
    
    if (!authToken) {
      console.log('[map-urls] ⚠️ No auth token provided. Usage:');
      console.log('  npx tsx scripts/map-urls-to-shortcodes.ts YOUR_AUTH_TOKEN');
      console.log('  npx tsx scripts/map-urls-to-shortcodes.ts username:password');
      console.log('  OR set AUTH_TOKEN environment variable');
      console.log('');
    }
    
    let simulations: any[] = [];
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('[map-urls] Using auth token');
      }
      
      const response = await fetch(SIMULATIONS_API, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      simulations = Array.isArray(data) ? data : (data.data || []);
      console.log(`[map-urls] Fetched ${simulations.length} simulations from API`);
    } catch (error: any) {
      console.error(`[map-urls] Failed to fetch from API: ${error.message}`);
      console.log('[map-urls] Continuing with local matching only...');
    }
    
    // Filter for biology simulations
    const biologySimulations = simulations.filter((sim: any) => {
      const subjectId = sim.subject?._id || sim.subject?.id || sim.subject || sim.subjectId;
      const subjectName = sim.subject?.name || sim.subjectName || '';
      return subjectId === BIOLOGY_SUBJECT_ID || 
             subjectName.toLowerCase().includes('biology') ||
             sim.category?.toLowerCase() === 'biology';
    });
    
    console.log(`[map-urls] Found ${biologySimulations.length} biology simulations`);
    
    // Match simulations to shortcodes by figure number
    let matchedCount = 0;
    let notMatchedCount = 0;
    
    for (const sim of biologySimulations) {
      // Get the image URL
      const imageUrl = sim.simulationFileUrl || sim.simulation_file_url || 
                      sim.image || sim.thumbnail || sim.preview || 
                      sim.imageUrl || sim.image_url;
      
      if (!imageUrl) continue;
      
      // Try to extract figure number from description, name, or alt
      const searchText = [
        sim.description || '',
        sim.name || '',
        sim.title || '',
        sim.alt || '',
        sim.label || ''
      ].join(' ').toLowerCase();
      
      // Match "Figure X.X" or "Fig X.X" or just "X.X" patterns
      const figureMatch = searchText.match(/(?:figure|fig\.?)\s*(\d+\.\d+)/i) ||
                         searchText.match(/(\d+\.\d+)/);
      
      if (figureMatch) {
        const figureNumber = figureMatch[1];
        const shortcodeInfo = figureToShortcode.get(figureNumber);
        
        if (shortcodeInfo && shortcodes[shortcodeInfo.shortcode]) {
          // Update the shortcode with the URL
          shortcodes[shortcodeInfo.shortcode].path = imageUrl;
          console.log(`[map-urls] ✅ Matched: Figure ${figureNumber} -> ${shortcodeInfo.shortcode} -> ${imageUrl.substring(0, 60)}...`);
          matchedCount++;
        } else {
          console.log(`[map-urls] ⚠️ Figure ${figureNumber} not found in figure-metadata.json`);
          notMatchedCount++;
        }
      }
    }
    
    console.log(`[map-urls] Matched ${matchedCount} URLs to shortcodes`);
    console.log(`[map-urls] Not matched: ${notMatchedCount}`);
    
    // Also try to match by looking at all simulations (not just biology)
    // in case some biology figures are miscategorized
    if (matchedCount < figures.length) {
      console.log('[map-urls] Trying to match remaining figures from all simulations...');
      
      for (const sim of simulations) {
        const imageUrl = sim.simulationFileUrl || sim.simulation_file_url || 
                        sim.image || sim.thumbnail || sim.preview || 
                        sim.imageUrl || sim.image_url;
        
        if (!imageUrl) continue;
        
        const searchText = [
          sim.description || '',
          sim.name || '',
          sim.title || '',
          sim.alt || '',
          sim.label || ''
        ].join(' ').toLowerCase();
        
        const figureMatch = searchText.match(/(?:figure|fig\.?)\s*(\d+\.\d+)/i);
        
        if (figureMatch) {
          const figureNumber = figureMatch[1];
          const shortcodeInfo = figureToShortcode.get(figureNumber);
          
          if (shortcodeInfo && shortcodes[shortcodeInfo.shortcode]) {
            // Only update if not already matched
            if (!shortcodes[shortcodeInfo.shortcode].path) {
              shortcodes[shortcodeInfo.shortcode].path = imageUrl;
              console.log(`[map-urls] ✅ Additional match: Figure ${figureNumber} -> ${shortcodeInfo.shortcode}`);
              matchedCount++;
            }
          }
        }
      }
    }
    
    // Update image-shortcodes.json
    const updatedData = {
      ...shortcodesData,
      generatedAt: new Date().toISOString(),
      shortcodes: shortcodes,
    };
    
    await writeFile(shortcodesPath, JSON.stringify(updatedData, null, 2), 'utf-8');
    
    console.log(`[map-urls] ✅ Updated image-shortcodes.json`);
    console.log(`[map-urls] Summary:`);
    console.log(`  - Total shortcodes: ${Object.keys(shortcodes).length}`);
    console.log(`  - With URLs: ${Object.values(shortcodes).filter(s => s.path).length}`);
    console.log(`  - Without URLs: ${Object.values(shortcodes).filter(s => !s.path).length}`);
    
    // Show which shortcodes still need URLs
    const missingUrls = Object.entries(shortcodes)
      .filter(([_, s]) => !s.path)
      .map(([shortcode, _]) => shortcode);
    
    if (missingUrls.length > 0) {
      console.log(`[map-urls] ⚠️ Shortcodes still missing URLs:`);
      missingUrls.forEach(sc => console.log(`    - ${sc}`));
    }
    
  } catch (error: any) {
    console.error('[map-urls] Error:', error);
    throw error;
  }
}

// Run the script
mapUrlsToShortcodes().catch(console.error);

export { mapUrlsToShortcodes };