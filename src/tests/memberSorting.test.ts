import { sortMembersByBalance, type MemberListItem } from "../features/members/sorting";

function createMemberListItem(name: string, balanceMinor: number): MemberListItem {
  return {
    id: name,
    name,
    balanceMinor,
    createdAt: "2026-05-23T08:00:00.000Z",
    updatedAt: "2026-05-23T08:00:00.000Z",
  };
}

describe("sortMembersByBalance", () => {
  it("puts non-zero balances first and sorts by largest absolute balance", () => {
    const sortedMembers = sortMembersByBalance([
      createMemberListItem("אפס", 0),
      createMemberListItem("קטן", 1200),
      createMemberListItem("גדול", -5000),
      createMemberListItem("בינוני", 3000),
    ]);

    expect(sortedMembers.map((member) => member.name)).toEqual(["גדול", "בינוני", "קטן", "אפס"]);
  });

  it("sorts equal balances by Hebrew name", () => {
    const sortedMembers = sortMembersByBalance([
      createMemberListItem("תמר", 2500),
      createMemberListItem("אורי", -2500),
      createMemberListItem("דני", 0),
      createMemberListItem("בר", 0),
    ]);

    expect(sortedMembers.map((member) => member.name)).toEqual(["אורי", "תמר", "בר", "דני"]);
  });
});
