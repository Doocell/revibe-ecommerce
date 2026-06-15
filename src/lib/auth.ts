import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const db = supabase as any;

export type AppRole = "buyer" | "seller" | "admin";

export interface AuthState {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
}

async function getUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    console.error("[Get User Roles Error]", error);
    return [];
  }

  return (data ?? [])
    .map((row: { role: string }) => row.role)
    .filter((role: string): role is AppRole =>
      ["buyer", "seller", "admin"].includes(role),
    );
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    roles: [],
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("[Get Session Error]", error);
        setState({
          user: null,
          roles: [],
          loading: false,
        });
        return;
      }

      const user = session?.user ?? null;

      if (!user) {
        setState({
          user: null,
          roles: [],
          loading: false,
        });
        return;
      }

      const roles = await getUserRoles(user.id);

      if (!mounted) return;

      setState({
        user,
        roles,
        loading: false,
      });
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;

      if (!user) {
        setState({
          user: null,
          roles: [],
          loading: false,
        });
        return;
      }

      setState((current) => ({
        ...current,
        user,
        loading: true,
      }));

      setTimeout(async () => {
        const roles = await getUserRoles(user.id);

        if (!mounted) return;

        setState({
          user,
          roles,
          loading: false,
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[Sign Out Error]", error);
  }

  window.location.href = "/";
}
export function hasRole(roles: AppRole[] | null | undefined, role: AppRole) {
  return Array.isArray(roles) && roles.includes(role);
}

export function hasAnyRole(
  roles: AppRole[] | null | undefined,
  allowedRoles: AppRole[],
) {
  if (!Array.isArray(roles)) return false;

  return allowedRoles.some((role) => roles.includes(role));
}

export function isAdmin(roles: AppRole[] | null | undefined) {
  return hasRole(roles, "admin");
}

export function isSeller(roles: AppRole[] | null | undefined) {
  return hasRole(roles, "seller");
}

export function isBuyer(roles: AppRole[] | null | undefined) {
  return hasRole(roles, "buyer");
}

export function getPrimaryRole(roles: AppRole[] | null | undefined): AppRole | null {
  if (!Array.isArray(roles) || roles.length === 0) {
    return null;
  }

  if (roles.includes("admin")) return "admin";
  if (roles.includes("seller")) return "seller";
  if (roles.includes("buyer")) return "buyer";

  return null;
}