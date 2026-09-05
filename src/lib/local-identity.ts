export type UserPersona = "candidate" | "admin";

export type LocalIdentity = {
  name: string;
  email: string;
  persona: UserPersona;
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
      !["candidate", "admin"].includes(value.persona || "")
    ) {
      return null;
    }
    return value as LocalIdentity;
  } catch {
    return null;
  }
}

export function saveLocalIdentity(identity: LocalIdentity, storage = browserStorage()) {
  storage?.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

export function clearLocalIdentity(storage = browserStorage()) {
  storage?.removeItem(IDENTITY_STORAGE_KEY);
}
