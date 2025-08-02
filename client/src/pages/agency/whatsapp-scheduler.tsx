import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin, Gift, Send, CheckCircle, Clock, RefreshCw, MessageSquare, AlertTriangle, BarChart3, Info } from "lucide-react";
import { format } from "date-fns";

interface UploadBatch {
  uploadId: string;
  uploadDate: string;
  travelerCount: number;
  routes: string[];
  coupons: string[];
  whatsappStatus: 'pending' | 'sent' | 'partial';
  sentCount: number;
  failedCount?: number;
  pendingCount?: number;
  progressPercentage?: number;
  fileName?: string;
  busName?: string;
}

interface DailyUsage {
  today: number;
  estimatedLimit: number;
  remaining: number;
  percentage: number;
  resetTime: string;
  lastUpdated: string;
}

export default function WhatsAppScheduler() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch upload batches with WhatsApp status
  const { data: uploadBatches = [], isLoading, error, refetch } = useQuery<UploadBatch[]>({
    queryKey: ["/api/agency/upload-batches"],
    retry: 3,
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: true, // Refresh when window gains focus
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Fetch daily WhatsApp usage
  const { data: dailyUsage, isLoading: usageLoading } = useQuery<DailyUsage>({
    queryKey: ["/api/agency/whatsapp/daily-usage"],
    retry: 3,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Send WhatsApp to all travelers in a batch
  const sendWhatsAppBatchMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      return await apiRequest(`/api/agency/whatsapp/send-batch/${uploadId}`, {
        method: 'POST'
      });
    },
    onSuccess: (data: any, uploadId: string) => {
      if (data.limitReached) {
        toast({
          title: "Daily Message Limit Reached",
          description: `Sent ${data.sentCount} messages before hitting limit. ${data.remainingToProcess} messages remain. Please resume tomorrow.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "WhatsApp Messages Sent",
          description: `Successfully sent messages to ${data.sentCount} travelers`,
          variant: "default",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/agency/upload-batches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agency/whatsapp/daily-usage"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to send WhatsApp messages",
        variant: "destructive",
      });
    },
  });

  // Verify WhatsApp template
  const verifyTemplateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/agency/whatsapp/verify-template', {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Template Verified",
        description: data.message || "WhatsApp template is working correctly",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Template Error",
        description: error.message || "Failed to verify WhatsApp template",
        variant: "destructive",
      });
    },
  });

  const handleSendBatch = (uploadId: string) => {
    sendWhatsAppBatchMutation.mutate(uploadId);
  };

  const verifyTemplate = () => {
    verifyTemplateMutation.mutate();
  };

  const getStatusBadge = (status: string, sentCount: number, totalCount: number) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          All Sent ({sentCount}/{totalCount})
        </Badge>;
      case 'partial':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Partial ({sentCount}/{totalCount})
        </Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending (0/{totalCount})
        </Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Scheduler</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading upload batches...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Scheduler</h1>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-red-500">
                <Send className="h-12 w-12" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Error Loading Batches</h3>
                <p className="text-gray-500 mt-1">Failed to load upload batches. Please try again.</p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
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
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Scheduler</h1>
          <p className="text-gray-600 mt-1">Send WhatsApp messages to uploaded traveler data</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => verifyTemplate()}
            variant="outline"
            className="flex items-center gap-2"
            disabled={verifyTemplateMutation.isPending}
          >
            <MessageSquare className="h-4 w-4" />
            {verifyTemplateMutation.isPending ? 'Verifying...' : 'Verify Template'}
          </Button>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Daily Usage Stats */}
      {dailyUsage && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Daily WhatsApp Usage
              <Badge variant="outline" className="ml-auto">
                {dailyUsage.today}/{dailyUsage.estimatedLimit} messages
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">Messages sent today</span>
              </div>
              <span className="font-semibold text-blue-600">{dailyUsage.today}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span>{dailyUsage.percentage}% of daily limit</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    dailyUsage.percentage >= 90 ? 'bg-red-500' : 
                    dailyUsage.percentage >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, dailyUsage.percentage)}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Remaining: {dailyUsage.remaining} messages</span>
              <span>Resets: {dailyUsage.resetTime}</span>
            </div>

            {dailyUsage.percentage >= 90 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800">Near Daily Limit</p>
                    <p className="text-red-700">You're close to your daily message limit. Consider waiting until tomorrow to send more messages.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!uploadBatches || uploadBatches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex flex-col items-center space-y-4">
              <Send className="h-12 w-12 text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">No Upload Batches Found</h3>
                <p className="text-gray-500 mt-1">Upload traveler data first to schedule WhatsApp messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(uploadBatches || []).filter(batch => batch && batch.uploadId).map((batch) => (
            <Card key={batch.uploadId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Upload Date: {format(new Date(batch.uploadDate), 'PPP')}
                  </CardTitle>
                  {getStatusBadge(batch.whatsappStatus, batch.sentCount, batch.travelerCount)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Traveler Count with Progress */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Travelers</p>
                      <p className="text-lg font-bold text-blue-600">{batch.travelerCount}</p>
                      {batch.whatsappStatus === 'partial' && (
                        <div className="mt-1">
                          <div className="text-xs text-gray-600">
                            {batch.sentCount}/{batch.travelerCount} sent ({batch.progressPercentage || Math.round((batch.sentCount / batch.travelerCount) * 100)}%)
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${batch.progressPercentage || Math.round((batch.sentCount / batch.travelerCount) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Routes */}
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Routes</p>
                      <p className="text-sm text-gray-600">
                        {(batch.routes && batch.routes.length > 0) ? batch.routes.join(', ') : 'No routes'}
                      </p>
                    </div>
                  </div>

                  {/* Coupons */}
                  <div className="flex items-center space-x-3">
                    <Gift className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Coupons</p>
                      <p className="text-sm text-gray-600">
                        {(batch.coupons && batch.coupons.length > 0) ? batch.coupons.join(', ') : 'No coupons'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Daily Limit Warning for Partial Batches */}
                {batch.whatsappStatus === 'partial' && batch.failedCount && batch.failedCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-amber-600">
                        <AlertTriangle className="h-5 w-5 mt-0.5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-amber-800">Batch Partially Complete</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          {batch.pendingCount || (batch.travelerCount - batch.sentCount)} messages remain to be sent. 
                          If you hit the daily limit, please try again tomorrow when the limit resets.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => handleSendBatch(batch.uploadId)}
                    disabled={sendWhatsAppBatchMutation.isPending || batch.whatsappStatus === 'sent'}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendWhatsAppBatchMutation.isPending ? 'Sending...' : 
                     batch.whatsappStatus === 'sent' ? 'All Sent' :
                     batch.whatsappStatus === 'partial' ? `Resume Batch (${batch.pendingCount || (batch.travelerCount - batch.sentCount)} remaining)` :
                     'Send WhatsApp to All'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}