import { securityMonitor } from "./security-monitor";

export interface WhatsAppTestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  responseText?: string;
}

/**
 * Test WhatsApp message sending using the approved BhashSMS API
 */
export async function testWhatsAppMessage(
  phone: string, 
  message: string, 
  imageUrl?: string
): Promise<WhatsAppTestResult> {
  try {
    console.log('=== WhatsApp API Test Started ===');
    
    // Validate phone number format
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Invalid phone number format');
    }

    // Clean phone number (remove country code if +91)
    let finalPhone = cleanPhone;
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      finalPhone = cleanPhone.substring(2);
    }

    // Use the approved BhashSMS API endpoint
    const apiUrl = 'http://bhashsms.com/api/sendmsgutil.php';
    const params = new URLSearchParams({
      user: 'BhashWapAi',
      pass: 'bwap@123$',
      sender: 'BUZWAP',
      phone: finalPhone,
      text: message,
      priority: 'wa',
      stype: 'utility'
    });

    // Add image parameters if provided
    if (imageUrl) {
      params.append('htype', 'image');
      params.append('url', imageUrl);
    }

    const fullUrl = `${apiUrl}?${params.toString()}`;
    console.log('API URL:', fullUrl);
    console.log('Sending to phone:', finalPhone);
    console.log('Message:', message);
    if (imageUrl) {
      console.log('Image URL:', imageUrl);
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'TravelFlow-WhatsApp-Service/1.0'
      }
    });

    const responseText = await response.text();
    console.log('BhashSMS API Response Status:', response.status);
    console.log('BhashSMS API Response:', responseText);

    if (response.ok) {
      // Parse response to check if message was sent successfully
      const isSuccess = responseText.toLowerCase().includes('success') || 
                       responseText.toLowerCase().includes('sent') ||
                       responseText.toLowerCase().includes('delivered') ||
                       responseText.toLowerCase().includes('queued') ||
                       (!responseText.toLowerCase().includes('error') && 
                        !responseText.toLowerCase().includes('fail'));

      if (isSuccess) {
        console.log('=== WhatsApp Message Sent Successfully ===');
        return { 
          success: true, 
          messageId: responseText.trim(),
          responseText: responseText 
        };
      } else {
        console.log('=== WhatsApp Message Failed ===');
        return { 
          success: false, 
          error: responseText,
          responseText: responseText 
        };
      }
    } else {
      throw new Error(`API request failed: ${response.status} - ${responseText}`);
    }

  } catch (error) {
    console.error('=== WhatsApp Test Failed ===');
    console.error('Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Log security event for failed API calls
    securityMonitor.logSecurityEvent({
      type: 'API_ERROR',
      ip: 'system',
      endpoint: '/whatsapp/send',
      details: { error: errorMessage, phone: phone.replace(/\d/g, '*') },
      severity: 'MEDIUM'
    });

    return { 
      success: false, 
      error: errorMessage,
      responseText: errorMessage 
    };
  }
}

/**
 * Send WhatsApp message to a traveler using approved template
 */
export async function sendWhatsAppToTraveler(
  travelerName: string,
  agencyName: string, 
  couponCode: string,
  bookingWebsite: string,
  phone: string
): Promise<WhatsAppTestResult> {
  // Use the approved template format
  const message = `Hi ${travelerName}, thanks for Traveling with us at ${agencyName}! Get 20% off on your next trip – use Coupon Code ${couponCode} 🚀 Valid for Next 90 days at: ${bookingWebsite} ✨ Hurry Up.`;
  
  console.log('Sending message with approved template to:', phone);
  return await testWhatsAppMessage(phone, message);
}

/**
 * Test WhatsApp with image using the provided example
 */
export async function testWhatsAppWithImage(phone: string): Promise<WhatsAppTestResult> {
  const message = 'bsl_image';
  const imageUrl = 'https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg';
  
  console.log('Testing WhatsApp with image...');
  return await testWhatsAppMessage(phone, message, imageUrl);
}