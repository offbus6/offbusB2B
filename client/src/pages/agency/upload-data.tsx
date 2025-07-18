import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileUpload from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { Upload, Calendar, Bus, Tag, Globe } from "lucide-react";

export default function UploadData() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedBusId, setSelectedBusId] = useState<string>("");
  const [travelDate, setTravelDate] = useState<string>("");
  const [couponCode, setCouponCode] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: buses, isLoading: busesLoading } = useQuery({
    queryKey: ["/api/buses"],
    retry: false,
  });

  const { data: uploadHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/upload-history"],
    retry: false,
  });

  const uploadDataMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/traveler-data/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/upload-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/traveler-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/agency"] });
      
      setSelectedBusId("");
      setTravelDate("");
      setCouponCode("");
      setSelectedFile(null);
      
      toast({
        title: "Success",
        description: `Data uploaded successfully! ${data.count} travelers processed.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to upload data",
        variant: "destructive",
      });
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBusId || !travelDate || !selectedFile || !couponCode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("busId", selectedBusId);
    formData.append("travelDate", travelDate);
    formData.append("couponCode", couponCode);

    uploadDataMutation.mutate(formData);
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Upload Travelers Data</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Upload Excel/CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bus Selection */}
              <div className="space-y-2">
                <Label htmlFor="bus-select" className="flex items-center">
                  <Bus className="mr-2 h-4 w-4" />
                  Select Bus
                </Label>
                <Select value={selectedBusId} onValueChange={setSelectedBusId}>
                  <SelectTrigger id="bus-select">
                    <SelectValue placeholder="Choose a bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses?.map((bus: any) => (
                      <SelectItem key={bus.id} value={bus.id.toString()}>
                        {bus.name} - {bus.fromLocation} to {bus.toLocation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Travel Date */}
              <div className="space-y-2">
                <Label htmlFor="travel-date" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Travel Date
                </Label>
                <Input
                  id="travel-date"
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Coupon Code */}
              <div className="space-y-2">
                <Label htmlFor="coupon-code" className="flex items-center">
                  <Tag className="mr-2 h-4 w-4" />
                  Coupon Code
                </Label>
                <Input
                  id="coupon-code"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code (e.g., SAVE20, DISCOUNT15)"
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  This coupon will be applied to all travelers in the uploaded file
                </p>
              </div>

              {/* Website URL Display */}
              {user?.agency?.website && (
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Globe className="mr-2 h-4 w-4" />
                    Coupon Website
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm text-gray-600">Travelers can use this coupon at:</p>
                    <a 
                      href={user.agency.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {user.agency.website}
                    </a>
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload File</Label>
                <FileUpload
                  accept=".xlsx,.xls,.csv"
                  onFileSelect={handleFileChange}
                  maxSize={10 * 1024 * 1024} // 10MB
                />
                <p className="text-sm text-gray-500">
                  Supported formats: Excel (.xlsx, .xls) or CSV (.csv)
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                disabled={uploadDataMutation.isPending || !selectedBusId || !travelDate || !selectedFile || !couponCode}
              >
                {uploadDataMutation.isPending ? "Uploading..." : "Upload Data"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Upload Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>File Format Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Excel/CSV Structure:</h4>
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <p className="font-medium">Required columns:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><code>traveler_name</code> - Full name of the traveler</li>
                  <li><code>phone</code> - Contact phone number</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Sample Data:</h4>
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">traveler_name</th>
                      <th className="text-left p-1">phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1">John Doe</td>
                      <td className="p-1">+1-555-0123</td>
                    </tr>
                    <tr>
                      <td className="p-1">Jane Smith</td>
                      <td className="p-1">+1-555-0456</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Notes:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>The coupon code will be automatically applied to all travelers</li>
                <li>Travel date and bus selection apply to all travelers in the file</li>
                <li>Phone numbers should include country code for WhatsApp integration</li>
                <li>Maximum file size: 10MB</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : uploadHistory && uploadHistory.length > 0 ? (
            <div className="space-y-2">
              {uploadHistory.map((upload: any) => (
                <div key={upload.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{upload.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {upload.travelerCount} travelers • {new Date(upload.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={upload.status === 'completed' ? 'default' : 'secondary'}>
                    {upload.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upload history found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}