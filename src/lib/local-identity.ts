import type { UserRole } from "@/lib/rbac";

export type UserPersona = UserRole;

export type LocalIdentity = {
  accountId: string;
  name: string;
  email: string;
  persona: UserPersona;
  authMode: "cloud" | "demo";
  organization?: string;
};

export const IDENTITY_STORAGE_KEY = "garuda:local-identity:v1";

type IdentityStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): IdentityStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function readLocalIdentity(storage = browserStorage()): LocalIdentity | null {
  if (!storage) return null;
  try {
    const value = JSON.parse(storage.getItem(IDENTITY_STORAGE_KEY) || "null") as Partial<LocalIdentity> | null;
    if (
      !value ||
      typeof value.name !== "string" ||
      typeof value.email !== "string" ||
      !["candidate", "admin", "super-admin"].includes(value.persona || "")
    ) {
      return null;
    }
    const identity = {
      ...value,
      accountId:
        typeof value.accountId === "string"
          ? value.accountId
          : globalThis.crypto?.randomUUID?.() || `local-${Date.now()}`,
      authMode: value.authMode === "cloud" ? "cloud" as const : "demo" as const,
    } as LocalIdentity;
    storage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
    return identity;
  } catch {
    return null;
  }
}

export function createDemoIdentity(
  identity: Omit<LocalIdentity, "accountId" | "authMode">,
): LocalIdentity {
  return {
    ...identity,
    accountId: globalThis.crypto?.randomUUID?.() || `local-${Date.now()}`,
    authMode: "demo",
  };
}

export function saveLocalIdentity(identity: LocalIdentity, storage = browserStorage()) {
  storage?.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

export function clearLocalIdentity(storage = browserStorage()) {
  storage?.removeItem(IDENTITY_STORAGE_KEY);
}
