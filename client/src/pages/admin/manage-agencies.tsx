import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Search, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Plus
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import { Link } from "wouter";

const addAgencySchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  agencyName: z.string().min(1, "Agency name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  logoUrl: z.string().optional().or(z.literal("")).refine(
    (val) => !val || val === "" || /^https?:\/\//.test(val) || /^data:image\//.test(val),
    "Invalid logo URL format"
  ),
  website: z.string().optional().or(z.literal("")).refine(
    (val) => !val || val === "" || /^https?:\/\//.test(val),
    "Invalid website URL format"
  ),
  bookingWebsite: z.string().optional().or(z.literal("")).refine(
    (val) => !val || val === "" || /^https?:\/\//.test(val),
    "Invalid booking website URL format"
  ),
});

type AddAgencyData = z.infer<typeof addAgencySchema>;

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
];

export default function ManageAgencies() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ["/api/admin/agencies"],
    retry: false,
  });

  // Use only real database data - no static fallbacks
  const actualAgencies = agencies || [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      console.log(`Updating agency ${id} status to ${status}`);
      return await apiRequest(`/api/admin/agencies/${id}/status`, {
        method: "PATCH",
        body: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agencies"] });
      toast({
        title: "Success",
        description: "Agency status updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update agency status",
        variant: "destructive",
      });
    },
  });

  const deleteAgencyMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`Deleting agency ${id}`);
      return await apiRequest(`/api/admin/agencies/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agencies"] });
      toast({
        title: "Success",
        description: "Agency deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete agency",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--airbnb-pink)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Filter agencies based on search term and status
  const filteredAgencies = actualAgencies?.filter((agency: any) => {
    const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || agency.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusCount = (status: string) => {
    if (status === "all") return actualAgencies?.length || 0;
    return actualAgencies?.filter((agency: any) => agency.status === status).length || 0;
  };

  const form = useForm<AddAgencyData>({
    resolver: zodResolver(addAgencySchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      agencyName: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      logoUrl: "",
      website: "",
      bookingWebsite: "",
    },
  });

  const addAgencyMutation = useMutation({
    mutationFn: async (data: AddAgencyData) => {
      return await apiRequest("/api/admin/agencies", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agencies"] });
      toast({
        title: "Success",
        description: "Agency created successfully and approved",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create agency",
        variant: "destructive",
      });
    },
  });

  const AddAgencyDialog = ({ onClose }: { onClose: () => void }) => (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-[var(--airbnb-dark)]">Add New Travel Agency</DialogTitle>
        <DialogDescription>
          Create a new travel agency. The agency will be automatically approved.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => addAgencyMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--airbnb-dark)]">First Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter first name"
                      {...field}
                      className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                      data-testid="input-first-name"
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
                      placeholder="Enter last name"
                      {...field}
                      className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                      data-testid="input-last-name"
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
                    placeholder="Enter agency name"
                    {...field}
                    className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                    data-testid="input-agency-name"
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
                      placeholder="Enter email"
                      {...field}
                      className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                      data-testid="input-email"
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
                      placeholder="Enter phone number"
                      {...field}
                      className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                      data-testid="input-phone"
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
                      placeholder="Enter city"
                      {...field}
                      className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]"
                      data-testid="input-city"
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
                      <SelectTrigger className="border-[var(--airbnb-border)] focus:border-[var(--airbnb-primary)]" data-testid="select-state">
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
                        data-testid="input-website"
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
                        data-testid="input-booking-website"
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
                        data-testid="input-logo-url"
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
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90"
              disabled={addAgencyMutation.isPending}
              data-testid="button-create-agency"
            >
              {addAgencyMutation.isPending ? "Creating..." : "Create Agency"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--airbnb-dark)]">Manage Agencies</h1>
          <p className="text-[var(--airbnb-gray)] mt-1">
            View and manage all registered travel agencies
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--airbnb-gray)] w-4 h-4" />
            <Input
              placeholder="Search agencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--airbnb-pink)] hover:bg-[var(--airbnb-pink)]/90 text-white" data-testid="button-add-agency">
                <Plus className="w-4 h-4 mr-2" />
                Add Agency
              </Button>
            </DialogTrigger>
            <AddAgencyDialog onClose={() => setIsAddDialogOpen(false)} />
          </Dialog>
        </div>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({getStatusCount("all")})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({getStatusCount("approved")})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({getStatusCount("pending")})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({getStatusCount("rejected")})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="space-y-4">
          {agenciesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--airbnb-pink)]"></div>
            </div>
          ) : filteredAgencies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Building2 className="w-12 h-12 text-[var(--airbnb-gray)] mb-4" />
                <h3 className="text-lg font-semibold text-[var(--airbnb-dark)] mb-2">
                  No agencies found
                </h3>
                <p className="text-[var(--airbnb-gray)] text-center">
                  {searchTerm ? "No agencies match your search criteria." : "No agencies have been registered yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAgencies.map((agency: any) => (
                <Card key={agency.id} className="border-[var(--airbnb-light-gray)] hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="bg-[var(--airbnb-pink)] text-white p-2 rounded-lg">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-[var(--airbnb-dark)]">{agency.name}</CardTitle>
                          <p className="text-[var(--airbnb-gray)] text-sm">ID: {agency.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(agency.status)}
                        <Link href={`/admin/agencies/${agency.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-dark)]"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteAgencyMutation.mutate(agency.id)}
                          disabled={deleteAgencyMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[var(--airbnb-gray)]" />
                        <span className="text-sm text-[var(--airbnb-gray)]">{agency.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[var(--airbnb-gray)]" />
                        <span className="text-sm text-[var(--airbnb-gray)]">{agency.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[var(--airbnb-gray)]" />
                        <span className="text-sm text-[var(--airbnb-gray)]">{agency.city}, {agency.state}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[var(--airbnb-gray)]" />
                        <span className="text-sm text-[var(--airbnb-gray)]">{agency.website || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--airbnb-gray)]" />
                        <span className="text-sm text-[var(--airbnb-gray)]">
                          {new Date(agency.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {agency.status === "pending" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--airbnb-light-gray)]">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => updateStatusMutation.mutate({ id: agency.id, status: "approved" })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatusMutation.mutate({ id: agency.id, status: "rejected" })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}