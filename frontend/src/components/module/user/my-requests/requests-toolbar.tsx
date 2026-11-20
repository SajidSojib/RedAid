import Link from "next/link";
import { cn } from "@/lib/utils";

const BASE = "/dashboard/my-requests";

type Type = "donor" | "bank";
type Scope = "active" | "history";

const TYPES: { value: Type; label: string }[] = [
  { value: "donor", label: "Donor requests" },
  { value: "bank", label: "Bank requests" },
];

const SCOPES: { value: Scope; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "history", label: "History" },
];

// Switching one control keeps the other, and defaults stay out of the URL
const href = (type: Type, scope: Scope) => {
  const params = new URLSearchParams();
  if (type === "bank") params.set("type", "bank");
  if (scope === "history") params.set("scope", "history");
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
};

export function RequestsToolbar({ type, scope }: { type: Type; scope: Scope }) {
  return (
    <div className="flex flex-col gap-3 border-b sm:flex-row sm:items-end sm:justify-between">
      <nav aria-label="Request type" className="-mb-px flex gap-6">
        {TYPES.map((t) => (
          <Link
            key={t.value}
            href={href(t.value, scope)}
            aria-current={type === t.value ? "page" : undefined}
            className={cn(
              "border-b-2 pb-3 text-sm font-medium transition-colors",
              type === t.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <nav
        aria-label="Scope"
        className="mb-3 inline-flex w-fit gap-0.5 rounded-full bg-muted p-0.5"
      >
        {SCOPES.map((s) => (
          <Link
            key={s.value}
            href={href(type, s.value)}
            aria-current={scope === s.value ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all",
              scope === s.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
