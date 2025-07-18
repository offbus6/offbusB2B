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
import { Shield, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginData = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: AdminLoginData) => {
      const response = await apiRequest("POST", "/api/auth/admin/login", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful!",
        description: "Welcome to the admin dashboard.",
      });
      
      // Clear cache and refresh auth state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Navigate to root which will redirect to correct dashboard
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: "Invalid admin credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminLoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <Layout variant="auth">
      <div className="bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          <Card className="airbnb-shadow border-0 bg-white/90 backdrop-blur-sm border-red-200">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-800">
                Admin Access
              </CardTitle>
              <CardDescription className="text-red-600">
                Secure administrative login portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-red-700">Admin Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter admin email"
                            {...field}
                            className="border-red-200 focus:border-red-400"
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
                        <FormLabel className="text-red-700">Admin Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter admin password"
                            {...field}
                            className="border-red-200 focus:border-red-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Authenticating...
                      </div>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Login
                      </>
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Need to create an admin account?{" "}
                  <Button 
                    variant="link" 
                    onClick={() => navigate("/admin-signup")}
                    className="text-red-600 hover:text-red-700 p-0 h-auto"
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
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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