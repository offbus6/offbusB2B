import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Pause, Play, Trash2 } from "lucide-react";

export default function ManageAgencies() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ["/api/agencies"],
    retry: false,
  });

  const updateAgencyStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/agencies/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      toast({
        title: "Success",
        description: "Agency status updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update agency status",
        variant: "destructive",
      });
    },
  });

  const deleteAgencyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/agencies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      toast({
        title: "Success",
        description: "Agency deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete agency",
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

  const filteredAgencies = agencies?.filter((agency: any) => {
    const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || agency.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { label: "Active", variant: "default" as const, className: "bg-green-100 text-green-800" },
      on_hold: { label: "On Hold", variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
      rejected: { label: "Rejected", variant: "destructive" as const, className: "bg-red-100 text-red-800" },
      pending: { label: "Pending", variant: "outline" as const, className: "bg-blue-100 text-blue-800" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--airbnb-dark)] mb-2">
          Manage Agencies
        </h2>
        <p className="text-[var(--airbnb-gray)]">
          View and manage all approved travel agencies
        </p>
      </div>

      {/* Search and Filter */}
      <Card className="airbnb-shadow mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--airbnb-gray)]" />
                <Input
                  placeholder="Search agencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agencies Table */}
      <Card className="airbnb-shadow">
        <CardHeader className="border-b border-[var(--airbnb-border)]">
          <CardTitle className="text-xl font-semibold text-[var(--airbnb-dark)]">
            All Agencies
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--airbnb-light)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Agency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--airbnb-border)]">
              {filteredAgencies.map((agency: any) => (
                <tr key={agency.id} className="hover:bg-[var(--airbnb-light)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-[var(--airbnb-dark)]">
                        {agency.name}
                      </div>
                      <div className="text-sm text-[var(--airbnb-gray)]">
                        {agency.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[var(--airbnb-dark)]">
                      {agency.contactPerson}
                    </div>
                    <div className="text-sm text-[var(--airbnb-gray)]">
                      {agency.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--airbnb-dark)]">
                    {agency.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(agency.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--airbnb-primary)] hover:text-[var(--airbnb-dark)]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => 
                        updateAgencyStatusMutation.mutate({
                          id: agency.id,
                          status: agency.status === "approved" ? "on_hold" : "approved"
                        })
                      }
                      disabled={updateAgencyStatusMutation.isPending}
                      className="text-[var(--airbnb-orange)] hover:text-[var(--airbnb-dark)]"
                    >
                      {agency.status === "approved" ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAgencyMutation.mutate(agency.id)}
                      disabled={deleteAgencyMutation.isPending}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
