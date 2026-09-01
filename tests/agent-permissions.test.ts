import { describe, expect, it } from "vitest";
import { DEFAULT_AGENT_PERMISSIONS, parseAgentPermissions, serializeAgentPermissions } from "../shared/agent-permissions";

describe("agent permissions", () => {
  it("defaults to account creation only", () => {
    expect(parseAgentPermissions("{}" )).toEqual(DEFAULT_AGENT_PERMISSIONS);
  });

  it("round-trips explicit permissions and ignores unknown keys", () => {
    const value = parseAgentPermissions(JSON.stringify({ createAccounts: false, manageRooms: true, unknown: true }));
    expect(value.createAccounts).toBe(false);
    expect(value.manageRooms).toBe(true);
    expect(JSON.parse(serializeAgentPermissions(value))).toEqual({
      createAccounts: false,
      manageRooms: true,
      transferPoints: false,
      manageFriendRequests: false,
      manageStore: false,
    });
  });
});
