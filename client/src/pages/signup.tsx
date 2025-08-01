import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, ArrowLeft, Upload, ImageIcon } from "lucide-react";
import Layout from "@/components/layout/layout";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  agencyName: z.string().min(1, "Agency name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  logoUrl: z.string().optional().refine(
    (val) => !val || val === "" || /^https?:\/\//.test(val) || /^data:image\//.test(val),
    "Invalid logo URL format"
  ),
  bookingWebsite: z.string().min(1, "Booking website is required").refine(
    (val) => !val || val === "" || /^https?:\/\//.test(val),
    "Please enter a valid booking website URL"
  ),
});

type SignupData = z.infer<typeof signupSchema>;

// State and Cities data
const statesAndCities = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Amravati", "Nanded", "Kolhapur", "Akola"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Davangere", "Gulbarga", "Shimoga", "Tumkur", "Raichur"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukudi"],
  "Andhra Pradesh": ["Hyderabad", "Vijayawada", "Visakhapatnam", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Anantapur"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam", "Khammam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Malappuram", "Kannur", "Kasaragod"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhidham", "Nadiad", "Morvi"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Aligarh", "Moradabad"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Malda", "Bardhaman", "Kharagpur", "Haldia", "Raiganj"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
  "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur", "Batala", "Pathankot", "Moga"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Karimganj", "Sivasagar"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Arrah", "Begusarai", "Katihar", "Munger"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Mahasamund"],
  "Goa": ["Panaji", "Vasco da Gama", "Margao", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Cuncolim", "Quepem"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Palampur", "Baddi", "Nahan", "Paonta Sahib", "Sundernagar", "Chamba"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Kotdwar", "Ramnagar", "Manglaur"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Baramulla", "Anantnag", "Sopore", "KathuaName", "Udhampur", "Punch", "Rajauri", "Kupwara"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Namsai", "Bomdila", "Ziro", "Along", "Tezu", "Seppa", "Khonsa"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Ukhrul", "Senapati", "Tamenglong", "Jiribam", "Pherzawl"],
  "Meghalaya": ["Shillong", "Tura", "Nongpoh", "Jowai", "Baghmara", "Ampati", "Resubelpara", "Mairang", "Nongstoin", "Williamnagar"],
  "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Hnahthial", "Saitual"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Kiphire", "Longleng", "Peren"],
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Belonia", "Khowai", "Ambassa", "Ranirbazar", "Sonamura", "Santirbazar"],
  "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Singtam", "Jorethang", "Nayabazar", "Rangpo", "Pakyong", "Soreng"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "North East Delhi", "North West Delhi", "South East Delhi", "South West Delhi"],
  "Chandigarh": ["Chandigarh"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"],
  "Andaman and Nicobar Islands": ["Port Blair", "Diglipur", "Mayabunder", "Rangat", "Havelock Island", "Neil Island", "Baratang", "Campbell Bay", "Car Nicobar", "Nancowry"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa", "Dadra", "Nagar Haveli"],
  "Lakshadweep": ["Kavaratti", "Agatti", "Amini", "Androth", "Bithra", "Chetlat", "Kadmat", "Kalpeni", "Kilthan", "Minicoy"],
  "Ladakh": ["Leh", "Kargil", "Nubra", "Zanskar", "Changthang", "Sham", "Rupshu", "Dras", "Sankoo", "Turtuk"]
};

export default function Signup() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedState, setSelectedState] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      agencyName: "",
      phone: "",
      state: "",
      city: "",
      logoUrl: "",
      bookingWebsite: "",
    },
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
        form.setValue('logoUrl', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    form.setValue('state', state);
    form.setValue('city', ""); // Reset city when state changes
  };

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      return await apiRequest("/api/auth/signup", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Account Created Successfully!",
        description: "Your account has been created and is pending approval. You can login once approved.",
      });
      
      // Navigate to login page
      navigate("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupData) => {
    signupMutation.mutate(data);
  };

  return (
    <Layout variant="auth">
      <div className="bg-gradient-to-br from-[var(--airbnb-light)] to-white flex items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-2xl">
        <Card className="airbnb-shadow border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-[var(--airbnb-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-[var(--airbnb-primary)]" />
            </div>
            <CardTitle className="text-2xl font-bold text-[var(--airbnb-dark)]">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-[var(--airbnb-gray)]">
              Join TravelFlow and start managing your travel agency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--airbnb-dark)]">First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your first name"
                            {...field}
                            className="border-gray-300 focus:border-[var(--airbnb-primary)] focus:ring-[var(--airbnb-primary)]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--airbnb-dark)]">Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your last name"
                            {...field}
                            className="border-gray-300 focus:border-[var(--airbnb-primary)] focus:ring-[var(--airbnb-primary)]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--airbnb-dark)]">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                          className="border-gray-300 focus:border-[var(--airbnb-primary)] focus:ring-[var(--airbnb-primary)]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--airbnb-dark)]">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Choose a password"
                          {...field}
                          className="border-gray-300 focus:border-[var(--airbnb-primary)] focus:ring-[var(--airbnb-primary)]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="agencyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--airbnb-dark)]">Agency Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your agency name"
                          {...field}
                          className="border-gray-300 focus:border-[var(--airbnb-primary)] focus:ring-[var(--airbnb-primary)]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Logo Upload Field */}
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--airbnb-dark)]">Agency Logo</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                              id="logo-upload"
                            />
                            <label
                              htmlFor="logo-upload"
                              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Upload Logo</span>
                            </label>
                            {logoFile && (
                              <span className="text-sm text-green-600">
                                {logoFile.name}
                              </span>
                            )}
                          </div>
                          {logoPreview && (
                            <div className="flex items-center space-x-4">
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                              />
                              <div className="text-sm text-gray-600">
                                <p>Logo uploaded successfully</p>
                                <p className="text-xs">Max size: 5MB</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--airbnb-dark)]">Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your phone number"
                          {...field}
                          className="border-gray-300 focus:border-[var(--airbnb-primary)] focus:ring-[var(--airbnb-primary)]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* State and City Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--airbnb-dark)]">State</FormLabel>
                        <Select onValueChange={handleStateChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-[var(--airbnb-primary)] focus:ring-[var(--airbnb-primary)]">
                              <SelectValue placeholder="Select your state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.keys(statesAndCities).map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--airbnb-dark)]">City</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-[var(--airbnb-primary)] focus:ring-[var(--airbnb-primary)]">
                              <SelectValue placeholder={selectedState ? "Select your city" : "Select state first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedState && statesAndCities[selectedState as keyof typeof statesAndCities]?.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Booking Website Field */}
                <FormField
                  control={form.control}
                  name="bookingWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--airbnb-dark)]">Booking Website URL *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://your-booking-website.com"
                          {...field}
                          className="border-gray-300 focus:border-[var(--airbnb-primary)] focus:ring-[var(--airbnb-primary)]"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500 mt-1">
                        This is where customers will use their coupon codes. Required for WhatsApp messaging.
                      </p>
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-[var(--airbnb-gray)] text-sm">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[var(--airbnb-primary)] hover:underline font-semibold"
                >
                  Sign in here
                </Link>
              </p>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 mb-2 font-semibold">Note:</p>
              <p className="text-xs text-blue-600">
                Your account will be pending approval after registration. Once approved by an admin, you'll be able to access all features.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-dark)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
      </div>
    </Layout>
  );
}