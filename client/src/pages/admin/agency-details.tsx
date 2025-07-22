
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
  CreditCard
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

  useEffect(() => {
    if (agency) {
      setFormData(agency);
      setLogoPreview(agency.logoUrl || "");
    }
  }, [agency]);

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

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (formData) {
      updateAgencyMutation.mutate(formData);
    }
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
            <h1 className="text-2xl font-bold text-[var(--airbnb-dark)]">Agency Details</h1>
            <p className="text-[var(--airbnb-gray)] mt-1">
              Manage agency information and settings
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSave}
          disabled={updateAgencyMutation.isPending}
          className="bg-[var(--airbnb-pink)] hover:bg-[var(--airbnb-pink-dark)] text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

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
            <CardContent className="space-y-4">
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
              <div className="bg-[var(--airbnb-light)] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Monthly Billing Summary</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Buses:</span>
                    <span>{agency.totalBuses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate per Bus:</span>
                    <span>₹{formData.renewalChargePerBus || 5000}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Monthly:</span>
                    <span>₹{(agency.totalBuses || 0) * (formData.renewalChargePerBus || 5000)}</span>
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
    </div>
  );
}
