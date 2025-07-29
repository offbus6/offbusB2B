import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin, Gift, Send, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface UploadBatch {
  uploadId: string;
  uploadDate: string;
  travelerCount: number;
  routes: string[];
  coupons: string[];
  whatsappStatus: 'pending' | 'sent' | 'partial';
  sentCount: number;
  fileName?: string;
  busName?: string;
}

export default function WhatsAppScheduler() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch upload batches with WhatsApp status
  const { data: uploadBatches = [], isLoading, refetch } = useQuery<UploadBatch[]>({
    queryKey: ["/api/agency/upload-batches"],
    retry: false,
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: true, // Refresh when window gains focus
  });

  // Send WhatsApp to all travelers in a batch
  const sendWhatsAppBatchMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      return await apiRequest(`/api/agency/whatsapp/send-batch/${uploadId}`, {
        method: 'POST'
      });
    },
    onSuccess: (data: any, uploadId: string) => {
      toast({
        title: "WhatsApp Messages Sent",
        description: `Successfully sent messages to ${data.sentCount} travelers`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agency/upload-batches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send WhatsApp messages",
        variant: "destructive",
      });
    },
  });

  const handleSendBatch = (uploadId: string) => {
    sendWhatsAppBatchMutation.mutate(uploadId);
  };

  const getStatusBadge = (status: string, sentCount: number, totalCount: number) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Partial ({sentCount}/{totalCount})</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Scheduler</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
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

      {uploadBatches.length === 0 ? (
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
          {uploadBatches.map((batch) => (
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
                  {/* Traveler Count */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Travelers</p>
                      <p className="text-lg font-bold text-blue-600">{batch.travelerCount}</p>
                    </div>
                  </div>

                  {/* Routes */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Routes</p>
                      <p className="text-sm text-gray-600">
                        {batch.routes.length > 0 ? batch.routes.join(', ') : 'No routes'}
                      </p>
                    </div>
                  </div>

                  {/* Coupons */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                      <Gift className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Coupons</p>
                      <p className="text-sm text-gray-600">
                        {batch.coupons.length > 0 ? batch.coupons.join(', ') : 'No coupons'}
                      </p>
                    </div>
                  </div>
                </div>

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
                     batch.whatsappStatus === 'partial' ? 'Send Remaining' :
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