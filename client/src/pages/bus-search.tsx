import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Search, Bus, ExternalLink, Tag, Clock, Star } from "lucide-react";
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

  const travelDeals = [
    {
      id: 1,
      operator: "RedBus",
      logoUrl: "https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?w=100&h=100&fit=crop&crop=center",
      offer: "₹200 OFF",
      discount: "20% OFF",
      description: "Book any bus journey above ₹1000",
      code: "REDBUS200",
      originalPrice: 1450,
      discountedPrice: 1250,
      validTill: "31 Dec 2025",
      terms: "Valid on all routes • Maximum discount ₹200 • Valid till 31st Dec",
      websiteUrl: "https://www.redbus.in",
      color: "bg-red-500"
    },
    {
      id: 2,
      operator: "AbhiBus",
      logoUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&h=100&fit=crop&crop=center",
      offer: "₹150 OFF",
      discount: "15% OFF",
      description: "First time users get extra savings",
      code: "ABHIBUS150",
      originalPrice: 950,
      discountedPrice: 800,
      validTill: "15 Jan 2025",
      terms: "Valid for new users • Maximum discount ₹150 • Valid on AC buses",
      websiteUrl: "https://www.abhibus.com",
      color: "bg-blue-500"
    },
    {
      id: 3,
      operator: "MakeMyTrip",
      logoUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop&crop=center",
      offer: "₹300 OFF",
      discount: "25% OFF",
      description: "Premium bus bookings with luxury amenities",
      code: "MMT300",
      originalPrice: 1650,
      discountedPrice: 1350,
      validTill: "28 Feb 2025",
      terms: "Valid on Volvo & Mercedes buses • Maximum discount ₹300 • Weekend special",
      websiteUrl: "https://www.makemytrip.com",
      color: "bg-orange-500"
    },
    {
      id: 4,
      operator: "Goibibo",
      logoUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=100&h=100&fit=crop&crop=center",
      offer: "₹100 OFF",
      discount: "10% OFF",
      description: "Round trip bookings save more",
      code: "GOIBIBO100",
      originalPrice: 1200,
      discountedPrice: 1100,
      validTill: "20 Jan 2025",
      terms: "Valid on round trip bookings • Maximum discount ₹100 • All routes",
      websiteUrl: "https://www.goibibo.com",
      color: "bg-green-500"
    },
    {
      id: 5,
      operator: "Paytm",
      logoUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&h=100&fit=crop&crop=center",
      offer: "₹250 OFF",
      discount: "20% OFF",
      description: "Pay with Paytm wallet for instant discount",
      code: "PAYTM250",
      originalPrice: 1300,
      discountedPrice: 1050,
      validTill: "10 Feb 2025",
      terms: "Valid with Paytm wallet payment • Maximum discount ₹250 • All operators",
      websiteUrl: "https://paytm.com/bus-booking",
      color: "bg-blue-600"
    },
    {
      id: 6,
      operator: "Yatra",
      logoUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=center",
      offer: "₹180 OFF",
      discount: "18% OFF",
      description: "Corporate bookings get special rates",
      code: "YATRA180",
      originalPrice: 1100,
      discountedPrice: 920,
      validTill: "25 Jan 2025",
      terms: "Valid for corporate bookings • Maximum discount ₹180 • AC Sleeper only",
      websiteUrl: "https://www.yatra.com",
      color: "bg-purple-500"
    }
  ];

  const handleRedirect = (websiteUrl: string, code: string) => {
    // Open the travel website in a new tab
    window.open(websiteUrl, '_blank');
  };

  if (showResults) {
    return (
      <Layout variant="dashboard">
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

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--airbnb-dark)] mb-2">
                Best Travel Deals & Coupons
              </h1>
              <p className="text-[var(--airbnb-gray)] text-lg">
                Save money on your bus bookings with exclusive offers from top travel platforms
              </p>
            </div>

            {/* Travel Deals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {travelDeals.map((deal) => (
                <Card key={deal.id} className="airbnb-shadow hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    {/* Header with Logo and Operator */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={deal.logoUrl} 
                          alt={deal.operator}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-bold text-lg text-[var(--airbnb-dark)]">{deal.operator}</h3>
                          <p className="text-sm text-[var(--airbnb-gray)]">{deal.description}</p>
                        </div>
                      </div>
                      <div className={`${deal.color} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                        {deal.discount}
                      </div>
                    </div>

                    {/* Offer Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-[var(--airbnb-primary)]" />
                          <span className="font-mono font-bold text-[var(--airbnb-primary)]">{deal.code}</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600">{deal.offer}</span>
                      </div>
                      
                      {/* Price Comparison */}
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm text-[var(--airbnb-gray)]">Sample Price:</span>
                        <span className="text-lg text-gray-500 line-through">₹{deal.originalPrice}</span>
                        <span className="text-lg font-bold text-green-600">₹{deal.discountedPrice}</span>
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                          Save ₹{deal.originalPrice - deal.discountedPrice}
                        </span>
                      </div>
                    </div>

                    {/* Terms and Validity */}
                    <div className="text-xs text-[var(--airbnb-gray)] mb-4">
                      <p className="mb-1">📅 Valid till: {deal.validTill}</p>
                      <p>{deal.terms}</p>
                    </div>

                    {/* Action Button */}
                    <Button 
                      onClick={() => handleRedirect(deal.websiteUrl, deal.code)}
                      className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white flex items-center justify-center space-x-2"
                    >
                      <span>Book Now on {deal.operator}</span>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Info */}
            <Card className="airbnb-shadow mt-8">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-[var(--airbnb-dark)] mb-2">How it Works</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[var(--airbnb-primary)] text-white rounded-full flex items-center justify-center mx-auto mb-2">1</div>
                      <h4 className="font-semibold">Choose Your Deal</h4>
                      <p className="text-sm text-[var(--airbnb-gray)]">Select the best offer for your journey</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[var(--airbnb-primary)] text-white rounded-full flex items-center justify-center mx-auto mb-2">2</div>
                      <h4 className="font-semibold">Visit Partner Site</h4>
                      <p className="text-sm text-[var(--airbnb-gray)]">Click to redirect to the travel platform</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[var(--airbnb-primary)] text-white rounded-full flex items-center justify-center mx-auto mb-2">3</div>
                      <h4 className="font-semibold">Apply & Save</h4>
                      <p className="text-sm text-[var(--airbnb-gray)]">Use the coupon code and enjoy savings</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="dashboard">
      <div className="min-h-screen bg-gradient-to-br from-[var(--airbnb-light)] via-white to-blue-50">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-[var(--airbnb-primary)]/10 rounded-full mb-6">
              <Bus className="w-16 h-16 text-[var(--airbnb-primary)]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-[var(--airbnb-dark)] mb-4">
              Find Best Travel Deals
            </h1>
            <p className="text-xl text-[var(--airbnb-gray)] max-w-2xl mx-auto">
              Discover exclusive coupons and offers from top travel platforms. Save money on your next bus journey.
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <Card className="airbnb-shadow">
              <CardHeader>
                <CardTitle className="text-2xl text-[var(--airbnb-dark)] text-center">
                  Search for Travel Deals
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
                      Find Deals
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
                      Find Deals
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