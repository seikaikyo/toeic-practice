"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExampleSentence, collectTokens } from "@/components/vocabulary/example-sentence";
import { WordPopover, type PopoverAnchor } from "@/components/vocabulary/word-popover";
import {
  DEFAULT_ACCENT,
  DEFAULT_GENDER,
  MALE_READY,
  audioUrlFor,
  useSpeech,
  type AccentId,
  type GenderId,
} from "@/hooks/use-speech";
import { lookupTokens } from "@/lib/api";
import { sentenceAudioUrl } from "@/lib/grammar";
import { setStudyWord } from "@/lib/review-handoff";
import type { LookupEntries, Word } from "@/lib/types";

/** 發音沿用背單字頁存下的口音與聲音，沒存過就用預設。 */
function savedVoice(): { accent: AccentId; gender: GenderId } {
  try {
    const accent = window.localStorage.getItem("toeic:accent");
    const gender = window.localStorage.getItem("toeic:gender");
    return {
      accent: accent === "us" || accent === "gb" || accent === "au" ? accent : DEFAULT_ACCENT,
      gender: gender === "f" || (gender === "m" && MALE_READY) ? gender : DEFAULT_GENDER,
    };
  } catch {
    return { accent: DEFAULT_ACCENT, gender: DEFAULT_GENDER };
  }
}

/* 例句與短文。字庫查得到的字可以點，小卡裡可以聽發音，「去背」跳到背單字頁第一張。
 * 開關小卡的時間差跟背單字頁的例句一致：滑過停 150 毫秒才開，離開 120 毫秒才關。
 */
export function LinkedSentences({
  sentences,
  slug,
  kind,
  ordered = false,
  testId,
}: {
  sentences: string[];
  slug: string;
  kind: "example" | "story";
  ordered?: boolean;
  testId?: string;
}) {
  const router = useRouter();
  const { supported, speaking, speak } = useSpeech();
  const [playing, setPlaying] = useState<number | null>(null);
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
        {sentences.map((sentence, index) => {
          const audioUrl = sentenceAudioUrl(slug, kind, index, sentence);
          return (
            <li key={index} lang="en" className="flex items-start gap-1.5">
              {audioUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`播放第 ${index + 1} 句`}
                  data-testid={`${testId ?? kind}-speak-${index + 1}`}
                  className={`size-7 shrink-0 ${speaking && playing === index ? "text-primary" : ""}`}
                  onClick={() => {
                    setPlaying(index);
                    speak(sentence, audioUrl);
                  }}
                >
                  <Volume2 className="size-4" aria-hidden />
                </Button>
              ) : null}
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
          );
        })}
      </List>
      {picked ? (
        <WordPopover
          word={picked.word}
          anchor={picked.anchor}
          hoverCapable={hoverCapable}
          canSpeak={supported}
          onSpeak={() => {
            const { accent, gender } = savedVoice();
            speak(picked.word.word, audioUrlFor(picked.word.id, accent, gender));
          }}
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
