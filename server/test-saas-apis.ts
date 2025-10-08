interface ProviderConfig {
  baseUrl: string;
  companyId: string;
  verifyCall: string;
}

interface ApiEndpoint {
  apiName: string;
  requestTemplate: string;
}

// SOAP envelope wrapper
function buildSoapRequest(body: string): string {
  // Remove the closing </soapenv:Envelope> from body if it exists
  const cleanBody = body.replace('</soapenv:Envelope>', '').trim();
  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:plat="http://apiownb2c.itspl.net/">
${cleanBody}
</soapenv:Envelope>`;
}

// Replace placeholders in template
function replacePlaceholders(
  template: string, 
  replacements: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    // Replace only text nodes, not tag names
    // Match: >PlaceholderText< but not <tag:PlaceholderText>
    const regex = new RegExp(`>\\s*${key}\\s*<`, 'g');
    result = result.replace(regex, `>${value}<`);
  }
  return result;
}

// Make SOAP API call
async function callSoapApi(
  baseUrl: string, 
  soapAction: string, 
  soapBody: string
): Promise<string> {
  const response = await fetch(baseUrl.replace('?wsdl', ''), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': `"http://apiownb2c.itspl.net/${soapAction}"`,
    },
    body: soapBody,
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    console.log('\n❌ SOAP Fault Response:', responseText);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return responseText;
}

// Test functions
async function testGetSources(config: ProviderConfig, endpoint: ApiEndpoint) {
  console.log('\n=== Testing GetSources API ===');
  console.log('Endpoint:', config.baseUrl);
  
  const requestBody = replacePlaceholders(endpoint.requestTemplate, {
    'VerifyCall': config.verifyCall
  });
  
  const soapRequest = buildSoapRequest(requestBody);
  console.log('\nRequest:', soapRequest);
  
  try {
    const response = await callSoapApi(config.baseUrl, 'GetSources', soapRequest);
    console.log('\nResponse:', response.substring(0, 1000) + '...');
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function testGetDestinations(
  config: ProviderConfig, 
  endpoint: ApiEndpoint, 
  sourceId: string
) {
  console.log('\n=== Testing GetDestinationsBasedOnSource API ===');
  console.log('Source ID:', sourceId);
  
  const requestBody = replacePlaceholders(endpoint.requestTemplate, {
    'SourceId': sourceId,
    'VerifyCall': config.verifyCall
  });
  
  const soapRequest = buildSoapRequest(requestBody);
  console.log('\nRequest:', soapRequest);
  
  try {
    const response = await callSoapApi(
      config.baseUrl, 
      'GetDestinationsBasedOnSource', 
      soapRequest
    );
    console.log('\nResponse:', response.substring(0, 1000) + '...');
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function testGetAvailableRoutes(
  config: ProviderConfig, 
  endpoint: ApiEndpoint,
  fromId: string,
  toId: string,
  travelDate: string
) {
  console.log('\n=== Testing GetAvailableRoutes API ===');
  console.log('From ID:', fromId);
  console.log('To ID:', toId);
  console.log('Travel Date:', travelDate);
  
  const requestBody = replacePlaceholders(endpoint.requestTemplate, {
    'FromId': fromId,
    'ToId': toId,
    'TravelDate': travelDate,
    'VerifyCall': config.verifyCall
  });
  
  const soapRequest = buildSoapRequest(requestBody);
  console.log('\nRequest:', soapRequest);
  
  try {
    const response = await callSoapApi(
      config.baseUrl, 
      'GetAvailableRoutes', 
      soapRequest
    );
    console.log('\nResponse:', response.substring(0, 2000) + '...');
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Parse XML response to extract data (simple parser)
function extractFromXml(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'gs');
  const matches = xml.matchAll(regex);
  return Array.from(matches, m => m[1]);
}

// Main test function
async function runTests() {
  const config: ProviderConfig = {
    baseUrl: 'http://apiownb2c.itspl.net/ITSGateway.asmx?wsdl',
    companyId: '1',
    verifyCall: 'ITS_UAT_B2C_a4716c415f85bbdf86040a8fe3206371934963419'
  };

  const endpoints = {
    getSources: {
      apiName: 'GetSources',
      requestTemplate: `<soapenv:Header/>
   <soapenv:Body>
      <plat:GetSources>
         <plat:verifyCall>VerifyCall</plat:verifyCall>
      </plat:GetSources>
   </soapenv:Body>
</soapenv:Envelope>`
    },
    getDestinations: {
      apiName: 'GetDestinationsBasedOnSource',
      requestTemplate: `<soapenv:Header/>
   <soapenv:Body>
      <plat:GetDestinationsBasedOnSource>
         <plat:SourceID>SourceId</plat:SourceID>
         <plat:VerifyCall>VerifyCall</plat:VerifyCall>
      </plat:GetDestinationsBasedOnSource>
   </soapenv:Body>
</soapenv:Envelope>`
    },
    getAvailableRoutes: {
      apiName: 'GetAvailableRoutes',
      requestTemplate: `<soapenv:Header/>
   <soapenv:Body>
      <plat:GetAvailableRoutes>
         <plat:FromID>FromId</plat:FromID>
         <plat:ToID>ToId</plat:ToID>
         <plat:JourneyDate>TravelDate</plat:JourneyDate>
         <plat:VerifyCall>VerifyCall</plat:VerifyCall>
      </plat:GetAvailableRoutes>
   </soapenv:Body>
</soapenv:Envelope>`
    }
  };

  try {
    // Step 1: Get Sources
    const sourcesResponse = await testGetSources(config, endpoints.getSources);
    const sourceIds = extractFromXml(sourcesResponse, 'CM_CityID');
    const sourceNames = extractFromXml(sourcesResponse, 'CM_CityName');
    
    console.log('\n📍 Available Sources:');
    for (let i = 0; i < Math.min(5, sourceIds.length); i++) {
      console.log(`  ${sourceIds[i]}: ${sourceNames[i]}`);
    }
    
    if (sourceIds.length === 0) {
      console.log('❌ No sources found. Check API credentials.');
      return;
    }

    // Step 2: Get Destinations for a known source (use 70=Rajkot or try first source)
    // From database example: FromCityId=70 (Rajkot) has routes to ToCityId=1 (Ahmedabad)
    let testSourceId = sourceIds.find(id => id === '70') || sourceIds[0];
    const destinationsResponse = await testGetDestinations(
      config, 
      endpoints.getDestinations, 
      testSourceId
    );
    const destIds = extractFromXml(destinationsResponse, 'CM_CityID');
    const destNames = extractFromXml(destinationsResponse, 'CM_CityName');
    
    const sourceIndex = sourceIds.indexOf(testSourceId);
    console.log(`\n📍 Destinations from ${sourceNames[sourceIndex]} (ID: ${testSourceId}):`);
    for (let i = 0; i < Math.min(5, destIds.length); i++) {
      console.log(`  ${destIds[i]}: ${destNames[i]}`);
    }

    if (destIds.length === 0) {
      console.log('❌ No destinations found.');
      return;
    }

    // Step 3: Get Available Routes
    const firstDestId = destIds[0];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const travelDate = tomorrow.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');

    const routesResponse = await testGetAvailableRoutes(
      config,
      endpoints.getAvailableRoutes,
      testSourceId,
      firstDestId,
      travelDate
    );

    const routeNames = extractFromXml(routesResponse, 'RouteName');
    const routeTimes = extractFromXml(routesResponse, 'RouteTime');
    const emptySeats = extractFromXml(routesResponse, 'EmptySeats');

    console.log(`\n🚌 Available Routes from ${sourceNames[sourceIndex]} to ${destNames[0]} on ${travelDate}:`);
    for (let i = 0; i < Math.min(3, routeNames.length); i++) {
      console.log(`  ${routeNames[i]} at ${routeTimes[i]} - ${emptySeats[i]} seats available`);
    }

    console.log('\n✅ All API tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Sources available: ${sourceIds.length}`);
    console.log(`  - Destinations from ${sourceNames[sourceIndex]}: ${destIds.length}`);
    console.log(`  - Routes found: ${routeNames.length}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
