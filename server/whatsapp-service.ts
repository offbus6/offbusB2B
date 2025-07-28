import { storage } from "./storage";
import type { TravelerData, WhatsappTemplate } from "@shared/schema";
import { securityMonitor } from "./security-monitor";

export interface WhatsappMessage {
  to: string;
  message: string;
  template: string;
}

export class WhatsappService {

  /**
   * Process dynamic variables in message templates
   */
  private processMessageTemplate(template: string, travelerData: TravelerData, agency: any, bus?: any): string {
    const variables = {
      '{{traveler_name}}': travelerData.travelerName || 'Traveler',
      '{{agency_name}}': agency?.name || 'Travel Agency',
      '{{bus_name}}': bus?.name || 'Bus Service',
      '{{route}}': bus ? `${bus.fromLocation} to ${bus.toLocation}` : 'Route',
      '{{travel_date}}': travelerData.travelDate ? new Date(travelerData.travelDate).toLocaleDateString() : 'Travel Date',
      '{{coupon_code}}': travelerData.couponCode || 'TRAVEL2024',
      '{{coupon_link}}': agency?.bookingWebsite || 'https://travelflow.com/coupon',
      '{{booking_website}}': agency?.bookingWebsite || 'https://travelflow.com/book',
      '{{phone}}': travelerData.phone || '',
      '{{days_since_travel}}': travelerData.travelDate ? 
        Math.floor((Date.now() - new Date(travelerData.travelDate).getTime()) / (1000 * 60 * 60 * 24)).toString() : '0',
    };

    let processedMessage = template;

    // Replace all variables
    Object.entries(variables).forEach(([variable, value]) => {
      processedMessage = processedMessage.replace(new RegExp(variable, 'g'), value);
    });

    // Add opt-out instructions to all messages
    processedMessage += '\n\nTo stop receiving these messages, reply with "STOP" or "UNSUBSCRIBE".';

    return processedMessage;
  }

  /**
   * Schedule WhatsApp messages for a traveler based on their upload date
   */
  async scheduleMessagesForTraveler(travelerId: number): Promise<void> {
    try {
      const travelerData = await storage.getTravelerData(travelerId);
      if (!travelerData) {
        throw new Error(`Traveler data not found for ID: ${travelerId}`);
      }

      const agency = await storage.getAgency(travelerData.agencyId);
      if (!agency) {
        throw new Error(`Agency not found for ID: ${travelerData.agencyId}`);
      }

      // Get all active templates
      const templates = await storage.getWhatsappTemplates();
      const activeTemplates = templates.filter(template => template.isActive);

      // Get bus information for better message templates
      const bus = await storage.getBus(travelerData.busId);

      // Schedule messages for each template
      for (const template of activeTemplates) {
        const uploadDate = new Date(travelerData.createdAt || new Date());
        const scheduledDate = new Date(uploadDate);
        scheduledDate.setDate(uploadDate.getDate() + template.dayTrigger);

        const processedMessage = this.processMessageTemplate(template.message, travelerData, agency, bus);

        await storage.createWhatsappQueue({
          travelerId: travelerId,
          templateId: template.id,
          scheduledFor: scheduledDate,
          status: 'pending',
          message: processedMessage,
          phoneNumber: travelerData.phone,
        });
      }
    } catch (error) {
      console.error('Error scheduling messages for traveler:', error);
      throw error;
    }
  }

  /**
   * Schedule messages for all travelers in a batch upload
   */
  async scheduleMessagesForUpload(agencyId: number, busId: number): Promise<void> {
    try {
      const travelers = await storage.getTravelerDataByBus(busId);

      for (const traveler of travelers) {
        await this.scheduleMessagesForTraveler(traveler.id);
      }

      console.log(`Scheduled messages for ${travelers.length} travelers from agency ${agencyId}`);
    } catch (error) {
      console.error('Error scheduling messages for upload:', error);
      throw error;
    }
  }

  /**
   * Process pending messages that are ready to be sent
   */
  async processPendingMessages(): Promise<void> {
    try {
      const config = await storage.getWhatsappConfig();
      if (!config || !config.isActive) {
        console.log('WhatsApp configuration not found or inactive');
        return;
      }

      const queue = await storage.getWhatsappQueue();
      const pendingMessages = queue.filter(msg => 
        msg.status === 'pending' && 
        new Date(msg.scheduledFor) <= new Date()
      );

      for (const message of pendingMessages) {
        try {
          // Check if the traveler has opted out
          const traveler = await storage.getTravelerData(message.travelerId);
          if (traveler?.whatsappOptOut) {
            console.log(`Traveler ${message.travelerId} has opted out, cancelling message`);
            await storage.updateWhatsappQueueStatus(message.id, 'cancelled');
            continue;
          }

          // Here you would integrate with actual WhatsApp API
          // For now, we'll just mark as sent
          await this.sendWhatsappMessage(message.phoneNumber, message.message, config);

          await storage.updateWhatsappQueueStatus(message.id, 'sent');
          console.log(`Message sent successfully to ${message.phoneNumber}`);
        } catch (error) {
          console.error(`Failed to send message to ${message.phoneNumber}:`, error);
          await storage.updateWhatsappQueueStatus(message.id, 'failed');
        }
      }
    } catch (error) {
      console.error('Error processing pending messages:', error);
    }
  }

  /**
   * Handle opt-out request from WhatsApp webhook
   */
  async handleOptOutRequest(phoneNumber: string, message: string): Promise<void> {
    try {
      // Common opt-out keywords
      const optOutKeywords = [
        'stop', 'unsubscribe', 'opt out', 'remove', 'cancel',
        'no more', 'quit', 'end', 'halt', 'pause'
      ];

      const lowerMessage = message.toLowerCase().trim();
      const isOptOutRequest = optOutKeywords.some(keyword => 
        lowerMessage.includes(keyword)
      );

      if (isOptOutRequest) {
        const optedOutTravelers = await storage.optOutTravelerFromWhatsapp(phoneNumber);

        if (optedOutTravelers.length > 0) {
          console.log(`Opted out ${optedOutTravelers.length} travelers with phone: ${phoneNumber}`);

          // Send confirmation message
          const confirmationMessage = "You have been successfully unsubscribed from our promotional messages. You will no longer receive coupon codes or travel offers. Thank you.";

          const config = await storage.getWhatsappConfig();
          if (config) {
            await this.sendWhatsappMessage(phoneNumber, confirmationMessage, config);
          }
        } else {
          console.log(`No travelers found with phone number: ${phoneNumber}`);
        }
      }
    } catch (error) {
      console.error('Error handling opt-out request:', error);
    }
  }

  /**
   * Process incoming WhatsApp webhook messages
   */
  async processIncomingMessage(phoneNumber: string, message: string): Promise<void> {
    try {
      console.log(`Received message from ${phoneNumber}: ${message}`);

      // Handle opt-out requests
      await this.handleOptOutRequest(phoneNumber, message);

      // You can add more message processing logic here
      // For example, handling help requests, status inquiries, etc.

    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }

  /**
   * Send WhatsApp message using BhashSMS API with security measures and image support
   */
  private async sendWhatsappMessage(phoneNumber: string, message: string, config: any, imageUrl?: string): Promise<boolean> {
    try {
      // Security: Validate phone number format
      if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ''))) {
        securityMonitor.logSecurityEvent({
          type: 'INVALID_INPUT',
          ip: 'system',
          endpoint: '/whatsapp/send',
          details: { phoneNumber: 'invalid_format' },
          severity: 'MEDIUM'
        });
        throw new Error('Invalid phone number format');
      }

      // Security: Validate message content
      if (!message || message.length > 1000) {
        securityMonitor.logSecurityEvent({
          type: 'INVALID_INPUT',
          ip: 'system',
          endpoint: '/whatsapp/send',
          details: { messageLength: message?.length || 0 },
          severity: 'MEDIUM'
        });
        throw new Error('Invalid message content');
      }

      // Clean phone number (remove country code if +91)
      let cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = cleanPhone.substring(2);
      }

      // BhashSMS API integration with activated utility endpoint
      const apiUrl = 'http://bhashsms.com/api/sendmsgutil.php';
      const params = new URLSearchParams({
        user: 'BhashWapAi',
        pass: 'bwap@123$',
        sender: 'BUZWAP',
        phone: cleanPhone,
        text: message,
        priority: 'wa',
        stype: 'utility'
      });

      // Add image parameters if image URL is provided
      if (imageUrl) {
        params.append('htype', 'image');
        params.append('url', imageUrl);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for images

      const response = await fetch(`${apiUrl}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'TravelFlow-WhatsApp-Service/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.text();

      // Check if message was sent successfully
      if (result.startsWith('S.')) {
        console.log(`WhatsApp message ${imageUrl ? 'with image ' : ''}sent successfully to ${cleanPhone}. ID: ${result}`);
        return true;
      } else {
        // Log failed attempts for monitoring
        securityMonitor.logSecurityEvent({
          type: 'INVALID_INPUT',
          ip: 'system',
          endpoint: '/whatsapp/send',
          details: { 
            phoneNumber: cleanPhone,
            apiResponse: result,
            provider: 'bhashsms',
            hasImage: !!imageUrl
          },
          severity: 'MEDIUM'
        });

        console.error(`Failed to send WhatsApp message. Response: ${result}`);
        return false;
      }
    } catch (error) {
      // Security: Log failed API calls
      securityMonitor.logSecurityEvent({
        type: 'INVALID_INPUT',
        ip: 'system',
        endpoint: '/whatsapp/send',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          phoneNumber: phoneNumber?.substring(0, 5) + 'xxxxx', // Partially mask phone
          hasImage: !!imageUrl
        },
        severity: 'HIGH'
      });

      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send test message to verify configuration with optional image support
   */
  async sendTestMessage(phoneNumber?: string, message?: string, config?: any, imageUrl?: string): Promise<boolean> {
    try {
      const whatsappConfig = config || await storage.getWhatsappConfig();
      if (!whatsappConfig) {
        throw new Error('WhatsApp configuration not found');
      }

      const testPhone = phoneNumber || whatsappConfig.phoneNumber;
      // Use a very simple message that might bypass template requirements
      const testMessage = message || `Hi! This is a test message from TravelFlow. Time: ${new Date().toLocaleTimeString()}`;

      return await this.sendWhatsappMessage(testPhone, testMessage, whatsappConfig, imageUrl);

    } catch (error) {
      console.error('Error sending test message:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsappService();

// Approved BhashSMS template with your specific variables
const APPROVED_BHASH_TEMPLATE = "Hi {{1}}, thanks for Traveling with us at {{2}}! Get 20% off on your next trip – use Coupon Code {{3}} 🚀 Valid for Next 90 days at: {{4}} ✨ Hurry Up.";

/**
 * Replace template variables with actual data
 */
export function replaceApprovedTemplateVariables(
  travelerName: string,
  agencyName: string,
  couponCode: string,
  couponLink: string
): string {
  return APPROVED_BHASH_TEMPLATE
    .replace('{{1}}', travelerName)
    .replace('{{2}}', agencyName)
    .replace('{{3}}', couponCode)
    .replace('{{4}}', couponLink);
}

/**
 * Send WhatsApp message using BhashSMS API with approved template
 */
export async function sendBhashWhatsAppMessage(
  phoneNumber: string,
  message?: string,
  imageUrl?: string,
  travelerData?: {
    travelerName: string;
    agencyName: string;
    couponCode: string;
    couponLink?: string;
  }
): Promise<{ success: boolean; message: string; apiResponse?: string; sentMessage?: string }> {
  try {
    console.log(`Sending WhatsApp message to ${phoneNumber} via BhashSMS API`);
    
    // Use approved template with variables if traveler data is provided
    let finalMessage = message || 'bsl_image';
    
    if (travelerData && (message === 'template' || message === 'approved_template')) {
      const couponLink = travelerData.couponLink || 'https://your-booking-site.com';
      finalMessage = replaceApprovedTemplateVariables(
        travelerData.travelerName,
        travelerData.agencyName,
        travelerData.couponCode,
        couponLink
      );
      console.log('Using approved template with variables:', finalMessage);
    }
    
    // Clean phone number (remove country code if +91)
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    const params = new URLSearchParams({
      user: 'BhashWapAi',
      pass: 'bwap@123$',
      sender: 'BUZWAP',
      phone: cleanPhone,
      text: finalMessage,
      priority: 'wa',
      stype: 'normal'
    });

    if (imageUrl) {
      params.append('htype', 'image');
      params.append('url', imageUrl);
    }

    const apiUrl = `http://bhashsms.com/api/sendmsgutil.php?${params.toString()}`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl);
    const responseText = await response.text();
    
    console.log('BhashSMS API Response:', responseText);

    // Check if response indicates success (starts with "S.")
    const isSuccess = responseText.trim().startsWith('S.');
    
    return {
      success: isSuccess,
      message: isSuccess ? 'WhatsApp message sent successfully!' : `Failed to send message. API Response: ${responseText.trim()}`,
      apiResponse: responseText.trim(),
      sentMessage: finalMessage
    };
    
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      message: 'Failed to send WhatsApp message due to network error'
    };
  }
}