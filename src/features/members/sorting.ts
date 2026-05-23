import type { Member } from "./types";

export type MemberListItem = Member & {
  balanceMinor: number;
};

export function sortMembersByBalance(items: readonly MemberListItem[]): MemberListItem[] {
  return [...items].sort((first, second) => {
    const firstIsSettled = first.balanceMinor === 0;
    const secondIsSettled = second.balanceMinor === 0;

    if (firstIsSettled !== secondIsSettled) {
      return firstIsSettled ? 1 : -1;
    }

    const balanceDifference = Math.abs(second.balanceMinor) - Math.abs(first.balanceMinor);

    if (balanceDifference !== 0) {
      return balanceDifference;
    }

    return first.name.localeCompare(second.name, "he");
  });
}
