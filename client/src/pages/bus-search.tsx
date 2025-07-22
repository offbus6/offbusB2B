import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Search, Bus, ExternalLink, Tag, Clock, Star, Users, Wifi, Coffee, Snowflake, ArrowLeftRight } from "lucide-react";
import Layout from "@/components/layout/layout";
import { Link } from "wouter";

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
      operator: "RedBus Express",
      route: "Mumbai Central → Delhi",
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
      amenities: ["WiFi", "Charging Point", "Blanket", "Water Bottle", "CCTV"],
      boardingPoints: 8,
      droppingPoints: 6,
      websiteUrl: "https://www.redbus.in",
      color: "bg-red-500",
      busImage: "https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?w=300&h=200&fit=crop&crop=center"
    },
    {
      id: 2,
      operator: "MakeMyTrip Travels",
      route: "Mumbai Central → Delhi",
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
      amenities: ["WiFi", "Charging Point", "Blanket", "Snacks", "Reading Light", "CCTV"],
      boardingPoints: 12,
      droppingPoints: 8,
      websiteUrl: "https://www.makemytrip.com",
      color: "bg-blue-600",
      busImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&h=200&fit=crop&crop=center"
    },
    {
      id: 3,
      operator: "Goibibo Premium",
      route: "Mumbai Central → Delhi",
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
      amenities: ["WiFi", "Charging Point", "Blanket", "Pillow", "Entertainment", "CCTV"],
      boardingPoints: 6,
      droppingPoints: 4,
      websiteUrl: "https://www.goibibo.com",
      color: "bg-orange-500",
      busImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop&crop=center"
    },
    {
      id: 4,
      operator: "Paytm Express",
      route: "Mumbai Central → Delhi",
      departureTime: "19:30",
      arrivalTime: "11:00+1",
      duration: "15h 30m",
      busType: "A/C Seater/Sleeper (2+2)",
      fare: 1300,
      discountedFare: 1050,
      discount: "19% OFF",
      couponOffer: "20% OFF",
      seatsAvailable: 35,
      rating: 3.9,
      reviews: 1567,
      amenities: ["Charging Point", "Water Bottle", "CCTV"],
      boardingPoints: 10,
      droppingPoints: 7,
      websiteUrl: "https://paytm.com/bus-booking",
      color: "bg-blue-500",
      busImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&h=200&fit=crop&crop=center"
    }
  ];

  const handleBookNow = (websiteUrl: string, operator: string) => {
    window.open(websiteUrl, '_blank');
  };

  if (showResults) {
    return (
      <Layout variant="dashboard">
        <div className="min-h-screen bg-background">
          {/* Airbnb-style Header with Search Bar */}
          <div className="bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 py-6">
              {/* Modified Search Bar */}
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <label className="text-xs text-gray-600 font-semibold">FROM</label>
                    <div className="flex items-center">
                      <Input
                        value={searchParams.from || "Mumbai"}
                        onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
                        className="border-0 p-0 text-lg font-semibold text-gray-800"
                        placeholder="Mumbai"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-primary" />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 font-semibold">TO</label>
                    <div className="flex items-center">
                      <Input
                        value={searchParams.to || "Delhi"}
                        onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
                        className="border-0 p-0 text-lg font-semibold text-gray-800"
                        placeholder="Delhi"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 font-semibold">DEPARTURE</label>
                    <div className="flex items-center">
                      <Input
                        type="date"
                        value={searchParams.departureDate}
                        onChange={(e) => setSearchParams({...searchParams, departureDate: e.target.value})}
                        className="border-0 p-0 text-lg font-semibold text-gray-800"
                      />
                    </div>
                  </div>

                  <Button 
                    className="h-12 rounded-lg font-semibold"
                    onClick={() => setShowResults(true)}
                  >
                    SEARCH BUSES
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="container mx-auto px-4 py-6">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {searchParams.from || "Mumbai"} to {searchParams.to || "Delhi"} Bus
                </h1>
                <p className="text-muted-foreground">{busResults.length} buses found</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">Sort By:</span>
                <select className="border border-input rounded-lg px-3 py-1 text-sm">
                  <option>Departure</option>
                  <option>Duration</option>
                  <option>Arrival</option>
                  <option>Rating</option>
                  <option>Fare</option>
                </select>
              </div>
            </div>

            {/* Bus Results */}
            <div className="space-y-4">
              {busResults.map((bus) => (
                <Card key={bus.id} className="bg-card border border-border hover:shadow-lg transition-shadow airbnb-shadow hover-lift">
                  <CardContent className="p-0">
                    <div className="p-6">
                      {/* Bus Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <img 
                            src={bus.busImage} 
                            alt={bus.operator}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{bus.operator}</h3>
                            <p className="text-gray-600 text-sm">{bus.busType}</p>
                            <div className="flex items-center mt-1">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-green-600 fill-current" />
                                <span className="ml-1 text-sm font-semibold text-gray-700">{bus.rating}</span>
                                <span className="ml-1 text-xs text-gray-500">({bus.reviews} reviews)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="text-sm text-muted-foreground line-through mr-2">₹{bus.fare}</span>
                            <span className="text-2xl font-bold text-foreground">₹{bus.discountedFare}</span>
                          </div>
                          <div className="text-xs text-primary font-semibold">{bus.discount}</div>
                        </div>
                      </div>

                      {/* Journey Details */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-semibold text-foreground">{bus.departureTime}</div>
                            <div className="text-xs text-muted-foreground">Mumbai Central</div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">{bus.duration}</div>
                          <div className="w-full h-px bg-border my-1 relative">
                            <div className="absolute inset-0 flex justify-center">
                              <Bus className="w-4 h-4 text-muted-foreground bg-background px-1" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-semibold text-foreground">{bus.arrivalTime}</div>
                            <div className="text-xs text-muted-foreground">Delhi</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="text-sm text-primary font-semibold">
                            {bus.seatsAvailable} seats left
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end pt-4 border-t border-border">
                        <div className="flex items-center space-x-3">
                          <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                            {bus.couponOffer}
                          </div>
                          <Button 
                            onClick={() => handleBookNow(bus.websiteUrl, bus.operator)}
                            className="px-8 py-2 rounded-lg font-semibold"
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
            <div className="text-center mt-8">
              <Button variant="outline" className="px-8">
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
      <div className="min-h-screen bg-background">
        {/* Hero Section - Airbnb Style */}
        <div className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find Your Perfect Journey
              </h1>
              <p className="text-xl opacity-90">
                Discover great deals on bus tickets with trusted operators
              </p>
            </div>

            {/* Search Form */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <label className="text-xs text-gray-600 font-semibold uppercase">FROM</label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        placeholder="Enter source city"
                        value={searchParams.from}
                        onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
                        className="text-lg font-semibold text-gray-800 border border-input rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs text-gray-600 font-semibold uppercase">TO</label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        placeholder="Enter destination city"
                        value={searchParams.to}
                        onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
                        className="text-lg font-semibold text-gray-800 border border-input rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs text-gray-600 font-semibold uppercase">DEPARTURE</label>
                    <div className="mt-1">
                      <Input
                        type="date"
                        value={searchParams.departureDate}
                        onChange={(e) => setSearchParams({...searchParams, departureDate: e.target.value})}
                        className="text-lg font-semibold text-gray-800 border border-input rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={() => setShowResults(true)}
                      className="w-full h-12 text-lg font-bold rounded-lg shadow-lg"
                    >
                      SEARCH BUSES
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Routes */}
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Popular Routes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                <Card key={index} className="border border-border hover:shadow-lg transition-all cursor-pointer hover-lift airbnb-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {route.from} ↔ {route.to}
                        </h3>
                        <p className="text-primary font-bold text-lg">{route.price}</p>
                      </div>
                      <Bus className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Why Choose Our Platform Section */}
            <div className="bg-muted py-16">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-foreground text-center mb-12">
                  Why Choose Our Platform?
                </h2>
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
                      <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Layout>
    );
}
