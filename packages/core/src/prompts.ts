// ============================================
// Writing Prompt Extraction from Gutenberg Text
// ============================================
//
// Transforms passages from public domain literature into
// creative writing prompts. These are prompts for human writers,
// not AI prompts.

export type PromptType =
  | "opening-line"
  | "dialogue"
  | "scene"
  | "philosophical"
  | "rewrite"
  | "contra"
  | "continue"
  | "letter"
  | "journal"
  | "witness"
  | "modernize";

export interface WritingPrompt {
  type: PromptType;
  promptText: string;
  sourcePassage: string;
  sourceBook: string;
  sourceAuthor: string;
  gutenbergId: number;
  score: number;
}

export interface ExtractOptions {
  maxPrompts?: number;
  types?: PromptType[];
  minPassageLength?: number;
  maxPassageLength?: number;
}

// ============================================
// Passage Extraction
// ============================================

interface RawPassage {
  text: string;
  score: number;
  traits: Set<string>;
}

/** Extract interesting passages from raw Gutenberg text */
export function extractPassages(
  text: string,
  options?: { minLength?: number; maxLength?: number; maxPassages?: number }
): RawPassage[] {
  const minLen = options?.minLength ?? 40;
  const maxLen = options?.maxLength ?? 800;
  const maxPassages = options?.maxPassages ?? 200;

  // Rejoin hard-wrapped lines (Gutenberg wraps at ~70 chars)
  // then split on true paragraph breaks (blank lines)
  const rejoined = text
    .replace(/([^\n])\n([^\n\s])/g, "$1 $2") // rejoin mid-paragraph line breaks
    .replace(/\r\n/g, "\n");

  const paragraphs = rejoined
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= minLen && p.length <= maxLen)
    // Skip paragraphs that look like chapter headings or metadata
    .filter((p) => !/^(CHAPTER|PART|BOOK|VOLUME|LETTER|ACT|SCENE)\b/i.test(p))
    .filter((p) => !/^(Produced by|Transcriber|Project Gutenberg)/i.test(p));

  // Score and classify each paragraph
  const scored: RawPassage[] = paragraphs.map((p) => {
    let score = 0;
    const traits = new Set<string>();

    // Contains dialogue (quotes)
    if (/[""][^""]+[""]/.test(p) || /'[^']+'/g.test(p)) {
      score += 15;
      traits.add("dialogue");
    }

    // Contains a question
    if (/\?/.test(p)) {
      score += 10;
      traits.add("question");
    }

    // Vivid description (sensory words)
    const sensory = /\b(see|saw|hear|heard|feel|felt|touch|smell|taste|bright|dark|cold|warm|silent|loud|soft|sharp|bitter|sweet|glow|shadow|light|echo|whisper|roar|trembl)/i;
    if (sensory.test(p)) {
      score += 12;
      traits.add("sensory");
    }

    // Strong claims or opinions
    const opinion = /\b(must|should|always|never|truth|false|right|wrong|believe|certain|impossible|essential|nothing|everything)\b/i;
    if (opinion.test(p)) {
      score += 10;
      traits.add("opinion");
    }

    // Philosophical / abstract concepts
    const philosophical = /\b(soul|mind|consciousness|reality|existence|truth|justice|beauty|freedom|nature|reason|virtue|meaning|purpose|death|life|god|heaven|fate|destiny|moral|human|spirit)\b/i;
    if (philosophical.test(p)) {
      score += 15;
      traits.add("philosophical");
    }

    // Action / narrative tension
    const action = /\b(ran|fled|struck|seized|cried|screamed|rushed|leap|burst|broke|suddenly|moment|instant)\b/i;
    if (action.test(p)) {
      score += 8;
      traits.add("action");
    }

    // Vocabulary richness (unique words / total words)
    const words = p.toLowerCase().split(/\s+/);
    const unique = new Set(words);
    const richness = unique.size / words.length;
    if (richness > 0.7) score += 10;
    if (richness > 0.8) score += 5;

    // Sentence variety
    const sentences = p.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length >= 2 && sentences.length <= 5) score += 5;

    // Length bonus (prefer medium-length passages)
    if (p.length > 100 && p.length < 400) score += 5;

    return { text: p, score, traits };
  });

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxPassages);
}

// ============================================
// Prompt Templates
// ============================================

const TEMPLATES: Record<PromptType, (passage: string, book: string, author: string) => string> = {
  "opening-line": (p) =>
    `Continue this story in your own words:\n\n"${truncate(p, 200)}"`,

  dialogue: (p) =>
    `Someone once said:\n\n"${truncate(p, 250)}"\n\nWho are they? What led to this moment? Write the scene.`,

  scene: (p) =>
    `You find yourself here:\n\n"${truncate(p, 250)}"\n\nWhat do you see? What do you do?`,

  philosophical: (p) =>
    `Consider this idea:\n\n"${truncate(p, 300)}"\n\nDo you agree? Disagree? Write your response.`,

  rewrite: (p) =>
    `Rewrite this passage as if it happened today, in your city:\n\n"${truncate(p, 250)}"`,

  contra: (p) =>
    `Here is a strong claim:\n\n"${truncate(p, 250)}"\n\nNow argue the opposite. Make it convincing.`,

  continue: (p) =>
    `The story stops here:\n\n"${truncate(p, 200)}"\n\nWhat happens next?`,

  letter: (p, _book, author) =>
    `After reading this from ${author}:\n\n"${truncate(p, 200)}"\n\nWrite a letter to the author. Tell them what you think.`,

  journal: (p, book) =>
    `Imagine you are a character in "${book}." You just experienced this:\n\n"${truncate(p, 200)}"\n\nWrite tonight's diary entry.`,

  witness: (p) =>
    `You witnessed this scene:\n\n"${truncate(p, 250)}"\n\nDescribe what you saw from where you were standing.`,

  modernize: (p) =>
    `This was written long ago:\n\n"${truncate(p, 250)}"\n\nRewrite it in the language of today.`,
};

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const cut = text.lastIndexOf(" ", maxLen);
  return text.substring(0, cut > 0 ? cut : maxLen) + "...";
}

// ============================================
// Prompt Classification
// ============================================

/** Determine the best prompt type for a passage based on its traits */
function classifyPassage(passage: RawPassage): PromptType[] {
  const types: PromptType[] = [];

  if (passage.traits.has("dialogue")) types.push("dialogue");
  if (passage.traits.has("opinion") || passage.traits.has("philosophical")) {
    types.push("philosophical", "contra");
  }
  if (passage.traits.has("sensory")) types.push("scene", "witness");
  if (passage.traits.has("action")) types.push("continue", "journal");

  // Universal types (any passage works)
  types.push("rewrite", "modernize", "letter");

  // Opening line — prefer shorter passages
  if (passage.text.length < 200) types.push("opening-line");

  return types;
}

// ============================================
// Main Extraction Pipeline
// ============================================

/**
 * Extract writing prompts from raw Gutenberg text.
 *
 * Pipeline:
 * 1. Split text into paragraphs
 * 2. Score paragraphs for interestingness
 * 3. Classify each passage by suitable prompt types
 * 4. Generate prompt text from templates
 * 5. Return ranked list for member curation
 */
export function extractPrompts(
  text: string,
  bookTitle: string,
  author: string,
  gutenbergId: number,
  options?: ExtractOptions
): WritingPrompt[] {
  const maxPrompts = options?.maxPrompts ?? 50;
  const allowedTypes = options?.types ? new Set(options.types) : null;

  // Step 1-2: Extract and score passages
  const passages = extractPassages(text, {
    minLength: options?.minPassageLength ?? 60,
    maxLength: options?.maxPassageLength ?? 600,
    maxPassages: maxPrompts * 3, // extract more than needed, then pick best
  });

  // Step 3-4: Classify and generate prompts
  const prompts: WritingPrompt[] = [];

  for (const passage of passages) {
    const suitableTypes = classifyPassage(passage);
    const filteredTypes = allowedTypes
      ? suitableTypes.filter((t) => allowedTypes.has(t))
      : suitableTypes;

    if (filteredTypes.length === 0) continue;

    // Pick the best type (first in the filtered list — most specific)
    const bestType = filteredTypes[0];
    const template = TEMPLATES[bestType];
    const promptText = template(passage.text, bookTitle, author);

    prompts.push({
      type: bestType,
      promptText,
      sourcePassage: passage.text,
      sourceBook: bookTitle,
      sourceAuthor: author,
      gutenbergId,
      score: passage.score,
    });
  }

  // Sort by score, deduplicate by type (spread variety)
  prompts.sort((a, b) => b.score - a.score);

  // Spread prompt types for variety
  const result: WritingPrompt[] = [];
  const typeCount = new Map<PromptType, number>();

  for (const prompt of prompts) {
    if (result.length >= maxPrompts) break;
    const count = typeCount.get(prompt.type) ?? 0;
    // Allow at most maxPrompts/5 of any single type
    if (count >= Math.ceil(maxPrompts / 5)) continue;
    result.push(prompt);
    typeCount.set(prompt.type, count + 1);
  }

  return result;
}

// ============================================
// Well-Known Gutenberg Books
// ============================================

export const CURATED_BOOKS = [
  { id: 84, title: "Frankenstein", author: "Mary Shelley", category: "Gothic" },
  { id: 1342, title: "Pride and Prejudice", author: "Jane Austen", category: "Literature" },
  { id: 2701, title: "Moby-Dick", author: "Herman Melville", category: "Literature" },
  { id: 345, title: "Dracula", author: "Bram Stoker", category: "Gothic" },
  { id: 1661, title: "Sherlock Holmes", author: "Arthur Conan Doyle", category: "Mystery" },
  { id: 1497, title: "The Republic", author: "Plato", category: "Philosophy" },
  { id: 205, title: "Walden", author: "Henry David Thoreau", category: "Essays" },
  { id: 1232, title: "The Prince", author: "Niccolò Machiavelli", category: "Philosophy" },
  { id: 768, title: "Wuthering Heights", author: "Emily Brontë", category: "Literature" },
  { id: 11, title: "Alice in Wonderland", author: "Lewis Carroll", category: "Fantasy" },
  { id: 1260, title: "Jane Eyre", author: "Charlotte Brontë", category: "Literature" },
  { id: 174, title: "The Picture of Dorian Gray", author: "Oscar Wilde", category: "Gothic" },
  { id: 1080, title: "A Modest Proposal", author: "Jonathan Swift", category: "Satire" },
  { id: 5200, title: "Metamorphosis", author: "Franz Kafka", category: "Surreal" },
  { id: 1952, title: "The Yellow Wallpaper", author: "Charlotte Perkins Gilman", category: "Gothic" },
  { id: 2600, title: "War and Peace", author: "Leo Tolstoy", category: "Literature" },
  { id: 1228, title: "Origin of Species", author: "Charles Darwin", category: "Science" },
  { id: 35, title: "The Time Machine", author: "H.G. Wells", category: "Science Fiction" },
  { id: 36, title: "War of the Worlds", author: "H.G. Wells", category: "Science Fiction" },
  { id: 996, title: "Don Quixote", author: "Miguel de Cervantes", category: "Literature" },
] as const;
