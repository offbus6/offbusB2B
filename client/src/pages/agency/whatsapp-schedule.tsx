
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MessageSquare, User, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function WhatsAppSchedule() {
  const { user } = useAuth();

  const { data: schedule, isLoading } = useQuery({
    queryKey: [`/api/whatsapp/schedule/agency/${user?.id}`],
    queryFn: () => apiRequest(`/api/whatsapp/schedule/agency/${user?.id}`),
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!user?.id
  });

  if (isLoading) {
    return <div className="p-6">Loading WhatsApp schedule...</div>;
  }

  const formatTimeUntil = (days: number) => {
    if (days < 0) return "Overdue";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">WhatsApp Message Schedule</h1>
        <Badge variant="outline" className="text-sm">
          {schedule?.count || 0} scheduled messages
        </Badge>
      </div>

      {schedule?.nextMessage && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Next Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Traveler</p>
                <p className="font-medium">{schedule.nextMessage.travelerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Scheduled For</p>
                <p className="font-medium">
                  {new Date(schedule.nextMessage.scheduledFor).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Template</p>
                <p className="font-medium">{schedule.nextMessage.templateName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Until Send</p>
                <p className="font-medium text-blue-600">
                  {formatTimeUntil(schedule.nextMessage.timeUntilSend)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <h2 className="text-xl font-semibold">All Scheduled Messages</h2>
        
        {!schedule?.schedule?.length ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No WhatsApp messages scheduled yet.</p>
              <p className="text-sm">Upload traveler data to automatically schedule messages.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {schedule.schedule.map((msg: any) => (
              <Card key={msg.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{msg.travelerName}</span>
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{msg.travelerPhone}</span>
                    </div>
                    <Badge className={getStatusColor(msg.status)}>
                      {msg.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Template</p>
                      <p className="font-medium">{msg.templateName}</p>
                      <p className="text-xs text-gray-500">Day {msg.dayTrigger}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Scheduled</p>
                      <p className="font-medium">
                        {new Date(msg.scheduledFor).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(msg.scheduledFor).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-medium">
                        {msg.status === 'pending' ? formatTimeUntil(msg.timeUntilSend) : msg.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-medium">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {msg.error && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Error:</strong> {msg.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
