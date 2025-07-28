import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Send, Image, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function WhatsAppTest() {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("9035580937");
  const [message, setMessage] = useState("bsl_image");
  const [imageUrl, setImageUrl] = useState("https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg");
  const [testResult, setTestResult] = useState<any>(null);

  // Predefined template messages that work with your account
  const templateMessages = [
    {
      name: "BSL Image Template",
      text: "bsl_image",
      description: "Standard image template for testing"
    },
    {
      name: "BSL Text Template", 
      text: "bsl_text",
      description: "Standard text template for testing"
    },
    {
      name: "Custom Test Message",
      text: "Test message from TravelFlow WhatsApp API",
      description: "Custom message (may require template approval)"
    }
  ];

  const testWhatsAppMutation = useMutation({
    mutationFn: async ({ phoneNumber, message, imageUrl }: { phoneNumber: string; message?: string; imageUrl?: string }) => {
      return await apiRequest('/api/test/bhash-whatsapp', {
        method: 'POST',
        body: { phoneNumber, message, imageUrl }
      });
    },
    onSuccess: (data: any) => {
      setTestResult(data);
      toast({
        title: data.success ? "WhatsApp Test Completed" : "WhatsApp Test Issue",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "WhatsApp Test Failed",
        description: error.message || "Failed to send test message",
        variant: "destructive",
      });
    },
  });

  const handleSendTest = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }

    testWhatsAppMutation.mutate({
      phoneNumber,
      message: message.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined
    });
  };

  const handleQuickTest = () => {
    testWhatsAppMutation.mutate({
      phoneNumber: "9035580937",
      message: "bsl_image",
      imageUrl: "https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg"
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WhatsApp API Test</h1>
        <p className="text-muted-foreground">
          Test WhatsApp message sending using the BhashSMS API with your credentials
        </p>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Test Instructions:</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Use "bsl_image" as the message text for template compliance</li>
            <li>• Your phone number (9035580937) is pre-filled for testing</li>
            <li>• The image URL is set to the test image you provided</li>
            <li>• Click "Quick Test" for instant testing with approved template</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Send Test Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="10-digit phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter 10-digit Indian mobile number (without +91)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {templateMessages.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage(template.text)}
                      className="text-xs"
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
                <Textarea
                  id="message"
                  placeholder="Enter your test message or click a template above"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Image URL (Optional)
              </Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImageUrl("https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg")}
                    className="text-xs"
                  >
                    Test Image 1
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImageUrl("https://via.placeholder.com/400x300.png?text=Test+Image")}
                    className="text-xs"
                  >
                    Placeholder Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImageUrl("")}
                    className="text-xs"
                  >
                    Clear Image
                  </Button>
                </div>
                <Input
                  id="image"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSendTest}
                disabled={testWhatsAppMutation.isPending}
                className="flex-1"
              >
                {testWhatsAppMutation.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleQuickTest}
                disabled={testWhatsAppMutation.isPending}
              >
                Quick Test
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            {testResult ? (
              <div className="space-y-4">
                <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                      {testResult.message}
                    </AlertDescription>
                  </div>
                </Alert>

                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Phone Number:</strong> {testResult.phoneNumber}
                  </div>
                  {testResult.apiResponse && (
                    <div>
                      <strong>API Response:</strong> {testResult.apiResponse}
                    </div>
                  )}
                  {testResult.sentMessage && (
                    <div>
                      <strong>Message:</strong> {testResult.sentMessage}
                    </div>
                  )}
                  {testResult.imageUrl && (
                    <div>
                      <strong>Image URL:</strong> 
                      <a href={testResult.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">
                        View Image
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No test results yet. Send a test message to see the response.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>API Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div><strong>API Endpoint:</strong> http://bhashsms.com/api/sendmsgutil.php</div>
              <div><strong>User:</strong> BhashWapAi</div>
              <div><strong>Sender:</strong> BUZWAP</div>
              <div><strong>Priority:</strong> wa (WhatsApp)</div>
              <div><strong>Type:</strong> normal</div>
            </div>
            <div className="space-y-2">
              <div><strong>Successful Response:</strong> S.{"{message_id}"}</div>
              <div><strong>Failed Response:</strong> Error message text</div>
              <div><strong>Template Support:</strong> Utility & Authentication</div>
              <div><strong>Image Support:</strong> Yes (htype=image)</div>
            </div>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> Your BhashSMS account only supports approved templates. 
              Use "bsl_image" for image messages or "bsl_text" for text-only messages to ensure delivery.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}