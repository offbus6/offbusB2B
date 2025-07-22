import { storage } from "./storage";
import type { TravelerData, WhatsappTemplate } from "@shared/schema";

export interface WhatsappMessage {
  to: string;
  message: string;
  template: string;
}

export class WhatsappService {
  
  /**
   * Process dynamic variables in message templates
   */
  private processMessageTemplate(template: string, travelerData: TravelerData, agency: any): string {
    const variables = {
      '{{traveler_name}}': travelerData.travelerName || 'Traveler',
      '{{agency_name}}': agency?.name || 'Travel Agency',
      '{{bus_name}}': travelerData.busName || 'Bus',
      '{{route}}': travelerData.route || 'Route',
      '{{travel_date}}': travelerData.travelDate ? new Date(travelerData.travelDate).toLocaleDateString() : 'Travel Date',
      '{{coupon_code}}': travelerData.couponCode || 'TRAVEL2024',
      '{{coupon_link}}': travelerData.couponLink || 'https://travelflow.com/coupon',
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

      // Schedule messages for each template
      for (const template of activeTemplates) {
        const uploadDate = new Date(travelerData.createdAt);
        const scheduledDate = new Date(uploadDate);
        scheduledDate.setDate(uploadDate.getDate() + template.dayTrigger);

        const processedMessage = this.processMessageTemplate(template.message, travelerData, agency);

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
   * Send WhatsApp message using configured provider
   */
  private async sendWhatsappMessage(phoneNumber: string, message: string, config: any): Promise<void> {
    // This is where you'd integrate with actual WhatsApp API providers
    // For demonstration, we'll simulate the API call
    
    console.log(`Sending WhatsApp message via ${config.provider}`);
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, we'll just log the message
    // In production, you'd implement actual API calls based on the provider:
    
    switch (config.provider) {
      case 'business_api':
        // await this.sendViaBusinessAPI(phoneNumber, message, config);
        break;
      case 'twilio':
        // await this.sendViaTwilio(phoneNumber, message, config);
        break;
      case 'messagebird':
        // await this.sendViaMessageBird(phoneNumber, message, config);
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Send test message to verify configuration
   */
  async sendTestMessage(): Promise<void> {
    try {
      const config = await storage.getWhatsappConfig();
      if (!config) {
        throw new Error('WhatsApp configuration not found');
      }

      const testMessage = `Test message from TravelFlow at ${new Date().toLocaleString()}`;
      await this.sendWhatsappMessage(config.phoneNumber, testMessage, config);
      
      console.log('Test message sent successfully');
    } catch (error) {
      console.error('Error sending test message:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsappService();