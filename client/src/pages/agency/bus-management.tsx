import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBusSchema } from "@shared/schema";
import { Plus, Edit, Trash2 } from "lucide-react";
import { z } from "zod";

const busFormSchema = insertBusSchema.omit({ agencyId: true });

export default function BusManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<any>(null);

  const form = useForm<z.infer<typeof busFormSchema>>({
    resolver: zodResolver(busFormSchema),
    defaultValues: {
      number: "",
      route: "",
      departureTime: "",
      arrivalTime: "",
    },
  });

  const { data: buses, isLoading: busesLoading } = useQuery({
    queryKey: ["/api/buses"],
    retry: false,
  });

  const createBusMutation = useMutation({
    mutationFn: async (data: z.infer<typeof busFormSchema>) => {
      await apiRequest("POST", "/api/buses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buses"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingBus(null);
      toast({
        title: "Success",
        description: "Bus created successfully",
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
        description: "Failed to create bus",
        variant: "destructive",
      });
    },
  });

  const updateBusMutation = useMutation({
    mutationFn: async (data: z.infer<typeof busFormSchema>) => {
      await apiRequest("PATCH", `/api/buses/${editingBus.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buses"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingBus(null);
      toast({
        title: "Success",
        description: "Bus updated successfully",
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
        description: "Failed to update bus",
        variant: "destructive",
      });
    },
  });

  const deleteBusMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/buses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buses"] });
      toast({
        title: "Success",
        description: "Bus deleted successfully",
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
        description: "Failed to delete bus",
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

  const onSubmit = async (data: z.infer<typeof busFormSchema>) => {
    if (editingBus) {
      updateBusMutation.mutate(data);
    } else {
      createBusMutation.mutate(data);
    }
  };

  const handleEdit = (bus: any) => {
    setEditingBus(bus);
    form.reset({
      number: bus.number,
      route: bus.route,
      departureTime: bus.departureTime,
      arrivalTime: bus.arrivalTime,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this bus?")) {
      deleteBusMutation.mutate(id);
    }
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
          Your agency needs to be approved before you can manage buses.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-[var(--airbnb-dark)] mb-2">
              Bus Management
            </h2>
            <p className="text-[var(--airbnb-gray)]">
              Manage your bus fleet and routes
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90 text-white"
                onClick={() => {
                  setEditingBus(null);
                  form.reset();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Bus
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingBus ? "Edit Bus" : "Add New Bus"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bus Number</FormLabel>
                        <FormControl>
                          <Input placeholder="MH-12-AB-3456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="route"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Route</FormLabel>
                        <FormControl>
                          <Input placeholder="Mumbai → Pune" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="departureTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="arrivalTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrival Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-[var(--airbnb-primary)] hover:bg-[var(--airbnb-primary)]/90"
                    disabled={createBusMutation.isPending || updateBusMutation.isPending}
                  >
                    {editingBus ? "Update Bus" : "Create Bus"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Buses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!buses || buses.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <p className="text-[var(--airbnb-gray)]">No buses found. Add your first bus!</p>
          </div>
        ) : (
          buses.map((bus: any) => (
            <Card key={bus.id} className="airbnb-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--airbnb-dark)]">
                      {bus.number}
                    </h3>
                    <p className="text-[var(--airbnb-gray)]">{bus.route}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(bus)}
                      className="text-[var(--airbnb-primary)] hover:text-[var(--airbnb-dark)]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bus.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--airbnb-gray)]">Departure Time:</span>
                    <span className="text-[var(--airbnb-dark)] font-medium">
                      {bus.departureTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--airbnb-gray)]">Arrival Time:</span>
                    <span className="text-[var(--airbnb-dark)] font-medium">
                      {bus.arrivalTime}
                    </span>
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
