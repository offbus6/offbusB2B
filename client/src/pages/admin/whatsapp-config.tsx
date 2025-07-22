import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Settings, Plus, Edit, Trash2, Save, Calendar, Users, TestTube } from "lucide-react";

const whatsappConfigSchema = z.object({
  provider: z.enum(["business_api", "twilio", "messagebird", "other"]),
  apiKey: z.string().min(1, "API Key is required"),
  apiSecret: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  webhookUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  dayTrigger: z.number().min(1, "Day trigger must be at least 1"),
  message: z.string().min(1, "Message is required"),
  isActive: z.boolean().default(true),
});

type WhatsappConfigData = z.infer<typeof whatsappConfigSchema>;
type TemplateData = z.infer<typeof templateSchema>;

export default function WhatsappConfig() {
  const { toast } = useToast();
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const configForm = useForm<WhatsappConfigData>({
    resolver: zodResolver(whatsappConfigSchema),
    defaultValues: {
      provider: "business_api",
      apiKey: "",
      apiSecret: "",
      phoneNumber: "",
      webhookUrl: "",
      isActive: true,
    },
  });

  const templateForm = useForm<TemplateData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      dayTrigger: 30,
      message: "",
      isActive: true,
    },
  });

  const { data: whatsappConfig, isLoading: configLoading } = useQuery({
    queryKey: ["/api/admin/whatsapp-config"],
    retry: false,
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/admin/whatsapp-templates"],
    retry: false,
  });

  const { data: queueStats } = useQuery({
    queryKey: ["/api/admin/whatsapp-queue/stats"],
    retry: false,
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: WhatsappConfigData) => {
      await apiRequest("/api/admin/whatsapp-config", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp-config"] });
      setIsConfigDialogOpen(false);
      toast({
        title: "Success",
        description: "WhatsApp configuration saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save WhatsApp configuration",
        variant: "destructive",
      });
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: TemplateData) => {
      const url = editingTemplate 
        ? `/api/admin/whatsapp-templates/${editingTemplate.id}`
        : "/api/admin/whatsapp-templates";
      const method = editingTemplate ? "PATCH" : "POST";

      await apiRequest(url, {
        method,
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp-templates"] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      templateForm.reset();
      toast({
        title: "Success",
        description: `Template ${editingTemplate ? 'updated' : 'created'} successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/admin/whatsapp-templates/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp-templates"] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const testMessageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/admin/whatsapp-test", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test message sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test message",
        variant: "destructive",
      });
    },
  });

  const onConfigSubmit = (data: WhatsappConfigData) => {
    saveConfigMutation.mutate(data);
  };

  const onTemplateSubmit = (data: TemplateData) => {
    saveTemplateMutation.mutate(data);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    templateForm.reset({
      name: template.name,
      dayTrigger: template.dayTrigger,
      message: template.message,
      isActive: template.isActive,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const variableHelpers = [
    { variable: "{{traveler_name}}", description: "Traveler's name" },
    { variable: "{{agency_name}}", description: "Travel agency name" },
    { variable: "{{bus_name}}", description: "Bus name" },
    { variable: "{{route}}", description: "From -> To route" },
    { variable: "{{travel_date}}", description: "Travel date" },
    { variable: "{{coupon_code}}", description: "Coupon code" },
    { variable: "{{coupon_link}}", description: "Coupon redemption link" },
    { variable: "{{phone}}", description: "Traveler's phone number" },
    { variable: "{{days_since_travel}}", description: "Days since travel" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--airbnb-dark)]">WhatsApp Configuration</h1>
          <p className="text-[var(--airbnb-gray)] mt-2">
            Configure WhatsApp API and manage automated message templates
          </p>
        </div>
        <Button onClick={() => setIsConfigDialogOpen(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Configure API
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-[var(--airbnb-primary)]" />
              <div>
                <p className="text-sm text-[var(--airbnb-gray)]">Total Messages</p>
                <p className="text-2xl font-bold">{queueStats?.totalMessages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-[var(--airbnb-gray)]">Pending</p>
                <p className="text-2xl font-bold">{queueStats?.pendingMessages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-[var(--airbnb-gray)]">Sent</p>
                <p className="text-2xl font-bold">{queueStats?.sentMessages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-red-500" />
              <div>
                <p className="text-sm text-[var(--airbnb-gray)]">Failed</p>
                <p className="text-2xl font-bold">{queueStats?.failedMessages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">API Configuration</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="queue">Message Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Current API Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {whatsappConfig ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Provider</Label>
                      <p className="text-sm bg-gray-100 p-2 rounded">{whatsappConfig.provider}</p>
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <p className="text-sm bg-gray-100 p-2 rounded">{whatsappConfig.phoneNumber}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="flex items-center space-x-2">
                        <Badge variant={whatsappConfig.isActive ? "default" : "secondary"}>
                          {whatsappConfig.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => setIsConfigDialogOpen(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Configuration
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => testMessageMutation.mutate()}
                      disabled={testMessageMutation.isPending}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No WhatsApp API configuration found</p>
                  <Button onClick={() => setIsConfigDialogOpen(true)} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Configuration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Message Templates</CardTitle>
                <Button onClick={() => setIsTemplateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates && templates.length > 0 ? (
                <div className="space-y-4">
                  {templates.map((template: any) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            Day {template.dayTrigger}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--airbnb-gray)] mb-2">
                        <strong>Subject:</strong> {template.subject}
                      </p>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {template.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No message templates found</p>
                  <Button onClick={() => setIsTemplateDialogOpen(true)} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variable Helper */}
          <Card>
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {variableHelpers.map((helper) => (
                  <div key={helper.variable} className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {helper.variable}
                    </code>
                    <span className="text-sm text-[var(--airbnb-gray)]">
                      {helper.description}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Message Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Message queue management will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* WhatsApp Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>WhatsApp API Configuration</DialogTitle>
          </DialogHeader>
          <Form {...configForm}>
            <form onSubmit={configForm.handleSubmit(onConfigSubmit)} className="space-y-4">
              <FormField
                control={configForm.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select WhatsApp provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="business_api">WhatsApp Business API</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="messagebird">MessageBird</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your API key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="apiSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Secret (Optional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your API secret" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-domain.com/webhook" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Active</FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveConfigMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
                    Create automated WhatsApp message templates. WhatsApp messages only contain text content (no subject line like emails).
                  </DialogDescription>
          </DialogHeader>
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={templateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 30 Day Follow-up" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={templateForm.control}
                  name="dayTrigger"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days After Travel</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="30" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={templateForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Message Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your WhatsApp message content..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Use variables like {{traveler_name}}, {{agency_name}}, {{coupon_code}}, {{travel_date}}. WhatsApp messages are text-only (no subject line).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Active</FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsTemplateDialogOpen(false);
                  setEditingTemplate(null);
                  templateForm.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveTemplateMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}