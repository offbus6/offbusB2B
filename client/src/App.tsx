import { Switch, Route } from "wouter";
import React, { lazy } from "react";
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
import AdminAccounts from "@/pages/admin/accounts";
import AdminUserData from "@/pages/admin/user-data";
import AdminNotifications from "@/pages/admin/notifications";
import WhatsAppTesting from "@/pages/admin/whatsapp-testing";
import AdminSignup from "@/pages/admin-signup";
import AdminSetup from "@/pages/admin-setup";
import AgencyLogin from "@/pages/agency-login";
import AgencyDashboard from "@/pages/agency/dashboard";
import BusManagement from "@/pages/agency/bus-management";
import UploadData from "@/pages/agency/upload-data";
import UploadedData from "@/pages/agency/uploaded-data";
import AgencyPayments from "@/pages/agency/payments";
import AgencyRegister from "@/pages/agency/register";
import AgencyPending from "@/pages/agency/pending";
import RoleSelection from "@/pages/role-selection";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import AdminLogin from "@/pages/admin-login";
import BusSearch from "@/pages/bus-search";
import Sidebar from "@/components/layout/sidebar";
import Layout from "@/components/layout/layout";

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is authenticated, show appropriate dashboard
  if (user) {
    if (user.role === "super_admin") {
      return (
        <Layout variant="dashboard">
          <div className="bg-[var(--airbnb-light)] min-h-screen">
            <div className="flex">
              <Sidebar />
              <main className="flex-1 p-8">
                <Switch>
                  <Route path="/" component={AdminDashboard} />
                  <Route path="/admin/dashboard" component={AdminDashboard} />
                  <Route path="/admin/agency-approval" component={AgencyApproval} />
                  <Route path="/admin/manage-agencies" component={ManageAgencies} />
                  <Route path="/admin/agencies/:id" component={AgencyDetails} />
                  <Route path="/admin/whatsapp-config" component={WhatsappConfig} />
                  <Route path="/admin/whatsapp-testing" component={WhatsAppTesting} />
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
      );
    } else if (user.role === "agency") {
      // Check if agency is approved
      if (user.agency?.status === "pending") {
        return <AgencyPending />;
      }

      return (
        <Layout variant="dashboard">
          <div className="bg-[var(--airbnb-light)] min-h-screen">
            <div className="flex">
              <Sidebar />
              <main className="flex-1 p-8">
                <Switch>
                  <Route path="/" component={AgencyDashboard} />
                  <Route path="/agency/dashboard" component={AgencyDashboard} />
                  <Route path="/agency/bus-management" component={BusManagement} />
                  <Route path="/agency/upload-data" component={UploadData} />
                  <Route path="/agency/uploaded-data" component={UploadedData} />
                  <Route path="/agency/payments" component={AgencyPayments} />
                  <Route path="/agency/profile" component={lazy(() => import("@/pages/agency/profile"))} />
                  <Route path="/agency/pending" component={AgencyPending} />
                  <Route path="/agency/register" component={AgencyRegister} />
                  <Route component={NotFound} />
                </Switch>
              </main>
            </div>
          </div>
        </Layout>
      );
    }
  }

  // Public routes for non-authenticated users
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin-signup" component={AdminSignup} />
      <Route path="/admin-setup" component={AdminSetup} />
      <Route path="/agency-login" component={AgencyLogin} />
      <Route path="/agency-register" component={AgencyRegister} />  
      <Route path="/role-selection" component={RoleSelection} />
      <Route path="/bus-search" component={BusSearch} />
      <Route path="/" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;