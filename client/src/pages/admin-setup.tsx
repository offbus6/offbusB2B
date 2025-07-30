
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";
import Layout from "@/components/layout/layout";

const adminSetupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AdminSetupData = z.infer<typeof adminSetupSchema>;

export default function AdminSetup() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const form = useForm<AdminSetupData>({
    resolver: zodResolver(adminSetupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: AdminSetupData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/admin/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Admin account created successfully. You can now log in.",
        });
        setIsComplete(true);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create admin account",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Setup error:", error);
      toast({
        title: "Error",
        description: "Failed to create admin account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <Layout variant="auth">
        <div className="bg-gradient-to-br from-[var(--airbnb-light)] to-white flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            <Card className="airbnb-shadow border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-[var(--airbnb-dark)]">
                  Setup Complete!
                </CardTitle>
                <CardDescription className="text-[var(--airbnb-gray)]">
                  Your admin account has been created successfully.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => window.location.href = "/admin-login"}
                  className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90"
                >
                  Go to Admin Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="auth">
      <div className="bg-gradient-to-br from-[var(--airbnb-light)] to-white flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          <Card className="airbnb-shadow border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-[var(--airbnb-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[var(--airbnb-primary)]" />
              </div>
              <CardTitle className="text-2xl font-bold text-[var(--airbnb-dark)]">
                Admin Setup
              </CardTitle>
              <CardDescription className="text-[var(--airbnb-gray)]">
                Create the first admin account for OffBus
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
                        <FormLabel className="text-[var(--airbnb-dark)]">Admin Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@offbus.com"
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
                            placeholder="Enter a secure password"
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
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--airbnb-dark)]">Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm your password"
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
                    className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Admin Account"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
