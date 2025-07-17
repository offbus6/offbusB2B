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

export default function UploadData() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedBusId, setSelectedBusId] = useState<string>("");
  const [travelDate, setTravelDate] = useState<string>("");
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
    
    if (!selectedBusId || !travelDate || !selectedFile) {
      toast({
        title: "Error",
        description: "Please fill all fields and select a file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("busId", selectedBusId);
    formData.append("travelDate", travelDate);

    uploadDataMutation.mutate(formData);
  };

  if (isLoading || busesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user?.agency || user.agency.status !== "approved") {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--airbnb-gray)]">
          Your agency needs to be approved before you can upload data.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Processed", className: "bg-green-100 text-green-800" },
      processing: { label: "Processing", className: "bg-yellow-100 text-yellow-800" },
      failed: { label: "Failed", className: "bg-red-100 text-red-800" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--airbnb-dark)] mb-2">
          Upload Traveler Data
        </h2>
        <p className="text-[var(--airbnb-gray)]">
          Upload daily traveler information for WhatsApp automation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <Card className="airbnb-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-[var(--airbnb-dark)]">
              Upload Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="bus-select" className="text-sm font-medium text-[var(--airbnb-dark)]">
                  Select Bus
                </Label>
                <Select value={selectedBusId} onValueChange={setSelectedBusId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a bus..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buses?.map((bus: any) => (
                      <SelectItem key={bus.id} value={bus.id.toString()}>
                        {bus.number} ({bus.route})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="travel-date" className="text-sm font-medium text-[var(--airbnb-dark)]">
                  Travel Date
                </Label>
                <Input
                  id="travel-date"
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-[var(--airbnb-dark)]">
                  Upload File
                </Label>
                <div className="mt-2">
                  <FileUpload onFileSelect={setSelectedFile} />
                </div>
              </div>

              <div className="bg-[var(--airbnb-light)] rounded-lg p-4">
                <h4 className="font-medium text-[var(--airbnb-dark)] mb-2">
                  Required CSV Format:
                </h4>
                <ul className="text-sm text-[var(--airbnb-gray)] space-y-1">
                  <li>• Traveler Name</li>
                  <li>• Phone Number</li>
                  <li>• Travel Date</li>
                  <li>• Coupon Code</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white"
                disabled={uploadDataMutation.isPending}
              >
                {uploadDataMutation.isPending ? "Uploading..." : "Upload Data & Trigger WhatsApp"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Upload History */}
        <Card className="airbnb-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-[var(--airbnb-dark)]">
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !uploadHistory || uploadHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--airbnb-gray)]">No uploads yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {uploadHistory.slice(0, 10).map((upload: any) => (
                  <div key={upload.id} className="border border-[var(--airbnb-border)] rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-[var(--airbnb-dark)]">
                          {upload.fileName}
                        </h4>
                        <p className="text-sm text-[var(--airbnb-gray)]">
                          {upload.travelerCount} travelers
                        </p>
                      </div>
                      {getStatusBadge(upload.status)}
                    </div>
                    <div className="text-sm text-[var(--airbnb-gray)]">
                      <div className="flex justify-between">
                        <span>Upload Date:</span>
                        <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
