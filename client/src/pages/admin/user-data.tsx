
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Download, Search, Users, Bus, MapPin, MessageSquare, Trash2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StatsCard from "@/components/ui/stats-card";
import * as XLSX from 'xlsx';

export default function AdminUserData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isBulkTestDialogOpen, setIsBulkTestDialogOpen] = useState(false);
  const [selectedAgencyForBulk, setSelectedAgencyForBulk] = useState("");

  const { data: userData, isLoading: dataLoading } = useQuery({
    queryKey: ["/api/admin/user-data"],
    retry: false,
  });

  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ["/api/admin/agencies"],
    retry: false,
  });

  const deleteTravelerMutation = useMutation({
    mutationFn: async (travelerId: number) => {
      return await apiRequest(`/api/admin/user-data/${travelerId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-data"] });
      toast({
        title: "Success",
        description: "Traveler data deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete traveler data",
        variant: "destructive",
      });
    },
  });

  const testWhatsAppMutation = useMutation({
    mutationFn: async ({ phoneNumber, message, agencyName }: { phoneNumber: string; message?: string; agencyName?: string }) => {
      return await apiRequest('/api/admin/whatsapp/test', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, message, agencyName }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-data"] });
      toast({
        title: "WhatsApp Test Sent",
        description: data.message || "Test message sent successfully",
      });
      setIsWhatsAppDialogOpen(false);
      setTestPhoneNumber("");
      setTestMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "WhatsApp Test Failed",
        description: error.message || "Failed to send test message",
        variant: "destructive",
      });
    },
  });

  const bulkTestWhatsAppMutation = useMutation({
    mutationFn: async ({ agencyId, message }: { agencyId: number; message?: string }) => {
      return await apiRequest('/api/admin/whatsapp/bulk-test', {
        method: 'POST',
        body: JSON.stringify({ agencyId, message }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-data"] });
      toast({
        title: "Bulk WhatsApp Test Completed",
        description: `${data.message}. Agency: ${data.agencyName}`,
      });
      setIsBulkTestDialogOpen(false);
      setSelectedAgencyForBulk("");
      setTestMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Bulk WhatsApp Test Failed",
        description: error.message || "Failed to send bulk messages",
        variant: "destructive",
      });
    },
  });

  if (dataLoading || agenciesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredData = (userData as any[])?.filter((user: any) => {
    const matchesSearch = user.travelerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm) ||
                         user.agencyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgency = agencyFilter === "all" || user.agencyId?.toString() === agencyFilter;
    const matchesStatus = statusFilter === "all" || user.whatsappStatus === statusFilter;
    const matchesDate = !dateFilter || new Date(user.travelDate).toISOString().split('T')[0] === dateFilter;
    
    return matchesSearch && matchesAgency && matchesStatus && matchesDate;
  }) || [];

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = () => {
    if (!filteredData || filteredData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const exportData = (filteredData as any[])?.map((user: any) => ({
      'Traveler Name': user.travelerName,
      'Phone': user.phone,
      'Travel Agency': user.agencyName,
      'Bus Number': user.busNumber,
      'From': user.fromLocation,
      'To': user.toLocation,
      'Travel Date': new Date(user.travelDate).toLocaleDateString(),
      'Departure Time': user.departureTime,
      'Arrival Time': user.arrivalTime,
      'Bus Type': user.busType,
      'Fare': user.fare,
      'Coupon Code': user.couponCode,
      'WhatsApp Status': user.whatsappStatus
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User Data");
    XLSX.writeFile(wb, `user-data-${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Export Successful",
      description: "User data has been exported to Excel file",
    });
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

  const totalUsers = (userData as any[])?.length || 0;
  const totalAgencies = new Set((userData as any[])?.map((u: any) => u.agencyId)).size || 0;
  const totalBuses = new Set((userData as any[])?.map((u: any) => u.busId)).size || 0;
  const totalMessagesSent = (userData as any[])?.filter((u: any) => u.whatsappStatus === 'sent').length || 0;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--airbnb-dark)] mb-2">
          User Data Management
        </h2>
        <p className="text-[var(--airbnb-gray)]">
          View and manage all traveler data across all agencies
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={Users}
          iconColor="text-[var(--airbnb-primary)]"
          title="Total Travelers"
          value={totalUsers}
        />
        <StatsCard
          icon={Bus}
          iconColor="text-[var(--airbnb-teal)]"
          title="Active Buses"
          value={totalBuses}
        />
        <StatsCard
          icon={MapPin}
          iconColor="text-[var(--airbnb-orange)]"
          title="Active Agencies"
          value={totalAgencies}
        />
        <StatsCard
          icon={MessageSquare}
          iconColor="text-green-500"
          title="WhatsApp Messages Sent"
          value={totalMessagesSent}
        />
      </div>

      {/* Filters */}
      <Card className="mb-6 airbnb-shadow">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--airbnb-gray)] w-4 h-4" />
              <Input
                placeholder="Search by name, phone, or agency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Agency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agencies</SelectItem>
                {agencies?.map((agency: any) => (
                  <SelectItem key={agency.id} value={agency.id.toString()}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by travel date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="airbnb-shadow">
        <CardHeader className="border-b border-[var(--airbnb-border)]">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-[var(--airbnb-dark)]">
              Traveler Data ({(filteredData as any[])?.length || 0} records)
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Test WhatsApp
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Test WhatsApp Message</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Phone Number (10 digits)</label>
                      <Input
                        placeholder="9876543210"
                        value={testPhoneNumber}
                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Custom Message (Optional)</label>
                      <Textarea
                        placeholder="Leave empty for default message..."
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={() => testWhatsAppMutation.mutate({ 
                        phoneNumber: testPhoneNumber, 
                        message: testMessage || undefined,
                        agencyName: "TravelFlow Admin"
                      })}
                      disabled={!testPhoneNumber || testPhoneNumber.length !== 10 || testWhatsAppMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {testWhatsAppMutation.isPending ? "Sending..." : "Send Test Message"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkTestDialogOpen} onOpenChange={setIsBulkTestDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Users className="w-4 h-4 mr-2" />
                    Bulk WhatsApp
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Bulk WhatsApp Test</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Select Agency</label>
                      <Select value={selectedAgencyForBulk} onValueChange={setSelectedAgencyForBulk}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose agency..." />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies?.map((agency: any) => (
                            <SelectItem key={agency.id} value={agency.id.toString()}>
                              {agency.name} ({filteredData.filter(u => u.agencyId === agency.id).length} travelers)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Custom Message (Optional)</label>
                      <Textarea
                        placeholder="Leave empty for personalized messages..."
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={() => bulkTestWhatsAppMutation.mutate({ 
                        agencyId: parseInt(selectedAgencyForBulk), 
                        message: testMessage || undefined
                      })}
                      disabled={!selectedAgencyForBulk || bulkTestWhatsAppMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {bulkTestWhatsAppMutation.isPending ? "Sending..." : "Send Bulk Messages"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={handleExport}
                className="bg-[var(--airbnb-teal)] hover:bg-[var(--airbnb-teal)]/90 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--airbnb-light)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Traveler Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Travel Agency
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Route Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Bus Information
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Travel Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Fare
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--airbnb-gray)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--airbnb-border)]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-[var(--airbnb-gray)]">
                    No traveler data found
                  </td>
                </tr>
              ) : (
                paginatedData.map((user: any) => (
                  <tr key={user.id} className="hover:bg-[var(--airbnb-light)]">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[var(--airbnb-dark)]">
                          {user.travelerName}
                        </div>
                        <div className="text-sm text-[var(--airbnb-gray)]">
                          {user.phone}
                        </div>
                        <div className="text-xs text-[var(--airbnb-gray)]">
                          Coupon: {user.couponCode}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--airbnb-dark)]">
                        {user.agencyName}
                      </div>
                      <div className="text-xs text-[var(--airbnb-gray)]">
                        {user.agencyCity}, {user.agencyState}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--airbnb-dark)]">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-[var(--airbnb-gray)]" />
                          {user.fromLocation || 'Not specified'} → {user.toLocation || 'Not specified'}
                        </div>
                        <div className="text-xs text-[var(--airbnb-gray)] mt-1">
                          {user.departureTime || 'N/A'} - {user.arrivalTime || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[var(--airbnb-dark)]">
                          {user.busNumber || user.busName || 'N/A'}
                        </div>
                        <div className="text-xs text-[var(--airbnb-gray)]">
                          {user.busType || 'N/A'} • {user.capacity || 0} seats
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--airbnb-dark)]">
                      {new Date(user.travelDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--airbnb-dark)]">
                      {user.fare}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(user.whatsappStatus)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTravelerMutation.mutate(user.id)}
                        disabled={deleteTravelerMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--airbnb-gray)]">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-[var(--airbnb-gray)]">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
