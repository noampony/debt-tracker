export function formatIsoDateForInput(date: Date): string {
  return getDateIso(date);
}

export function getTodayDateIso(date = new Date()): string {
  return getDateIso(date);
}

export function formatDate(dateIso: string): string {
  const date = parseDateIso(dateIso);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateIso(dateIso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);

  if (!match) {
    return null;
  }

  const [, yearInput, monthInput, dayInput] = match;
  const year = Number.parseInt(yearInput, 10);
  const month = Number.parseInt(monthInput, 10);
  const day = Number.parseInt(dayInput, 10);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}
