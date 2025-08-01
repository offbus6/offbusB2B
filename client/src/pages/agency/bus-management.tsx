import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Bus, Clock, MapPin, Users } from "lucide-react";
import { z } from "zod";

const busFormSchema = z.object({
  number: z.string().min(1, "Bus number is required"),
  name: z.string().min(1, "Bus name is required"),
  fromLocation: z.string().min(1, "From location is required"),
  toLocation: z.string().min(1, "To location is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  arrivalTime: z.string().min(1, "Arrival time is required"),
  busType: z.enum(["Seater", "Sleeper", "AC Seater", "AC Sleeper", "Seater and Sleeper"]),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  fare: z.string().min(1, "Fare is required"),
  amenities: z.string().optional(),
  imageUrl: z.string().optional(),
});

type BusFormData = z.infer<typeof busFormSchema>;

export default function BusManagement() {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<any>(null);

  const form = useForm<BusFormData>({
    resolver: zodResolver(busFormSchema),
    defaultValues: {
      number: "",
      name: "",
      fromLocation: "",
      toLocation: "",
      departureTime: "",
      arrivalTime: "",
      busType: "Seater",
      capacity: 30,
      fare: "",
      amenities: "",
      imageUrl: "",
    },
  });

  const { data: buses, isLoading: busesLoading } = useQuery({
    queryKey: ["/api/buses"],
    retry: false,
  });

  const createBusMutation = useMutation({
    mutationFn: async (data: BusFormData) => {
      const payload = {
        ...data,
        capacity: Number(data.capacity),
        amenities: data.amenities ? data.amenities.split(',').map(a => a.trim()) : [],
      };
      await apiRequest("/api/buses", {
        method: "POST",
        body: payload,
      });
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
      toast({
        title: "Error",
        description: "Failed to create bus",
        variant: "destructive",
      });
    },
  });

  const updateBusMutation = useMutation({
    mutationFn: async (data: BusFormData) => {
      const payload = {
        ...data,
        capacity: Number(data.capacity),
        amenities: data.amenities ? data.amenities.split(',').map(a => a.trim()) : [],
      };
      await apiRequest(`/api/buses/${editingBus.id}`, {
        method: "PUT",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buses"] });
      queryClient.refetchQueries({ queryKey: ["/api/buses"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingBus(null);
      toast({
        title: "Success",
        description: "Bus updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update bus",
        variant: "destructive",
      });
    },
  });

  const deleteBusMutation = useMutation({
    mutationFn: async (busId: number) => {
      await apiRequest("DELETE", `/api/buses/${busId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buses"] });
      toast({
        title: "Success",
        description: "Bus deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete bus",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: BusFormData) => {
    if (editingBus) {
      updateBusMutation.mutate(data);
    } else {
      createBusMutation.mutate(data);
    }
  };

  const handleEdit = (bus: any) => {
    setEditingBus(bus);
    form.reset({
      number: bus.number || "",
      name: bus.name || "",
      fromLocation: bus.fromLocation || "",
      toLocation: bus.toLocation || "",
      departureTime: bus.departureTime || "",
      arrivalTime: bus.arrivalTime || "",
      busType: bus.busType || "Seater",
      capacity: bus.capacity || 30,
      fare: bus.fare || "",
      amenities: Array.isArray(bus.amenities) ? bus.amenities.join(', ') : "",
      imageUrl: bus.imageUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingBus(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleDelete = (busId: number) => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      deleteBusMutation.mutate(busId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Bus Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Bus Management</h1>
        <Button 
          onClick={handleAddNew}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 text-lg"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add New Bus
        </Button>
      </div>

      {/* Bus List */}
      {busesLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buses?.map((bus: any) => (
            <Card key={bus.id} className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {bus.name || `Bus ${bus.number}`}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{bus.number}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(bus)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(bus.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="mr-2 h-4 w-4" />
                  {bus.fromLocation} → {bus.toLocation}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="mr-2 h-4 w-4" />
                  {bus.departureTime} - {bus.arrivalTime}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Bus className="mr-2 h-4 w-4" />
                  {bus.busType}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="mr-2 h-4 w-4" />
                  {bus.capacity} seats
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-semibold text-red-500">
                    ₹{bus.fare}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!buses || buses.length === 0) && (
            <div className="col-span-full text-center py-12">
              <Bus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No buses found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first bus.</p>
              <Button 
                onClick={handleAddNew}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Bus
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Bus Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingBus ? 'Edit Bus' : 'Add New Bus'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bus Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MH-01-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bus Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Golden Express" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Mumbai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="toLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Delhi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <FormField
                control={form.control}
                name="busType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bus Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bus type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Seater">Seater</SelectItem>
                        <SelectItem value="Sleeper">Sleeper</SelectItem>
                        <SelectItem value="AC Seater">AC Seater</SelectItem>
                        <SelectItem value="AC Sleeper">AC Sleeper</SelectItem>
                        <SelectItem value="Seater and Sleeper">Seater and Sleeper</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 45"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fare (₹)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amenities (comma separated)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., WiFi, AC, USB Charging, Reclining Seats"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/bus-image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-6 py-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createBusMutation.isPending || updateBusMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2"
                >
                  {createBusMutation.isPending || updateBusMutation.isPending ? 'Saving...' : (editingBus ? 'Update Bus' : 'Save Bus')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}