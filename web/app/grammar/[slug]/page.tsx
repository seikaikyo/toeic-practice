import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DrillRunner } from "@/components/grammar/drill-runner";
import { LinkedSentences } from "@/components/grammar/linked-sentences";
import { PatternTable } from "@/components/grammar/pattern-table";
import { StructureBreakdown } from "@/components/grammar/structure-breakdown";
import { grammarPattern, grammarPatterns } from "@/lib/grammar";

// 內容是靜態資料，建置時把有內容的分類全部產生好，其餘網址直接 404。
export const dynamicParams = false;

export function generateStaticParams() {
  return grammarPatterns().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/grammar/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pattern = grammarPattern(slug);
  return pattern
    ? { title: `${pattern.title} | 句型 | 多益練習`, description: pattern.point }
    : {};
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3" aria-labelledby={`grammar-step-${step}`}>
      <h2 id={`grammar-step-${step}`} className="flex items-baseline gap-2 text-lg font-semibold">
        <span className="text-sm text-muted-foreground tabular-nums">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function GrammarPatternPage({ params }: PageProps<"/grammar/[slug]">) {
  const { slug } = await params;
  const pattern = grammarPattern(slug);
  if (!pattern) notFound();

  return (
    <article className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/grammar"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          所有句型
        </Link>
        <h1 className="text-2xl font-bold">
          {pattern.title}
          <span className="ml-2 text-sm font-normal text-muted-foreground" lang="en">
            {pattern.category}
          </span>
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{pattern.point}</p>
      </div>

      <Section step={1} title="句型公式">
        <p className="border-l-2 border-primary pl-3 text-base leading-7" data-testid="grammar-formula">
          {pattern.formula}
        </p>
      </Section>

      <Section step={2} title="結構拆解">
        <StructureBreakdown parts={pattern.breakdown.parts} />
      </Section>

      <Section step={3} title="中英對照">
        <PatternTable rows={pattern.table} />
      </Section>

      <Section step={4} title="同句型例句">
        <p className="text-sm text-muted-foreground">結構不變，只換名詞和動詞。字下有虛線的可以點開查。</p>
        <LinkedSentences sentences={pattern.examples} testId="grammar-examples" />
      </Section>

      <Section step={5} title="情境練習">
        <p className="text-sm text-muted-foreground">
          先讀短文，再回答三題。不要在腦中翻成中文，看到題目直接反應。
        </p>
        <LinkedSentences sentences={pattern.story} ordered testId="grammar-story" />
        <DrillRunner drills={pattern.drills} />
      </Section>
    </article>
  );
}
