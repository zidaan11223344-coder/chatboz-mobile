import { describe, expect, it } from "vitest";
import { canManageRoomMembers, toggledManagedRole } from "../shared/room-permissions";

describe("room permissions", () => {
  it("allows only the owner to manage member roles", () => {
    expect(canManageRoomMembers("owner")).toBe(true);
    expect(canManageRoomMembers("moderator")).toBe(false);
    expect(canManageRoomMembers("member")).toBe(false);
    expect(canManageRoomMembers(null)).toBe(false);
  });

  it("toggles moderator and member without changing owner", () => {
    expect(toggledManagedRole("moderator")).toBe("member");
    expect(toggledManagedRole("member")).toBe("moderator");
  });
});
