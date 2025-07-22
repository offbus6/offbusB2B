import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation,  } from "wouter";
import { Menu, X, Bell } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

interface HeaderProps {
  variant?: 'landing' | 'dashboard' | 'auth';
}

export default function Header({ variant = 'dashboard' }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch notifications based on user role
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
    enabled: isAuthenticated,
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error("Logout failed");
      return response.json();
    },
    onSuccess: () => {
      // Clear all queries from cache
      queryClient.clear();
      // Force a hard refresh to clear any remaining state
      window.location.href = "/";
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Even if logout fails on backend, clear frontend state
      queryClient.clear();
      window.location.href = "/";
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Auth page header (simple)
  if (variant === 'auth') {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-[var(--airbnb-primary)]">
                TravelFlow
              </h1>
            </Link>
            <div className="text-sm text-[var(--airbnb-gray)]">
              Secure Authentication
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Landing page header
  if (variant === 'landing') {
    return (
      <header className="bg-white/80 backdrop-blur-sm border-b border-[var(--airbnb-border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[var(--airbnb-primary)]">
                TravelFlow
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] transition-colors">
                About
              </a>
              <Link to="/bus-search" className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] transition-colors">
                Bus Search
              </Link>
              <a href="#contact" className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] transition-colors">
                Contact
              </a>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/agency-login")}
                className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)]"
              >
                Agency Login
              </Button>
              <Button 
                onClick={() => navigate("/signup")}
                className="bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white"
              >
                Sign Up
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[var(--airbnb-gray)]" />
              ) : (
                <Menu className="w-6 h-6 text-[var(--airbnb-gray)]" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[var(--airbnb-border)] py-4">
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] transition-colors">
                  Pricing
                </a>
                <a href="#about" className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] transition-colors">
                  About
                </a>
                <Link to="/bus-search" className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] transition-colors">
                  Bus Search
                </Link>
                <a href="#contact" className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] transition-colors">
                  Contact
                </a>
                <div className="flex flex-col space-y-2 pt-4 border-t border-[var(--airbnb-border)]">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate("/agency-login")}
                    className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] justify-start"
                  >
                    Agency Login
                  </Button>
                  <Button 
                    onClick={() => navigate("/signup")}
                    className="bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white justify-start"
                  >
                    Sign Up
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    );
  }

  // Dashboard header (authenticated users)
  return (
    <header className="bg-white border-b border-[var(--airbnb-border)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-[var(--airbnb-primary)]">
              TravelFlow
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5 text-[var(--airbnb-gray)]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <DropdownMenuItem>
                    <span className="text-[var(--airbnb-gray)]">No notifications</span>
                  </DropdownMenuItem>
                ) : (
                  notifications.slice(0, 5).map((notification: any) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                      <div className="flex justify-between w-full">
                        <span className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <span className="text-xs text-[var(--airbnb-gray)] mt-1">
                        {notification.message}
                      </span>
                      <span className="text-xs text-[var(--airbnb-gray)] mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
                {notifications.length > 5 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link to="/notifications" className="text-[var(--airbnb-primary)]">
                        View all notifications
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} alt="Profile" />
                <AvatarFallback className="bg-[var(--airbnb-primary)] text-white">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[var(--airbnb-dark)]">
                  {user?.firstName || user?.email}
                </span>
                <span className="text-xs text-[var(--airbnb-gray)]">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Travel Agency'}
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="border-[var(--airbnb-border)] text-[var(--airbnb-dark)] hover:bg-[var(--airbnb-light)]"
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}