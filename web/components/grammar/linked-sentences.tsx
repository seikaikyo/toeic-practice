"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExampleSentence, collectTokens } from "@/components/vocabulary/example-sentence";
import { WordPopover, type PopoverAnchor } from "@/components/vocabulary/word-popover";
import { lookupTokens } from "@/lib/api";
import { setStudyWord } from "@/lib/review-handoff";
import type { LookupEntries, Word } from "@/lib/types";

/* 例句與短文。字庫查得到的字可以點，小卡裡的「去背」跳到背單字頁第一張。
 * 開關小卡的時間差跟背單字頁的例句一致：滑過停 150 毫秒才開，離開 120 毫秒才關。
 */
export function LinkedSentences({
  sentences,
  ordered = false,
  testId,
}: {
  sentences: string[];
  ordered?: boolean;
  testId?: string;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<LookupEntries>({});
  const [picked, setPicked] = useState<{ word: Word; anchor: PopoverAnchor | null } | null>(null);
  const [hoverCapable, setHoverCapable] = useState(false);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    queueMicrotask(() => setHoverCapable(query.matches));
  }, []);

  useEffect(() => {
    const tokens = collectTokens(sentences);
    if (tokens.length === 0) return;
    lookupTokens(tokens)
      .then(setEntries)
      // 查不到就維持純文字，句子照樣讀得到
      .catch(() => setEntries({}));
  }, [sentences]);

  const clearTimers = useCallback(() => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const pick = useCallback(
    (word: Word, anchor: PopoverAnchor | null, hover: boolean) => {
      clearTimers();
      if (!hover) {
        setPicked({ word, anchor });
        return;
      }
      openTimer.current = window.setTimeout(() => setPicked({ word, anchor }), 150);
    },
    [clearTimers],
  );

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setPicked(null), 120);
  }, [clearTimers]);

  const List = ordered ? "ol" : "ul";

  return (
    <>
      <List className="space-y-1" data-testid={testId}>
        {sentences.map((sentence, index) => (
          <li key={index} lang="en" className={ordered ? "flex gap-2" : undefined}>
            {ordered ? (
              <span aria-hidden className="pt-1 text-xs text-muted-foreground tabular-nums">
                {index + 1}
              </span>
            ) : null}
            <ExampleSentence
              sentence={sentence}
              entries={entries}
              onPick={pick}
              onLeave={scheduleClose}
            />
          </li>
        ))}
      </List>
      {picked ? (
        <WordPopover
          word={picked.word}
          anchor={picked.anchor}
          hoverCapable={hoverCapable}
          canSpeak={false}
          onSpeak={() => {}}
          onClose={() => {
            clearTimers();
            setPicked(null);
          }}
          onJump={() => {
            setStudyWord(picked.word);
            router.push("/vocabulary");
          }}
          onPointerEnter={clearTimers}
          onPointerLeave={scheduleClose}
        />
      ) : null}
    </>
  );
}
