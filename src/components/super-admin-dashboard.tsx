"use client";

import { useMemo, useState } from "react";
import { Building2, LogOut, Search, ShieldCheck, UserCog, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  readAccountDirectory,
  saveAccountDirectory,
  type AccountStatus,
  type ManagedAccount,
} from "@/lib/account-directory";
import type { LocalIdentity } from "@/lib/local-identity";
import { ROLE_LABELS, type UserRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const MANAGEABLE_ROLES: UserRole[] = ["candidate", "admin", "super-admin"];

export function SuperAdminDashboard({
  identity,
  onSignOut,
}: {
  identity: LocalIdentity;
  onSignOut: () => void;
}) {
  const [accounts, setAccounts] = useState<ManagedAccount[]>(() => readAccountDirectory());
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  const filtered = useMemo(
    () =>
      accounts.filter(
        (account) =>
          (roleFilter === "all" || account.role === roleFilter) &&
          `${account.name} ${account.email} ${account.organization}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [accounts, query, roleFilter],
  );

  function updateAccount(id: string, change: Partial<Pick<ManagedAccount, "role" | "status">>) {
    setAccounts((current) => {
      const next = current.map((account) => (account.id === id ? { ...account, ...change } : account));
      saveAccountDirectory(next);
      return next;
    });
  }

  const candidateCount = accounts.filter(({ role }) => role === "candidate").length;
  const adminCount = accounts.filter(({ role }) => role === "admin").length;
  const suspendedCount = accounts.filter(({ status }) => status === "suspended").length;
  const organizations = new Set(accounts.map(({ organization }) => organization)).size;

  return (
    <main className="min-h-svh bg-[#f7f3eb]">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div>
            <p className="font-heading text-lg font-semibold leading-none">Garuda Control</p>
            <p className="mt-1 text-[10px] font-semibold tracking-wider text-primary uppercase">
              Super admin
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold">{identity.name}</p>
              <p className="text-[10px] text-muted-foreground">Platform governance</p>
            </div>
            <Button variant="outline" size="sm" onClick={onSignOut}>
              <LogOut /> <span className="hidden sm:inline">Switch account</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <Badge className="gap-1.5 bg-primary/10 text-primary">
          <ShieldCheck className="size-3.5" /> RBAC control plane
        </Badge>
        <h1 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl">Accounts and access</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Govern who can practice, who can manage cohorts, and who can administer the platform.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Candidates", value: candidateCount, icon: Users },
            { label: "Placement admins", value: adminCount, icon: UserCog },
            { label: "Organizations", value: organizations, icon: Building2 },
            { label: "Suspended", value: suspendedCount, icon: ShieldCheck },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="py-0">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
                    <Icon className="size-4 text-primary" />
                  </div>
                  <p className="mt-3 font-heading text-3xl font-semibold">{metric.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 py-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="font-heading text-xl font-semibold">Account directory</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assign roles and suspend access across organizations
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9 sm:w-64"
                    placeholder="Search accounts"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <Select
                  value={roleFilter}
                  onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}
                >
                  <SelectTrigger className="h-9 w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {MANAGEABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-xl border border-border lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/55 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Account</th>
                    <th className="px-4 py-3 font-semibold">Organization</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((account) => (
                    <tr key={account.id} className="bg-background">
                      <td className="px-4 py-4">
                        <p className="font-semibold">{account.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{account.email}</p>
                      </td>
                      <td className="px-4 py-4">{account.organization}</td>
                      <td className="px-4 py-4">
                        <RoleSelect
                          account={account}
                          onChange={(role) => updateAccount(account.id, { role })}
                        />
                      </td>
                      <td className="px-4 py-4"><StatusBadge value={account.status} /></td>
                      <td className="px-4 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateAccount(account.id, {
                              status: account.status === "suspended" ? "active" : "suspended",
                            })
                          }
                        >
                          {account.status === "suspended" ? "Restore" : "Suspend"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              {filtered.map((account) => (
                <div key={account.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{account.name}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{account.email}</p>
                    </div>
                    <StatusBadge value={account.status} />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{account.organization}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <RoleSelect
                      account={account}
                      onChange={(role) => updateAccount(account.id, { role })}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateAccount(account.id, {
                          status: account.status === "suspended" ? "active" : "suspended",
                        })
                      }
                    >
                      {account.status === "suspended" ? "Restore" : "Suspend"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
          Demo changes persist in this browser. Production role assignments and suspension checks must
          execute server-side and be recorded in an immutable audit log.
        </div>
      </div>
    </main>
  );
}

function RoleSelect({
  account,
  onChange,
}: {
  account: ManagedAccount;
  onChange: (role: UserRole) => void;
}) {
  return (
    <Select value={account.role} onValueChange={(value) => onChange(value as UserRole)}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MANAGEABLE_ROLES.map((role) => (
          <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusBadge({ value }: { value: AccountStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        value === "active" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        value === "invited" && "border-blue-200 bg-blue-50 text-blue-800",
        value === "suspended" && "border-red-200 bg-red-50 text-red-800",
      )}
    >
      {value}
    </Badge>
  );
}
