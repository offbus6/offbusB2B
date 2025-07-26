
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Users, Bus, MapPin, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StatsCard from "@/components/ui/stats-card";
import * as XLSX from 'xlsx';

export default function AdminUserData() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: userData, isLoading: dataLoading } = useQuery({
    queryKey: ["/api/admin/user-data"],
    retry: false,
  });

  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ["/api/admin/agencies"],
    retry: false,
  });

  if (dataLoading || agenciesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredData = (userData as any[])?.filter((user: any) => {
    const matchesSearch = user.travelerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm) ||
                         user.agencyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgency = agencyFilter === "all" || user.agencyId.toString() === agencyFilter;
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
  const totalRevenue = (userData as any[])?.reduce((sum: number, u: any) => {
    if (!u.fare) return sum;
    const fareStr = typeof u.fare === 'string' ? u.fare : String(u.fare);
    return sum + (parseInt(fareStr.replace(/[^\d]/g, '')) || 0);
  }, 0) || 0;

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
          icon={Calendar}
          iconColor="text-green-500"
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
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
            <Button
              onClick={handleExport}
              className="bg-[var(--airbnb-teal)] hover:bg-[var(--airbnb-teal)]/90 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
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
