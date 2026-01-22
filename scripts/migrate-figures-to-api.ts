/**
 * Migration Script: Migrate image-shortcodes.json to Figures API Database
 * 
 * This script reads all shortcodes from image-shortcodes.json and migrates them
 * to the external Figures API database.
 * 
 * Usage:
 *   npx tsx scripts/migrate-figures-to-api.ts <username> <password>
 * 
 * Example:
 *   npx tsx scripts/migrate-figures-to-api.ts eric.john 'Ejb201313!'
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

const API_BASE_URL = process.env.FIGURES_API_BASE_URL || 'https://opschool.tie.go.tz:5001/v1';
const USERNAME = process.argv[2] || '';
const PASSWORD = process.argv[3] || '';

interface JsonShortcode {
  path?: string;
  paths?: string[];
  alt: string;
  alts?: string[];
  category: string;
  description?: string;
  chapterName?: string;
  topicName?: string;
  subjectName?: string;
  searchableText?: string;
}

interface JsonData {
  shortcodes: Record<string, JsonShortcode>;
  total: number;
  byCategory: Record<string, number>;
}

interface ApiFigure {
  id?: string;
  shortcode: string;
  figure_number?: string;
  caption?: string;
  alt?: string;
  description?: string;
  path?: string;
  paths?: string[];
  alts?: string[];
  category: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  page_number?: number;
}

let authToken: string = '';

/**
 * Login to get authentication token
 */
async function login(): Promise<boolean> {
  try {
    console.log(`[Migration] Logging in as ${USERNAME}...`);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`[Migration] ❌ Login failed: ${data.message}`);
      return false;
    }

    authToken = data.access_token || data.accessToken || data.token || '';
    if (authToken) {
      console.log(`[Migration] ✅ Login successful`);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error(`[Migration] ❌ Login error:`, error.message);
    return false;
  }
}

/**
 * Check if figure exists by shortcode
 */
async function figureExists(shortcode: string): Promise<ApiFigure | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/figures/shortcode/${shortcode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return null;
    }

    return JSON.parse(text) as ApiFigure;
  } catch (error) {
    return null;
  }
}

/**
 * Create a new figure
 */
async function createFigure(shortcode: string, data: JsonShortcode): Promise<boolean> {
  try {
    // Try to get figure number from figure-metadata.json first
    let figureNumber = '';
    let pageNumber: number | undefined = undefined;
    
    try {
      const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
      const metadataContent = await readFile(metadataPath, 'utf-8');
      const metadataData = JSON.parse(metadataContent);
      const metadataEntry = metadataData.images?.find((img: any) => img.shortcode === shortcode);
      
      if (metadataEntry) {
        // Extract number from "Figure 1.1" format
        const figNumMatch = metadataEntry.figure_number?.match(/figure\s+(\d+\.?\d*)/i);
        if (figNumMatch) {
          figureNumber = figNumMatch[1];
        } else {
          figureNumber = metadataEntry.figure_number?.replace(/figure\s+/i, '') || '';
        }
        pageNumber = metadataEntry.page_number;
      }
    } catch (error) {
      // If figure-metadata.json doesn't exist or can't be read, extract from shortcode
    }
    
    // Fallback: Extract figure number from shortcode if not found in metadata
    if (!figureNumber) {
      const figureMatch = shortcode.match(/figure[_\s](\d+)[_\s](\d+)/i);
      if (figureMatch) {
        figureNumber = `${figureMatch[1]}.${figureMatch[2]}`;
      } else {
        const altMatch = shortcode.match(/figure[_\s](\d+)/i);
        if (altMatch) {
          figureNumber = altMatch[1];
        } else {
          const simMatch = shortcode.match(/Sim(\d+)/i);
          if (simMatch) {
            figureNumber = `Sim${simMatch[1]}`;
          }
        }
      }
    }

    // Prepare images array - API expects images array format
    const images: Array<{ url: string; alt?: string }> = [];
    if (data.paths && data.paths.length > 0) {
      data.paths.forEach((path, index) => {
        images.push({
          url: path,
          alt: data.alts?.[index] || data.alt
        });
      });
    } else if (data.path) {
      images.push({
        url: data.path,
        alt: data.alt
      });
    }

    // API expects JSON format field names (subjectName, chapterName, topicName)
    // Ensure description is not empty (use alt as fallback)
    const description = data.description || data.alt || 'No description available';
    
    const apiData: any = {
      shortcode: shortcode,
      alt: data.alt,
      description: description,
      category: data.category,
      subjectName: data.subjectName || '',
      chapterName: data.chapterName || '',
      topicName: data.topicName || '',
      figureNumber: figureNumber || '',
      images: images,
    };
    
    // Add page_number if available from figure-metadata.json
    if (pageNumber !== undefined) {
      apiData.page_number = pageNumber;
    }

    const response = await fetch(`${API_BASE_URL}/figures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(apiData),
    });

    if (response.ok) {
      return true;
    }

    const errorData = await response.json().catch(() => ({}));
    console.error(`[Migration] ❌ Failed to create ${shortcode}: ${response.status} - ${errorData.message || response.statusText}`);
    return false;
  } catch (error: any) {
    console.error(`[Migration] ❌ Error creating ${shortcode}:`, error.message);
    return false;
  }
}

/**
 * Update an existing figure
 */
async function updateFigure(shortcode: string, existingId: string, data: JsonShortcode): Promise<boolean> {
  try {
    // Try to get figure number from figure-metadata.json first
    let figureNumber = '';
    let pageNumber: number | undefined = undefined;
    
    try {
      const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
      const metadataContent = await readFile(metadataPath, 'utf-8');
      const metadataData = JSON.parse(metadataContent);
      const metadataEntry = metadataData.images?.find((img: any) => img.shortcode === shortcode);
      
      if (metadataEntry) {
        const figNumMatch = metadataEntry.figure_number?.match(/figure\s+(\d+\.?\d*)/i);
        if (figNumMatch) {
          figureNumber = figNumMatch[1];
        } else {
          figureNumber = metadataEntry.figure_number?.replace(/figure\s+/i, '') || '';
        }
        pageNumber = metadataEntry.page_number;
      }
    } catch (error) {
      // Fallback: Extract from shortcode
    }
    
    // Fallback: Extract figure number from shortcode if not found in metadata
    if (!figureNumber) {
      const figureMatch = shortcode.match(/figure[_\s](\d+)[_\s](\d+)/i);
      if (figureMatch) {
        figureNumber = `${figureMatch[1]}.${figureMatch[2]}`;
      } else {
        const altMatch = shortcode.match(/figure[_\s](\d+)/i);
        if (altMatch) {
          figureNumber = altMatch[1];
        } else {
          const simMatch = shortcode.match(/Sim(\d+)/i);
          if (simMatch) {
            figureNumber = `Sim${simMatch[1]}`;
          }
        }
      }
    }

    // Prepare images array
    const images: Array<{ url: string; alt?: string }> = [];
    if (data.paths && data.paths.length > 0) {
      data.paths.forEach((path, index) => {
        images.push({
          url: path,
          alt: data.alts?.[index] || data.alt
        });
      });
    } else if (data.path) {
      images.push({
        url: data.path,
        alt: data.alt
      });
    }

    // API expects JSON format field names (subjectName, chapterName, topicName)
    const description = data.description || data.alt || 'No description available';
    
    const apiData: any = {
      alt: data.alt,
      description: description,
      category: data.category,
      subjectName: data.subjectName || '',
      chapterName: data.chapterName || '',
      topicName: data.topicName || '',
      figureNumber: figureNumber || '',
      images: images,
    };
    
    // Add page_number if available from figure-metadata.json
    if (pageNumber !== undefined) {
      apiData.page_number = pageNumber;
    }

    // Try PUT /figures/:id first
    let response = await fetch(`${API_BASE_URL}/figures/${existingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(apiData),
    });

    // If that doesn't work, try PATCH
    if (!response.ok && response.status !== 404) {
      response = await fetch(`${API_BASE_URL}/figures/${existingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(apiData),
      });
    }

    // If still not working, try PUT /figures/shortcode/:shortcode
    if (!response.ok && response.status !== 404) {
      response = await fetch(`${API_BASE_URL}/figures/shortcode/${shortcode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(apiData),
      });
    }

    if (response.ok) {
      return true;
    }

    const errorData = await response.json().catch(() => ({}));
    console.error(`[Migration] ❌ Failed to update ${shortcode}: ${response.status} - ${errorData.message || response.statusText}`);
    return false;
  } catch (error: any) {
    console.error(`[Migration] ❌ Error updating ${shortcode}:`, error.message);
    return false;
  }
}

/**
 * Migrate a single shortcode
 */
async function migrateShortcode(shortcode: string, data: JsonShortcode): Promise<boolean> {
  // Check if figure already exists
  const existing = await figureExists(shortcode);
  
  if (existing && existing.id) {
    // Update existing figure
    console.log(`[Migration] 🔄 Updating existing figure: ${shortcode}`);
    return await updateFigure(shortcode, existing.id, data);
  } else {
    // Create new figure
    console.log(`[Migration] ➕ Creating new figure: ${shortcode}`);
    return await createFigure(shortcode, data);
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('='.repeat(70));
  console.log('Figures Migration Script');
  console.log('='.repeat(70));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Username: ${USERNAME}`);
  console.log('');

  if (!USERNAME || !PASSWORD) {
    console.error('Usage: npx tsx scripts/migrate-figures-to-api.ts <username> <password>');
    process.exit(1);
  }

  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('[Migration] ❌ Authentication failed. Exiting.');
    process.exit(1);
  }

  // Load JSON file
  console.log('[Migration] 📖 Loading image-shortcodes.json...');
  let jsonData: JsonData;
  try {
    const filePath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const fileContent = await readFile(filePath, 'utf-8');
    jsonData = JSON.parse(fileContent);
    console.log(`[Migration] ✅ Loaded ${Object.keys(jsonData.shortcodes).length} shortcodes from JSON`);
  } catch (error: any) {
    console.error(`[Migration] ❌ Failed to load JSON file:`, error.message);
    process.exit(1);
  }

  // Migrate each shortcode
  const shortcodes = Object.entries(jsonData.shortcodes);
  const total = shortcodes.length;
  let successCount = 0;
  let failCount = 0;
  const failed: string[] = [];

  console.log(`[Migration] 🚀 Starting migration of ${total} shortcodes...`);
  console.log('');

  for (let i = 0; i < shortcodes.length; i++) {
    const [shortcode, data] = shortcodes[i];
    const progress = `[${i + 1}/${total}]`;
    
    try {
      const success = await migrateShortcode(shortcode, data);
      if (success) {
        successCount++;
        console.log(`${progress} ✅ ${shortcode}`);
      } else {
        failCount++;
        failed.push(shortcode);
        console.log(`${progress} ❌ ${shortcode}`);
      }
    } catch (error: any) {
      failCount++;
      failed.push(shortcode);
      console.log(`${progress} ❌ ${shortcode} - Error: ${error.message}`);
    }

    // Add a small delay to avoid overwhelming the API
    if (i < shortcodes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Summary
  console.log('');
  console.log('='.repeat(70));
  console.log('Migration Summary');
  console.log('='.repeat(70));
  console.log(`Total shortcodes: ${total}`);
  console.log(`✅ Successfully migrated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  if (failed.length > 0) {
    console.log('');
    console.log('Failed shortcodes:');
    failed.forEach(sc => console.log(`  - ${sc}`));
  }
  
  console.log('');
  console.log('='.repeat(70));
}

main().catch(console.error);

