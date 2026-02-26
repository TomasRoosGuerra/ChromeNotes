export const MINUTES_PER_DAY = 24 * 60;

export function minutesToLabel(mins: number): string {
  const clamped = ((mins % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const displayH = ((h + 11) % 12) + 1;
  return `${displayH.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")} ${suffix}`;
}

export function formatDurationMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function parseDuration(input: string): number | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  // Handle formats like "1h30", "1h30m"
  if (raw.includes("h")) {
    const [hPart, restPart] = raw.split("h");
    const hours = Number(hPart.trim());
    if (!Number.isFinite(hours)) return null;
    let minutes = 0;
    const rest = restPart.replace(/m|min/g, "").trim();
    if (rest) {
      const mVal = Number(rest);
      if (!Number.isFinite(mVal)) return null;
      minutes = mVal;
    }
    return hours * 60 + minutes;
  }

  // Handle formats like "30m" or "30min"
  if (raw.endsWith("m") || raw.endsWith("min")) {
    const num = raw.replace(/m|min/g, "").trim();
    const minutes = Number(num);
    return Number.isFinite(minutes) ? minutes : null;
  }

  // Fallback: plain number in minutes
  const minutes = Number(raw);
  return Number.isFinite(minutes) ? minutes : null;
}

