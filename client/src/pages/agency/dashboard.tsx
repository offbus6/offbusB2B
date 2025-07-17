import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import StatsCard from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Mail, Ticket, Users, Plus, Upload, Database } from "lucide-react";

export default function AgencyDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/agency"],
    retry: false,
  });

  const { data: uploadHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/upload-history"],
    retry: false,
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

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const agencyStatus = user?.agency?.status;

  if (agencyStatus === "pending") {
    return (
      <div className="text-center py-16">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
          <div className="text-yellow-600 text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Agency Approval Pending
          </h2>
          <p className="text-yellow-700">
            Your agency registration is being reviewed by our admin team. 
            You'll receive access once approved.
          </p>
        </div>
      </div>
    );
  }

  if (agencyStatus === "rejected") {
    return (
      <div className="text-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
          <div className="text-red-600 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Agency Registration Rejected
          </h2>
          <p className="text-red-700">
            Unfortunately, your agency registration has been rejected. 
            Please contact support for more information.
          </p>
        </div>
      </div>
    );
  }

  if (agencyStatus === "on_hold") {
    return (
      <div className="text-center py-16">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 max-w-md mx-auto">
          <div className="text-orange-600 text-4xl mb-4">⏸️</div>
          <h2 className="text-xl font-semibold text-orange-800 mb-2">
            Agency Account On Hold
          </h2>
          <p className="text-orange-700">
            Your agency account has been temporarily suspended. 
            Please contact support for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (!user?.agency) {
    return (
      <div className="text-center py-16">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-md mx-auto">
          <div className="text-blue-600 text-4xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold text-blue-800 mb-2">
            No Agency Found
          </h2>
          <p className="text-blue-700 mb-4">
            You don't have an agency registered yet. Please register your agency first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--airbnb-dark)] mb-2">
          Agency Dashboard
        </h2>
        <p className="text-[var(--airbnb-gray)]">
          Your agency's performance overview
        </p>
      </div>

      {/* Agency Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={Bus}
          iconColor="text-[var(--airbnb-primary)]"
          title="Total Buses"
          value={stats?.totalBuses || 0}
        />
        <StatsCard
          icon={Mail}
          iconColor="text-[var(--airbnb-teal)]"
          title="Messages Sent"
          value={stats?.totalMessages || 0}
        />
        <StatsCard
          icon={Ticket}
          iconColor="text-[var(--airbnb-orange)]"
          title="Coupons Used"
          value={stats?.totalCoupons || 0}
        />
        <StatsCard
          icon={Users}
          iconColor="text-green-500"
          title="Total Travelers"
          value={stats?.totalTravelers || 0}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/agency/bus-management">
          <Card className="airbnb-shadow hover-lift cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-50 rounded-lg">
                  <Plus className="w-6 h-6 text-[var(--airbnb-primary)]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-[var(--airbnb-dark)]">
                    Add New Bus
                  </h3>
                  <p className="text-[var(--airbnb-gray)] text-sm">
                    Register a new bus route
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/agency/upload-data">
          <Card className="airbnb-shadow hover-lift cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-teal-50 rounded-lg">
                  <Upload className="w-6 h-6 text-[var(--airbnb-teal)]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-[var(--airbnb-dark)]">
                    Upload Data
                  </h3>
                  <p className="text-[var(--airbnb-gray)] text-sm">
                    Add traveler information
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/agency/uploaded-data">
          <Card className="airbnb-shadow hover-lift cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Database className="w-6 h-6 text-[var(--airbnb-orange)]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-[var(--airbnb-dark)]">
                    View Data
                  </h3>
                  <p className="text-[var(--airbnb-gray)] text-sm">
                    Browse uploaded records
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card className="airbnb-shadow">
        <CardHeader className="border-b border-[var(--airbnb-border)]">
          <CardTitle className="text-xl font-semibold text-[var(--airbnb-dark)]">
            Recent Upload Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !uploadHistory || uploadHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--airbnb-gray)]">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadHistory.slice(0, 5).map((history: any) => (
                <div key={history.id} className="flex items-center py-3 border-b border-[var(--airbnb-border)] last:border-b-0">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-[var(--airbnb-dark)] font-medium">
                      {history.fileName} - {history.travelerCount} travelers uploaded
                    </p>
                    <p className="text-[var(--airbnb-gray)] text-sm">
                      {new Date(history.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      history.status === 'completed' ? 'bg-green-100 text-green-800' :
                      history.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {history.status}
                    </span>
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
