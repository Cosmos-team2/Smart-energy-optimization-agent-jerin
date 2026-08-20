/**
 * Normalize a datetime string to "HH:MM" for chart display and fixture matching.
 * Handles both "HH:MM" fixture labels and ISO 8601 timestamps from the backend.
 */
export function toHHMM(datetime: string): string {
  if (!datetime) return "";
  // Already "HH:MM" format from seed fixture
  if (/^\d{1,2}:\d{2}$/.test(datetime)) {
    return datetime.padStart(5, "0");
  }
  // ISO 8601 timestamp — parse and extract HH:MM in IST
  try {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) return datetime;
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return datetime;
  }
}
