// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";

import { getAuthToken, getCurrentUser, logout as apiLogout } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Shield, LogOut, LayoutDashboard } from "lucide-react";

interface User {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
}

const AUTH_USER_KEY = "auth_user";
const AUTH_TOKEN_KEY = "auth_token"; // keep in sync with lib/api.ts if key name differs

export default function Navbar() {
  const router = useRouter();

  // Synchronous initial state from localStorage/token -> makes UI optimistic/immediate
  const [signedIn, setSignedIn] = useState<boolean>(() => {
    try {
      return !!getAuthToken();
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(AUTH_USER_KEY) : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isFetchingUser, setIsFetchingUser] = useState<boolean>(false);

  // Fetch fresh user in background without blocking the UI
  const fetchUserBackground = useCallback(async (strictOnAuthFail = false) => {
    const token = getAuthToken();
    setSignedIn(!!token);

    if (!token) {
      // no token -> signed out
      setUser(null);
      try {
        localStorage.removeItem(AUTH_USER_KEY);
      } catch {}
      return;
    }

    setIsFetchingUser(true);
    try {
      const u = await getCurrentUser();
      const normalized: User = {
        firstName: (u as any).firstName ?? (u as any).first_name ?? null,
        lastName: (u as any).lastName ?? (u as any).last_name ?? null,
        email: (u as any).email ?? null,
        profileImageUrl:
          (u as any).profileImageUrl ?? (u as any).profile_image_url ?? null,
      };

      setUser(normalized);
      // update cached user for instant future renders
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalized));
      } catch {}
    } catch (err: any) {
      if (strictOnAuthFail && /401|Unauthorized/i.test(String(err?.message ?? ""))) {
        setSignedIn(false);
        setUser(null);
        try {
          localStorage.removeItem(AUTH_USER_KEY);
          localStorage.removeItem(AUTH_TOKEN_KEY);
        } catch {}
      } else {
        setUser(null);
      }
    } finally {
      setIsFetchingUser(false);
    }
  }, []);

  // Stable handler for events
  useEffect(() => {
    // run once on mount to ensure background fetch runs and keeps things fresh
    fetchUserBackground();

    const onAuthChange = (e: Event) => {
      fetchUserBackground(true);
    };

    const onStorage = (e: StorageEvent) => {
      if (!e.key) {
        fetchUserBackground(true);
        return;
      }
      if (e.key === AUTH_TOKEN_KEY || e.key === AUTH_USER_KEY) {
        fetchUserBackground(true);
      }
    };

    const onRoute = () => {
      fetchUserBackground();
    };

    window.addEventListener("auth-change", onAuthChange);
    window.addEventListener("storage", onStorage);
    (router.events as any)?.on?.("routeChangeComplete", onRoute);

    return () => {
      window.removeEventListener("auth-change", onAuthChange);
      window.removeEventListener("storage", onStorage);
      (router.events as any)?.off?.("routeChangeComplete", onRoute);
    };
  }, [fetchUserBackground, router.events]);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore backend logout errors — still clear client state
    } finally {
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      } catch {}
      window.dispatchEvent(new CustomEvent("auth-change", { detail: { source: "logout" } }));
      setSignedIn(false);
      setUser(null);
      router.push("/");
    }
  };

  // Small UI helpers
  const displayName = user
    ? user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName ?? user.email ?? "User"
    : "";

 return (
  <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
    <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 cursor-pointer">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">DeepVerify</span>
      </Link>

      <div className="flex items-center gap-4">
        {signedIn ? (
          <>
            <Link href="/dashboard">
              <span className="hover:text-indigo-600 cursor-pointer">Dashboard</span>
            </Link>

            <Link href="/membership">
              <span className="hover:text-indigo-600 cursor-pointer">Membership</span>
            </Link>

            <Link href="/support">
              <span className="hover:text-indigo-600 cursor-pointer">Support</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Button asChild data-testid="button-signin">
              <Link href="/login">Sign In</Link>
            </Button>

            <Link
              href="/register"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  </header>
);
}
