import type { LucideIcon } from "lucide-react";

type ColorType = "blue" | "emerald" | "amber" | "violet" | "red" | "orange";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: ColorType;
  subtitle?: string;
}

const colorStyles = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-950",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-950",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-950",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500",
  },
  violet: {
    bg: "bg-violet-100 dark:bg-violet-950",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-950",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-950",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = "blue",
  subtitle,
}: StatsCardProps) {
  // Proteção contra undefined/null
  const safeValue = value ?? 0;
  const selected = colorStyles[color] || colorStyles.blue;

  return (
    <div
      className={`
        flex items-center justify-between p-6 
        bg-card border border-border rounded-2xl 
        hover:shadow-md transition-all duration-200
        border-l-4 ${selected.border}
      `}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground font-medium">
          {title}
        </span>

        <span className="text-3xl font-semibold tracking-tight text-foreground">
          {safeValue}
        </span>

        {subtitle && (
          <span className="text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>

      <div className={`p-3.5 rounded-2xl ${selected.bg}`}>
        <Icon size={32} className={selected.text} strokeWidth={2.2} />
      </div>
    </div>
  );
}
