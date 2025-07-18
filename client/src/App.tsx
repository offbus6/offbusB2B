import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin/dashboard";
import AgencyApproval from "@/pages/admin/agency-approval";
import ManageAgencies from "@/pages/admin/manage-agencies";
import AgencyDashboard from "@/pages/agency/dashboard";
import BusManagement from "@/pages/agency/bus-management";
import UploadData from "@/pages/agency/upload-data";
import UploadedData from "@/pages/agency/uploaded-data";
import AgencyRegister from "@/pages/agency/register";
import AgencyPending from "@/pages/agency/pending";
import RoleSelection from "@/pages/role-selection";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import AdminLogin from "@/pages/admin-login";
import AgencyLogin from "@/pages/agency-login";
import Sidebar from "@/components/layout/sidebar";
import Layout from "@/components/layout/layout";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/agency-login" component={AgencyLogin} />
        <Route path="/signup" component={Signup} />
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  const userRole = (user as any)?.role;
  const isSuperAdmin = userRole === 'super_admin';

  // Check if user needs to select a role
  if (!userRole) {
    return <RoleSelection />;
  }

  // Check if user needs to register an agency
  const userAgency = (user as any)?.agency;
  const needsAgencyRegistration = !isSuperAdmin && !userAgency;

  if (needsAgencyRegistration) {
    return <AgencyRegister />;
  }

  // Check if user has pending agency approval
  const hasPendingAgency = !isSuperAdmin && userAgency && userAgency.status !== 'approved';

  if (hasPendingAgency) {
    return <AgencyPending />;
  }

  return (
    <Layout variant="dashboard">
      <div className="bg-[var(--airbnb-light)] min-h-screen">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <Switch>
              {isSuperAdmin ? (
                <>
                  <Route path="/" component={AdminDashboard} />
                  <Route path="/admin/dashboard" component={AdminDashboard} />
                  <Route path="/admin/agency-approval" component={AgencyApproval} />
                  <Route path="/admin/manage-agencies" component={ManageAgencies} />
                </>
              ) : (
                <>
                  <Route path="/" component={AgencyDashboard} />
                  <Route path="/agency/dashboard" component={AgencyDashboard} />
                  <Route path="/agency/bus-management" component={BusManagement} />
                  <Route path="/agency/upload-data" component={UploadData} />
                  <Route path="/agency/uploaded-data" component={UploadedData} />
                </>
              )}
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
