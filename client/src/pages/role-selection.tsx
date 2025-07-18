import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Building2 } from "lucide-react";

export default function RoleSelection() {
  const { toast } = useToast();

  const assignRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      await apiRequest("POST", "/api/auth/assign-role", { role });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role assigned successfully!",
      });
      // Refresh the page to trigger user data refetch
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRoleSelection = (role: string) => {
    assignRoleMutation.mutate(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--airbnb-light)] to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg airbnb-shadow">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[var(--airbnb-dark)]">
            Choose Your Role
          </CardTitle>
          <p className="text-[var(--airbnb-gray)]">
            Select your role to continue to the appropriate dashboard
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-[var(--airbnb-primary)]"
              onClick={() => handleRoleSelection('super_admin')}
            >
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-[var(--airbnb-primary)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--airbnb-dark)] mb-2">
                  System Administrator
                </h3>
                <p className="text-[var(--airbnb-gray)] text-sm">
                  Manage agencies, approve registrations, and oversee the entire system
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-[var(--airbnb-teal)]"
              onClick={() => handleRoleSelection('agency')}
            >
              <CardContent className="p-6 text-center">
                <Building2 className="w-12 h-12 text-[var(--airbnb-teal)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--airbnb-dark)] mb-2">
                  Travel Agency
                </h3>
                <p className="text-[var(--airbnb-gray)] text-sm">
                  Manage your buses, upload traveler data, and send automated messages
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-sm text-[var(--airbnb-gray)] mt-6">
            <p>Don't worry, you can always contact support if you need to change your role later.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}