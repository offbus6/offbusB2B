// WhatsApp Delivery Investigation Tool
// Using native fetch API (Node.js 18+)

interface DeliveryTestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  phoneNumber: string;
  timestamp: string;
}

export class WhatsAppDeliveryTester {
  private apiUrl = 'http://bhashsms.com/api/sendmsg.php';
  private credentials = {
    user: 'eddygoo1',
    pass: '123456',
    sender: 'BUZWAP',
    params: '54,877,966,52'
  };

  async testSimpleMessage(phoneNumber: string): Promise<DeliveryTestResult> {
    const timestamp = new Date().toISOString();
    const message = `Test ${timestamp.slice(-8, -3)} - Simple delivery test`;

    try {
      const params = new URLSearchParams({
        user: this.credentials.user,
        pass: this.credentials.pass,
        sender: this.credentials.sender,
        phone: phoneNumber,
        text: message,
        priority: 'wa',
        stype: 'normal',
        Params: this.credentials.params
      });

      console.log(`Testing simple message to ${phoneNumber}:`);
      console.log(`Message: ${message}`);
      console.log(`API URL: ${this.apiUrl}?${params.toString()}`);

      const response = await fetch(`${this.apiUrl}?${params.toString()}`);
      const result = await response.text();
      const trimmedResult = result.trim();

      console.log(`API Response: "${trimmedResult}"`);

      return {
        success: trimmedResult.startsWith('S.'),
        messageId: trimmedResult.startsWith('S.') ? trimmedResult : undefined,
        error: !trimmedResult.startsWith('S.') ? trimmedResult : undefined,
        phoneNumber,
        timestamp
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        phoneNumber,
        timestamp
      };
    }
  }

  async testTemplateMessage(phoneNumber: string, travelerName: string): Promise<DeliveryTestResult> {
    const timestamp = new Date().toISOString();
    // Using exact approved template format
    const message = `Hi ${travelerName}, thanks for Traveling with us at TestTravel Agency! Get 20% off on your next trip – use Coupon Code SAVE20 🚀 Valid for Next 90 days at: https://testtravelagency.com ✨ Hurry Up.`;

    try {
      const params = new URLSearchParams({
        user: this.credentials.user,
        pass: this.credentials.pass,
        sender: this.credentials.sender,
        phone: phoneNumber,
        text: message,
        priority: 'wa',
        stype: 'normal',
        Params: this.credentials.params
      });

      console.log(`Testing template message to ${phoneNumber}:`);
      console.log(`Message: ${message}`);

      const response = await fetch(`${this.apiUrl}?${params.toString()}`);
      const result = await response.text();
      const trimmedResult = result.trim();

      console.log(`API Response: "${trimmedResult}"`);

      return {
        success: trimmedResult.startsWith('S.'),
        messageId: trimmedResult.startsWith('S.') ? trimmedResult : undefined,
        error: !trimmedResult.startsWith('S.') ? trimmedResult : undefined,
        phoneNumber,
        timestamp
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        phoneNumber,
        timestamp
      };
    }
  }

  async runDeliveryTests(): Promise<void> {
    console.log('=== WHATSAPP DELIVERY INVESTIGATION ===');
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`Testing BhashSMS API delivery...`);

    const testNumbers = ['9900408817', '8088635590']; // Known test numbers

    for (const number of testNumbers) {
      console.log(`\n--- Testing ${number} ---`);
      
      // Test 1: Simple message
      const simpleResult = await this.testSimpleMessage(number);
      console.log(`Simple Test: ${simpleResult.success ? 'SUCCESS' : 'FAILED'}`);
      if (simpleResult.messageId) {
        console.log(`Message ID: ${simpleResult.messageId}`);
      }

      // Wait 2 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test 2: Template message
      const templateResult = await this.testTemplateMessage(number, 'TestUser');
      console.log(`Template Test: ${templateResult.success ? 'SUCCESS' : 'FAILED'}`);
      if (templateResult.messageId) {
        console.log(`Message ID: ${templateResult.messageId}`);
      }

      console.log(`⚠️  Check WhatsApp on +91${number} for message delivery`);
      
      // Wait 3 seconds between numbers
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n=== END DELIVERY INVESTIGATION ===');
    console.log('Check the phone numbers above for actual WhatsApp message delivery');
  }
}