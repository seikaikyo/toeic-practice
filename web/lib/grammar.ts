/* 句型區的內容。一個文法分類一份 JSON，放在 data/grammar/，隨前端一起出貨，
 * 不打後端也不呼叫任何付費 API。category 跟題目的 grammar_category 同一套字。
 */
import verbTense from "@/data/grammar/verb-tense.json";
import wordForm from "@/data/grammar/word-form.json";
import preposition from "@/data/grammar/preposition.json";
import gerundInfinitive from "@/data/grammar/gerund-infinitive.json";
import subjunctive from "@/data/grammar/subjunctive.json";
import comparison from "@/data/grammar/comparison.json";
import relativeClause from "@/data/grammar/relative-clause.json";
import passiveVoice from "@/data/grammar/passive-voice.json";
import conjunction from "@/data/grammar/conjunction.json";
import pronoun from "@/data/grammar/pronoun.json";
import quantifier from "@/data/grammar/quantifier.json";
import vocabulary from "@/data/grammar/vocabulary.json";

export type GrammarRole = "S" | "V" | "O" | "C" | "M";

export interface GrammarDrill {
  prompt: string;
  choices: string[];
  answer: string;
  /** 答錯時顯示的一句修正 */
  fix: string;
}

export interface GrammarPattern {
  slug: string;
  category: string;
  title: string;
  point: string;
  formula: string;
  breakdown: { parts: { text: string; role: GrammarRole }[] };
  table: { en: string; zh: string; rule: string }[];
  examples: string[];
  story: string[];
  drills: GrammarDrill[];
}

export const ROLE_LABEL: Record<GrammarRole, string> = {
  S: "主詞",
  V: "動詞",
  O: "受詞",
  C: "補語",
  M: "修飾語",
};

/** 題庫的 12 個文法分類，順序即列表順序 */
export const GRAMMAR_CATEGORIES = [
  { category: "verb tense", slug: "verb-tense", title: "動詞時態" },
  { category: "word form", slug: "word-form", title: "詞性" },
  { category: "preposition", slug: "preposition", title: "介系詞" },
  { category: "gerund/infinitive", slug: "gerund-infinitive", title: "動名詞與不定詞" },
  { category: "subjunctive", slug: "subjunctive", title: "假設語氣" },
  { category: "comparison", slug: "comparison", title: "比較級" },
  { category: "relative clause", slug: "relative-clause", title: "關係子句" },
  { category: "passive voice", slug: "passive-voice", title: "被動語態" },
  { category: "conjunction", slug: "conjunction", title: "連接詞" },
  { category: "pronoun", slug: "pronoun", title: "代名詞" },
  { category: "quantifier", slug: "quantifier", title: "數量詞" },
  { category: "vocabulary", slug: "vocabulary", title: "字義辨析" },
] as const;

const PATTERNS = [
  verbTense,
  wordForm,
  preposition,
  gerundInfinitive,
  subjunctive,
  comparison,
  relativeClause,
  passiveVoice,
  conjunction,
  pronoun,
  quantifier,
  vocabulary,
] as GrammarPattern[];

export function grammarPatterns(): GrammarPattern[] {
  return PATTERNS;
}

export function grammarPattern(slug: string): GrammarPattern | undefined {
  return PATTERNS.find((p) => p.slug === slug);
}

/** 題目的 grammar_category 對到有內容的句型頁；沒有就回 undefined，不出連結 */
export function patternForCategory(category?: string): GrammarPattern | undefined {
  if (!category) return undefined;
  return PATTERNS.find((p) => p.category === category);
}
