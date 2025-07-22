
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Search, Bus, ExternalLink, Tag, Clock, Star, Users, Wifi, Coffee, Snowflake, ArrowLeftRight } from "lucide-react";
import Layout from "@/components/layout/layout";
import { Link } from "react-router-dom";

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
        <div className="min-h-screen bg-gray-50">
          {/* RedBus-style Header with Search Bar */}
          <div className="bg-red-600 text-white">
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
                    <ArrowLeftRight className="w-5 h-5 text-red-600" />
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
                    className="bg-red-600 hover:bg-red-700 text-white h-12 rounded-lg font-semibold"
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
                <h1 className="text-2xl font-bold text-gray-800">
                  {searchParams.from || "Mumbai"} to {searchParams.to || "Delhi"} Bus
                </h1>
                <p className="text-gray-600">{busResults.length} buses found</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Sort By:</span>
                <select className="border rounded-lg px-3 py-1 text-sm">
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
                <Card key={bus.id} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
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
                            <span className="text-sm text-gray-500 line-through mr-2">₹{bus.fare}</span>
                            <span className="text-2xl font-bold text-gray-800">₹{bus.discountedFare}</span>
                          </div>
                          <div className="text-xs text-green-600 font-semibold">{bus.discount}</div>
                        </div>
                      </div>

                      {/* Journey Details */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-semibold text-gray-800">{bus.departureTime}</div>
                            <div className="text-xs text-gray-500">Mumbai Central</div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-sm text-gray-500">{bus.duration}</div>
                          <div className="w-full h-px bg-gray-300 my-1 relative">
                            <div className="absolute inset-0 flex justify-center">
                              <Bus className="w-4 h-4 text-gray-400 bg-white px-1" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-semibold text-gray-800">{bus.arrivalTime}</div>
                            <div className="text-xs text-gray-500">Delhi</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600 font-semibold">
                            {bus.seatsAvailable} seats left
                          </span>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="text-sm text-gray-600">Amenities:</span>
                        <div className="flex items-center space-x-2">
                          {bus.amenities.slice(0, 4).map((amenity, index) => (
                            <span key={index} className="inline-flex items-center">
                              {amenity === "WiFi" && <Wifi className="w-4 h-4 text-blue-600" />}
                              {amenity === "Charging Point" && <div className="w-4 h-4 bg-green-600 rounded-sm flex items-center justify-center text-white text-xs">⚡</div>}
                              {amenity === "Blanket" && <div className="w-4 h-4 bg-purple-600 rounded-sm"></div>}
                              {amenity === "CCTV" && <div className="w-4 h-4 bg-red-600 rounded-sm flex items-center justify-center text-white text-xs">📹</div>}
                              {amenity === "Water Bottle" && <div className="w-4 h-4 bg-blue-400 rounded-sm"></div>}
                              {amenity === "Snacks" && <Coffee className="w-4 h-4 text-orange-600" />}
                              <span className="ml-1 text-xs text-gray-600">{amenity}</span>
                            </span>
                          ))}
                          {bus.amenities.length > 4 && (
                            <span className="text-xs text-blue-600">+{bus.amenities.length - 4} more</span>
                          )}
                        </div>
                      </div>

                      {/* Boarding Points */}
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <span>Boarding Points: {bus.boardingPoints}</span>
                        <span>Dropping Points: {bus.droppingPoints}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex space-x-3">
                          <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                            View Seats
                          </Button>
                          <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                            Boarding & Dropping Points
                          </Button>
                          <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                            Reviews
                          </Button>
                        </div>
                        <Button 
                          onClick={() => handleBookNow(bus.websiteUrl, bus.operator)}
                          className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-lg font-semibold"
                        >
                          Book Now
                        </Button>
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
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - RedBus Style */}
        <div className="bg-red-600 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                India's No. 1 Online Bus Ticket Booking Site
              </h1>
              <p className="text-xl opacity-90">
                Book bus tickets online in simple, fast & secure way
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
                        className="text-lg font-semibold text-gray-800 border-0 border-b-2 border-gray-200 rounded-none focus:border-red-600"
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
                        className="text-lg font-semibold text-gray-800 border-0 border-b-2 border-gray-200 rounded-none focus:border-red-600"
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
                        className="text-lg font-semibold text-gray-800 border-0 border-b-2 border-gray-200 rounded-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={() => setShowResults(true)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-bold rounded-lg shadow-lg"
                    >
                      SEARCH BUSES
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Routes */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
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
              <Card key={index} className="border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {route.from} ↔ {route.to}
                      </h3>
                      <p className="text-red-600 font-bold text-lg">{route.price}</p>
                    </div>
                    <Bus className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Choose RedBus Style Section */}
        <div className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
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
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
