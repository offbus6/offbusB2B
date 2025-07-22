
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
