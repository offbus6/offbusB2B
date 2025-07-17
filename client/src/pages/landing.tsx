import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Users, MessageSquare, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--airbnb-light)] to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-[var(--airbnb-primary)] mb-4">
            TravelFlow
          </h1>
          <p className="text-xl text-[var(--airbnb-gray)] max-w-2xl mx-auto">
            A comprehensive admin and agency management system for travel agencies with bus management, traveler data handling, and seamless communication.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center airbnb-shadow hover-lift">
            <CardHeader>
              <Bus className="w-12 h-12 text-[var(--airbnb-primary)] mx-auto mb-4" />
              <CardTitle className="text-[var(--airbnb-dark)]">Bus Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage your bus fleet with detailed route information, schedules, and capacity tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center airbnb-shadow hover-lift">
            <CardHeader>
              <Users className="w-12 h-12 text-[var(--airbnb-teal)] mx-auto mb-4" />
              <CardTitle className="text-[var(--airbnb-dark)]">Traveler Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload and manage traveler information with CSV/Excel support and automated processing.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center airbnb-shadow hover-lift">
            <CardHeader>
              <MessageSquare className="w-12 h-12 text-[var(--airbnb-orange)] mx-auto mb-4" />
              <CardTitle className="text-[var(--airbnb-dark)]">WhatsApp Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automated WhatsApp messaging system for customer engagement and coupon distribution.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center airbnb-shadow hover-lift">
            <CardHeader>
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-[var(--airbnb-dark)]">Admin Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive admin dashboard with agency approval, management, and system analytics.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            onClick={handleLogin}
            className="bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white px-8 py-3 text-lg rounded-lg"
          >
            Get Started
          </Button>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-[var(--airbnb-dark)] mb-8">
            Trusted by Travel Agencies Worldwide
          </h2>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-[var(--airbnb-gray)] font-medium">147+ Agencies</div>
            <div className="text-[var(--airbnb-gray)] font-medium">1,234+ Buses</div>
            <div className="text-[var(--airbnb-gray)] font-medium">45,678+ Messages</div>
          </div>
        </div>
      </div>
    </div>
  );
}
