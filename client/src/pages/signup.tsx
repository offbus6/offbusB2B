import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, ArrowLeft } from "lucide-react";
import Layout from "@/components/layout/layout";

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  agencyName: z.string().min(1, "Agency name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  city: z.string().min(1, "City is required"),
});

type SignupData = z.infer<typeof signupSchema>;

export default function Signup() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      agencyName: "",
      phone: "",
      city: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      return await apiRequest("/api/auth/signup", "POST", data);
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--airbnb-dark)]">Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Choose a username"
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="border-gray-300 focus:border-[var(--airbnb-primary)] focus:ring-[var(--airbnb-primary)]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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