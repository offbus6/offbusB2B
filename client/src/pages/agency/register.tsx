import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAgencySchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";

const agencyFormSchema = insertAgencySchema.omit({ userId: true });

export default function AgencyRegister() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const form = useForm<z.infer<typeof agencyFormSchema>>({
    resolver: zodResolver(agencyFormSchema),
    defaultValues: {
      name: "",
      email: user?.email || "",
      contactPerson: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      phone: "",
      city: "",
      status: "pending",
    },
  });

  const createAgencyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof agencyFormSchema>) => {
      await apiRequest("POST", "/api/agencies", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Agency registration submitted successfully! Please wait for admin approval.",
      });
      // Refresh the page to trigger user data refetch
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to register agency. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof agencyFormSchema>) => {
    createAgencyMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--airbnb-light)] to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md airbnb-shadow">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[var(--airbnb-dark)]">
            Register Your Travel Agency
          </CardTitle>
          <p className="text-[var(--airbnb-gray)]">
            Fill out the form below to register your travel agency
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency Name</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Travel Agency" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@agency.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
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
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90"
                disabled={createAgencyMutation.isPending}
              >
                {createAgencyMutation.isPending ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}