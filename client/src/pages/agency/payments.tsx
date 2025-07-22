
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, CreditCard, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface Payment {
  id: number;
  billId: string;
  billingPeriod: string;
  totalBuses: number;
  chargePerBus: number;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'partial';
  paymentMethod?: string;
  paymentDate?: string;
  dueDate: string;
  notes?: string;
  createdAt: string;
}

export default function AgencyPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('');

  // Fetch payment history
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['/api/agency/payments'],
    queryFn: async (): Promise<Payment[]> => {
      const response = await fetch('/api/agency/payments');
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      return response.json();
    },
  });

  // Mock payment function (replace with actual payment gateway integration)
  const initiatePayment = useMutation({
    mutationFn: async (paymentId: number) => {
      // This is where you would integrate with a payment gateway
      // For now, we'll just show a toast
      toast({
        title: "Payment Initiated",
        description: "Redirecting to payment gateway...",
      });
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agency/payments'] });
    },
  });

  // Filter payments based on status and period
  const filteredPayments = payments.filter(payment => {
    const statusMatch = statusFilter === 'all' || payment.paymentStatus === statusFilter;
    const periodMatch = !periodFilter || payment.billingPeriod.toLowerCase().includes(periodFilter.toLowerCase());
    return statusMatch && periodMatch;
  });

  // Separate pending payments and payment history
  const pendingPayments = filteredPayments.filter(p => p.paymentStatus === 'pending' || p.paymentStatus === 'overdue');
  const paymentHistory = filteredPayments.filter(p => p.paymentStatus === 'paid');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToExcel = () => {
    const exportData = filteredPayments.map(payment => ({
      'Bill ID': payment.billId,
      'Billing Period': payment.billingPeriod,
      'Total Buses': payment.totalBuses,
      'Charge Per Bus': `₹${payment.chargePerBus}`,
      'Subtotal': `₹${payment.subtotal}`,
      'Tax (%)': `${payment.taxPercentage}%`,
      'Tax Amount': `₹${payment.taxAmount}`,
      'Total Amount': `₹${payment.totalAmount}`,
      'Status': payment.paymentStatus,
      'Payment Method': payment.paymentMethod || 'N/A',
      'Payment Date': payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A',
      'Due Date': new Date(payment.dueDate).toLocaleDateString(),
      'Notes': payment.notes || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payment History');
    XLSX.writeFile(wb, `payment-history-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Export Successful",
      description: "Payment history has been exported to Excel",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--airbnb-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[var(--airbnb-dark)]">Payments</h2>
          <p className="text-[var(--airbnb-gray)]">Manage your payments and billing history</p>
        </div>
        <Button onClick={exportToExcel} className="bg-[var(--airbnb-primary)]">
          <Download className="w-4 h-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {pendingPayments.map((payment) => (
                <Card key={payment.id} className="border-2 border-yellow-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{payment.billingPeriod}</h3>
                          <Badge className={getStatusColor(payment.paymentStatus)}>
                            {payment.paymentStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Bill ID: {payment.billId}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-500">Total Buses</p>
                            <p className="font-semibold">{payment.totalBuses}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-semibold text-lg">₹{payment.totalAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Due Date</p>
                            <p className="font-semibold text-red-600">
                              {new Date(payment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Days Left</p>
                            <p className="font-semibold">
                              {Math.ceil((new Date(payment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={() => initiatePayment.mutate(payment.id)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={initiatePayment.isPending}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay Now
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          View Invoice
                        </Button>
                      </div>
                    </div>
                    
                    {/* Payment Breakdown */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Payment Breakdown</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Subtotal</p>
                          <p className="font-semibold">₹{payment.subtotal.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tax ({payment.taxPercentage}%)</p>
                          <p className="font-semibold">₹{payment.taxAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Per Bus Charge</p>
                          <p className="font-semibold">₹{payment.chargePerBus.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-semibold">Total</p>
                          <p className="font-bold text-lg">₹{payment.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Filter by billing period..."
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill ID</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Buses</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.billId}</TableCell>
                    <TableCell>{payment.billingPeriod}</TableCell>
                    <TableCell>{payment.totalBuses}</TableCell>
                    <TableCell>₹{payment.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.paymentStatus)}
                        <Badge className={getStatusColor(payment.paymentStatus)}>
                          {payment.paymentStatus}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {payment.paymentDate 
                        ? new Date(payment.paymentDate).toLocaleDateString() 
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {payment.paymentStatus !== 'paid' && (
                          <Button 
                            size="sm" 
                            onClick={() => initiatePayment.mutate(payment.id)}
                            disabled={initiatePayment.isPending}
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Pay
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <FileText className="w-3 h-3 mr-1" />
                          Invoice
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payment records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, CreditCard, Download, Filter, Search, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from 'xlsx';

interface Payment {
  id: number;
  agencyId: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: string;
  paymentDate?: string;
  invoiceNumber: string;
  notes?: string;
  billingPeriod: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentStats {
  totalOutstanding: number;
  totalPaid: number;
  overdueAmount: number;
  nextDueAmount: number;
  nextDueDate?: string;
}

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  // Fetch payment data
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/agency/payments'],
    queryFn: async () => {
      const response = await fetch('/api/agency/payments');
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      return response.json();
    }
  });

  // Fetch payment stats
  const { data: paymentStats } = useQuery<PaymentStats>({
    queryKey: ['/api/agency/payment-stats'],
    queryFn: async () => {
      const response = await fetch('/api/agency/payment-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch payment stats');
      }
      return response.json();
    }
  });

  // Filter and search payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch = payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.billingPeriod.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
      
      const matchesPeriod = periodFilter === "all" || payment.billingPeriod.includes(periodFilter);
      
      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [payments, searchTerm, statusFilter, periodFilter]);

  // Get next payment due
  const nextPaymentDue = useMemo(() => {
    const pendingPayments = payments.filter(p => p.status === 'pending');
    if (pendingPayments.length === 0) return null;
    
    return pendingPayments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  }, [payments]);

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredPayments.map((payment) => ({
      'Invoice Number': payment.invoiceNumber,
      'Amount': `₹${payment.amount.toLocaleString()}`,
      'Due Date': format(new Date(payment.dueDate), 'dd/MM/yyyy'),
      'Status': payment.status.toUpperCase(),
      'Billing Period': payment.billingPeriod,
      'Payment Date': payment.paymentDate ? format(new Date(payment.paymentDate), 'dd/MM/yyyy') : 'N/A',
      'Payment Method': payment.paymentMethod || 'N/A',
      'Notes': payment.notes || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment History');

    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = colWidths;

    // Export file
    XLSX.writeFile(workbook, `payment-history-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const handlePayment = (paymentId: number) => {
    // This would typically open a payment gateway or redirect to payment page
    console.log('Processing payment for ID:', paymentId);
    // For now, we'll just show an alert
    alert('Payment gateway integration would be implemented here');
  };

  if (paymentsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Manage your subscription payments and billing history</p>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{paymentStats?.totalOutstanding?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{paymentStats?.totalPaid?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₹{paymentStats?.overdueAmount?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Next Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₹{paymentStats?.nextDueAmount?.toLocaleString() || '0'}
            </div>
            {paymentStats?.nextDueDate && (
              <p className="text-sm text-gray-500 mt-1">
                Due: {format(new Date(paymentStats.nextDueDate), 'dd MMM yyyy')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Payment Due */}
      {nextPaymentDue && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Due
                </CardTitle>
                <CardDescription>
                  Your next payment is due soon
                </CardDescription>
              </div>
              <Button onClick={() => handlePayment(nextPaymentDue.id)} className="bg-blue-600 hover:bg-blue-700">
                Pay Now
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Amount Due</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{nextPaymentDue.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(new Date(nextPaymentDue.dueDate), 'dd MMM yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="text-lg font-semibold">{nextPaymentDue.invoiceNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View and manage your payment history</CardDescription>
            </div>
            <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search invoices, periods, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No payment records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.invoiceNumber}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.dueDate), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{payment.billingPeriod}</TableCell>
                      <TableCell>
                        {payment.paymentDate 
                          ? format(new Date(payment.paymentDate), 'dd MMM yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {payment.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handlePayment(payment.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Pay Now
                          </Button>
                        )}
                        {payment.status === 'paid' && (
                          <Button size="sm" variant="outline">
                            Receipt
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination could be added here for large datasets */}
          {filteredPayments.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Showing {filteredPayments.length} of {payments.length} payments
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
