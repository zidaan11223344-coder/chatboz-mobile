export type RoomMemberRole = "owner" | "moderator" | "member";

export function canManageRoomMembers(role: RoomMemberRole | null | undefined) {
  return role === "owner";
}

export function toggledManagedRole(role: RoomMemberRole): "moderator" | "member" {
  return role === "moderator" ? "member" : "moderator";
}
