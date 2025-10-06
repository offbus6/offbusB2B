import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar,
  Save,
  ArrowLeft,
  Upload,
  IndianRupee,
  Bus,
  User,
  CreditCard,
  Plus,
  Receipt,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Ticket,
  MessageCircle,
  Route
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation, useRoute } from "wouter";
import { insertApiConfigurationSchema, type ApiConfiguration } from "@shared/schema";

interface AgencyDetails {
  id: number;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  state: string;
  city: string;
  website: string;
  logoUrl: string;
  renewalChargePerBus: number;
  status: string;
  createdAt: string;
  totalBuses: number;
  totalRenewalCharge: number;
}

export default function AgencyDetails() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, params] = useRoute("/admin/agencies/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const agencyId = params?.id ? parseInt(params.id) : null;

  const [formData, setFormData] = useState<Partial<AgencyDetails>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [taxConfigOpen, setTaxConfigOpen] = useState(false);
  const [newBillPeriod, setNewBillPeriod] = useState("");
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Bus management states
  const [addBusDialogOpen, setAddBusDialogOpen] = useState(false);
  const [editBusDialogOpen, setEditBusDialogOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  
  // API Configuration states
  const [apiConfigDialogOpen, setApiConfigDialogOpen] = useState(false);
  const [editingApiConfig, setEditingApiConfig] = useState<ApiConfiguration | null>(null);

  // API Configuration form schema
  const apiConfigFormSchema = insertApiConfigurationSchema.extend({
    headers: z.string().optional(),
    payloadTemplate: z.string().optional(),
    responseStructure: z.string().optional(),
  }).omit({ agencyId: true });

  // Bus form schema
  const busFormSchema = z.object({
    number: z.string().min(1, "Bus number is required"),
    name: z.string().min(1, "Bus name is required"),
    fromLocation: z.string().min(1, "From location is required"),
    toLocation: z.string().min(1, "To location is required"),
    departureTime: z.string().min(1, "Departure time is required"),
    arrivalTime: z.string().min(1, "Arrival time is required"),
    busType: z.enum(["Seater", "Sleeper", "AC Seater", "AC Sleeper", "Seater and Sleeper"]),
    capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
    fare: z.string().min(1, "Fare is required"),
    amenities: z.string().optional(),
    imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
    isActive: z.boolean().default(true),
    availabilityStatus: z.enum(["available", "not_available"]).default("available"),
    unavailableUntil: z.string().optional(),
  });

  type BusFormValues = z.infer<typeof busFormSchema>;

  const addBusForm = useForm<BusFormValues>({
    resolver: zodResolver(busFormSchema),
    defaultValues: {
      number: "",
      name: "",
      fromLocation: "",
      toLocation: "",
      departureTime: "",
      arrivalTime: "",
      busType: "Seater",
      capacity: 1,
      fare: "",
      amenities: "",
      imageUrl: "",
      isActive: true,
      availabilityStatus: "available",
      unavailableUntil: "",
    },
  });

  const editBusForm = useForm<BusFormValues>({
    resolver: zodResolver(busFormSchema),
    defaultValues: {
      number: "",
      name: "",
      fromLocation: "",
      toLocation: "",
      departureTime: "",
      arrivalTime: "",
      busType: "Seater",
      capacity: 1,
      fare: "",
      amenities: "",
      imageUrl: "",
      isActive: true,
      availabilityStatus: "available",
      unavailableUntil: "",
    },
  });

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

  const { data: agency, isLoading: agencyLoading } = useQuery({
    queryKey: [`/api/admin/agencies/${agencyId}`],
    enabled: !!agencyId,
    retry: false,
  });

  const { data: paymentHistory, isLoading: paymentsLoading } = useQuery({
    queryKey: [`/api/admin/agencies/${agencyId}/payments`],
    enabled: !!agencyId,
    retry: false,
  });

  const { data: busDetails, isLoading: busesLoading } = useQuery({
    queryKey: [`/api/admin/agencies/${agencyId}/buses`],
    enabled: !!agencyId,
    retry: false,
  });

  const { data: userDetails, isLoading: usersLoading } = useQuery({
    queryKey: [`/api/admin/agencies/${agencyId}/users`],
    enabled: !!agencyId,
    retry: false,
  });

  const { data: agencyStats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/admin/agencies/${agencyId}/stats`],
    enabled: !!agencyId,
    retry: false,
  });

  const { data: taxConfig } = useQuery({
    queryKey: ["/api/admin/tax-config"],
    retry: false,
  });

  useEffect(() => {
    if (agency) {
      setFormData(agency);
      setLogoPreview(agency.logoUrl || "");
      setHasUnsavedChanges(false);
    }
  }, [agency]);

  useEffect(() => {
    if (taxConfig && typeof taxConfig === 'object' && 'percentage' in taxConfig) {
      setTaxPercentage((taxConfig as any).percentage || 18);
    }
  }, [taxConfig]);

  const updateAgencyMutation = useMutation({
    mutationFn: async (updates: Partial<AgencyDetails>) => {
      return await apiRequest(`/api/admin/agencies/${agencyId}/details`, {
        method: "PATCH",
        body: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agencies/${agencyId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agencies"] });
      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Agency updated successfully",
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
        description: "Failed to update agency",
        variant: "destructive",
      });
    },
  });

  const generateBillMutation = useMutation({
    mutationFn: async (period: string) => {
      return await apiRequest(`/api/admin/agencies/${agencyId}/generate-bill`, {
        method: "POST",
        body: { period },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agencies/${agencyId}/payments`] });
      setBillDialogOpen(false);
      setNewBillPeriod("");
      toast({
        title: "Success",
        description: "Bill generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate bill",
        variant: "destructive",
      });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, status, paymentMethod, notes }: any) => {
      return await apiRequest(`/api/admin/payments/${id}/status`, {
        method: "PATCH",
        body: { status, paymentMethod, notes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agencies/${agencyId}/payments`] });
      setPaymentDialogOpen(false);
      setSelectedPayment(null);
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    },
  });

  const updateTaxMutation = useMutation({
    mutationFn: async (percentage: number) => {
      return await apiRequest("/api/admin/tax-config", {
        method: "PATCH",
        body: { percentage },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tax-config"] });
      setTaxConfigOpen(false);
      toast({
        title: "Success",
        description: "Tax configuration updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tax configuration",
        variant: "destructive",
      });
    },
  });

  const addTestBusesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/agencies/${agencyId}/add-test-buses`, {
        method: "POST",
        body: { count: 3 },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agencies/${agencyId}`] });
      toast({
        title: "Success",
        description: "Test buses added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add test buses",
        variant: "destructive",
      });
    },
  });

  const addBusMutation = useMutation({
    mutationFn: async (data: z.infer<typeof busFormSchema>) => {
      const payload = {
        ...data,
        agencyId: parseInt(agencyId!.toString()),
        amenities: data.amenities ? data.amenities.split(",").map(item => item.trim()).filter(Boolean) : [],
        unavailableUntil: data.unavailableUntil && data.unavailableUntil.trim() ? new Date(data.unavailableUntil).toISOString() : null,
      };
      return await apiRequest(`/api/admin/agencies/${agencyId}/buses`, {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agencies/${agencyId}/buses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agencies/${agencyId}`] });
      setAddBusDialogOpen(false);
      addBusForm.reset();
      toast({
        title: "Success",
        description: "Bus added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add bus",
        variant: "destructive",
      });
    },
  });

  const updateBusMutation = useMutation({
    mutationFn: async ({ busId, data }: { busId: number; data: z.infer<typeof busFormSchema> }) => {
      const payload = {
        ...data,
        amenities: data.amenities ? data.amenities.split(",").map(item => item.trim()).filter(Boolean) : [],
        unavailableUntil: data.unavailableUntil && data.unavailableUntil.trim() ? new Date(data.unavailableUntil).toISOString() : null,
      };
      return await apiRequest(`/api/admin/agencies/${agencyId}/buses/${busId}`, {
        method: "PATCH",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agencies/${agencyId}/buses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agencies/${agencyId}`] });
      setEditBusDialogOpen(false);
      setSelectedBus(null);
      editBusForm.reset();
      toast({
        title: "Success",
        description: "Bus updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bus",
        variant: "destructive",
      });
    },
  });

  // API Configuration queries and mutations
  const apiConfigsQuery = useQuery({
    queryKey: [`/api/admin/agencies/${agencyId}/api-configs`],
    enabled: !!agencyId,
  });

  const apiConfigForm = useForm<z.infer<typeof apiConfigFormSchema>>({
    resolver: zodResolver(apiConfigFormSchema),
    defaultValues: {
      apiType: "",
      name: "",
      baseUrl: "",
      headers: "",
      payloadTemplate: "",
      responseStructure: "",
      dataExtractionPath: "",
      isActive: true,
    },
  });

  const createApiConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof apiConfigFormSchema>) => {
      // Safely parse JSON fields with proper error handling
      let headers = null;
      let payloadTemplate = null;
      let responseStructure = null;
      
      try {
        headers = data.headers ? JSON.parse(data.headers) : null;
      } catch (e) {
        throw new Error("Invalid JSON in Headers Configuration");
      }
      
      try {
        payloadTemplate = data.payloadTemplate ? JSON.parse(data.payloadTemplate) : null;
      } catch (e) {
        throw new Error("Invalid JSON in Payload Template");
      }
      
      try {
        responseStructure = data.responseStructure ? JSON.parse(data.responseStructure) : null;
      } catch (e) {
        throw new Error("Invalid JSON in Response Structure");
      }

      const payload = {
        ...data,
        headers,
        payloadTemplate,
        responseStructure,
      };
      
      return await apiRequest(`/api/admin/agencies/${agencyId}/api-configs`, {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agencies/${agencyId}/api-configs`] });
      setApiConfigDialogOpen(false);
      setEditingApiConfig(null);
      apiConfigForm.reset();
      toast({
        title: "Success",
        description: "API configuration created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create API configuration",
        variant: "destructive",
      });
    },
  });

  const updateApiConfigMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof apiConfigFormSchema> }) => {
      // Safely parse JSON fields with proper error handling
      let headers = null;
      let payloadTemplate = null;
      let responseStructure = null;
      
      try {
        headers = data.headers ? JSON.parse(data.headers) : null;
      } catch (e) {
        throw new Error("Invalid JSON in Headers Configuration");
      }
      
      try {
        payloadTemplate = data.payloadTemplate ? JSON.parse(data.payloadTemplate) : null;
      } catch (e) {
        throw new Error("Invalid JSON in Payload Template");
      }
      
      try {
        responseStructure = data.responseStructure ? JSON.parse(data.responseStructure) : null;
      } catch (e) {
        throw new Error("Invalid JSON in Response Structure");
      }

      const payload = {
        ...data,
        headers,
        payloadTemplate,
        responseStructure,
      };
      
      return await apiRequest(`/api/admin/agencies/${agencyId}/api-configs/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agencies/${agencyId}/api-configs`] });
      setApiConfigDialogOpen(false);
      setEditingApiConfig(null);
      apiConfigForm.reset();
      toast({
        title: "Success",
        description: "API configuration updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update API configuration",
        variant: "destructive",
      });
    },
  });

  const deleteApiConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/agencies/${agencyId}/api-configs/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agencies/${agencyId}/api-configs`] });
      toast({
        title: "Success",
        description: "API configuration deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API configuration",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, logoUrl: result }));
        setHasUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!hasUnsavedChanges) return;

    const updates = { ...formData };
    // Remove computed and non-updatable fields
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.totalBuses;
    delete updates.totalRenewalCharge;

    // Ensure numeric fields are properly typed
    if (updates.renewalChargePerBus) {
      updates.renewalChargePerBus = Number(updates.renewalChargePerBus);
    }

    updateAgencyMutation.mutate(updates);
  }, [hasUnsavedChanges, formData, updateAgencyMutation]);

  const getStatusBadge = useMemo(() => (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case "on_hold":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">On Hold</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }, []);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
            <Clock className="w-3 h-3 mr-1" />
            Partial
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getWhatsappStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleMarkAsPaid = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentDialogOpen(true);
  };

  const handleUpdatePayment = (status: string, paymentMethod: string, notes: string) => {
    if (selectedPayment) {
      updatePaymentMutation.mutate({
        id: selectedPayment.id,
        status,
        paymentMethod,
        notes,
      });
    }
  };

  const handleGenerateBill = () => {
    if (newBillPeriod.trim()) {
      generateBillMutation.mutate(newBillPeriod.trim());
    }
  };

  const calculateTaxAmount = (subtotal: number, taxPercentage: number) => {
    return Math.round((subtotal * taxPercentage) / 100);
  };

  // Bus form handlers
  const handleAddBus: SubmitHandler<BusFormValues> = (data) => {
    addBusMutation.mutate(data);
  };

  const handleEditBus: SubmitHandler<BusFormValues> = (data) => {
    if (selectedBus) {
      updateBusMutation.mutate({ busId: selectedBus.id, data });
    }
  };

  const handleEditBusClick = (bus: any) => {
    setSelectedBus(bus);
    editBusForm.reset({
      number: bus.number || "",
      name: bus.name || "",
      fromLocation: bus.fromLocation || "",
      toLocation: bus.toLocation || "",
      departureTime: bus.departureTime || "",
      arrivalTime: bus.arrivalTime || "",
      busType: bus.busType || "Seater",
      capacity: Number(bus.capacity) || 1,
      fare: bus.fare || "",
      amenities: bus.amenities ? bus.amenities.join(", ") : "",
      imageUrl: bus.imageUrl || "",
      isActive: bus.isActive ?? true,
      availabilityStatus: bus.availabilityStatus || "available",
      unavailableUntil: bus.unavailableUntil ? new Date(bus.unavailableUntil).toISOString().slice(0, 16) : "",
    });
    setEditBusDialogOpen(true);
  };

  // Memoize calculation-heavy operations
  const billingCalculation = useMemo(() => {
    const agencyData = agency as any || {};
    const totalBuses = agencyStats?.totalBuses || agencyData.totalBuses || 0;
    const ratePerBus = formData.renewalChargePerBus || 5000;
    const subtotal = totalBuses * ratePerBus;
    const taxAmount = Math.round((subtotal * taxPercentage) / 100);
    const total = subtotal + taxAmount;
    
    return { totalBuses, ratePerBus, subtotal, taxAmount, total };
  }, [agency, agencyStats, formData.renewalChargePerBus, taxPercentage]);

  if (isLoading || agencyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
      </div>
    );
  }

  if (!isAuthenticated || !agency) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/admin/manage-agencies")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Agencies
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--airbnb-dark)]">{formData.name || 'Travel Agency'}</h1>
            <p className="text-[var(--airbnb-gray)] mt-1">
              Manage agency information, buses, users and billing
            </p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={updateAgencyMutation.isPending || !hasUnsavedChanges}
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.white,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
            opacity: hasUnsavedChanges ? 1 : 0.6,
            fontWeight: '500',
            fontSize: '14px',
            transition: 'all 0.2s ease-in-out',
            boxShadow: hasUnsavedChanges ? theme.shadows.sm : 'none'
          }}
          onMouseEnter={(e) => {
            if (hasUnsavedChanges) {
              e.currentTarget.style.backgroundColor = theme.colors.primaryHover;
              e.currentTarget.style.boxShadow = theme.shadows.md;
            }
          }}
          onMouseLeave={(e) => {
            if (hasUnsavedChanges) {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
              e.currentTarget.style.boxShadow = theme.shadows.sm;
            }
          }}
        >
          {updateAgencyMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--airbnb-gray)]">Total Users</p>
                <p className="text-2xl font-bold text-[var(--airbnb-dark)]">
                  {agencyStats?.totalUsers || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--airbnb-gray)]">Total Coupons</p>
                <p className="text-2xl font-bold text-[var(--airbnb-dark)]">
                  {agencyStats?.totalCoupons || 0}
                </p>
              </div>
              <Ticket className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--airbnb-gray)]">Coupons Used</p>
                <p className="text-2xl font-bold text-[var(--airbnb-dark)]">
                  {agencyStats?.couponsUsed || 0}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--airbnb-gray)]">Messages Sent</p>
                <p className="text-2xl font-bold text-[var(--airbnb-dark)]">
                  {agencyStats?.messagesSent || 0}
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="details">Agency Details</TabsTrigger>
          <TabsTrigger value="buses">Bus Details</TabsTrigger>
          <TabsTrigger value="users">User Details</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="api-config">API Configuration</TabsTrigger>
          <TabsTrigger value="saas-providers">SAAS Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Agency Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson || ""}
                    onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city || ""}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state || ""}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website || ""}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Logo Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Label htmlFor="logo">Upload New Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="mt-1"
                  />
                  <p className="text-sm text-[var(--airbnb-gray)] mt-1">
                    Recommended: 200x200px, PNG or JPG
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Status Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Agency Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--airbnb-gray)]">Status</span>
                {getStatusBadge(formData.status || "")}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--airbnb-gray)]">Total Buses</span>
                <div className="flex items-center gap-1">
                  <Bus className="w-4 h-4" />
                  <span className="font-semibold">{(agency as any)?.totalBuses || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--airbnb-gray)]">Member Since</span>
                <span className="font-semibold">
                  {new Date(formData.createdAt || "").toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Billing Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Billing Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="renewalChargePerBus">Charge Per Bus (Monthly)</Label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-[var(--airbnb-gray)]" />
                  <Input
                    id="renewalChargePerBus"
                    type="number"
                    value={formData.renewalChargePerBus || 5000}
                    onChange={(e) => handleInputChange("renewalChargePerBus", parseInt(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tax Configuration */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4" />
                  <Label className="text-base font-medium">Tax Configuration</Label>
                </div>
                <div>
                  <Label>GST Tax Rate (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(parseInt(e.target.value) || 0)}
                      min="0"
                      max="100"
                      className="w-24"
                    />
                    <Button
                      onClick={() => updateTaxMutation.mutate(taxPercentage)}
                      disabled={updateTaxMutation.isPending}
                      size="sm"
                    >
                      Update
                    </Button>
                  </div>
                  <p className="text-sm text-[var(--airbnb-gray)] mt-1">
                    This tax rate will be applied to all new bills
                  </p>
                </div>
              </div>

              {/* Billing Calculator */}
              <div className="bg-[var(--airbnb-light)] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Monthly Billing Calculator</span>
                  {((agency as any)?.totalBuses || 0) === 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addTestBusesMutation.mutate()}
                      disabled={addTestBusesMutation.isPending}
                      className="text-xs"
                    >
                      {addTestBusesMutation.isPending ? "Adding..." : "Add Test Buses"}
                    </Button>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Buses:</span>
                    <span>{billingCalculation.totalBuses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate per Bus:</span>
                    <span>₹{billingCalculation.ratePerBus.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{billingCalculation.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({taxPercentage}%):</span>
                    <span>₹{billingCalculation.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold text-base">
                    <span>Total Payable:</span>
                    <span>₹{billingCalculation.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--airbnb-gray)]" />
                <span className="text-sm">{formData.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--airbnb-gray)]" />
                <span className="text-sm">{formData.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--airbnb-gray)]" />
                <span className="text-sm">{formData.city}, {formData.state}</span>
              </div>
              {formData.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[var(--airbnb-gray)]" />
                  <a 
                    href={formData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--airbnb-pink)] hover:underline"
                  >
                    {formData.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="buses" className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[var(--airbnb-dark)]">Bus Details</h2>
              <Dialog open={addBusDialogOpen} onOpenChange={setAddBusDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-[var(--airbnb-pink)] hover:bg-[var(--airbnb-pink-dark)] text-white"
                    data-testid="button-add-bus"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Bus
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                {busesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--airbnb-pink)]"></div>
                  </div>
                ) : !busDetails || !Array.isArray(busDetails) || busDetails.length === 0 ? (
                  <div className="text-center py-8">
                    <Bus className="w-12 h-12 text-[var(--airbnb-gray)] mx-auto mb-4" />
                    <p className="text-[var(--airbnb-gray)]">No buses found for this agency</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bus Number</TableHead>
                        <TableHead>Bus Name</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead>Arrival</TableHead>
                        <TableHead>Bus Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Fare</TableHead>
                        <TableHead>Amenities</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(busDetails as any[])?.map((bus: any) => (
                        <TableRow key={bus.id}>
                          <TableCell className="font-medium">{bus.number}</TableCell>
                          <TableCell>{bus.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Route className="w-4 h-4" />
                              {bus.fromLocation} → {bus.toLocation}
                            </div>
                          </TableCell>
                          <TableCell>{bus.departureTime}</TableCell>
                          <TableCell>{bus.arrivalTime}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{bus.busType}</Badge>
                          </TableCell>
                          <TableCell>{bus.capacity} seats</TableCell>
                          <TableCell>₹{bus.fare}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {bus.amenities && bus.amenities.length > 0 ? (
                                bus.amenities.map((amenity: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {amenity}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-gray-500">No amenities</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={bus.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {bus.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <div>
                                <Badge 
                                  className={
                                    bus.availabilityStatus === "available" || !bus.availabilityStatus 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-orange-100 text-orange-800"
                                  }
                                >
                                  {bus.availabilityStatus === "not_available" 
                                    ? `Unavailable${bus.unavailableUntil ? ` until ${new Date(bus.unavailableUntil).toLocaleDateString()}` : ""}`
                                    : "Available"
                                  }
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditBusClick(bus)}
                              className="text-xs"
                              data-testid={`button-edit-bus-${bus.id}`}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--airbnb-dark)] mb-4">User Details & Follow-up Schedule</h2>
            <Card>
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--airbnb-pink)]"></div>
                  </div>
                ) : !userDetails || !Array.isArray(userDetails) || userDetails.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-[var(--airbnb-gray)] mx-auto mb-4" />
                    <p className="text-[var(--airbnb-gray)]">No user data found for this agency</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Traveler Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Travel Date</TableHead>
                        <TableHead>Coupon Code</TableHead>
                        <TableHead>WhatsApp Status</TableHead>
                        <TableHead>1st Message</TableHead>
                        <TableHead>30-Day Follow-up</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(userDetails as any[])?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.travelerName}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Route className="w-4 h-4" />
                              {user.busName}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(user.travelDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {user.couponCode}
                            </span>
                          </TableCell>
                          <TableCell>{getWhatsappStatusBadge(user.whatsappStatus)}</TableCell>
                          <TableCell>
                            {user.firstMessageSent ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Sent
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.followUpSent ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Sent
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Scheduled
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-[var(--airbnb-dark)]">Payment History</h2>
              <p className="text-[var(--airbnb-gray)]">Track all payments and billing records</p>
            </div>
            <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[var(--airbnb-pink)] hover:bg-[var(--airbnb-pink-dark)] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Bill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New Bill</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="billingPeriod">Billing Period</Label>
                    <Input
                      id="billingPeriod"
                      placeholder="e.g., January 2025"
                      value={newBillPeriod}
                      onChange={(e) => setNewBillPeriod(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setBillDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleGenerateBill}
                      disabled={generateBillMutation.isPending || !newBillPeriod.trim()}
                    >
                      {generateBillMutation.isPending ? "Generating..." : "Generate Bill"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--airbnb-pink)]"></div>
                </div>
              ) : !paymentHistory || !Array.isArray(paymentHistory) || paymentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-[var(--airbnb-gray)] mx-auto mb-4" />
                  <p className="text-[var(--airbnb-gray)]">No payment history found</p>
                </div>
              ) : (
                <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Total Buses</TableHead>
                        <TableHead>Coupons Used</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(paymentHistory as any[])?.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.paymentDate 
                              ? new Date(payment.paymentDate).toLocaleDateString()
                              : new Date(payment.createdAt).toLocaleDateString()
                            }
                          </TableCell>
                          <TableCell>{payment.billingPeriod}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Bus className="w-4 h-4" />
                              {payment.totalBuses}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Ticket className="w-4 h-4" />
                              {payment.couponsUsed || agencyStats?.couponsUsed || 0}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">₹{payment.totalAmount.toLocaleString()}</TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.paymentStatus)}</TableCell>
                          <TableCell>
                            {payment.paymentStatus !== 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsPaid(payment)}
                                className="text-xs"
                              >
                                Mark as Paid
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-config" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-[var(--airbnb-dark)]">API Configuration</h2>
              <p className="text-[var(--airbnb-gray)]">Configure booking software API integrations for this agency</p>
            </div>
            <Dialog open={apiConfigDialogOpen} onOpenChange={setApiConfigDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[var(--airbnb-pink)] hover:bg-[var(--airbnb-pink-dark)] text-white"
                  data-testid="button-add-api-config"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add API Configuration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingApiConfig ? "Edit API Configuration" : "Add New API Configuration"}</DialogTitle>
                </DialogHeader>
                <Form {...apiConfigForm}>
                  <form 
                    onSubmit={apiConfigForm.handleSubmit((data) => {
                      if (editingApiConfig) {
                        updateApiConfigMutation.mutate({ id: editingApiConfig.id, data });
                      } else {
                        createApiConfigMutation.mutate(data);
                      }
                    })}
                    className="space-y-4"
                  >
                    <p className="text-sm text-gray-600">Configure API endpoints for booking software integration</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={apiConfigForm.control}
                        name="apiType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-api-type">
                                  <SelectValue placeholder="Select API type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="get_routes">Get Available Routes</SelectItem>
                                <SelectItem value="book_seat">Book Seat API</SelectItem>
                                <SelectItem value="routes_with_coupon">Routes with Coupon</SelectItem>
                                <SelectItem value="daily_booking_summary">Daily Booking Summary</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={apiConfigForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter API name" 
                                {...field} 
                                data-testid="input-api-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={apiConfigForm.control}
                      name="baseUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://api.example.com" 
                              {...field} 
                              data-testid="input-base-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={apiConfigForm.control}
                      name="headers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Headers Configuration (JSON)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={`{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN",
  "X-API-Key": "your-api-key"
}`}
                              rows={4}
                              {...field}
                              data-testid="textarea-headers"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={apiConfigForm.control}
                      name="payloadTemplate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payload Template (JSON)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={`{
  "source": "{{source}}",
  "destination": "{{destination}}",
  "date": "{{date}}"
}`}
                              rows={4}
                              {...field}
                              data-testid="textarea-payload"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={apiConfigForm.control}
                      name="responseStructure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Response Structure (JSON)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={`{
  "success": true,
  "data": [
    {
      "routeId": "string",
      "departure": "string",
      "arrival": "string"
    }
  ]
}`}
                              rows={4}
                              {...field}
                              data-testid="textarea-response"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={apiConfigForm.control}
                      name="dataExtractionPath"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Extraction Path</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="data.routes (JSONPath to extract data from response)" 
                              {...field} 
                              data-testid="input-extraction-path"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={apiConfigForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-active"
                            />
                          </FormControl>
                          <FormLabel>Active</FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        type="button"
                        onClick={() => {
                          setApiConfigDialogOpen(false);
                          setEditingApiConfig(null);
                          apiConfigForm.reset();
                        }}
                        data-testid="button-cancel-api-config"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-[var(--airbnb-pink)] hover:bg-[var(--airbnb-pink-dark)] text-white"
                        disabled={createApiConfigMutation.isPending || updateApiConfigMutation.isPending}
                        data-testid="button-save-api-config"
                      >
                        {createApiConfigMutation.isPending || updateApiConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                API Configurations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apiConfigsQuery.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--airbnb-pink)] mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading API configurations...</p>
                </div>
              ) : apiConfigsQuery.data && apiConfigsQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {apiConfigsQuery.data.map((config: ApiConfiguration) => (
                    <div 
                      key={config.id} 
                      className="border rounded-lg p-4 space-y-3"
                      data-testid={`card-api-config-${config.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold text-[var(--airbnb-dark)]" data-testid={`text-api-name-${config.id}`}>
                              {config.name}
                            </h3>
                            <p className="text-sm text-gray-600 capitalize" data-testid={`text-api-type-${config.id}`}>
                              {config.apiType.replace('_', ' ')}
                            </p>
                          </div>
                          <Badge 
                            className={config.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                            data-testid={`badge-status-${config.id}`}
                          >
                            {config.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingApiConfig(config);
                              apiConfigForm.reset({
                                apiType: config.apiType,
                                name: config.name,
                                baseUrl: config.baseUrl,
                                headers: config.headers ? JSON.stringify(config.headers, null, 2) : "",
                                payloadTemplate: config.payloadTemplate ? JSON.stringify(config.payloadTemplate, null, 2) : "",
                                responseStructure: config.responseStructure ? JSON.stringify(config.responseStructure, null, 2) : "",
                                dataExtractionPath: config.dataExtractionPath || "",
                                isActive: config.isActive,
                              });
                              setApiConfigDialogOpen(true);
                            }}
                            data-testid={`button-edit-${config.id}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the API configuration "${config.name}"?`)) {
                                deleteApiConfigMutation.mutate(config.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            data-testid={`button-delete-${config.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Base URL:</span> <span data-testid={`text-base-url-${config.id}`}>{config.baseUrl}</span></p>
                        {config.dataExtractionPath && (
                          <p><span className="font-medium">Data Extraction:</span> <span data-testid={`text-extraction-${config.id}`}>{config.dataExtractionPath}</span></p>
                        )}
                        <p className="text-xs text-gray-500">
                          Created: {new Date(config.createdAt).toLocaleDateString()}
                          {config.updatedAt !== config.createdAt && 
                            ` • Updated: ${new Date(config.updatedAt).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No API configurations found</p>
                  <p className="text-sm">Add your first API configuration to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saas-providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">SAAS Provider Integration</CardTitle>
              <p className="text-sm text-gray-600">Configure ITS, Bitla, and other SAAS provider integrations for booking and route management</p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-blue-50">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-blue-900">SAAS Provider Setup</h3>
                    <p className="text-sm text-blue-800">
                      Add your provider credentials (SWDL URL, Company ID, VerifyCall token) below. Then configure individual API endpoints for each provider.
                    </p>
                    <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 mt-2">
                      <li>ITS: Internet Ticketing System integration</li>
                      <li>Bitla: Bus ticketing and route management</li>
                      <li>Custom providers: Add other SAAS providers as needed</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center py-12 text-gray-500">
                <Settings className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">SAAS Provider Management Coming Soon</p>
                <p className="text-sm mt-2">
                  Add and manage your ITS, Bitla, and other SAAS provider integrations
                </p>
                <p className="text-xs mt-4 text-gray-400">
                  This feature includes secure token storage, SOAP/XML API configuration, and endpoint management
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Update Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Status</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p><strong>Bill ID:</strong> {selectedPayment.billId}</p>
                <p><strong>Period:</strong> {selectedPayment.billingPeriod}</p>
                <p><strong>Amount:</strong> ₹{selectedPayment.totalAmount}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Payment Method</Label>
                  <Select onValueChange={(value) => {
                    setSelectedPayment({...selectedPayment, paymentMethod: value});
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes about the payment..."
                    onChange={(e) => {
                      setSelectedPayment({...selectedPayment, notes: e.target.value});
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleUpdatePayment(
                    'paid', 
                    selectedPayment.paymentMethod || 'cash', 
                    selectedPayment.notes || ''
                  )}
                  disabled={updatePaymentMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {updatePaymentMutation.isPending ? "Updating..." : "Mark as Paid"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Bus Dialog */}
      <Dialog open={addBusDialogOpen} onOpenChange={setAddBusDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Bus</DialogTitle>
          </DialogHeader>
          <Form {...addBusForm}>
            <form onSubmit={addBusForm.handleSubmit(handleAddBus)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addBusForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bus Number *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-bus-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addBusForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bus Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-bus-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addBusForm.control}
                  name="fromLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Location *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-from-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addBusForm.control}
                  name="toLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Location *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-to-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addBusForm.control}
                  name="departureTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Time *</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" data-testid="input-departure-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addBusForm.control}
                  name="arrivalTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Time *</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" data-testid="input-arrival-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addBusForm.control}
                  name="busType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bus Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-bus-type">
                            <SelectValue placeholder="Select bus type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Seater">Seater</SelectItem>
                          <SelectItem value="Sleeper">Sleeper</SelectItem>
                          <SelectItem value="AC Seater">AC Seater</SelectItem>
                          <SelectItem value="AC Sleeper">AC Sleeper</SelectItem>
                          <SelectItem value="Seater and Sleeper">Seater and Sleeper</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addBusForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (seats) *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1"
                          data-testid="input-capacity" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addBusForm.control}
                  name="fare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fare *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 500" data-testid="input-fare" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addBusForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." data-testid="input-image-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addBusForm.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amenities</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="WiFi, AC, TV, Water (comma separated)" data-testid="input-amenities" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addBusForm.control}
                  name="availabilityStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-availability-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="not_available">Not Available</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addBusForm.control}
                  name="unavailableUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unavailable Until (if applicable)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-unavailable-until" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center space-x-2">
                <FormField
                  control={addBusForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-is-active"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Bus is active
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddBusDialogOpen(false)}
                  data-testid="button-cancel-add-bus"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addBusMutation.isPending}
                  className="bg-[var(--airbnb-pink)] hover:bg-[var(--airbnb-pink-dark)] text-white"
                  data-testid="button-submit-add-bus"
                >
                  {addBusMutation.isPending ? "Adding..." : "Add Bus"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Bus Dialog */}
      <Dialog open={editBusDialogOpen} onOpenChange={setEditBusDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bus</DialogTitle>
          </DialogHeader>
          <Form {...editBusForm}>
            <form onSubmit={editBusForm.handleSubmit(handleEditBus)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editBusForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bus Number *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-bus-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBusForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bus Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-bus-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBusForm.control}
                  name="fromLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Location *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-from-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBusForm.control}
                  name="toLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Location *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-to-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBusForm.control}
                  name="departureTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Time *</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" data-testid="input-edit-departure-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBusForm.control}
                  name="arrivalTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Time *</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" data-testid="input-edit-arrival-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBusForm.control}
                  name="busType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bus Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-bus-type">
                            <SelectValue placeholder="Select bus type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Seater">Seater</SelectItem>
                          <SelectItem value="Sleeper">Sleeper</SelectItem>
                          <SelectItem value="AC Seater">AC Seater</SelectItem>
                          <SelectItem value="AC Sleeper">AC Sleeper</SelectItem>
                          <SelectItem value="Seater and Sleeper">Seater and Sleeper</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBusForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (seats) *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1"
                          data-testid="input-edit-capacity" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBusForm.control}
                  name="fare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fare *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 500" data-testid="input-edit-fare" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBusForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." data-testid="input-edit-image-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editBusForm.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amenities</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="WiFi, AC, TV, Water (comma separated)" data-testid="input-edit-amenities" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editBusForm.control}
                  name="availabilityStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-availability-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="not_available">Not Available</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editBusForm.control}
                  name="unavailableUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unavailable Until (if applicable)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-edit-unavailable-until" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center space-x-2">
                <FormField
                  control={editBusForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-edit-is-active"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Bus is active
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditBusDialogOpen(false)}
                  data-testid="button-cancel-edit-bus"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateBusMutation.isPending}
                  className="bg-[var(--airbnb-pink)] hover:bg-[var(--airbnb-pink-dark)] text-white"
                  data-testid="button-submit-edit-bus"
                >
                  {updateBusMutation.isPending ? "Updating..." : "Update Bus"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}