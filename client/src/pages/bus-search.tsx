
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Search, Bus, Clock, Star, Users, Wifi, Car, Snowflake, Coffee } from "lucide-react";
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

  const sampleBuses = [
    {
      id: 1,
      name: "Volvo Multi-Axle AC Sleeper",
      operator: "TravelFlow Express",
      from: searchParams.from || "Mumbai",
      to: searchParams.to || "Delhi",
      departureTime: "08:00 PM",
      arrivalTime: "10:30 AM",
      duration: "14h 30m",
      fare: 1450,
      rating: 4.5,
      seats: 32,
      amenities: ["AC", "WiFi", "Blanket", "Water Bottle", "Charging Point"]
    },
    {
      id: 2,
      name: "Mercedes Multi-Axle AC Seater",
      operator: "RedBus Travels",
      from: searchParams.from || "Mumbai",
      to: searchParams.to || "Delhi",
      departureTime: "06:30 AM",
      arrivalTime: "06:00 PM",
      duration: "11h 30m",
      fare: 950,
      rating: 4.2,
      seats: 45,
      amenities: ["AC", "WiFi", "Water Bottle", "Charging Point"]
    },
    {
      id: 3,
      name: "Scania AC Sleeper",
      operator: "Highway Express",
      from: searchParams.from || "Mumbai",
      to: searchParams.to || "Delhi",
      departureTime: "09:45 PM",
      arrivalTime: "12:15 PM",
      duration: "14h 30m",
      fare: 1650,
      rating: 4.7,
      seats: 28,
      amenities: ["AC", "WiFi", "Blanket", "Meals", "Water Bottle", "Charging Point"]
    },
    {
      id: 4,
      name: "Tata AC Semi Sleeper",
      operator: "Swift Travels",
      from: searchParams.from || "Mumbai",
      to: searchParams.to || "Delhi",
      departureTime: "11:00 PM",
      arrivalTime: "01:30 PM",
      duration: "14h 30m",
      fare: 1200,
      rating: 4.0,
      seats: 38,
      amenities: ["AC", "Blanket", "Water Bottle", "Charging Point"]
    }
  ];

  const couponOffers = [
    {
      code: "FIRST100",
      title: "First Time User",
      discount: "₹100 OFF",
      description: "Valid on bookings above ₹500",
      color: "bg-gradient-to-r from-green-400 to-green-600"
    },
    {
      code: "WEEKEND50",
      title: "Weekend Special",
      discount: "₹50 OFF",
      description: "Valid on weekend bookings",
      color: "bg-gradient-to-r from-blue-400 to-blue-600"
    },
    {
      code: "SAVE200",
      title: "Super Saver",
      discount: "₹200 OFF",
      description: "Valid on bookings above ₹1000",
      color: "bg-gradient-to-r from-purple-400 to-purple-600"
    }
  ];

  if (showResults) {
    return (
      <Layout variant="app">
        <div className="min-h-screen bg-gradient-to-br from-[var(--airbnb-light)] via-white to-blue-50">
          <div className="container mx-auto px-4 py-8">
            {/* Search Summary */}
            <Card className="airbnb-shadow mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center text-[var(--airbnb-dark)]">
                      <MapPin className="w-5 h-5 mr-2 text-[var(--airbnb-primary)]" />
                      <span className="font-medium">{searchParams.from || "Mumbai"} → {searchParams.to || "Delhi"}</span>
                    </div>
                    <div className="flex items-center text-[var(--airbnb-gray)]">
                      <Calendar className="w-5 h-5 mr-2 text-[var(--airbnb-primary)]" />
                      <span>{searchParams.departureDate || "Today"}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowResults(false)}
                    variant="outline"
                    className="border-[var(--airbnb-primary)] text-[var(--airbnb-primary)]"
                  >
                    Modify Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Bus Results */}
              <div className="lg:col-span-3 space-y-4">
                <h2 className="text-2xl font-bold text-[var(--airbnb-dark)] mb-4">
                  {sampleBuses.length} buses found
                </h2>
                
                {sampleBuses.map((bus) => (
                  <Card key={bus.id} className="airbnb-shadow hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Bus Info */}
                        <div className="col-span-12 md:col-span-3">
                          <h3 className="font-semibold text-[var(--airbnb-dark)] text-lg mb-1">
                            {bus.name}
                          </h3>
                          <p className="text-[var(--airbnb-gray)] text-sm mb-2">{bus.operator}</p>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium ml-1">{bus.rating}</span>
                            </div>
                            <div className="flex items-center text-[var(--airbnb-gray)] text-sm">
                              <Users className="w-4 h-4 mr-1" />
                              {bus.seats} seats
                            </div>
                          </div>
                        </div>

                        {/* Route & Timing */}
                        <div className="col-span-12 md:col-span-4">
                          <div className="flex items-center justify-between">
                            <div className="text-center">
                              <div className="text-xl font-bold text-[var(--airbnb-dark)]">
                                {bus.departureTime}
                              </div>
                              <div className="text-sm text-[var(--airbnb-gray)]">
                                {bus.from}
                              </div>
                            </div>
                            <div className="flex flex-col items-center px-4">
                              <div className="text-xs text-[var(--airbnb-gray)] mb-1">
                                {bus.duration}
                              </div>
                              <div className="w-16 h-px bg-[var(--airbnb-gray)] relative">
                                <div className="absolute -right-1 -top-1 w-2 h-2 bg-[var(--airbnb-primary)] rounded-full"></div>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-[var(--airbnb-dark)]">
                                {bus.arrivalTime}
                              </div>
                              <div className="text-sm text-[var(--airbnb-gray)]">
                                {bus.to}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Amenities */}
                        <div className="col-span-12 md:col-span-3">
                          <div className="flex flex-wrap gap-1 mb-3">
                            {bus.amenities.slice(0, 4).map((amenity) => (
                              <span 
                                key={amenity}
                                className="inline-flex items-center px-2 py-1 bg-[var(--airbnb-light)] text-[var(--airbnb-primary)] text-xs rounded-full"
                              >
                                {amenity === "AC" && <Snowflake className="w-3 h-3 mr-1" />}
                                {amenity === "WiFi" && <Wifi className="w-3 h-3 mr-1" />}
                                {amenity === "Charging Point" && <Car className="w-3 h-3 mr-1" />}
                                {amenity === "Meals" && <Coffee className="w-3 h-3 mr-1" />}
                                {amenity}
                              </span>
                            ))}
                            {bus.amenities.length > 4 && (
                              <span className="text-xs text-[var(--airbnb-gray)]">
                                +{bus.amenities.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Book */}
                        <div className="col-span-12 md:col-span-2 text-right">
                          <div className="text-2xl font-bold text-[var(--airbnb-dark)] mb-2">
                            ₹{bus.fare}
                          </div>
                          <Button className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white">
                            Select Seats
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Coupons Sidebar */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[var(--airbnb-dark)]">Available Offers</h3>
                
                {couponOffers.map((offer, index) => (
                  <Card key={index} className="overflow-hidden airbnb-shadow">
                    <div className={`${offer.color} p-4 text-white`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">{offer.discount}</h4>
                        <div className="bg-white/20 px-2 py-1 rounded text-xs">
                          {offer.code}
                        </div>
                      </div>
                      <h5 className="font-semibold mb-1">{offer.title}</h5>
                      <p className="text-xs opacity-90">{offer.description}</p>
                    </div>
                    <CardContent className="p-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[var(--airbnb-primary)] border-[var(--airbnb-primary)]"
                      >
                        Apply Code
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {/* Customer Support */}
                <Card className="airbnb-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg text-[var(--airbnb-dark)]">Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-[var(--airbnb-gray)]">
                      Our travel experts are here to assist you 24/7
                    </div>
                    <Button variant="outline" className="w-full">
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="app">
      <div className="min-h-screen bg-gradient-to-br from-[var(--airbnb-light)] via-white to-blue-50">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-[var(--airbnb-primary)]/10 rounded-full mb-6">
              <Bus className="w-16 h-16 text-[var(--airbnb-primary)]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-[var(--airbnb-dark)] mb-4">
              Book Your Bus Journey
            </h1>
            <p className="text-xl text-[var(--airbnb-gray)] max-w-2xl mx-auto">
              Travel comfortably across India with our premium bus services. Safe, reliable, and affordable.
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <Card className="airbnb-shadow">
              <CardHeader>
                <CardTitle className="text-2xl text-[var(--airbnb-dark)] text-center">
                  Find Your Perfect Bus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* From */}
                    <div className="space-y-2">
                      <Label htmlFor="from" className="text-[var(--airbnb-dark)] font-medium">
                        From
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--airbnb-primary)] w-5 h-5" />
                        <Input
                          id="from"
                          type="text"
                          placeholder="Enter departure city"
                          value={searchParams.from}
                          onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
                          className="pl-10 h-12 text-lg border-2 border-gray-200 focus:border-[var(--airbnb-primary)]"
                        />
                      </div>
                    </div>

                    {/* To */}
                    <div className="space-y-2">
                      <Label htmlFor="to" className="text-[var(--airbnb-dark)] font-medium">
                        To
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--airbnb-teal)] w-5 h-5" />
                        <Input
                          id="to"
                          type="text"
                          placeholder="Enter destination city"
                          value={searchParams.to}
                          onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
                          className="pl-10 h-12 text-lg border-2 border-gray-200 focus:border-[var(--airbnb-primary)]"
                        />
                      </div>
                    </div>

                    {/* Departure Date */}
                    <div className="space-y-2">
                      <Label htmlFor="departure" className="text-[var(--airbnb-dark)] font-medium">
                        Departure Date
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--airbnb-primary)] w-5 h-5" />
                        <Input
                          id="departure"
                          type="date"
                          value={searchParams.departureDate}
                          onChange={(e) => setSearchParams({...searchParams, departureDate: e.target.value})}
                          className="pl-10 h-12 text-lg border-2 border-gray-200 focus:border-[var(--airbnb-primary)]"
                        />
                      </div>
                    </div>

                    {/* Return Date (Optional) */}
                    <div className="space-y-2">
                      <Label htmlFor="return" className="text-[var(--airbnb-dark)] font-medium">
                        Return Date (Optional)
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--airbnb-teal)] w-5 h-5" />
                        <Input
                          id="return"
                          type="date"
                          value={searchParams.returnDate}
                          onChange={(e) => setSearchParams({...searchParams, returnDate: e.target.value})}
                          className="pl-10 h-12 text-lg border-2 border-gray-200 focus:border-[var(--airbnb-primary)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Search Button */}
                  <div className="text-center pt-4">
                    <Button 
                      type="submit"
                      className="bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white px-12 py-4 text-xl rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      <Search className="mr-3 w-6 h-6" />
                      Search Buses
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Popular Routes */}
          <div className="mt-16 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--airbnb-dark)] text-center mb-8">
              Popular Routes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { from: "Mumbai", to: "Delhi", fare: "₹1,200", duration: "14h" },
                { from: "Delhi", to: "Manali", fare: "₹800", duration: "12h" },
                { from: "Bangalore", to: "Goa", fare: "₹600", duration: "8h" },
                { from: "Chennai", to: "Bangalore", fare: "₹400", duration: "6h" },
                { from: "Hyderabad", to: "Mumbai", fare: "₹900", duration: "10h" },
                { from: "Pune", to: "Mumbai", fare: "₹300", duration: "4h" }
              ].map((route, index) => (
                <Card key={index} className="airbnb-shadow hover:scale-105 transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-[var(--airbnb-dark)] text-lg">
                          {route.from} → {route.to}
                        </h3>
                        <p className="text-[var(--airbnb-gray)]">{route.duration} journey</p>
                      </div>
                      <div className="text-[var(--airbnb-primary)] font-bold text-lg">
                        {route.fare}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-[var(--airbnb-primary)] text-[var(--airbnb-primary)]"
                      onClick={() => {
                        setSearchParams({
                          ...searchParams,
                          from: route.from,
                          to: route.to
                        });
                        setShowResults(true);
                      }}
                    >
                      Select Route
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
