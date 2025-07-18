import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  variant?: 'landing' | 'dashboard' | 'auth';
}

export default function Header({ variant = 'dashboard' }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out.",
      });
      
      // Clear the user data cache
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Navigate to home
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
    },
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
            <Link href="/" className="flex items-center">
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
