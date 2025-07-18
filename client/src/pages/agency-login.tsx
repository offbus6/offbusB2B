import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plane, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";

const agencyLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type AgencyLoginData = z.infer<typeof agencyLoginSchema>;

export default function AgencyLogin() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<AgencyLoginData>({
    resolver: zodResolver(agencyLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: AgencyLoginData) => {
      const response = await apiRequest("POST", "/api/auth/agency/login", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful!",
        description: "Welcome to your agency dashboard.",
      });
      
      // Clear cache and refresh auth state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Navigate to root which will redirect to correct dashboard
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: "Invalid agency credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AgencyLoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <Layout variant="auth">
      <div className="bg-gradient-to-br from-[var(--airbnb-light)] to-white flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          <Card className="airbnb-shadow border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-[var(--airbnb-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-[var(--airbnb-primary)]" />
              </div>
              <CardTitle className="text-2xl font-bold text-[var(--airbnb-dark)]">
                Travel Agency Login
              </CardTitle>
              <CardDescription className="text-[var(--airbnb-gray)]">
                Access your travel agency dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--airbnb-dark)]">Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your username"
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
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--airbnb-dark)]">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            {...field}
                            className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      <>
                        <Plane className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-[var(--airbnb-gray)]">
                  Don't have an account?{" "}
                  <Button 
                    variant="link" 
                    className="text-[var(--airbnb-primary)] hover:text-[var(--airbnb-primary)]/80 p-0"
                    onClick={() => navigate("/signup")}
                  >
                    Sign up here
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-primary)] hover:bg-[var(--airbnb-light)]"
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