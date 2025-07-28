import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTravelerDataSchema } from "@shared/schema";
import { Search, Edit, Download, Trash2, MessageCircle, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { z } from "zod";

const travelerFormSchema = insertTravelerDataSchema.omit({ 
  busId: true, 
  agencyId: true 
}).extend({
  travelDate: z.string().min(1, "Travel date is required"),
});

export default function UploadedData() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [busFilter, setBusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [editingTraveler, setEditingTraveler] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const form = useForm<z.infer<typeof travelerFormSchema>>({
    resolver: zodResolver(travelerFormSchema),
    defaultValues: {
      travelerName: "",
      phone: "",
      travelDate: "",
      couponCode: "",
      whatsappStatus: "pending",
    },
  });

  const { data: travelerData = [], isLoading: dataLoading } = useQuery({
    queryKey: ["/api/traveler-data"],
    retry: false,
  });

  const { data: buses = [], isLoading: busesLoading } = useQuery({
    queryKey: ["/api/buses"],
    retry: false,
  });

  // WhatsApp send all mutation
  const sendAllWhatsAppMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/agency/whatsapp/send-all', {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "WhatsApp Messages Sent",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/traveler-data"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Messages",
        description: error.message || "Failed to send WhatsApp messages",
        variant: "destructive",
      });
    },
  });

  // WhatsApp send individual mutation
  const sendIndividualWhatsAppMutation = useMutation({
    mutationFn: async (travellerId: number) => {
      return await apiRequest(`/api/agency/whatsapp/send-individual/${travellerId}`, {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "Message Sent" : "Message Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/traveler-data"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "Failed to send WhatsApp message",
        variant: "destructive",
      });
    },
  });

  const updateTravelerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof travelerFormSchema>) => {
      // Auto-format phone number for Indian numbers
      let phone = data.phone.trim();
      if (phone) {
        // Remove any existing formatting
        phone = phone.replace(/[^\d]/g, '');
        
        // If it's a 10-digit number, add +91
        if (phone.length === 10 && phone.match(/^[6-9]\d{9}$/)) {
          phone = '+91' + phone;
        }
        // If it already has 91 prefix, format it properly
        else if (phone.length === 12 && phone.startsWith('91') && phone.substring(2).match(/^[6-9]\d{9}$/)) {
          phone = '+91' + phone.substring(2);
        }
      }

      return await apiRequest(`/api/traveler-data/${editingTraveler.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...data,
          phone: phone,
          travelDate: new Date(data.travelDate).toISOString().split('T')[0],
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/traveler-data"] });
      setIsDialogOpen(false);
      setEditingTraveler(null);
      form.reset();
      toast({
        title: "Success",
        description: "Traveler data updated successfully",
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
        description: "Failed to update traveler data",
        variant: "destructive",
      });
    },
  });

  const deleteTravelerMutation = useMutation({
    mutationFn: async (travelerId: number) => {
      return await apiRequest(`/api/traveler-data/${travelerId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/traveler-data"] });
      toast({
        title: "Success",
        description: "Traveler data deleted successfully",
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
        description: "Failed to delete traveler data",
        variant: "destructive",
      });
    },
  });

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

  const handleEdit = (traveler: any) => {
    setEditingTraveler(traveler);
    form.reset({
      travelerName: traveler.travelerName,
      phone: traveler.phone,
      travelDate: new Date(traveler.travelDate).toISOString().split('T')[0],
      couponCode: traveler.couponCode,
      whatsappStatus: traveler.whatsappStatus,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (traveler: any) => {
    if (window.confirm(`Are you sure you want to delete ${traveler.travelerName}'s data? This action cannot be undone.`)) {
      deleteTravelerMutation.mutate(traveler.id);
    }
  };

  const onSubmit = async (data: z.infer<typeof travelerFormSchema>) => {
    updateTravelerMutation.mutate(data);
  };

  const handleExport = () => {
    if (!filteredData || filteredData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ["Traveler Name", "Phone", "Bus Number", "Travel Date", "Coupon Code", "WhatsApp Status"],
      ...filteredData.map((traveler: any) => [
        traveler.travelerName,
        traveler.phone,
        getBusNumber(traveler.busId),
        new Date(traveler.travelDate).toLocaleDateString(),
        traveler.couponCode,
        traveler.whatsappStatus,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `traveler-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBusNumber = (busId: number) => {
    const bus = Array.isArray(buses) ? buses.find((b: any) => b.id === busId) : null;
    return bus?.number || "Unknown";
  };

  const getBusRoute = (busId: number) => {
    const bus = Array.isArray(buses) ? buses.find((b: any) => b.id === busId) : null;
    return bus?.route || "Unknown";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { label: "Sent", className: "bg-green-100 text-green-800" },
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      failed: { label: "Failed", className: "bg-red-100 text-red-800" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading || dataLoading || busesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user?.agency || user.agency.status !== "approved") {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--airbnb-gray)]">
          Your agency needs to be approved before you can view data.
        </p>
      </div>
    );
  }

  const filteredData = Array.isArray(travelerData) ? travelerData.filter((traveler: any) => {
    const matchesSearch = traveler.travelerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         traveler.phone.includes(searchTerm);
    const matchesBus = busFilter === "all" || traveler.busId.toString() === busFilter;
    const matchesStatus = statusFilter === "all" || traveler.whatsappStatus === statusFilter;
    const matchesDate = !dateFilter || new Date(traveler.travelDate).toISOString().split('T')[0] === dateFilter;
    
    return matchesSearch && matchesBus && matchesStatus && matchesDate;
  }) : [];

  const unsentCount = filteredData.filter((t: any) => !t.whatsappStatus || t.whatsappStatus === 'failed').length;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-[var(--airbnb-dark)] mb-2">
              Uploaded Data
            </h2>
            <p className="text-[var(--airbnb-gray)]">
              View and manage all uploaded traveler information
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => sendAllWhatsAppMutation.mutate()} 
              disabled={sendAllWhatsAppMutation.isPending || unsentCount === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {sendAllWhatsAppMutation.isPending ? 'Sending...' : `Send WhatsApp to All (${unsentCount})`}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="airbnb-shadow mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="bus-filter" className="text-sm font-medium text-[var(--airbnb-dark)]">
                Bus Number
              </Label>
              <Select value={busFilter} onValueChange={setBusFilter}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All Buses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buses</SelectItem>
                  {Array.isArray(buses) && buses.map((bus: any) => (
                    <SelectItem key={bus.id} value={bus.id.toString()}>
                      {bus.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-filter" className="text-sm font-medium text-[var(--airbnb-dark)]">
                Travel Date
              </Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="status-filter" className="text-sm font-medium text-[var(--airbnb-dark)]">
                WhatsApp Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search" className="text-sm font-medium text-[var(--airbnb-dark)]">
                Search
              </Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--airbnb-gray)]" />
                <Input
                  id="search"
                  placeholder="Search travelers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="airbnb-shadow">
        <CardHeader className="border-b border-[var(--airbnb-border)]">
          <CardTitle className="text-xl font-semibold text-[var(--airbnb-dark)]">
            Traveler Data ({filteredData.length} total, {unsentCount} unsent WhatsApp)
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--airbnb-light)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Traveler Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Bus Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Travel Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Coupon Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  WhatsApp Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--airbnb-border)]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[var(--airbnb-gray)]">
                    No traveler data found
                  </td>
                </tr>
              ) : (
                paginatedData.map((traveler: any) => (
                  <tr key={traveler.id} className="hover:bg-[var(--airbnb-light)]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--airbnb-dark)]">
                      {traveler.travelerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--airbnb-dark)]">
                      {traveler.phone}
                      {traveler.phone && !traveler.phone.startsWith('+91') && traveler.phone.length === 10 && (
                        <span className="text-xs text-[var(--airbnb-gray)] block">+91{traveler.phone}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--airbnb-dark)]">
                      <div>
                        <div className="font-medium">{getBusNumber(traveler.busId)}</div>
                        <div className="text-[var(--airbnb-gray)] text-xs">{getBusRoute(traveler.busId)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--airbnb-dark)]">
                      {new Date(traveler.travelDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--airbnb-dark)]">
                      {traveler.couponCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(traveler.whatsappStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {(!traveler.whatsappStatus || traveler.whatsappStatus === 'failed') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendIndividualWhatsAppMutation.mutate(traveler.id)}
                            disabled={sendIndividualWhatsAppMutation.isPending}
                            className="text-green-600 hover:text-green-700"
                            title="Send WhatsApp Message"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        {traveler.whatsappStatus === 'sent' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="text-green-600"
                            title="Message Already Sent"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {traveler.whatsappStatus === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendIndividualWhatsAppMutation.mutate(traveler.id)}
                            disabled={sendIndividualWhatsAppMutation.isPending}
                            className="text-orange-600 hover:text-orange-700 mr-1"
                            title="Retry WhatsApp Message"
                          >
                            <XCircle className="w-3 h-3" />
                            <Send className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(traveler)}
                          className="text-[var(--airbnb-primary)] hover:text-[var(--airbnb-dark)]"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(traveler)}
                          className="text-red-500 hover:text-red-700"
                          disabled={deleteTravelerMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--airbnb-border)]">
            <div className="flex justify-between items-center">
              <p className="text-sm text-[var(--airbnb-gray)]">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-dark)]"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? 
                      "bg-[var(--airbnb-primary)] text-white" : 
                      "text-[var(--airbnb-gray)] hover:text-[var(--airbnb-dark)]"
                    }
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="text-[var(--airbnb-gray)] hover:text-[var(--airbnb-dark)]"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Traveler Data</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="travelerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Traveler Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
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
                      <Input 
                        placeholder="Enter 10-digit mobile number" 
                        {...field}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^\d]/g, ''); // Only digits
                          if (value.length <= 10) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-[var(--airbnb-gray)] mt-1">
                      Enter 10-digit number. +91 will be added automatically.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="travelDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Travel Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="couponCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter coupon code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90"
                disabled={updateTravelerMutation.isPending}
              >
                {updateTravelerMutation.isPending ? "Updating..." : "Update Traveler"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
