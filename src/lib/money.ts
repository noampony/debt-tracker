export const shekelCurrency = "ILS";

const amountInputPattern = /^\d+(?:[.,]\d{1,2})?$/;

export function parseIlsInputToMinor(input: string): number | null {
  const normalizedInput = input.trim().replace(/\s/g, "").replace(/^₪/, "").replace(/₪$/, "");

  if (!amountInputPattern.test(normalizedInput)) {
    return null;
  }

  const [wholePart, decimalPart = ""] = normalizedInput.replace(",", ".").split(".");
  const wholeMinor = Number.parseInt(wholePart, 10) * 100;
  const decimalMinor = Number.parseInt(decimalPart.padEnd(2, "0") || "0", 10);
  const amountMinor = wholeMinor + decimalMinor;

  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    return null;
  }

  return amountMinor;
}

export function formatIls(amountMinor: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: shekelCurrency,
  }).format(amountMinor / 100);
}
