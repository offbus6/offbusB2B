import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Prevent automatic refetching
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });

  const user = data?.user || null;

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}
