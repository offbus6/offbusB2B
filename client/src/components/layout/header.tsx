import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

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
              className="border-[var(--airbnb-border)] text-[var(--airbnb-dark)] hover:bg-[var(--airbnb-light)]"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
