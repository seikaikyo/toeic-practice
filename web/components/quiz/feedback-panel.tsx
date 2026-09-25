import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { patternForCategory } from "@/lib/grammar";
import { cn } from "@/lib/utils";

export function FeedbackPanel({
  isCorrect,
  explanation,
  category,
  className,
}: {
  isCorrect: boolean;
  explanation?: string;
  /** 題目的 grammar_category，有對應的句型頁才出連結 */
  category?: string;
  className?: string;
}) {
  const pattern = patternForCategory(category);
  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
          isCorrect
            ? "bg-[var(--tone-good-soft)] text-[var(--tone-good)]"
            : "bg-[var(--tone-poor-soft)] text-[var(--tone-poor)]",
        )}
      >
        {isCorrect ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <X className="size-4" aria-hidden="true" />
        )}
        {isCorrect ? "答對了" : "答錯了"}
      </div>
      {explanation ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {explanation}
        </p>
      ) : null}
      {pattern ? (
        <Link
          href={`/grammar/${pattern.slug}`}
          data-testid="feedback-grammar-link"
          className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
        >
          看這個句型：{pattern.title}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
