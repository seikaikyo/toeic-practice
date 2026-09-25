import { ROLE_LABEL, type GrammarPattern, type GrammarRole } from "@/lib/grammar";

// 底線顏色只是輔助，每段下面都有角色文字，不靠顏色分辨。
const ROLE_BORDER: Record<GrammarRole, string> = {
  S: "border-[var(--chart-1)]",
  V: "border-[var(--chart-2)]",
  O: "border-[var(--chart-3)]",
  C: "border-[var(--chart-4)]",
  M: "border-[var(--chart-5)]",
};

export function StructureBreakdown({ parts }: { parts: GrammarPattern["breakdown"]["parts"] }) {
  return (
    <p className="flex flex-wrap items-start gap-x-2 gap-y-3" data-testid="grammar-breakdown">
      {parts.map((part, index) => (
        <span key={index} className="inline-flex flex-col">
          <span className={`border-b-2 pb-0.5 text-base leading-7 ${ROLE_BORDER[part.role]}`}>
            {part.text}
          </span>
          <span className="pt-0.5 text-xs text-muted-foreground">
            {ROLE_LABEL[part.role]} {part.role}
          </span>
        </span>
      ))}
    </p>
  );
}
