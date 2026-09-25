import type { GrammarPattern } from "@/lib/grammar";

// 桌機是三欄表格，手機每列改成上下堆疊，避免表格撐出橫向捲動。
export function PatternTable({ rows }: { rows: GrammarPattern["table"] }) {
  return (
    <div className="border-y border-border" data-testid="grammar-table">
      <div className="hidden grid-cols-[1.3fr_1fr_1.5fr] gap-3 border-b border-border py-2 text-xs text-muted-foreground sm:grid">
        <span>英文</span>
        <span>中文</span>
        <span>規則</span>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li
            key={row.en}
            className="grid gap-1 py-2.5 text-sm leading-relaxed sm:grid-cols-[1.3fr_1fr_1.5fr] sm:gap-3"
          >
            <span className="font-medium break-words" lang="en">
              {row.en}
            </span>
            <span className="text-muted-foreground">{row.zh}</span>
            <span>{row.rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
