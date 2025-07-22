
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { theme } from "@/lib/theme";
import { 
  Download, 
  Search, 
  Filter, 
  Eye, 
  CreditCard, 
  Calendar,
  Building,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["/api/admin/payments"],
    retry: false,
  });

  const { data: paymentStats = {} } = useQuery({
    queryKey: ["/api/admin/payment-stats"],
    retry: false,
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, status, paymentMethod, notes }: any) => {
      const response = await fetch(`/api/admin/payments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, paymentMethod, notes }),
      });
      if (!response.ok) throw new Error("Failed to update payment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-stats"] });
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    },
  });

  const filteredPayments = payments.filter((payment: any) => {
    const matchesSearch = payment.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    const matchesDate = dateFilter === "all" || (() => {
      const paymentDate = new Date(payment.dueDate);
      const now = new Date();
      
      switch (dateFilter) {
        case "overdue":
          return payment.status === "pending" && paymentDate < now;
        case "this_month":
          return paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear();
        case "last_month":
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          return paymentDate.getMonth() === lastMonth.getMonth() && 
                 paymentDate.getFullYear() === lastMonth.getFullYear();
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const exportToExcel = () => {
    const csvContent = [
      ['Agency Name', 'Invoice Number', 'Amount', 'Due Date', 'Status', 'Payment Method', 'Payment Date', 'Notes'],
      ...filteredPayments.map((payment: any) => [
        payment.agencyName,
        payment.invoiceNumber,
        payment.amount,
        new Date(payment.dueDate).toLocaleDateString(),
        payment.status,
        payment.paymentMethod || '',
        payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '',
        payment.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const markAsPaid = (payment: any) => {
    updatePaymentMutation.mutate({
      id: payment.id,
      status: 'paid',
      paymentMethod: 'manual',
      notes: 'Marked as paid manually'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[var(--airbnb-dark)]">Accounts & Payments</h2>
          <p className="text-[var(--airbnb-gray)]">Manage agency payments and billing</p>
        </div>
        <Button onClick={exportToExcel} className="bg-[var(--airbnb-primary)]">
          <Download className="w-4 h-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="airbnb-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="text-xl text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-[var(--airbnb-gray)] text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-[var(--airbnb-dark)]">
                  ₹{paymentStats.totalRevenue?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="airbnb-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <CheckCircle className="text-xl text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-[var(--airbnb-gray)] text-sm">Paid</p>
                <p className="text-2xl font-bold text-[var(--airbnb-dark)]">
                  {paymentStats.paidCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="airbnb-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="text-xl text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-[var(--airbnb-gray)] text-sm">Pending</p>
                <p className="text-2xl font-bold text-[var(--airbnb-dark)]">
                  {paymentStats.pendingCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="airbnb-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <XCircle className="text-xl text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-[var(--airbnb-gray)] text-sm">Overdue</p>
                <p className="text-2xl font-bold text-[var(--airbnb-dark)]">
                  {paymentStats.overdueCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="airbnb-shadow">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--airbnb-gray)] w-4 h-4" />
                <Input
                  placeholder="Search by agency name or invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="airbnb-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Records ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-2 text-[var(--airbnb-gray)]" />
                      {payment.agencyName}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{payment.invoiceNumber}</TableCell>
                  <TableCell className="font-semibold">₹{payment.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-[var(--airbnb-gray)]" />
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    {payment.paymentDate ? 
                      new Date(payment.paymentDate).toLocaleDateString() : 
                      '-'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Payment Details</DialogTitle>
                            <DialogDescription>
                              Invoice: {payment.invoiceNumber}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Agency</label>
                                <p className="text-sm text-[var(--airbnb-gray)]">{payment.agencyName}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Amount</label>
                                <p className="text-sm text-[var(--airbnb-gray)]">₹{payment.amount?.toLocaleString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <div className="mt-1">{getStatusBadge(payment.status)}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Due Date</label>
                                <p className="text-sm text-[var(--airbnb-gray)]">
                                  {new Date(payment.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {payment.notes && (
                              <div>
                                <label className="text-sm font-medium">Notes</label>
                                <p className="text-sm text-[var(--airbnb-gray)]">{payment.notes}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {payment.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => markAsPaid(payment)}
                          disabled={updatePaymentMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[var(--airbnb-gray)]">No payments found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
