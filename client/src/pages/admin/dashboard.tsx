import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StatsCard from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Bus, Mail, Ticket, Plus, Upload, Database } from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/system"],
    retry: false,
  });

  // Redirect to login if not authenticated
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

  if (isLoading || statsLoading) {
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
          Super Admin Dashboard
        </h2>
        <p className="text-[var(--airbnb-gray)]">
          Overview of all system activities and statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={Building}
          iconColor="text-[var(--airbnb-primary)]"
          title="Total Agencies"
          value={stats?.totalAgencies || 0}
        />
        <StatsCard
          icon={Bus}
          iconColor="text-[var(--airbnb-teal)]"
          title="Total Buses"
          value={stats?.totalBuses || 0}
        />
        <StatsCard
          icon={Mail}
          iconColor="text-[var(--airbnb-orange)]"
          title="Messages Sent"
          value={stats?.totalMessages || 0}
        />
        <StatsCard
          icon={Ticket}
          iconColor="text-green-500"
          title="Coupons Used"
          value={stats?.totalCoupons || 0}
        />
      </div>

      {/* Recent Activity */}
      <Card className="airbnb-shadow">
        <CardHeader className="border-b border-[var(--airbnb-border)]">
          <CardTitle className="text-xl font-semibold text-[var(--airbnb-dark)]">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center py-4 border-b border-[var(--airbnb-border)] last:border-b-0">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-[var(--airbnb-primary)]" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-[var(--airbnb-dark)] font-medium">
                  New agency registration pending approval
                </p>
                <p className="text-[var(--airbnb-gray)] text-sm">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center py-4 border-b border-[var(--airbnb-border)]">
              <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-[var(--airbnb-teal)]" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-[var(--airbnb-dark)] font-medium">
                  Agency uploaded new traveler data
                </p>
                <p className="text-[var(--airbnb-gray)] text-sm">4 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center py-4">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-[var(--airbnb-orange)]" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-[var(--airbnb-dark)] font-medium">
                  WhatsApp messages sent for multiple routes
                </p>
                <p className="text-[var(--airbnb-gray)] text-sm">6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
