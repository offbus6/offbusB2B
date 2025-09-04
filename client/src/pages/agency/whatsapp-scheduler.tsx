import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin, Gift, Send, CheckCircle, Clock, RefreshCw, MessageSquare, AlertTriangle, RotateCcw } from "lucide-react";
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

  // Track loading state for each batch separately
  const [loadingBatches, setLoadingBatches] = useState<Set<string>>(new Set());
  const [retryingBatches, setRetryingBatches] = useState<Set<string>>(new Set());

  // Send WhatsApp to all travelers in a batch
  const sendWhatsAppBatchMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      setLoadingBatches(prev => new Set(prev).add(uploadId));
      return await apiRequest(`/api/agency/whatsapp/send-batch/${uploadId}`, {
        method: 'POST'
      });
    },
    onSuccess: (data: any, uploadId: string) => {
      setLoadingBatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
      
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
    },
    onError: (error: any, uploadId: string) => {
      setLoadingBatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
      
      toast({
        title: "Error", 
        description: error.message || "Failed to send WhatsApp messages",
        variant: "destructive",
      });
    },
  });

  // Retry failed WhatsApp messages in a batch
  const retryFailedMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      setRetryingBatches(prev => new Set(prev).add(uploadId));
      return await apiRequest(`/api/agency/whatsapp/retry-failed/${uploadId}`, {
        method: 'POST'
      });
    },
    onSuccess: (data: any, uploadId: string) => {
      setRetryingBatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
      
      toast({
        title: "Retry Complete",
        description: `Retry complete: ${data.retriedCount} successful, ${data.stillFailedCount} still failed`,
        variant: data.retriedCount > 0 ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agency/upload-batches"] });
    },
    onError: (error: any, uploadId: string) => {
      setRetryingBatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
      
      toast({
        title: "Retry Error", 
        description: error.message || "Failed to retry failed messages",
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

  const handleRetryFailed = (uploadId: string) => {
    retryFailedMutation.mutate(uploadId);
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

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  {/* Retry Failed Button - Show if there are failed messages */}
                  {(batch.failedCount || 0) > 0 && (
                    <Button
                      onClick={() => handleRetryFailed(batch.uploadId)}
                      disabled={retryingBatches.has(batch.uploadId)}
                      variant="outline"
                      className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                      data-testid={`button-retry-failed-${batch.uploadId}`}
                    >
                      <RotateCcw className="h-4 w-4" />
                      {retryingBatches.has(batch.uploadId) ? 'Retrying...' : `Retry Failed (${batch.failedCount})`}
                    </Button>
                  )}
                  
                  {/* Main Send Button */}
                  <Button
                    onClick={() => handleSendBatch(batch.uploadId)}
                    disabled={loadingBatches.has(batch.uploadId) || batch.whatsappStatus === 'sent'}
                    className="flex items-center gap-2"
                    data-testid={`button-send-whatsapp-${batch.uploadId}`}
                  >
                    <Send className="h-4 w-4" />
                    {loadingBatches.has(batch.uploadId) ? 'Sending...' : 
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