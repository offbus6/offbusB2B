import { Switch, Route } from "wouter";
import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin/dashboard";
import AgencyApproval from "@/pages/admin/agency-approval";
import ManageAgencies from "./pages/admin/manage-agencies";
import AgencyDetails from "./pages/admin/agency-details";
import WhatsappConfig from "./pages/admin/whatsapp-config";
import AdminProfile from "@/pages/admin/profile";
import AdminSignup from "@/pages/admin-signup";
import AdminSetup from "@/pages/admin-setup";
import AgencyLogin from "@/pages/agency-login";
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
import Sidebar from "@/components/layout/sidebar";
import Layout from "@/components/layout/layout";
import AdminAccounts from "@/pages/admin/accounts";
import AdminUserData from "@/pages/admin/user-data";
import AdminNotifications from "@/pages/admin/notifications";
import AgencyPayments from "./pages/agency/payments";
import BusSearch from "@/pages/bus-search";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Fix dashboard scroll issue - must be at the top before any conditional returns
  React.useEffect(() => {
    if (isAuthenticated) {
      window.scrollTo(0, 0);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#e91e63' }}></div>
          <p style={{ color: '#6c757d' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/admin-signup" component={AdminSignup} />
        <Route path="/admin-setup" component={AdminSetup} />
        <Route path="/agency-login" component={AgencyLogin} />
        <Route path="/signup" component={Signup} />
        <Route path="/bus-search" component={BusSearch} />
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

  // Check agency status for non-admin users
  const userAgency = (user as any)?.agency;

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/bus-search" component={BusSearch} />
      
      {/* Agency registration and status routes */}
      <Route path="/agency/register">
        {!isSuperAdmin && !userAgency ? <AgencyRegister /> : <Landing />}
      </Route>
      <Route path="/agency/pending">
        {!isSuperAdmin && userAgency?.status === 'pending' ? <AgencyPending /> : <Landing />}
      </Route>
      
      {/* Dashboard routes */}
      <Route path="/admin/*">
        {isSuperAdmin ? (
          <Layout variant="dashboard">
            <div className="bg-[var(--airbnb-light)] min-h-screen">
              <div className="flex">
                <Sidebar />
                <main className="flex-1 p-8">
                  <Switch>
                    <Route path="/admin/dashboard" component={AdminDashboard} />
                    <Route path="/admin/agency-approval" component={AgencyApproval} />
                    <Route path="/admin/manage-agencies" component={ManageAgencies} />
                    <Route path="/admin/agencies/:id" component={AgencyDetails} />
                    <Route path="/admin/whatsapp-config" component={WhatsappConfig} />
                    <Route path="/admin/profile" component={AdminProfile} />
                    <Route path="/admin/accounts" component={AdminAccounts} />
                    <Route path="/admin/user-data" component={AdminUserData} />
                    <Route path="/admin/notifications" component={AdminNotifications} />
                    <Route component={NotFound} />
                  </Switch>
                </main>
              </div>
            </div>
          </Layout>
        ) : <Landing />}
      </Route>
      
      <Route path="/agency/*">
        {!isSuperAdmin && userAgency?.status === 'approved' ? (
          <Layout variant="dashboard">
            <div className="bg-[var(--airbnb-light)] min-h-screen">
              <div className="flex">
                <Sidebar />
                <main className="flex-1 p-8">
                  <Switch>
                    <Route path="/agency/dashboard" component={AgencyDashboard} />
                    <Route path="/agency/bus-management" component={BusManagement} />
                    <Route path="/agency/upload-data" component={UploadData} />
                    <Route path="/agency/uploaded-data" component={UploadedData} />
                    <Route path="/agency/payments" component={AgencyPayments} />
                    <Route component={NotFound} />
                  </Switch>
                </main>
              </div>
            </div>
          </Layout>
        ) : !isSuperAdmin && userAgency?.status === 'pending' ? <AgencyPending /> : !isSuperAdmin && !userAgency ? <AgencyRegister /> : <Landing />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
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