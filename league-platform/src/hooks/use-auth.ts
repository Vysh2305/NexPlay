import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, User } from "@workspace/api-client-react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("league_token"));
  const [location, setLocation] = useLocation();

  const { data: user, isLoading, isError, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const login = async (newToken: string) => {
    localStorage.setItem("league_token", newToken);
    setToken(newToken);
    const result = await refetch();
    const userData = result.data as User | undefined;
    if (userData?.role === "admin") {
      setLocation("/admin/dashboard");
    } else if (userData?.role === "franchise_owner") {
      setLocation("/franchise/dashboard");
    } else {
      setLocation("/player/dashboard");
    }
  };

  const logout = () => {
    localStorage.removeItem("league_token");
    setToken(null);
    setLocation("/login");
  };

  // Auto logout if token is invalid
  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError]);

  return {
    user: user as User | undefined,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isFranchise: user?.role === "franchise_owner",
    isPlayer: user?.role === "player",
    login,
    logout,
  };
}
