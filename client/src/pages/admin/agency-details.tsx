import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    if (taxConfig) {
      setTaxPercentage(taxConfig.percentage || 18);
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
    setHasUnsavedChanges(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleSave = () => {
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
  };

  const getStatusBadge = (status: string) => {
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
  };

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

  if (isLoading || agencyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--airbnb-pink)]"></div>
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
        <Button 
          onClick={handleSave}
          disabled={updateAgencyMutation.isPending || !hasUnsavedChanges}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            hasUnsavedChanges 
              ? 'bg-[var(--airbnb-pink)] hover:bg-[var(--airbnb-pink-dark)] text-white' 
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4 mr-2" />
          {hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
        </Button>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Agency Details</TabsTrigger>
          <TabsTrigger value="buses">Bus Details</TabsTrigger>
          <TabsTrigger value="users">User Details</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
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
                  <span className="font-semibold">{agency.totalBuses}</span>
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
                  {(agency?.totalBuses || 0) === 0 && (
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
                    <span>{agency?.totalBuses || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate per Bus:</span>
                    <span>₹{formData.renewalChargePerBus || 5000}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{((agency?.totalBuses || 0) * (formData.renewalChargePerBus || 5000)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({taxPercentage}%):</span>
                    <span>₹{calculateTaxAmount((agency?.totalBuses || 0) * (formData.renewalChargePerBus || 5000), taxPercentage).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold text-base">
                    <span>Total Payable:</span>
                    <span>₹{(((agency?.totalBuses || 0) * (formData.renewalChargePerBus || 5000)) + calculateTaxAmount((agency?.totalBuses || 0) * (formData.renewalChargePerBus || 5000), taxPercentage)).toLocaleString()}</span>
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
            <h2 className="text-xl font-semibold text-[var(--airbnb-dark)] mb-4">Bus Details</h2>
            <Card>
              <CardContent className="p-0">
                {busesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--airbnb-pink)]"></div>
                  </div>
                ) : !busDetails || busDetails.length === 0 ? (
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {busDetails.map((bus: any) => (
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
                            <Badge className={bus.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {bus.isActive ? "Active" : "Inactive"}
                            </Badge>
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
                    <div className="animate-spin rounded-full h-8w-8 border-b-2 border-[var(--airbnb-pink)]"></div>
                  </div>
                ) : !userDetails || userDetails.length === 0 ? (
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
                      {userDetails.map((user: any) => (
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
              ) : !paymentHistory || paymentHistory.length === 0 ? (
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
                      {paymentHistory.map((payment: any) => (
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
    </div>
  );
}