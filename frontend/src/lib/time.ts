const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(iso: string) {
  const date = new Date(iso);
  const seconds = (date.getTime() - Date.now()) / 1000; // negative for the past

  if (Math.abs(seconds) >= 7 * 86_400) return date.toLocaleDateString();

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size)
      return rtf.format(Math.round(seconds / size), unit);
  }

  return "just now";
}
