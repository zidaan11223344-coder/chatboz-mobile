export const AGENT_PERMISSION_KEYS = [
  "createAccounts",
  "manageRooms",
  "transferPoints",
  "manageFriendRequests",
  "manageStore",
] as const;

export type AgentPermissionKey = (typeof AGENT_PERMISSION_KEYS)[number];
export type AgentPermissions = Record<AgentPermissionKey, boolean>;

export const DEFAULT_AGENT_PERMISSIONS: AgentPermissions = {
  createAccounts: true,
  manageRooms: false,
  transferPoints: false,
  manageFriendRequests: false,
  manageStore: false,
};

export const AGENT_PERMISSION_LABELS: Record<AgentPermissionKey, string> = {
  createAccounts: "إنشاء الحسابات",
  manageRooms: "إدارة الغرف",
  transferPoints: "تحويل النقاط",
  manageFriendRequests: "إدارة طلبات الصداقة",
  manageStore: "إدارة المتجر",
};

export function parseAgentPermissions(raw: string | null | undefined): AgentPermissions {
  try {
    const parsed = JSON.parse(raw || "{}");
    return AGENT_PERMISSION_KEYS.reduce((result, key) => {
      result[key] = parsed?.[key] === undefined ? DEFAULT_AGENT_PERMISSIONS[key] : parsed[key] === true;
      return result;
    }, { ...DEFAULT_AGENT_PERMISSIONS } as AgentPermissions);
  } catch {
    return { ...DEFAULT_AGENT_PERMISSIONS };
  }
}

export function serializeAgentPermissions(permissions: Partial<AgentPermissions>): string {
  return JSON.stringify(AGENT_PERMISSION_KEYS.reduce((result, key) => {
    result[key] = permissions[key] === true;
    return result;
  }, {} as AgentPermissions));
}
