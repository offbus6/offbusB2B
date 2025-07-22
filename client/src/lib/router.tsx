import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from "react-router-dom";
import Root from "./Root";
import ErrorPage from "./error-page";
import Index from "@/pages/index";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Logout from "@/pages/logout";
import AgencyDashboard from "@/pages/agency/dashboard";
import BusManagement from "@/pages/agency/bus-management";
import UploadData from "@/pages/agency/upload-data";
import UploadedData from "@/pages/agency/uploaded-data";
import Payments from "@/pages/agency/payments";
import PendingApproval from "@/pages/agency/pending";
import AgencyRoot from "./AgencyRoot";
import Profile from "@/pages/profile";
import Bookings from "@/pages/bookings";
import ProtectedRoute from "@/components/ProtectedRoute";
import PaymentsPage from "@/pages/payments-page";
import TermsAndConditions from "@/pages/terms-and-conditions";
import PrivacyPolicy from "@/pages/privacy-policy";
import ContactUs from "@/pages/contact-us";
import AboutUs from "@/pages/about-us";
import FAQ from "@/pages/faq";
import { Authenticated } from "@refinedev/core";
import { useAuth } from "@refinedev/core";
import BusDetails from "@/pages/bus-details";
import BookingDetails from "@/pages/booking-details";

const Router = () => {
  const { auth } = useAuth();

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/logout" element={<Logout />} />
        <Route element={<Root />} errorElement={<ErrorPage />}>
          <Route index element={<Index />} />
          <Route path="/bus/:busId" element={<BusDetails />} />
          <Route
            path="/profile"
            element={
              <Authenticated
                key="profile"
                fallback={<Login />}
              >
                <Profile />
              </Authenticated>
            }
          />
           <Route
            path="/bookings"
            element={
              <Authenticated
                key="bookings"
                fallback={<Login />}
              >
                <Bookings />
              </Authenticated>
            }
          />
          <Route
            path="/booking/:bookingId"
            element={
              <Authenticated
                key="booking-details"
                fallback={<Login />}
              >
                <BookingDetails />
              </Authenticated>
            }
          />
          <Route
            path="/payments"
            element={
              <Authenticated
                key="payments-page"
                fallback={<Login />}
              >
                <PaymentsPage />
              </Authenticated>
            }
          />
        </Route>
        <Route element={<AgencyRoot />} errorElement={<ErrorPage />}>
          <Route path="/agency/dashboard" element={<AgencyDashboard />} />
          <Route path="/agency/bus-management" element={<BusManagement />} />
          <Route path="/agency/upload-data" element={<UploadData />} />
          <Route path="/agency/uploaded-data" element={<UploadedData />} />
          <Route path="/agency/payments" element={<Payments />} />
          <Route path="/agency/pending" element={<PendingApproval />} />
        </Route>
      </>
    )
  );

  return <RouterProvider router={router} />;
};

export default Router;