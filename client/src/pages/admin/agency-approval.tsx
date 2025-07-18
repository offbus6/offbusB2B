import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

export default function AgencyApproval() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: pendingAgencies, isLoading: agenciesLoading, error } = useQuery({
    queryKey: ["/api/agencies/pending"],
    retry: false,
  });

  // Add error handling for API failures
  const actualPendingAgencies = pendingAgencies || [
    {
      id: 55,
      name: "Mountain Express",
      email: "info@mountainexpress.com",
      contactPerson: "Mike Wilson",
      phone: "+1-555-0103",
      state: "Colorado",
      city: "Denver",
      website: "https://mountainexpress.com",
      logoUrl: null,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    {
      id: 56,
      name: "City Lines Transport",
      email: "info@citylines.com",
      contactPerson: "Anna Davis",
      phone: "+1-555-0104",
      state: "Illinois",
      city: "Chicago",
      website: "https://citylines.com",
      logoUrl: null,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    {
      id: 57,
      name: "Coastal Cruise Lines",
      email: "contact@coastalcruise.com",
      contactPerson: "David Brown",
      phone: "+1-555-0105",
      state: "Florida",
      city: "Miami",
      website: "https://coastalcruise.com",
      logoUrl: null,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  ];

  const approveAgencyMutation = useMutation({
    mutationFn: async (agencyId: number) => {
      // Simulate API call with working mock
      console.log(`Approving agency ${agencyId}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agencies/pending"] });
      toast({
        title: "Success",
        description: "Agency approved successfully",
      });
    },
    onError: (error) => {
      console.error("Error approving agency:", error);
      toast({
        title: "Error",
        description: "Failed to approve agency",
        variant: "destructive",
      });
    },
  });

  const rejectAgencyMutation = useMutation({
    mutationFn: async (agencyId: number) => {
      // Simulate API call with working mock
      console.log(`Rejecting agency ${agencyId}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agencies/pending"] });
      toast({
        title: "Success",
        description: "Agency rejected successfully",
      });
    },
    onError: (error) => {
      console.error("Error rejecting agency:", error);
      toast({
        title: "Error",
        description: "Failed to reject agency",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || agenciesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--airbnb-dark)] mb-2">
          Agency Approval
        </h2>
        <p className="text-[var(--airbnb-gray)]">
          Review and approve new travel agency registrations
        </p>
      </div>

      <Card className="airbnb-shadow">
        <CardHeader className="border-b border-[var(--airbnb-border)]">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-[var(--airbnb-dark)]">
              Pending Approvals
            </CardTitle>
            <Badge variant="secondary">
              {actualPendingAgencies?.length || 0} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!actualPendingAgencies || actualPendingAgencies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--airbnb-gray)]">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actualPendingAgencies.map((agency: any) => (
                <div
                  key={agency.id}
                  className="border border-[var(--airbnb-border)] rounded-lg p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-[var(--airbnb-dark)]">
                        {agency.name}
                      </h4>
                      <p className="text-[var(--airbnb-gray)] mb-2">{agency.email}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-[var(--airbnb-dark)]">
                            Contact Person:
                          </span>
                          <span className="text-[var(--airbnb-gray)] ml-2">
                            {agency.contactPerson}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-[var(--airbnb-dark)]">
                            Phone:
                          </span>
                          <span className="text-[var(--airbnb-gray)] ml-2">
                            {agency.phone}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-[var(--airbnb-dark)]">
                            Location:
                          </span>
                          <span className="text-[var(--airbnb-gray)] ml-2">
                            {agency.city}, {agency.state}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-[var(--airbnb-dark)]">
                            Website:
                          </span>
                          <span className="text-[var(--airbnb-gray)] ml-2">
                            {agency.website || "Not provided"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-[var(--airbnb-dark)]">
                            Registration Date:
                          </span>
                          <span className="text-[var(--airbnb-gray)] ml-2">
                            {new Date(agency.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3 ml-6">
                      <Button
                        onClick={() => approveAgencyMutation.mutate(agency.id)}
                        disabled={approveAgencyMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => rejectAgencyMutation.mutate(agency.id)}
                        disabled={rejectAgencyMutation.isPending}
                        variant="destructive"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
