import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Send, Users, CheckCircle, Clock, AlertTriangle, Image, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@radix-ui/react-label";

export default function WhatsAppTesting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Single message testing state
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testImageUrl, setTestImageUrl] = useState("");
  const [selectedAgencyForBulk, setSelectedAgencyForBulk] = useState("");

  // Bulk testing state
  const [bulkMessage, setBulkMessage] = useState("");

  // Fetch agencies for bulk testing
  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ["/api/admin/agencies"],
  });

  // Fetch user data to show WhatsApp status
  const { data: userData, isLoading: userDataLoading } = useQuery({
    queryKey: ["/api/admin/user-data"],
  });

  // Single message test mutation
  const testWhatsAppMutation = useMutation({
    mutationFn: async ({ phoneNumber, message, agencyName, imageUrl }: { phoneNumber: string; message?: string; agencyName?: string; imageUrl?: string }) => {
      return await apiRequest('/api/admin/whatsapp/test', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, message, agencyName, imageUrl }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-data"] });
      toast({
        title: data.success ? "WhatsApp Test Completed" : "WhatsApp Test Issue",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      if (data.success) {
        setTestPhoneNumber("");
        setTestMessage("");
        setTestImageUrl("");
      }
    },
    onError: (error: any) => {
      toast({
        title: "WhatsApp Test Failed",
        description: error.message || "Failed to send test message",
        variant: "destructive",
      });
    },
  });

  // Bulk message test mutation
  const bulkTestWhatsAppMutation = useMutation({
    mutationFn: async ({ agencyId, message }: { agencyId: number; message?: string }) => {
      return await apiRequest('/api/admin/whatsapp/bulk-test', {
        method: 'POST',
        body: JSON.stringify({ agencyId, message }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-data"] });
      toast({
        title: "Bulk WhatsApp Test Completed",
        description: `${data.message}. Agency: ${data.agencyName}`,
      });
      setSelectedAgencyForBulk("");
      setBulkMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Bulk WhatsApp Test Failed",
        description: error.message || "Failed to send bulk messages",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'template_required':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />Template Required</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (agenciesLoading || userDataLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>;
  }

  const travelerStats = Array.isArray(userData) ? userData.reduce((acc: any, traveler: any) => {
    const status = traveler.whatsappStatus || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) : {};

  const filteredTravelers = Array.isArray(userData) ? userData.filter((traveler: any) => 
    traveler.agencyName?.toLowerCase().includes('intercity') || 
    traveler.phone?.includes('9900408817') || 
    traveler.phone?.includes('8088635590')
  ) : [];

    const handleTestMessage = () => {
    if (!testPhoneNumber) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }

    testWhatsAppMutation.mutate({
      phoneNumber: testPhoneNumber,
      message: testMessage,
      agencyName: "TravelFlow Admin",
      imageUrl: testImageUrl
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--airbnb-dark)]">WhatsApp Testing</h1>
          <p className="text-gray-600 mt-2">Test WhatsApp message delivery using BhashSMS API</p>
        </div>
      </div>

      {/* API Status Alert */}
      <Alert className="border-yellow-500 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>BhashSMS API Status:</strong> Currently requires approved message templates. 
          Template setup needed for production WhatsApp messaging. Contact BhashSMS support to activate templates.
        </AlertDescription>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-green-600">{travelerStats.sent || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{travelerStats.failed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-600">{travelerStats.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Template Required</p>
                <p className="text-2xl font-bold text-yellow-600">{travelerStats.template_required || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Message Test</TabsTrigger>
          <TabsTrigger value="database">Database User Test</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Agency Test</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Single WhatsApp Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  placeholder="Leave empty for default template message..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={6}
                />
              </div>
                            <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (optional)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={testImageUrl}
                    onChange={(e) => setTestImageUrl(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Test with sample image: https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg
                  </p>
                </div>

                <Button 
                  onClick={handleTestMessage}
                  disabled={testWhatsAppMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {testWhatsAppMutation.isPending ? "Sending..." : testImageUrl ? "Send Test Message with Image" : "Send Test Message"}
                  {testImageUrl ? <Image className="ml-2 h-4 w-4" /> : <Send className="ml-2 h-4 w-4" />}
                </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Bulk Agency WhatsApp Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Agency</label>
                <Select value={selectedAgencyForBulk} onValueChange={setSelectedAgencyForBulk}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose agency..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(agencies) && agencies.map((agency: any) => (
                      <SelectItem key={agency.id} value={agency.id.toString()}>
                        {agency.name} ({Array.isArray(userData) ? userData.filter((u: any) => u.agencyId === agency.id).length : 0} travelers)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Custom Message (Optional)</label>
                <Textarea
                  placeholder="Leave empty for personalized messages with traveler names and coupon codes..."
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  rows={6}
                />
              </div>
              <Button
                onClick={() => bulkTestWhatsAppMutation.mutate({ 
                  agencyId: parseInt(selectedAgencyForBulk), 
                  message: bulkMessage || undefined
                })}
                disabled={!selectedAgencyForBulk || bulkTestWhatsAppMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {bulkTestWhatsAppMutation.isPending ? "Sending..." : "Send Bulk Messages"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intercity Travels - WhatsApp Status</CardTitle>
              <p className="text-sm text-gray-600">Testing data for Intercity Travels agency</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTravelers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Traveler</th>
                          <th className="text-left p-2 font-medium">Phone</th>
                          <th className="text-left p-2 font-medium">Agency</th>
                          <th className="text-left p-2 font-medium">Coupon</th>
                          <th className="text-left p-2 font-medium">WhatsApp Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTravelers.map((traveler: any) => (
                          <tr key={traveler.id} className="border-b">
                            <td className="p-2">{traveler.travelerName}</td>
                            <td className="p-2 font-mono">{traveler.phone}</td>
                            <td className="p-2">{traveler.agencyName}</td>
                            <td className="p-2">
                              <Badge variant="outline">{traveler.couponCode}</Badge>
                            </td>
                            <td className="p-2">
                              {getStatusBadge(traveler.whatsappStatus || 'pending')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No Intercity Travels data found</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertDescription>
                  <strong>Current API Endpoint:</strong> http://bhashsms.com/api/sendmsgutil.php
                  <br />
                  <strong>Credentials:</strong> user=BhashWapAi, pass=bwap@123$, sender=BUZWAP
                  <br />
                  <strong>Test Numbers:</strong> 9900408817 (Shubin), 8088635590 (Sukan)
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Manual API Test Command:</h4>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  curl "http://bhashsms.com/api/sendmsgutil.php?user=BhashWapAi&pass=bwap@123$&sender=BUZWAP&phone=9900408817&text=Test%20message&priority=wa&stype=normal"
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}