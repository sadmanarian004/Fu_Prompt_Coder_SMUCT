"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import apiClient from "../lib/apiClient";

interface DecodedToken {
  userId: string;
  shopId: string;
  role: "OWNER" | "STAFF";
  exp: number;
}

interface AuthUser {
  userId: string;
  shopId: string;
  role: "OWNER" | "STAFF";
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  shopName: string;
  ownerName: string;
  email: string;
  password: string;
  language: "en" | "bn";
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFromToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        setUser(null);
      } else {
        setUser({
          userId: decoded.userId,
          shopId: decoded.shopId,
          role: decoded.role,
        });
      }
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromToken();
  }, [loadFromToken]);

  const login = useCallback(
    async ({ email, password }: LoginPayload) => {
      const { data } = await apiClient.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      loadFromToken();
      router.push("/dashboard");
    },
    [loadFromToken, router]
  );

  const register = useCallback(
    async ({ shopName, ownerName, email, password, language }: RegisterPayload) => {
      const { data } = await apiClient.post("/auth/register", {
        shopName,
        ownerName,
        email,
        password,
        language,
      });
      localStorage.setItem("token", data.token);
      loadFromToken();
      router.push("/dashboard");
    },
    [loadFromToken, router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  }, [router]);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };
}