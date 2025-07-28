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
import { Plane, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";

const agencySignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  agencyName: z.string().min(1, "Agency name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  bookingWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type AgencySignupData = z.infer<typeof agencySignupSchema>;

export default function AgencySignup() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<AgencySignupData>({
    resolver: zodResolver(agencySignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      agencyName: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      password: "",
      logoUrl: "",
      website: "",
      bookingWebsite: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: AgencySignupData) => {
      return await apiRequest("/api/auth/signup", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful!",
        description: "Your agency registration has been submitted. Please wait for admin approval.",
      });
      navigate("/agency-login");
    },
    onError: (error: any) => {
      console.error("Signup error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register agency. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AgencySignupData) => {
    signupMutation.mutate(data);
  };

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
    "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
  ];

  return (
    <Layout variant="auth">
      <div className="bg-gradient-to-br from-[var(--airbnb-light)] to-white flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-2xl">
          <Card className="airbnb-shadow border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-[var(--airbnb-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-[var(--airbnb-primary)]" />
              </div>
              <CardTitle className="text-2xl font-bold text-[var(--airbnb-dark)]">
                Travel Agency Registration
              </CardTitle>
              <CardDescription className="text-[var(--airbnb-gray)]">
                Register your travel agency to get started
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
                              className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
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
                              className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                            className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                            />
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
                              className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--airbnb-dark)]">City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your city"
                              {...field}
                              className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--airbnb-dark)]">State</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {indianStates.map((state) => (
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
                  </div>

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--airbnb-dark)]">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Create a strong password"
                            {...field}
                            className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-[var(--airbnb-dark)]">Optional Information</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[var(--airbnb-dark)]">Website URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://yourwebsite.com"
                                {...field}
                                className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bookingWebsite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[var(--airbnb-dark)]">Booking Website URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://booking.yourwebsite.com"
                                {...field}
                                className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[var(--airbnb-dark)]">Logo URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://yourwebsite.com/logo.png"
                                {...field}
                                className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/agency-login")}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90"
                      disabled={signupMutation.isPending}
                    >
                      {signupMutation.isPending ? "Registering..." : "Register Agency"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}