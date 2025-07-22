import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Users, MessageSquare, Shield, Star, CheckCircle, TrendingUp, Globe, ArrowRight, Zap } from "lucide-react";
import Layout from "@/components/layout/layout";

export default function Landing() {
  return (
    <Layout variant="landing">
      <div className="bg-gradient-to-br from-[var(--airbnb-light)] via-white to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <div className="inline-block p-4 bg-[var(--airbnb-primary)]/10 rounded-full mb-6">
            <Bus className="w-16 h-16 text-[var(--airbnb-primary)]" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-[var(--airbnb-dark)] mb-6 leading-tight">
            TravelFlow
          </h1>
          <p className="text-xl md:text-2xl text-[var(--airbnb-gray)] mb-8 max-w-4xl mx-auto leading-relaxed">
            The complete travel agency management platform trusted by professionals worldwide. 
            Streamline operations, automate messaging, and grow your business.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              onClick={() => window.location.href = "/search"}
              className="bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white px-10 py-4 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Search Buses
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              onClick={() => window.location.href = "/agency-login"}
              variant="outline"
              className="border-2 border-[var(--airbnb-primary)] text-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)] hover:text-white px-10 py-4 text-lg rounded-xl font-semibold transition-all"
            >
              Travel Agency Login
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[var(--airbnb-gray)] mb-16">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="font-medium">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--airbnb-primary)]" />
              <span className="font-medium">500+ Agencies</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[var(--airbnb-teal)]" />
              <span className="font-medium">50+ Countries</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[var(--airbnb-accent)]" />
              <span className="font-medium">24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <Card className="airbnb-shadow hover:scale-105 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-[var(--airbnb-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bus className="w-8 h-8 text-[var(--airbnb-primary)]" />
              </div>
              <CardTitle className="text-[var(--airbnb-dark)] text-xl">Fleet Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--airbnb-gray)] text-center leading-relaxed">
                Manage your entire bus fleet with real-time tracking, route optimization, and maintenance scheduling
              </p>
            </CardContent>
          </Card>

          <Card className="airbnb-shadow hover:scale-105 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-[var(--airbnb-teal)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[var(--airbnb-teal)]" />
              </div>
              <CardTitle className="text-[var(--airbnb-dark)] text-xl">Smart Data Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--airbnb-gray)] text-center leading-relaxed">
                Effortlessly upload traveler data with CSV/Excel support and automated validation
              </p>
            </CardContent>
          </Card>

          <Card className="airbnb-shadow hover:scale-105 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-[var(--airbnb-dark)] text-xl">WhatsApp Automation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--airbnb-gray)] text-center leading-relaxed">
                Send personalized WhatsApp messages automatically with smart scheduling and templates
              </p>
            </CardContent>
          </Card>

          <Card className="airbnb-shadow hover:scale-105 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-[var(--airbnb-accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[var(--airbnb-accent)]" />
              </div>
              <CardTitle className="text-[var(--airbnb-dark)] text-xl">Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--airbnb-gray)] text-center leading-relaxed">
                Bank-grade security with role-based access, data encryption, and compliance standards
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trust Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 mb-20 airbnb-shadow">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--airbnb-dark)] mb-4">
              Why Travel Agencies Trust TravelFlow
            </h2>
            <p className="text-[var(--airbnb-gray)] text-lg max-w-2xl mx-auto">
              Join hundreds of successful agencies that have streamlined their operations and increased revenue
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--airbnb-dark)] mb-2">40% Revenue Increase</h3>
              <p className="text-[var(--airbnb-gray)]">Average revenue growth reported by our clients within 6 months</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--airbnb-dark)] mb-2">99.9% Uptime</h3>
              <p className="text-[var(--airbnb-gray)]">Reliable platform with enterprise-grade infrastructure</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--airbnb-dark)] mb-2">24/7 Support</h3>
              <p className="text-[var(--airbnb-gray)]">Dedicated customer success team always ready to help</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--airbnb-dark)] mb-6">
            Ready to Transform Your Travel Agency?
          </h2>
          <p className="text-[var(--airbnb-gray)] text-lg mb-8 max-w-2xl mx-auto">
            Join the revolution in travel management. Start your free trial today and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = "/login"}
              variant="outline"
              className="border-[var(--airbnb-primary)] text-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)] hover:text-white px-12 py-4 text-xl rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Login
            </Button>
            <Button 
              onClick={() => window.location.href = "/signup"}
              className="bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white px-12 py-4 text-xl rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Sign Up
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}