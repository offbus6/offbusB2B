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
    total: number;
    breakdown: any;
  };
  allTimeApiCalls: {
    sent: number;
    failed: number;
    total: number;
  };
  statistics: {
    totalTravelers: number;
    processedTravelers: number;
    pendingTravelers: number;
    processingRate: number;
  };
  verification?: {
    note: string;
    possibleReasons: string[];
  };
  recentCalls?: { travelerName: string; phone: string; status: string }[];
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

interface RetryAnalytics {
  retryBreakdown?: {
    oneRetry?: { count: number };
    twoRetries?: { count: number };
    threeRetries?: { count: number };
    fourPlusRetries?: { count: number };
  };
  summary?: {
    message: string;
    efficiency: string;
  };
  currentFailedNumbers?: {
    total: number;
    byRetryCount: {
      '0'?: number;
      '1'?: number;
      '2'?: number;
      '3'?: number;
      '4'?: number;
      '5'?: number;
    };
  };
}

export default function ApiDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date

  // Fetch API call statistics and retry analytics for the selected date
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

  const { data: retryAnalytics, isLoading: retryLoading, error: retryError, refetch: refetchRetry } = useQuery<RetryAnalytics>({
    queryKey: ["/api/agency/whatsapp/retry-analytics", selectedDate],
    queryFn: async () => {
      console.log(`🔄 Frontend: Fetching retry analytics for date: ${selectedDate}`);
      const response = await fetch(`/api/agency/whatsapp/retry-analytics?date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch retry analytics');
      const data = await response.json();
      console.log('📊 Frontend: Received retry analytics:', data);
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
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
      // Backend already filters for batches with API calls on selected date
      // Don't add additional date filtering here - just map the data
      return data
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

  const isLoading = statsLoading || batchLoading || retryLoading;
  const hasError = statsError || batchError || retryError;

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
              <Button onClick={() => { refetchStats(); refetchBatch(); refetchRetry(); }} variant="outline">
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
              refetchRetry();
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
              {apiStats?.todaysApiCalls?.total || 0}
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
              {apiStats?.statistics?.pendingTravelers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Travelers pending WhatsApp
            </p>
            <div className="text-lg font-bold text-yellow-500 mt-1">
              Total Travelers: {apiStats?.statistics?.totalTravelers || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retry Analytics Section */}
      {retryAnalytics && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">🔄 Retry Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{retryAnalytics.retryBreakdown?.oneRetry?.count || 0}</div>
              <div className="text-sm text-gray-600">1 Retry</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">{retryAnalytics.retryBreakdown?.twoRetries?.count || 0}</div>
              <div className="text-sm text-gray-600">2 Retries</div>
            </div>
            <div className="p-4 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">{retryAnalytics.retryBreakdown?.threeRetries?.count || 0}</div>
              <div className="text-sm text-gray-600">3 Retries</div>
            </div>
            <div className="p-4 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">{retryAnalytics.retryBreakdown?.fourPlusRetries?.count || 0}</div>
              <div className="text-sm text-gray-600">4+ Retries</div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded mb-4">
            <h4 className="font-semibold mb-2">Total API Usage Including Retries</h4>
            <p className="text-sm text-gray-600">{retryAnalytics.summary?.message}</p>
            <p className="text-sm text-green-600 font-medium">{retryAnalytics.summary?.efficiency}</p>
          </div>

          {retryAnalytics.currentFailedNumbers?.total > 0 && (
            <div className="p-4 bg-red-50 rounded">
              <h4 className="font-semibold mb-2 text-red-800">📞 Failed Numbers Requiring Retry</h4>
              <div className="text-sm text-gray-600 mb-2">
                Total: {retryAnalytics.currentFailedNumbers.total} numbers
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>0 retries: {retryAnalytics.currentFailedNumbers.byRetryCount['0'] || 0}</div>
                <div>1 retry: {retryAnalytics.currentFailedNumbers.byRetryCount['1'] || 0}</div>
                <div>2 retries: {retryAnalytics.currentFailedNumbers.byRetryCount['2'] || 0}</div>
                <div>3+ retries: {(retryAnalytics.currentFailedNumbers.byRetryCount['3'] || 0) + (retryAnalytics.currentFailedNumbers.byRetryCount['4'] || 0) + (retryAnalytics.currentFailedNumbers.byRetryCount['5'] || 0)}</div>
              </div>
            </div>
          )}
        </div>
      )}

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