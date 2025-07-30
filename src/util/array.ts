export function getMaxByKey<T extends Record<string, any>>(
  items: T[],
  key: keyof T,
  secondaryKey: keyof T = "totalMatches" 
): T | undefined {
  if (items.length === 0) return undefined;

  return items.reduce((max, curr) => {
    const currValue = curr[key];
    const maxValue = max[key];

    if (typeof currValue === "number" && typeof maxValue === "number") {
      if (currValue > maxValue) return curr;
      if (currValue < maxValue) return max;

      const currSecondary = curr[secondaryKey];
      const maxSecondary = max[secondaryKey];

      if (
        typeof currSecondary === "number" &&
        typeof maxSecondary === "number"
      ) {
        return currSecondary > maxSecondary ? curr : max;
      }
    }

    return max;
  }, items[0]);
}
