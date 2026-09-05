export type UserRole = "candidate" | "admin" | "super-admin";

export type Capability =
  | "practice:interview"
  | "progress:view-own"
  | "cohort:view"
  | "cohort:manage"
  | "accounts:manage"
  | "roles:assign";

export const ROLE_LABELS: Record<UserRole, string> = {
  candidate: "Candidate",
  admin: "Placement / L&D Admin",
  "super-admin": "Super Admin",
};

export const PUBLIC_LOGIN_ROLES = ["candidate", "admin"] as const satisfies readonly UserRole[];

const ROLE_CAPABILITIES: Record<UserRole, readonly Capability[]> = {
  candidate: ["practice:interview", "progress:view-own"],
  admin: ["cohort:view", "cohort:manage"],
  "super-admin": ["cohort:view", "cohort:manage", "accounts:manage", "roles:assign"],
};

export function hasCapability(role: UserRole, capability: Capability) {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function capabilitiesFor(role: UserRole) {
  return [...ROLE_CAPABILITIES[role]];
}
