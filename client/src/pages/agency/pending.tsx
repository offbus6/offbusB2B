import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AgencyPending() {
  const { user } = useAuth();
  const agency = (user as any)?.agency;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return "Your agency registration is still under approval. Please wait 24 hours for processing. To expedite your approval, please call +91 9900408888.";
      case 'approved':
        return "Congratulations! Your agency has been approved. You can now access all travel agency features.";
      case 'rejected':
        return "Unfortunately, your agency registration has been rejected. Please contact support for more information.";
      default:
        return "Status unknown. Please contact support.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--airbnb-light)] to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md airbnb-shadow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon(agency?.status || 'pending')}
          </div>
          <CardTitle className="text-2xl font-bold text-[var(--airbnb-dark)]">
            {agency?.status === 'pending' ? 'Registration Pending' : 
             agency?.status === 'approved' ? 'Agency Approved' : 
             'Registration Status'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-[var(--airbnb-gray)] mb-4">
              {getStatusMessage(agency?.status || 'pending')}
            </p>
            
            {agency?.status === 'pending' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Need Faster Approval?</h4>
                <p className="text-blue-700 text-sm mb-2">
                  For urgent approval or any questions, contact our support team:
                </p>
                <div className="flex items-center justify-center">
                  <Button 
                    onClick={() => window.open('tel:+919900408888', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    📞 Call +91 9900408888
                  </Button>
                </div>
              </div>
            )}
            
            {agency && (
              <div className="bg-[var(--airbnb-light)] p-4 rounded-lg text-left">
                <h3 className="font-semibold text-[var(--airbnb-dark)] mb-2">Agency Details:</h3>
                <p><strong>Name:</strong> {agency.name}</p>
                <p><strong>Email:</strong> {agency.email}</p>
                <p><strong>Contact:</strong> {agency.contactPerson}</p>
                <p><strong>Phone:</strong> {agency.phone}</p>
                <p><strong>Location:</strong> {agency.city}, {agency.state}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    agency.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    agency.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {agency.status}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex-1"
            >
              Logout
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90"
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}