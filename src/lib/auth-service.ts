import type { User } from "@supabase/supabase-js";
import type { LocalIdentity } from "@/lib/local-identity";
import type { UserRole } from "@/lib/rbac";
import { getSupabaseClient, isCloudAuthConfigured } from "@/lib/supabase";

function trustedRole(user: User): UserRole {
  const role = user.app_metadata?.role;
  return ["candidate", "admin", "super-admin"].includes(role) ? role : "candidate";
}

function identityFromUser(user: User): LocalIdentity {
  return {
    accountId: user.id,
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Candidate",
    email: user.email || "",
    persona: trustedRole(user),
    organization: user.app_metadata?.organization,
    authMode: "cloud",
  };
}

export async function getAuthenticatedIdentity() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return identityFromUser(data.user);
}

export async function registerCandidate(input: {
  name: string;
  email: string;
  password: string;
}) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Cloud accounts are not configured for this deployment.");
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.name } },
  });
  if (error) throw error;
  return {
    identity: data.session && data.user ? identityFromUser(data.user) : null,
    needsConfirmation: !data.session,
  };
}

export async function signInWithPassword(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Cloud accounts are not configured for this deployment.");
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return identityFromUser(data.user);
}

export async function signOutCloudAccount() {
  const client = getSupabaseClient();
  if (client) await client.auth.signOut();
}

export { isCloudAuthConfigured };
