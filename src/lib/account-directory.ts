import type { UserRole } from "@/lib/rbac";

export type AccountStatus = "active" | "invited" | "suspended";

export type ManagedAccount = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  status: AccountStatus;
  lastActive: string | null;
};

export const ACCOUNT_DIRECTORY_KEY = "garuda:account-directory:v1";

export const DEMO_ACCOUNTS: ManagedAccount[] = [
  { id: "acct-1", name: "Maya Rao", email: "maya@northstar.edu", role: "candidate", organization: "Northstar Institute", status: "active", lastActive: "2026-09-05T17:40:00Z" },
  { id: "acct-2", name: "Aarav Mehta", email: "aarav@northstar.edu", role: "candidate", organization: "Northstar Institute", status: "active", lastActive: "2026-09-05T13:20:00Z" },
  { id: "acct-3", name: "Diya Nair", email: "diya@northstar.edu", role: "candidate", organization: "Northstar Institute", status: "active", lastActive: "2026-09-05T10:05:00Z" },
  { id: "acct-4", name: "Rohan Das", email: "rohan@northstar.edu", role: "candidate", organization: "Northstar Institute", status: "invited", lastActive: null },
  { id: "acct-5", name: "Anita Sharma", email: "anita@northstar.edu", role: "admin", organization: "Northstar Institute", status: "active", lastActive: "2026-09-05T16:30:00Z" },
  { id: "acct-6", name: "Rahul Verma", email: "rahul@uplift.org", role: "admin", organization: "Uplift Academy", status: "active", lastActive: "2026-09-04T11:10:00Z" },
  { id: "acct-7", name: "Garuda Operations", email: "ops@garuda.ai", role: "super-admin", organization: "Garuda", status: "active", lastActive: "2026-09-05T18:00:00Z" },
];

type DirectoryStorage = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): DirectoryStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function isAccount(value: unknown): value is ManagedAccount {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<ManagedAccount>;
  return (
    typeof account.id === "string" &&
    typeof account.email === "string" &&
    ["candidate", "admin", "super-admin"].includes(account.role || "") &&
    ["active", "invited", "suspended"].includes(account.status || "")
  );
}

export function readAccountDirectory(storage = browserStorage()) {
  if (!storage) return DEMO_ACCOUNTS;
  try {
    const parsed: unknown = JSON.parse(storage.getItem(ACCOUNT_DIRECTORY_KEY) || "null");
    return Array.isArray(parsed) && parsed.every(isAccount) ? parsed : DEMO_ACCOUNTS;
  } catch {
    return DEMO_ACCOUNTS;
  }
}

export function saveAccountDirectory(accounts: ManagedAccount[], storage = browserStorage()) {
  storage?.setItem(ACCOUNT_DIRECTORY_KEY, JSON.stringify(accounts));
  return accounts;
}
