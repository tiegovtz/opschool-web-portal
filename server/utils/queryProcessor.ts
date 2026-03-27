// @ts-nocheck
/**
 * Enhanced Query Processing for RAG
 * 
 * Provides query expansion, cleaning, normalization, and classification
 * to improve retrieval accuracy in the RAG system.
 * Includes LLM-based query rewriting for better textbook phrase matching.
 * 
 * ENVIRONMENT VARIABLES:
 * 
 * - ENABLE_QUERY_EXPANSION (default: true)
 *   Enable/disable rule-based query expansion
 *   Set to 'false' to disable
 * 
 * - ENABLE_LLM_QUERY_REWRITE (default: true)
 *   Enable/disable LLM-based query rewriting using GPT-4o-mini
 *   Set to 'false' to disable (saves API costs)
 * 
 * - QUERY_EXPANSION_AGGRESSIVENESS (default: 0.5)
 *   Controls how aggressively queries are expanded with domain terms
 *   Range: 0.0 (no expansion) to 1.0 (maximum expansion)
 * 
 * - LLM_REWRITE_CACHE_TTL (default: 86400000 = 24 hours)
 *   Cache TTL for LLM query rewrites in milliseconds
 *   Reduces API calls for repeated queries
 * 
 * - MIN_QUERY_LENGTH_FOR_LLM (default: 3)
 *   Minimum query length (in characters) to use LLM rewrite
 *   Shorter queries will skip LLM rewriting
 * 
 * - MAX_QUERY_VARIATIONS (default: 5)
 *   Maximum number of query variations to try during exhaustive search
 *   Limits the number of search attempts per query
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export type QueryType = 'factoid' | 'explanation' | 'comparison' | 'general';

export interface ProcessedQuery {
  original: string;
  cleaned: string;
  expanded: string;
  type: QueryType;
  keywords: string[];
  subject?: string;
  llmRewritten?: string[];
}

export interface QueryContext {
  subject?: string;
  level?: string;
  topic?: string;
}

/**
 * Domain-specific term expansion dictionary
 * Maps key terms to related educational concepts
 */
const DOMAIN_EXPANSIONS: Record<string, string[]> = {
  // Physics terms
  'force': ['force', 'pressure', 'momentum', 'acceleration', "Newton's laws", 'motion', 'mechanics'],
  'motion': ['motion', 'movement', 'velocity', 'speed', 'acceleration', 'displacement', 'kinematics'],
  'energy': ['energy', 'work', 'power', 'kinetic energy', 'potential energy', 'conservation'],
  'heat': ['heat', 'temperature', 'thermal energy', 'thermodynamics', 'conduction', 'convection'],
  'light': ['light', 'optics', 'reflection', 'refraction', 'wave', 'electromagnetic'],
  'electricity': ['electricity', 'current', 'voltage', 'resistance', 'circuit', 'electrical'],
  'magnetism': ['magnetism', 'magnetic field', 'magnet', 'electromagnetism'],
  'wave': ['wave', 'frequency', 'amplitude', 'wavelength', 'oscillation'],
  
  // Biology terms
  'cell': ['cell', 'organism', 'tissue', 'organ', 'living things', 'biology', 'life'],
  'photosynthesis': ['photosynthesis', 'chlorophyll', 'plant', 'carbon dioxide', 'oxygen', 'glucose'],
  'respiration': ['respiration', 'breathing', 'oxygen', 'carbon dioxide', 'cellular respiration'],
  'digestion': ['digestion', 'digestive system', 'nutrient', 'absorption', 'metabolism'],
  'reproduction': ['reproduction', 'reproductive system', 'offspring', 'genetics', 'heredity'],
  'ecosystem': ['ecosystem', 'environment', 'habitat', 'food chain', 'biodiversity'],
  'evolution': ['evolution', 'adaptation', 'natural selection', 'species', 'diversity'],
  
  // Chemistry terms
  'reaction': ['reaction', 'compound', 'element', 'molecule', 'chemical change', 'chemistry'],
  'atom': ['atom', 'element', 'molecule', 'compound', 'atomic structure', 'periodic table'],
  'acid': ['acid', 'base', 'pH', 'neutralization', 'chemical property'],
  'bond': ['bond', 'chemical bond', 'covalent', 'ionic', 'molecular structure'],
  'solution': ['solution', 'solvent', 'solute', 'mixture', 'dissolve'],
  
  // Mathematics terms
  'equation': ['equation', 'formula', 'solve', 'calculate', 'variable', 'algebra'],
  'geometry': ['geometry', 'shape', 'angle', 'triangle', 'circle', 'area', 'perimeter'],
  'algebra': ['algebra', 'expression', 'variable', 'solve', 'equation', 'formula'],
  'fraction': ['fraction', 'decimal', 'percentage', 'ratio', 'proportion'],
  'graph': ['graph', 'plot', 'coordinate', 'axis', 'data', 'chart'],
  
  // Geography terms
  'climate': ['climate', 'weather', 'temperature', 'precipitation', 'environment', 'atmosphere'],
  'geography': ['geography', 'location', 'region', 'landform', 'terrain', 'topography'],
  'population': ['population', 'demographics', 'settlement', 'urban', 'rural'],
  'resource': ['resource', 'natural resource', 'mineral', 'agriculture', 'economy'],
};

/**
 * Subject detection keywords
 */
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  physics: ['physics', 'force', 'motion', 'energy', 'heat', 'light', 'electricity', 'magnetism', 'wave', 'mechanics', 'thermodynamics', 'optics'],
  biology: ['biology', 'cell', 'organism', 'photosynthesis', 'respiration', 'digestion', 'reproduction', 'ecosystem', 'evolution', 'living things'],
  chemistry: ['chemistry', 'reaction', 'atom', 'molecule', 'compound', 'acid', 'base', 'bond', 'solution', 'element'],
  mathematics: ['mathematics', 'math', 'equation', 'geometry', 'algebra', 'fraction', 'graph', 'calculate', 'solve', 'formula'],
  geography: ['geography', 'climate', 'weather', 'population', 'resource', 'location', 'region', 'landform'],
};

/**
 * Conversational fillers to remove
 */
const CONVERSATIONAL_FILLERS = [
  'please', 'can you', 'tell me', 'i want to know', 'i need to know',
  'could you', 'would you', 'help me', 'i\'m asking', 'i ask',
  'what do you know about', 'do you know', 'can you explain'
];

/**
 * Query normalization patterns
 */
const NORMALIZATION_PATTERNS: Array<[RegExp, string]> = [
  [/^what is\s+/i, 'definition of '],
  [/^what are\s+/i, 'definition of '],
  [/^how does\s+/i, 'explanation of how '],
  [/^how do\s+/i, 'explanation of how '],
  [/^how can\s+/i, 'explanation of how '],
  [/^why does\s+/i, 'explanation of why '],
  [/^why do\s+/i, 'explanation of why '],
  [/^explain\s+/i, 'explanation of '],
  [/^describe\s+/i, 'description of '],
  [/^define\s+/i, 'definition of '],
];

/**
 * Detect subject from query or context
 */
function detectSubject(query: string, context?: QueryContext): string | undefined {
  // First check context
  if (context?.subject) {
    const normalized = context.subject.toLowerCase().trim();
    if (normalized in SUBJECT_KEYWORDS) {
      return normalized;
    }
  }
  
  // Then check query for subject keywords
  const lowerQuery = query.toLowerCase();
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        return subject;
      }
    }
  }
  
  return undefined;
}

/**
 * Extract keywords from query
 */
function extractKeywords(query: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
  ]);
  
  // Extract words (3+ characters, not stop words)
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopWords.has(word));
  
  // Remove duplicates and return
  return [...new Set(words)];
}

/**
 * Expand query with domain-specific terms
 */
function expandQuery(query: string, subject?: string, aggressiveness: number = 0.5): string {
  if (!subject || aggressiveness <= 0) {
    return query;
  }
  
  const keywords = extractKeywords(query);
  const expandedTerms: string[] = [];
  
  // For each keyword, check if it has expansions
  for (const keyword of keywords) {
    const expansions = DOMAIN_EXPANSIONS[keyword];
    if (expansions) {
      // Add a subset of expansions based on aggressiveness
      const numExpansions = Math.max(1, Math.floor(expansions.length * aggressiveness));
      const selectedExpansions = expansions.slice(0, numExpansions);
      expandedTerms.push(...selectedExpansions);
    }
  }
  
  // Remove duplicates and terms already in query
  const queryLower = query.toLowerCase();
  const uniqueExpansions = [...new Set(expandedTerms)]
    .filter(term => !queryLower.includes(term.toLowerCase()));
  
  // Combine original query with expansions
  if (uniqueExpansions.length > 0) {
    return `${query} ${uniqueExpansions.join(' ')}`;
  }
  
  return query;
}

/**
 * Clean and normalize query
 */
function cleanQuery(query: string): string {
  let cleaned = query.trim();
  
  // Remove conversational fillers
  for (const filler of CONVERSATIONAL_FILLERS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '').trim();
  }
  
  // Apply normalization patterns
  for (const [pattern, replacement] of NORMALIZATION_PATTERNS) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, replacement);
      break; // Only apply first matching pattern
    }
  }
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned || query; // Return original if cleaning removes everything
}

/**
 * Classify query type
 */
function classifyQueryType(query: string): QueryType {
  const lower = query.toLowerCase();
  
  // Check for comparison queries (highest priority)
  if (/\b(compare|comparison|difference|different|vs|versus|between|versus|contrast)\b/.test(lower)) {
    return 'comparison';
  }
  
  // Check for explanation queries
  if (/^(how|why|explain|describe|elaborate|clarify)/i.test(query)) {
    return 'explanation';
  }
  
  // Check for factoid queries
  if (/^(what|who|when|where|which)\s+/i.test(query)) {
    return 'factoid';
  }
  
  // Default to general
  return 'general';
}

/**
 * Main query processing function
 * 
 * @param originalQuery - The original user query
 * @param context - Optional context (subject, level, topic)
 * @returns Processed query with expansion, cleaning, and classification
 */
export function processQuery(
  originalQuery: string,
  context?: QueryContext
): ProcessedQuery {
  if (!originalQuery || !originalQuery.trim()) {
    throw new Error('Query cannot be empty');
  }
  
  // Detect subject
  const subject = detectSubject(originalQuery, context);
  
  // Clean the query
  const cleaned = cleanQuery(originalQuery);
  
  // Expand the query (with configurable aggressiveness)
  const expansionAggressiveness = parseFloat(
    process.env.QUERY_EXPANSION_AGGRESSIVENESS || '0.5'
  );
  const expanded = expandQuery(cleaned, subject, expansionAggressiveness);
  
  // Classify query type
  const type = classifyQueryType(cleaned);
  
  // Extract keywords
  const keywords = extractKeywords(cleaned);
  
  return {
    original: originalQuery,
    cleaned,
    expanded,
    type,
    keywords,
    subject,
  };
}

/**
 * Check if query expansion is enabled
 */
export function isQueryExpansionEnabled(): boolean {
  const enabled = process.env.ENABLE_QUERY_EXPANSION;
  return enabled === undefined || enabled.toLowerCase() === 'true';
}

/**
 * In-memory cache for LLM query rewrites
 */
interface CacheEntry {
  queries: string[];
  timestamp: number;
}

const rewriteCache = new Map<string, CacheEntry>();

/**
 * Get cache TTL from environment (default: 24 hours)
 */
function getCacheTTL(): number {
  const ttl = parseInt(process.env.LLM_REWRITE_CACHE_TTL || '86400000', 10);
  return ttl > 0 ? ttl : 86400000; // Default to 24 hours
}

/**
 * Get minimum query length for LLM rewrite (default: 3)
 */
function getMinQueryLengthForLLM(): number {
  return parseInt(process.env.MIN_QUERY_LENGTH_FOR_LLM || '3', 10);
}

/**
 * Determine if LLM rewrite should be used for this query
 */
export function shouldUseLLMRewrite(query: string, queryType: QueryType): boolean {
  // Check if LLM rewrite is enabled
  const enabled = process.env.ENABLE_LLM_QUERY_REWRITE;
  if (enabled !== undefined && enabled.toLowerCase() === 'false') {
    return false;
  }

  // Check minimum query length
  const minLength = getMinQueryLengthForLLM();
  if (query.trim().length < minLength) {
    return false;
  }

  // Use LLM for definition queries (they often need rewriting to match textbook phrasing)
  if (queryType === 'factoid' && /^(what|who|when|where|which)\s+/i.test(query)) {
    return true;
  }

  // Use LLM for very short queries (likely need expansion)
  if (query.split(/\s+/).length <= 3) {
    return true;
  }

  // Skip LLM for long, specific queries (rule-based should work)
  return false;
}

/**
 * Rewrite query using LLM to match textbook phrasing
 * Uses GPT-4o-mini for cost efficiency
 */
export async function rewriteQueryWithLLM(
  originalQuery: string,
  context?: QueryContext,
  useCache: boolean = true
): Promise<string[]> {
  const config = useRuntimeConfig();
  const apiKey = config.OPENAI_API_KEY || 
                 config.openaiApiKey || 
                 process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("[Query Rewriter] No API key, skipping LLM rewrite");
    return [originalQuery];
  }

  // Check cache
  const cacheKey = `${originalQuery}_${context?.subject || ''}_${context?.level || ''}`;
  if (useCache) {
    const cached = rewriteCache.get(cacheKey);
    if (cached) {
      const ttl = getCacheTTL();
      if (Date.now() - cached.timestamp < ttl) {
        console.log(`[Query Rewriter] Using cached rewrite for: "${originalQuery.substring(0, 50)}"`);
        return cached.queries;
      } else {
        // Cache expired, remove it
        rewriteCache.delete(cacheKey);
      }
    }
  }

  const openai = createOpenAI({ apiKey });

  // Build context string
  const contextInfo = context 
    ? `Context: Subject: ${context.subject || 'unknown'}, Level: ${context.level || 'unknown'}, Topic: ${context.topic || 'none'}`
    : '';

  const rewritePrompt = `You are a query rewriter for an educational RAG (Retrieval-Augmented Generation) system. Your task is to rewrite student questions to match how textbooks phrase information.

Student Question: "${originalQuery}"
${contextInfo}

Rewrite this question into 2-3 variations that would match how textbooks typically phrase this information. Textbooks often use:
- Direct statements: "Biology is..." instead of "what is biology"
- Introduction phrases: "Introduction to Biology", "Basic concepts of Biology"
- Definition formats: "Biology is defined as..." or "Biology refers to..."

Return ONLY a JSON array of rewritten queries, no explanation. Example:
["biology is", "introduction to biology", "basic concepts biology"]

Rewritten queries:`;

  try {
    console.log(`[Query Rewriter] Rewriting query with LLM: "${originalQuery.substring(0, 50)}"`);
    
    const response = await generateText({
      model: openai("gpt-4o-mini"), // Use mini for cost efficiency
      system: "You are a helpful assistant that rewrites queries for educational content retrieval. Return only valid JSON arrays.",
      prompt: rewritePrompt,
      temperature: 0.3, // Lower temperature for consistency
      maxTokens: 150,
    });

    // Parse JSON response
    const responseText = response.text.trim();
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const rewrittenQueries = JSON.parse(jsonText);
    
    if (Array.isArray(rewrittenQueries) && rewrittenQueries.length > 0) {
      const validQueries = rewrittenQueries
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0);
      
      if (validQueries.length > 0) {
        console.log(`[Query Rewriter] Generated ${validQueries.length} query variations:`, validQueries);
        
        // Cache result
        if (useCache) {
          rewriteCache.set(cacheKey, {
            queries: validQueries,
            timestamp: Date.now()
          });
        }
        
        return validQueries;
      }
    }
    
    console.warn("[Query Rewriter] Invalid or empty LLM response, using original query");
    return [originalQuery];
  } catch (error: any) {
    console.warn("[Query Rewriter] LLM rewrite failed, using original query:", error?.message || error);
    return [originalQuery];
  }
}

/**
 * Hybrid query processing: LLM rewrite + rule-based expansion
 */
export async function processQueryWithLLM(
  originalQuery: string,
  context?: QueryContext,
  useLLMRewrite: boolean = true
): Promise<ProcessedQuery & { llmRewritten?: string[] }> {
  if (!originalQuery || !originalQuery.trim()) {
    throw new Error('Query cannot be empty');
  }
  
  // Step 1: Rule-based processing first (to get query type)
  const ruleBased = processQuery(originalQuery, context);
  
  // Step 2: LLM-based rewriting (if enabled and appropriate)
  let llmRewritten: string[] = [];
  if (useLLMRewrite && shouldUseLLMRewrite(originalQuery, ruleBased.type)) {
    try {
      llmRewritten = await rewriteQueryWithLLM(originalQuery, context);
    } catch (error: any) {
      console.warn("[Query Processor] LLM rewrite failed:", error?.message);
    }
  }
  
  // Step 3: If LLM rewrite succeeded, use the best rewritten query
  // Otherwise fall back to rule-based expansion
  let finalExpanded = ruleBased.expanded;
  if (llmRewritten.length > 0) {
    // Use first LLM rewrite as primary, combine with rule-based expansion
    const primaryRewrite = llmRewritten[0];
    // Combine LLM rewrite with keywords for better coverage
    const keywordString = ruleBased.keywords.length > 0 
      ? ' ' + ruleBased.keywords.join(' ')
      : '';
    finalExpanded = `${primaryRewrite}${keywordString}`.trim();
    console.log(`[Query Processor] Using LLM rewrite: "${primaryRewrite}"`);
  }
  
  return {
    ...ruleBased,
    expanded: finalExpanded,
    llmRewritten: llmRewritten.length > 0 ? llmRewritten : undefined,
  };
}

