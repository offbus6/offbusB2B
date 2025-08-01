// Using native fetch API (Node.js 18+)

// WhatsApp delivery debugging tool to investigate bulk vs individual delivery issues
export async function debugWhatsAppDelivery() {
  console.log('\n🔍 WHATSAPP DELIVERY INVESTIGATION 🔍\n');
  
  const testNumber = '919900408817'; // Your test number
  const apiUrl = 'https://bhashsms.com/api/sendmsg.php';
  
  // Test 1: Check account balance/credits
  console.log('1️⃣ Checking BhashSMS account status...');
  try {
    const balanceUrl = `${apiUrl}?user=eddygoo1&pass=123456&sender=BUZWAP&phone=${testNumber}&text=balance`;
    const balanceResponse = await fetch(balanceUrl);
    const balanceText = await balanceResponse.text();
    console.log(`Account Balance Response: "${balanceText}"`);
  } catch (error) {
    console.error('Balance check failed:', error);
  }
  
  // Test 2: Check template approval status
  console.log('\n2️⃣ Testing template approval...');
  try {
    const templateUrl = `${apiUrl}?user=eddygoo1&pass=123456&sender=BUZWAP&phone=${testNumber}&text=eddygoo_2807&priority=wa&stype=normal&Params=TestUser,TestAgency,TEST20,https://test.com&htype=image&url=https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg`;
    const templateResponse = await fetch(templateUrl);
    const templateText = await templateResponse.text();
    console.log(`Template Test Response: "${templateText}"`);
    
    if (templateText.includes('S.')) {
      console.log('✅ Template appears to be approved and working');
    } else if (templateText.includes('E.')) {
      console.log('❌ Template error detected - may need approval');
    } else {
      console.log('⚠️ Unexpected response - investigate further');
    }
  } catch (error) {
    console.error('Template test failed:', error);
  }
  
  // Test 3: Check rate limiting
  console.log('\n3️⃣ Testing rate limits with rapid fire...');
  for (let i = 1; i <= 3; i++) {
    try {
      const rapidUrl = `${apiUrl}?user=eddygoo1&pass=123456&sender=BUZWAP&phone=${testNumber}&text=eddygoo_2807&priority=wa&stype=normal&Params=RateTest${i},TestAgency,TEST20,https://test.com&htype=image&url=https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg`;
      const rapidResponse = await fetch(rapidUrl);
      const rapidText = await rapidResponse.text();
      console.log(`Rapid Test ${i}: "${rapidText}"`);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Rapid test ${i} failed:`, error);
    }
  }
  
  // Test 4: Different message priorities
  console.log('\n4️⃣ Testing different priority levels...');
  const priorities = ['wa', 'high', 'normal'];
  for (const priority of priorities) {
    try {
      const priorityUrl = `${apiUrl}?user=eddygoo1&pass=123456&sender=BUZWAP&phone=${testNumber}&text=eddygoo_2807&priority=${priority}&stype=normal&Params=PriorityTest,TestAgency,TEST20,https://test.com&htype=image&url=https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg`;
      const priorityResponse = await fetch(priorityUrl);
      const priorityText = await priorityResponse.text();
      console.log(`Priority ${priority}: "${priorityText}"`);
    } catch (error) {
      console.error(`Priority test ${priority} failed:`, error);
    }
  }
  
  console.log('\n📋 INVESTIGATION COMPLETE 📋');
  console.log('Please check your WhatsApp for any received messages.');
  console.log('If no messages are received despite S. responses, the issue is likely:');
  console.log('1. Template needs approval with BhashSMS');
  console.log('2. Account has delivery restrictions');
  console.log('3. WhatsApp Business API limitations');
  
  return {
    message: 'WhatsApp delivery investigation completed',
    timestamp: new Date().toISOString()
  };
}

// Quick individual message test function
export async function testIndividualWhatsApp(phone: string, name: string) {
  console.log(`\n📱 Testing individual WhatsApp to ${name} at ${phone}...`);
  
  const apiUrl = 'https://bhashsms.com/api/sendmsg.php';
  const cleanPhone = phone.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  
  try {
    const testUrl = `${apiUrl}?user=eddygoo1&pass=123456&sender=BUZWAP&phone=${finalPhone}&text=eddygoo_2807&priority=wa&stype=normal&Params=${name},TestAgency,SAVE20,https://test.com&htype=image&url=https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg`;
    
    console.log(`🔗 API URL: ${testUrl}`);
    
    const response = await fetch(testUrl);
    const responseText = (await response.text()).trim();
    
    console.log(`📊 Response: "${responseText}"`);
    
    if (responseText.startsWith('S.')) {
      console.log(`✅ Individual test successful - Message ID: ${responseText}`);
      return { success: true, messageId: responseText };
    } else {
      console.log(`❌ Individual test failed: ${responseText}`);
      return { success: false, error: responseText };
    }
  } catch (error) {
    console.error(`🚨 Individual test error:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}