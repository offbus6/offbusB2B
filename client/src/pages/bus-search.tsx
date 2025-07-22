import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, Search, Bus, Star, Users, Clock, ArrowLeftRight } from "lucide-react";
import Layout from "@/components/layout/layout";

export default function BusSearch() {
  const [searchParams, setSearchParams] = useState({
    from: "",
    to: "",
    departureDate: "",
    returnDate: ""
  });
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
  };

  const busResults = [
    {
      id: 1,
      operator: "Express Travels",
      route: "Mumbai → Delhi",
      departureTime: "21:30",
      arrivalTime: "14:00+1",
      duration: "16h 30m",
      busType: "A/C Sleeper (2+1)",
      fare: 1450,
      discountedFare: 1250,
      discount: "14% OFF",
      couponOffer: "₹200 OFF",
      seatsAvailable: 28,
      rating: 4.2,
      reviews: 2847,
      websiteUrl: "https://www.redbus.in",
    },
    {
      id: 2,
      operator: "Premium Coach",
      route: "Mumbai → Delhi",
      departureTime: "20:00",
      arrivalTime: "12:30+1",
      duration: "16h 30m",
      busType: "Volvo Multi-Axle A/C Sleeper (2+1)",
      fare: 1650,
      discountedFare: 1350,
      discount: "18% OFF",
      couponOffer: "15% OFF",
      seatsAvailable: 15,
      rating: 4.5,
      reviews: 1924,
      websiteUrl: "https://www.makemytrip.com",
    },
    {
      id: 3,
      operator: "Luxury Lines",
      route: "Mumbai → Delhi",
      departureTime: "22:15",
      arrivalTime: "15:45+1",
      duration: "17h 30m",
      busType: "Mercedes Multi-Axle A/C Sleeper (2+1)",
      fare: 1800,
      discountedFare: 1520,
      discount: "16% OFF",
      couponOffer: "₹300 OFF",
      seatsAvailable: 22,
      rating: 4.1,
      reviews: 3156,
      websiteUrl: "https://www.goibibo.com",
    }
  ];

  const handleBookNow = (websiteUrl: string, operator: string) => {
    window.open(websiteUrl, '_blank');
  };

  if (showResults) {
    return (
      <Layout variant="dashboard">
        <div className="min-h-screen bg-gradient-to-br from-[var(--airbnb-light)] via-white to-blue-50">
          {/* Header with Search Bar */}
          <div className="bg-white border-b border-[var(--airbnb-border)]">
            <div className="container mx-auto px-6 py-8">
              <div className="bg-white rounded-2xl p-6 airbnb-shadow">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                  <div>
                    <label className="text-sm font-semibold text-[var(--airbnb-gray)] uppercase tracking-wide mb-2 block">FROM</label>
                    <Input
                      value={searchParams.from || "Mumbai"}
                      onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
                      className="text-lg font-medium text-[var(--airbnb-dark)] border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)] h-12"
                      placeholder="Mumbai"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[var(--airbnb-gray)] uppercase tracking-wide mb-2 block">TO</label>
                    <Input
                      value={searchParams.to || "Delhi"}
                      onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
                      className="text-lg font-medium text-[var(--airbnb-dark)] border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)] h-12"
                      placeholder="Delhi"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[var(--airbnb-gray)] uppercase tracking-wide mb-2 block">DEPARTURE</label>
                    <Input
                      type="date"
                      value={searchParams.departureDate}
                      onChange={(e) => setSearchParams({...searchParams, departureDate: e.target.value})}
                      className="text-lg font-medium text-[var(--airbnb-dark)] border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)] h-12"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[var(--airbnb-gray)] uppercase tracking-wide mb-2 block">RETURN</label>
                    <Input
                      type="date"
                      value={searchParams.returnDate}
                      onChange={(e) => setSearchParams({...searchParams, returnDate: e.target.value})}
                      className="text-lg font-medium text-[var(--airbnb-dark)] border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)] h-12"
                      placeholder="Optional"
                    />
                  </div>

                  <Button 
                    className="bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white h-12 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    onClick={() => setShowResults(true)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    SEARCH BUSES
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="container mx-auto px-6 py-8">
            {/* Results Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[var(--airbnb-dark)] mb-2">
                {searchParams.from || "Mumbai"} to {searchParams.to || "Delhi"}
              </h1>
              <p className="text-[var(--airbnb-gray)] text-lg">{busResults.length} buses found for your journey</p>
            </div>

            {/* Bus Results */}
            <div className="space-y-6">
              {busResults.map((bus) => (
                <Card key={bus.id} className="bg-white border-[var(--airbnb-border)] hover:shadow-xl transition-all duration-300 airbnb-shadow hover-lift rounded-2xl overflow-hidden">
                  <CardContent className="p-8">
                    {/* Bus Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-xl text-[var(--airbnb-dark)] mb-1">{bus.operator}</h3>
                        <p className="text-[var(--airbnb-gray)] text-sm mb-2">{bus.busType}</p>
                        
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end mb-1">
                          <span className="text-sm text-[var(--airbnb-gray)] line-through mr-2">₹{bus.fare}</span>
                          <span className="text-2xl font-bold text-[var(--airbnb-dark)]">₹{bus.discountedFare}</span>
                        </div>
                        <div className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                          {bus.discount}
                        </div>
                      </div>
                    </div>

                    {/* Journey Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="font-bold text-xl text-[var(--airbnb-dark)]">{bus.departureTime}</div>
                        <div className="text-sm text-[var(--airbnb-gray)]">Mumbai Central</div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm text-[var(--airbnb-gray)] mb-2">{bus.duration}</div>
                        <div className="flex items-center justify-center">
                          <div className="w-full h-px bg-[var(--airbnb-border)]"></div>
                          <Bus className="w-5 h-5 text-[var(--airbnb-primary)] mx-2" />
                          <div className="w-full h-px bg-[var(--airbnb-border)]"></div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="font-bold text-xl text-[var(--airbnb-dark)]">{bus.arrivalTime}</div>
                        <div className="text-sm text-[var(--airbnb-gray)]">Delhi</div>
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="pt-6 border-t border-[var(--airbnb-border)]">
                      <div className="flex items-center justify-between">
                        {/* Left side - Seats and Reviews */}
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center text-[var(--airbnb-primary)]">
                            <Users className="w-4 h-4 mr-1" />
                            <span className="font-semibold">{bus.seatsAvailable} seats left</span>
                          </div>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                            <span className="font-semibold text-[var(--airbnb-dark)]">{bus.rating}</span>
                            <span className="ml-1 text-[var(--airbnb-gray)]">({bus.reviews} reviews)</span>
                          </div>
                        </div>

                        {/* Right side - Offer and Copy Coupon */}
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold text-sm border border-green-200">
                            {bus.couponOffer}
                          </div>
                          <Button 
                            onClick={() => navigator.clipboard.writeText(bus.couponOffer)}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                          >
                            Copy Coupon
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button 
                variant="outline" 
                className="border-[var(--airbnb-primary)] text-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)] hover:text-white px-8 py-3 rounded-xl font-semibold transition-all"
              >
                Load More Buses
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="dashboard">
      <div className="min-h-screen bg-gradient-to-br from-[var(--airbnb-light)] via-white to-blue-50">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="inline-block p-4 bg-[var(--airbnb-primary)]/10 rounded-full mb-6">
              <Bus className="w-16 h-16 text-[var(--airbnb-primary)]" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-[var(--airbnb-dark)] mb-6 leading-tight">
              Find Your Journey
            </h1>
            <p className="text-xl text-[var(--airbnb-gray)] mb-12 max-w-2xl mx-auto leading-relaxed">
              Discover comfortable buses with trusted operators at the best prices
            </p>

            {/* Search Form */}
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white rounded-3xl p-8 airbnb-shadow border-0">
                <CardContent className="p-0">
                  <form onSubmit={handleSearch}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      <div>
                        <label className="text-sm font-semibold text-[var(--airbnb-gray)] uppercase tracking-wide mb-2 block">FROM</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--airbnb-gray)]" />
                          <Input
                            type="text"
                            placeholder="Enter source city"
                            value={searchParams.from}
                            onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
                            className="pl-10 text-lg font-medium text-[var(--airbnb-dark)] border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)] h-14 rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-[var(--airbnb-gray)] uppercase tracking-wide mb-2 block">TO</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--airbnb-gray)]" />
                          <Input
                            type="text"
                            placeholder="Enter destination city"
                            value={searchParams.to}
                            onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
                            className="pl-10 text-lg font-medium text-[var(--airbnb-dark)] border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)] h-14 rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-[var(--airbnb-gray)] uppercase tracking-wide mb-2 block">DEPARTURE</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--airbnb-gray)]" />
                          <Input
                            type="date"
                            value={searchParams.departureDate}
                            onChange={(e) => setSearchParams({...searchParams, departureDate: e.target.value})}
                            className="pl-10 text-lg font-medium text-[var(--airbnb-dark)] border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)] h-14 rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-[var(--airbnb-gray)] uppercase tracking-wide mb-2 block">RETURN</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--airbnb-gray)]" />
                          <Input
                            type="date"
                            value={searchParams.returnDate}
                            onChange={(e) => setSearchParams({...searchParams, returnDate: e.target.value})}
                            className="pl-10 text-lg font-medium text-[var(--airbnb-dark)] border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)] h-14 rounded-xl"
                            placeholder="Optional"
                          />
                        </div>
                      </div>

                      <div className="flex items-end">
                        <Button 
                          type="submit"
                          className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        >
                          <Search className="w-5 h-5 mr-2" />
                          SEARCH BUSES
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Popular Routes */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--airbnb-dark)] mb-4">
              Popular Routes
            </h2>
            <p className="text-[var(--airbnb-gray)] text-lg">
              Most searched destinations by travelers
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { from: "Mumbai", to: "Delhi", price: "₹1,200" },
              { from: "Delhi", to: "Manali", price: "₹800" },
              { from: "Bangalore", to: "Goa", price: "₹600" },
              { from: "Chennai", to: "Bangalore", price: "₹400" },
              { from: "Hyderabad", to: "Mumbai", price: "₹900" },
              { from: "Pune", to: "Mumbai", price: "₹300" },
              { from: "Ahmedabad", to: "Mumbai", price: "₹450" },
              { from: "Jaipur", to: "Delhi", price: "₹350" }
            ].map((route, index) => (
              <Card key={index} className="bg-white border-[var(--airbnb-border)] hover:shadow-lg transition-all cursor-pointer hover-lift airbnb-shadow rounded-xl">
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold text-[var(--airbnb-dark)] mb-1">
                    {route.from} → {route.to}
                  </h3>
                  <p className="text-[var(--airbnb-primary)] font-bold">{route.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: "🚌",
                title: "2000+ Cities",
                description: "Connecting cities across India"
              },
              {
                icon: "🎫",
                title: "50+ Operators",
                description: "Trusted bus operators nationwide"
              },
              {
                icon: "💰",
                title: "Best Deals",
                description: "Guaranteed lowest prices"
              },
              {
                icon: "🔒",
                title: "Secure Booking",
                description: "100% safe and secure payments"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-[var(--airbnb-dark)] mb-2">{feature.title}</h3>
                <p className="text-[var(--airbnb-gray)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}