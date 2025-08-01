
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, User, Mail, Lock, Save, Building2, Phone, MapPin } from "lucide-react";

export default function AgencyProfile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const agency = user?.agency;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactPerson: "",
    phone: "",
    city: "",
    state: "",
    bookingWebsite: "",
    whatsappImageUrl: "",
    whatsappTemplate: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || "",
        email: agency.email || "",
        contactPerson: agency.contactPerson || "",
        phone: agency.phone || "",
        city: agency.city || "",
        state: agency.state || "",
        bookingWebsite: agency.bookingWebsite || "",
        whatsappImageUrl: agency.whatsappImageUrl || "",
        whatsappTemplate: agency.whatsappTemplate || "eddygoo_2807",
      });
    }
  }, [agency]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest(`/api/agencies/${agency?.id}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your agency profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return apiRequest(`/api/agencies/${agency?.id}/password`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Update Failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({
        title: "Missing Information",
        description: "Current password and new password are required",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'agency') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">You need agency privileges to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-6 w-6 text-[var(--airbnb-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--airbnb-dark)]">Agency Profile</h1>
          </div>
          <p className="text-[var(--airbnb-gray)]">Manage your agency information and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agency Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Agency Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Agency Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter agency name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Person
                  </Label>
                  <Input
                    id="contactPerson"
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                    placeholder="Enter contact person name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      City
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Enter city"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bookingWebsite">Booking Website URL</Label>
                  <Input
                    id="bookingWebsite"
                    type="url"
                    value={formData.bookingWebsite}
                    onChange={(e) => handleInputChange("bookingWebsite", e.target.value)}
                    placeholder="Enter booking website URL (used in WhatsApp messages)"
                    required
                  />
                  <p className="text-sm text-[var(--airbnb-gray)]">This URL will be sent to travelers in WhatsApp messages</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappImageUrl">WhatsApp Image URL</Label>
                  <Input
                    id="whatsappImageUrl"
                    type="url"
                    value={formData.whatsappImageUrl}
                    onChange={(e) => handleInputChange("whatsappImageUrl", e.target.value)}
                    placeholder="Enter image URL for WhatsApp messages"
                    required
                  />
                  <p className="text-sm text-[var(--airbnb-gray)]">This image will be attached to WhatsApp messages sent to travelers</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappTemplate">WhatsApp Template Name</Label>
                  <Input
                    id="whatsappTemplate"
                    type="text"
                    value={formData.whatsappTemplate}
                    onChange={(e) => handleInputChange("whatsappTemplate", e.target.value)}
                    placeholder="Enter your WhatsApp template name (e.g., eddygoo_2807)"
                    required
                  />
                  <p className="text-sm text-[var(--airbnb-gray)]">This is your approved WhatsApp template name from BhashSMS</p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90"
                  disabled={updatePasswordMutation.isPending}
                >
                  {updatePasswordMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Agency Status Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Agency Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--airbnb-gray)]">Current Status</p>
                <p className={`font-semibold ${
                  agency?.status === 'approved' ? 'text-green-600' : 
                  agency?.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {agency?.status === 'approved' ? '✅ Approved' : 
                   agency?.status === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--airbnb-gray)]">Agency ID</p>
                <p className="font-mono text-sm">{agency?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
