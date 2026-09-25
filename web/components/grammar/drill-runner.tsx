"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OptionButton, type OptionState } from "@/components/quiz/option-button";
import { optionLetter } from "@/lib/format";
import type { GrammarDrill } from "@/lib/grammar";
import { cn } from "@/lib/utils";

const LIMIT_MS = 3000;
const TIMER_KEY = "toeic:grammar-timer";

type Phase = "idle" | "asking" | "answered" | "done";

function readTimerSetting(): boolean {
  try {
    return window.localStorage.getItem(TIMER_KEY) !== "off";
  } catch {
    return true;
  }
}

function saveTimerSetting(on: boolean) {
  try {
    window.localStorage.setItem(TIMER_KEY, on ? "on" : "off");
  } catch {
    // 存不了只是下次要再關一次
  }
}

/* 情境練習：每題限時 3 秒，逼自己不經過中文直接反應。
 * 倒數可以關掉（計時必須能調整，無障礙要求），設定存在瀏覽器。
 */
export function DrillRunner({ drills }: { drills: GrammarDrill[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [index, setIndex] = useState(0);
  // null 代表時間到沒答
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [timerOn, setTimerOn] = useState(true);
  const [remaining, setRemaining] = useState(LIMIT_MS);
  const deadline = useRef(0);
  const firstOption = useRef<HTMLDivElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const saved = readTimerSetting();
    queueMicrotask(() => setTimerOn(saved));
  }, []);

  const drill = drills[index];
  const answer = answers[index];

  const record = useCallback(
    (value: string | null) => {
      setAnswers((prev) => {
        if (prev.length > index) return prev;
        return [...prev, value];
      });
      setPhase("answered");
    },
    [index],
  );

  useEffect(() => {
    if (phase !== "asking") return;
    firstOption.current?.querySelector("button")?.focus();
    if (!timerOn) return;
    deadline.current = Date.now() + LIMIT_MS;
    const tick = window.setInterval(() => {
      const left = Math.max(0, deadline.current - Date.now());
      setRemaining(left);
      if (left === 0) {
        window.clearInterval(tick);
        record(null);
      }
    }, 100);
    return () => window.clearInterval(tick);
  }, [phase, index, timerOn, record]);

  useEffect(() => {
    if (phase === "answered") nextButton.current?.focus();
  }, [phase]);

  function start() {
    setAnswers([]);
    setIndex(0);
    setRemaining(LIMIT_MS);
    setPhase("asking");
  }

  function next() {
    if (index + 1 >= drills.length) {
      setPhase("done");
      return;
    }
    setIndex(index + 1);
    setRemaining(LIMIT_MS);
    setPhase("asking");
  }

  function optionState(option: string): OptionState {
    if (phase !== "answered") return "idle";
    if (option === drill.answer) return "correct";
    if (option === answer) return "incorrect";
    return "muted";
  }

  const timerToggle = (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <input
        type="checkbox"
        checked={timerOn}
        data-testid="grammar-timer-toggle"
        className="size-4 accent-[var(--primary)]"
        onChange={(event) => {
          setTimerOn(event.target.checked);
          saveTimerSetting(event.target.checked);
          setRemaining(LIMIT_MS);
        }}
      />
      每題限時 3 秒
    </label>
  );

  if (phase === "idle") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        {timerToggle}
        <Button type="button" data-testid="grammar-drill-start" onClick={start}>
          開始練習
        </Button>
      </div>
    );
  }

  if (phase === "done") {
    const correct = drills.filter((d, i) => answers[i] === d.answer).length;
    return (
      <div className="space-y-3" data-testid="grammar-drill-result">
        <p className="text-base font-semibold">
          答對 {correct} / {drills.length} 題
        </p>
        <ol className="divide-y divide-border border-y border-border">
          {drills.map((d, i) => {
            const ok = answers[i] === d.answer;
            return (
              <li key={i} className="space-y-1 py-2.5 text-sm">
                <p className="flex items-start gap-2" lang="en">
                  {ok ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--tone-good)]" aria-label="答對" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-[var(--tone-poor)]" aria-label="答錯" />
                  )}
                  <span>{d.prompt}</span>
                </p>
                <p className="pl-6 text-muted-foreground">
                  正解 <span lang="en">{d.answer}</span>
                  {ok ? null : (
                    <>
                      ，你的答案 {answers[i] === null ? "時間到" : <span lang="en">{answers[i]}</span>}
                    </>
                  )}
                </p>
                {ok ? null : <p className="pl-6">{d.fix}</p>}
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {timerToggle}
          <Button type="button" variant="outline" data-testid="grammar-drill-restart" onClick={start}>
            <RotateCcw data-icon="inline-start" />
            再練一次
          </Button>
        </div>
      </div>
    );
  }

  const isCorrect = answer === drill.answer;

  return (
    <div className="space-y-3" data-testid="grammar-drill">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          第 {index + 1} 題 / 共 {drills.length} 題
        </span>
        {timerOn && phase === "asking" ? (
          <span className="tabular-nums" aria-hidden>
            {(remaining / 1000).toFixed(1)} 秒
          </span>
        ) : null}
      </div>
      {timerOn ? (
        <Progress
          value={phase === "asking" ? (remaining / LIMIT_MS) * 100 : 0}
          aria-label="剩餘時間"
        />
      ) : null}
      <p className="text-base leading-7" lang="en" data-testid="grammar-drill-prompt">
        {drill.prompt}
      </p>
      <div ref={firstOption} className="grid gap-2 sm:grid-cols-3">
        {drill.choices.map((option, i) => (
          <OptionButton
            key={option}
            marker={optionLetter(i)}
            label={option}
            state={optionState(option)}
            disabled={phase !== "asking"}
            onClick={() => record(option)}
          />
        ))}
      </div>
      {phase === "answered" ? (
        <div className="space-y-2" aria-live="polite">
          <p
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold",
              isCorrect
                ? "bg-[var(--tone-good-soft)] text-[var(--tone-good)]"
                : "bg-[var(--tone-poor-soft)] text-[var(--tone-poor)]",
            )}
          >
            {isCorrect ? "答對了" : answer === null ? "時間到" : "答錯了"}
          </p>
          {isCorrect ? null : <p className="text-sm leading-relaxed">{drill.fix}</p>}
          <div className="flex justify-end">
            <Button ref={nextButton} type="button" data-testid="grammar-drill-next" onClick={next}>
              {index + 1 >= drills.length ? "看結果" : "下一題"}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
