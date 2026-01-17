# Commit Report: `ae0c0b96` — Refine TIE AI teacher prompt and syllabus tool

## 1. Executive Summary

This commit upgrades the **general TIE AI Teacher** behavior from a short “NECTA curriculum assistant” prompt into a structured **Form I & II competence-based teacher** with strict pedagogical rules (one topic per message, progressive competence breakdown, mandatory understanding checks), and adds a **local JSON-based syllabus tool** (`getSyllabus`) to reliably load TIE syllabus structure for supported subjects.

It also removes UI rendering of tool-call JSON so students only see teacher-facing responses.

### Commit metadata

- **Commit**: `ae0c0b96`
- **Title**: “Refine TIE AI teacher prompt and syllabus tool”
- **Author**: Erick-J `<95274481+Lumena07@users.noreply.github.com>`
- **Date**: Wed Jan 14 18:29:12 2026 +0300

### Scope of change

- **Files changed**: 7
- **Net change**: 892 insertions, 18 deletions
- **Core outcomes**:
  - **Stronger prompt governance** for Form I–II teaching
  - **Syllabus retrieval tool** backed by local JSONs (server-side)
  - **Tool-call output hidden** in AI teacher UI

## 2. Files Changed Summary

### Modified

- `server/api/chat.ts`
  - Replaced the old minimal general assistant prompt with a comprehensive **TIE Online Public School – Form I & II AI Teacher** system prompt.
- `server/api/utils/tools.ts`
  - Added syllabus JSON loading utilities and registered `getSyllabus` tool inside `studentTools`.
- `app/components/ai-teacher/MessageAI.vue`
  - Removed rendering of `tool-*` parts (tool-call JSON) in the UI.

### Added

- `app/types/syllabus.interface.ts`
  - Introduced TypeScript interfaces to describe syllabus JSON structure.
- `server/data/syllabus/syllabus_biology_form1.json`
- `server/data/syllabus/syllabus_biology_form2.json`
- `server/data/syllabus/syllabus_physics_form1.json`

## 3. Detailed Changes Analysis

### 3.1 AI Teacher Prompt Refinements (`server/api/chat.ts`)

#### Before

The “general assistant” mode used a short NECTA-focused prompt with constraints like “answer only based on Tanzanian curriculum/notes,” but did not strongly enforce:

- competence-based progression,
- per-message topic limits,
- teacher-like scaffolding,
- mandatory understanding checks,
- syllabus sequencing.

#### After (new system prompt behavior)

The new system prompt implements a structured teacher persona and a ruleset designed to prevent student overwhelm while ensuring mastery.

Key additions:

- **Hidden reasoning / tool logic**
  - Explicitly prohibits exposing internal reasoning, planning steps, or tool calling logic to the student.
- **Form I–II scope**
  - Strongly frames the assistant as a Form I & II teacher; prohibits out-of-scope content.
- **Competence-based learning**
  - Treats competences as learning outcomes and insists on teaching aligned to syllabus competences.
- **Syllabus tool mandate**
  - Requires calling `get_syllabus` early (start of session / when student asks about a subject).
- **Sequential teaching**
  - Default is **Competence 1 → Competence 2 → …**, with explicit permission to deviate only if the student requests.
- **Competence as a goal (not a single message)**
  - Competence must be broken into **3–7 small learning goals**.
- **One-topic-per-message**
  - When an activity lists “meaning, branches, importance, relationship with other disciplines”, each is treated as **separate learning goals**, each taught in its own message.
- **Mandatory understanding checks**
  - After each explanation, the assistant must ask **one specific question** to verify understanding before progressing.
- **Teacher-like pacing**
  - Emphasizes patience, slow-down and re-teach if student struggles.
- **Tanzanian context**
  - Reinforces localized examples (cities, industries, day-to-day life, etc.).
- **Session start choice**
  - Once the subject is known, the assistant should tell the student it will start at **Competence 1**, briefly explain what it covers, and then ask if the student wants help with a different topic instead.

Behavioral impact:

- Students receive **smaller, focused instruction chunks**.
- The assistant is guided to **wait for student evidence of understanding** rather than moving ahead.
- The assistant’s path is constrained to syllabus order by default, while still allowing student-led topic selection.

#### Important prompt mechanics introduced

- **“ONE TOPIC PER MESSAGE” rule** applies especially to multi-topic learning activity strings such as:
  - “meaning, branches, importance, relationship with other disciplines”
- **“Teach → Example → Question → Wait → Confirm → Next topic” loop** becomes the default for each learning goal.

### 3.2 Syllabus Tool Implementation (`server/api/utils/tools.ts`)

This commit introduces a server-side syllabus loader and tool wrapper:

#### `readSyllabusFromFile(subject, level)`

- Normalizes **subject**:
  - lowercase, trim, replace whitespace with underscore (`"basic science"` → `"basic_science"`).
- Normalizes **level**:
  - converts `"Form I"`, `"form i"` → `form1`
  - converts `"Form II"`, `"form ii"` → `form2`
  - supports `"Form 1"`, `"Form 2"` → `form1` / `form2`
- Constructs filename:
  - `syllabus_${normalizedSubject}_${normalizedLevel}.json`
- Reads from:
  - `process.cwd()/server/data/syllabus/<filename>`
- Includes debug logging:
  - current working directory, requested filename, full path
  - directory listing of available files

#### `formatSyllabusForAgent(syllabus)`

Creates a flattened, readable string:

- syllabus title + level + competence count
- for each competence:
  - main competence, specific competence, periods
  - activities + methods + assessment + resources

#### Tool registration: `studentTools.getSyllabus`

Registers `getSyllabus` as an AI tool:

- **Inputs**: `{ subject: string, level: string }`
- **Success output**:
  - formatted syllabus text
  - array of competence summaries (main/specific/periods/activity count)
  - `found: true`
- **Not found output**:
  - returns a “No syllabus file found…” message
  - indicates available files (Biology Form I/II, Physics Form I) and suggests fallback to general knowledge for other subjects
  - `found: false`

Behavioral impact:

- Enables **deterministic syllabus retrieval** from local JSON (no vector search required for supported subjects).
- Supports the prompt’s strict syllabus ordering rules by giving the model access to structured competences.

### 3.3 Type System (`app/types/syllabus.interface.ts`)

Adds TypeScript interfaces:

- `Syllabus`:
  - `syllabus_title: string`
  - `level: string`
  - `content: Competence[]`
- `Competence`:
  - `main_competence: string`
  - `specific_competence: string`
  - `number_of_periods: number`
  - `learning_activities: LearningActivity[]`
- `LearningActivity`:
  - `activity: string`
  - `teaching_learning_methods: string[]`
  - `assessment_criteria: string`
  - `suggested_resources: string`

### 3.4 UI Improvements (`app/components/ai-teacher/MessageAI.vue`)

Tool-call UI rendering was removed:

- Previously, tool parts were rendered as a `<pre>` block when `part.type.startsWith('tool-')`.
- After this commit, tool calls are not displayed, improving student-facing cleanliness and aligning with the “hide tool logic” instruction.

Behavioral impact:

- Students see only explanatory teacher text, not raw tool execution JSON.

### 3.5 Syllabus Data (`server/data/syllabus/*.json`)

Added three syllabus JSON files used by the new tool:

- Biology Form I (contains learning activity strings like “meaning, branches, … relationship with other disciplines”)
- Biology Form II
- Physics Form I (also contains “meaning, branches, importance, relationship…” pattern)

These files provide the raw material that the prompt expects to break down into single-topic learning goals.

## 4. Teaching Methodology Changes (What Students Will Experience)

### Competence as a goal

Rather than “teach the competence” as a single lesson, the assistant is directed to:

- state the competence goal,
- break it into learning goals,
- teach one learning goal at a time.

### One topic per message (critical)

If an activity includes multiple comma-separated subtopics:

- “meaning” must be taught alone in one message,
- “branches” must be taught alone in the next,
- “importance” must be taught alone in the next, etc.

### Understanding verification (mandatory)

After each learning goal:

- the assistant asks **one** targeted question,
- waits for the response,
- confirms/corrects,
- only then proceeds.

### Student choice at start

Once the syllabus is retrieved:

- the assistant announces it will start with **Competence 1** and what it covers,
- asks if the student wants help with a different topic instead.

## 5. Technical Notes / Risks / Follow-ups

### 5.1 JSON schema mismatch risk (high)

`app/types/syllabus.interface.ts` and the loader/formatter assume a schema like:

- `level`
- `content: Competence[]`
  - `specific_competence`
  - `number_of_periods`
  - `learning_activities[]` with `activity`, `teaching_learning_methods`, etc.

However, `server/data/syllabus/syllabus_biology_form2.json` appears to use a different schema (example observed):

- `class_level` (not `level`)
- `content[]` includes `specific_competences[]` (nested list)
- `learning_activities[]` keys differ (`activity_description`, `teaching_methods`, etc.)

Impact:

- `readSyllabusFromFile()` will still JSON.parse successfully, but `formatSyllabusForAgent()` may produce incorrect output or throw at runtime if it expects missing keys (e.g., `syllabus.level`, `competence.learning_activities`).

Recommended follow-up:

- Either normalize Form II Biology JSON to the same schema as Form I/Physics, or update types + formatter to support both schema variants.

### 5.2 Tool name consistency

In code, the tool is registered as `getSyllabus` (camel case), while the prompt text instructs calling `get_syllabus` in places. If the model follows the prompt literally, tool invocation could fail.

Recommended follow-up:

- Standardize tool naming across prompt and tool registration (either rename tool to `get_syllabus` or update prompt to `getSyllabus` everywhere).

### 5.3 Logging verbosity

The new syllabus loader logs directory listings and paths. This is useful for debugging but may be noisy in production.

Recommended follow-up:

- Gate logs behind an environment flag or use a structured logger with levels.

## 6. Appendix: Quick Reference

### Changed files

- Modified:
  - `server/api/chat.ts`
  - `server/api/utils/tools.ts`
  - `app/components/ai-teacher/MessageAI.vue`
- Added:
  - `app/types/syllabus.interface.ts`
  - `server/data/syllabus/syllabus_biology_form1.json`
  - `server/data/syllabus/syllabus_biology_form2.json`
  - `server/data/syllabus/syllabus_physics_form1.json`

### Net change

- **+892 / -18** lines across 7 files



