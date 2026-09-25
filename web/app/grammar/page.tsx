import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GRAMMAR_CATEGORIES, grammarPattern } from "@/lib/grammar";

export const metadata: Metadata = {
  title: "句型 | 多益練習",
  description: "多益 Part 5 常考的 12 種文法句型：公式、結構拆解、中英對照與情境練習",
};

export default function GrammarIndexPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">句型</h1>
        <p className="text-sm text-muted-foreground">
          先看懂句子的結構，再用短文練反應。每一類對應 Part 5 的一種文法題。
        </p>
      </div>
      <ul className="divide-y divide-border border-y border-border" data-testid="grammar-list">
        {GRAMMAR_CATEGORIES.map((item) => {
          const pattern = grammarPattern(item.slug);
          if (!pattern) {
            return (
              <li
                key={item.slug}
                className="flex items-baseline justify-between gap-3 px-1 py-3 text-muted-foreground"
              >
                <span>
                  <span className="text-base">{item.title}</span>
                  <span className="ml-2 text-xs" lang="en">
                    {item.category}
                  </span>
                </span>
                <span className="text-xs">準備中</span>
              </li>
            );
          }
          return (
            <li key={item.slug}>
              <Link
                href={`/grammar/${item.slug}`}
                data-testid={`grammar-link-${item.slug}`}
                className="flex items-center justify-between gap-3 px-1 py-3 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="min-w-0 space-y-0.5">
                  <span className="block">
                    <span className="text-base font-semibold">{item.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground" lang="en">
                      {item.category}
                    </span>
                  </span>
                  <span className="block text-sm text-muted-foreground">{pattern.formula}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
