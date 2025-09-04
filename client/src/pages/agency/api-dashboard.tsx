import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Activity, Phone, Calendar, AlertTriangle, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";

interface ApiCallStats {
  date: string;
  totalApiCallsToday: number;
  totalApiCallsEver: number;
  todaysApiCalls: {
    sent: number;
    failed: number;
    pending: number;
    total: number;
  };
  allTimeApiCalls: {
    sent: number;
    failed: number;
    pending: number;
    total: number;
  };
  note: string;
  verification?: {
    note: string;
    possibleReasons: string[];
  };
}

interface BatchApiStats {
  batchId: string;
  uploadDate: string;
  fileName: string;
  busName: string;
  travelers: number;
  apiCallsMade: number;
  sent: number;
  failed: number;
  status: string;
  lastProcessed: string;
}

export default function ApiDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('2025-08-29'); // Reset to current date to test filtering

  // Get API call statistics for selected date
  const { data: apiStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery<ApiCallStats>({
    queryKey: ["/api/agency/whatsapp/api-stats", selectedDate],
    queryFn: async () => {
      console.log(`🔍 Frontend: Fetching API stats for date: ${selectedDate}`);
      const response = await fetch(`/api/agency/whatsapp/api-stats?date=${selectedDate}&cache=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch API stats');
      const data = await response.json();
      console.log(`📊 Frontend: Received API stats:`, data);
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  // Get batch-wise API statistics for selected date only
  const { data: batchStats, isLoading: batchLoading, error: batchError, refetch: refetchBatch } = useQuery<BatchApiStats[]>({
    queryKey: ["/api/agency/upload-batches", selectedDate],
    queryFn: async () => {
      console.log(`🔍 Frontend: Fetching batches for date: ${selectedDate}`);
      const response = await fetch(`/api/agency/upload-batches?date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch batch stats');
      const data = await response.json();
      console.log(`📦 Frontend: Received batch data:`, data);
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: true,
    staleTime: 0,
    select: (data: any[]) => {
      // Filter and map batch data for selected date
      return data
        .filter(batch => {
          const batchDate = new Date(batch.uploadDate).toISOString().split('T')[0];
          return batchDate === selectedDate;
        })
        .map(batch => ({
          batchId: batch.uploadId,
          uploadDate: batch.uploadDate,
          fileName: batch.fileName || 'Unknown File',
          busName: batch.busName || 'Unknown Bus',
          travelers: batch.travelerCount,
          apiCallsMade: (batch.sentCount || 0) + (batch.failedCount || 0),
          sent: batch.sentCount || 0,
          failed: batch.failedCount || 0,
          status: batch.whatsappStatus || 'pending',
          lastProcessed: batch.uploadDate
        }));
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isLoading = statsLoading || batchLoading;
  const hasError = statsError || batchError;

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">API Call Dashboard</h1>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex flex-col items-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Unable to Load Dashboard</h3>
                <p className="text-gray-500 mt-1">Please refresh the page and try again. If the problem continues, you may need to log in again.</p>
              </div>
              <Button onClick={() => { refetchStats(); refetchBatch(); }} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Call Dashboard</h1>
          <p className="text-gray-600 mt-1">Track WhatsApp API usage and prevent unauthorized calls</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="date-picker" className="text-sm font-medium">Select Date:</Label>
            <Input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            onClick={() => { 
              console.log(`🔄 Frontend: Force refreshing API stats for date: ${selectedDate}`);
              refetchStats(); 
              refetchBatch(); 
            }}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading}
            data-testid="button-refresh-api-stats"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Date-based Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls on {format(new Date(selectedDate), 'MMM dd')}</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {apiStats?.totalApiCallsToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected date usage
            </p>
            <div className="text-lg font-bold text-orange-600 mt-2">
              Total Ever: {apiStats?.totalApiCallsEver || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {apiStats?.todaysApiCalls?.sent || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful API calls today
            </p>
            <div className="text-lg font-bold text-green-500 mt-1">
              Total: {apiStats?.allTimeApiCalls?.sent || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {apiStats?.todaysApiCalls?.failed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Failed API calls today
            </p>
            <div className="text-lg font-bold text-red-500 mt-1">
              Total: {apiStats?.allTimeApiCalls?.failed || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Messages</CardTitle>
            <Activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {apiStats?.todaysApiCalls?.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Never sent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            API Calls by Batch - {format(new Date(selectedDate), 'PPP')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {batchStats && batchStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Upload Time</th>
                      <th className="text-left p-3 font-medium">File Name</th>
                      <th className="text-left p-3 font-medium">Bus</th>
                      <th className="text-center p-3 font-medium">Travelers</th>
                      <th className="text-center p-3 font-medium">API Calls Made</th>
                      <th className="text-center p-3 font-medium">Sent</th>
                      <th className="text-center p-3 font-medium">Failed</th>
                      <th className="text-center p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchStats.map((batch) => (
                      <tr key={batch.batchId} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          {format(new Date(batch.uploadDate), 'MMM dd, HH:mm')}
                        </td>
                        <td className="p-3 font-medium">{batch.fileName}</td>
                        <td className="p-3">{batch.busName}</td>
                        <td className="text-center p-3">{batch.travelers}</td>
                        <td className="text-center p-3">
                          <span className="font-bold text-red-600">{batch.apiCallsMade}</span>
                        </td>
                        <td className="text-center p-3">
                          <span className="font-medium text-green-600">{batch.sent}</span>
                        </td>
                        <td className="text-center p-3">
                          <span className="font-medium text-red-600">{batch.failed}</span>
                        </td>
                        <td className="text-center p-3">
                          <Badge className={getStatusColor(batch.status)}>
                            {batch.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No batch data available for {format(new Date(selectedDate), 'MMM dd, yyyy')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warning Message */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Important API Usage Notice</h3>
              <p className="text-sm text-red-800 mt-1">
                Every API call (successful or failed) costs money. The system should ONLY send messages when you explicitly click "Send WhatsApp" for a specific batch.
                If you see API calls being made without your action, this indicates a system bug that needs immediate fixing.
              </p>
              <div className="mt-2 text-xs text-red-700">
                <strong>API Call Formula:</strong> Total API Calls = Sent Messages + Failed Attempts
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}