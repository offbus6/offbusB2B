
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { theme } from "@/lib/theme";
import { 
  Bell, 
  CheckCircle, 
  Building, 
  CreditCard, 
  AlertTriangle,
  MarkAsRead
} from "lucide-react";

export default function AdminNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to mark as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'agency_registration':
        return <Building className="w-5 h-5 text-blue-600" />;
      case 'payment_overdue':
        return <CreditCard className="w-5 h-5 text-red-600" />;
      case 'payment_reminder':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'agency_registration':
        return 'bg-blue-50 border-blue-200';
      case 'payment_overdue':
        return 'bg-red-50 border-red-200';
      case 'payment_reminder':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[var(--airbnb-dark)]">Notifications</h2>
          <p className="text-[var(--airbnb-gray)]">Stay updated with system activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {notifications.filter((n: any) => !n.isRead).length} unread
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="airbnb-shadow">
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-[var(--airbnb-gray)] mx-auto mb-4" />
              <p className="text-[var(--airbnb-gray)]">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification: any) => (
            <Card 
              key={notification.id} 
              className={`airbnb-shadow transition-all ${getNotificationColor(notification.type)} ${
                !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`font-semibold ${!notification.isRead ? 'text-[var(--airbnb-dark)]' : 'text-[var(--airbnb-gray)]'}`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-[var(--airbnb-gray)] mb-2">
                        {notification.message}
                      </p>
                      <p className="text-sm text-[var(--airbnb-gray)]">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
