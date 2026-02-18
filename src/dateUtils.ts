/**
 * Resolves date expressions like `today()-5Y`, `today()-6M`, `today()-30D`
 * into ISO date strings (YYYY-MM-DD).
 */
export function resolveDate(expr: string): string {
  const trimmed = expr.trim();

  // Already a date literal
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // today() with no offset
  if (trimmed === "today()") {
    return toISO(new Date());
  }

  // today()-NY, today()-NM, today()-ND
  const match = trimmed.match(/^today\(\)\s*-\s*(\d+)(Y|M|D)$/i);
  if (!match) {
    return trimmed; // Return as-is if unrecognized
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2].toUpperCase();
  const now = new Date();

  switch (unit) {
    case "Y":
      now.setFullYear(now.getFullYear() - amount);
      break;
    case "M":
      now.setMonth(now.getMonth() - amount);
      break;
    case "D":
      now.setDate(now.getDate() - amount);
      break;
  }

  return toISO(now);
}

function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}
