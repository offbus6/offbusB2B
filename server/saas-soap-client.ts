interface ProviderConfig {
  baseUrl: string;
  companyId: string;
  verifyCall: string;
}

interface ApiEndpoint {
  requestTemplate: string;
}

// Build SOAP envelope
function buildSoapRequest(body: string): string {
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
    throw new Error(`SOAP Error (${response.status}): ${responseText}`);
  }

  return responseText;
}

// Extract data from XML to JSON
function extractCities(xmlResponse: string, elementName: string): Array<{ id: string; name: string }> {
  const idRegex = new RegExp(`<CM_CityID>(.*?)</CM_CityID>`, 'gs');
  const nameRegex = new RegExp(`<CM_CityName>(.*?)</CM_CityName>`, 'gs');
  
  const ids = Array.from(xmlResponse.matchAll(idRegex), m => m[1]);
  const names = Array.from(xmlResponse.matchAll(nameRegex), m => m[1]);
  
  return ids.map((id, index) => ({ id, name: names[index] }));
}

// Extract routes from XML
function extractRoutes(xmlResponse: string): Array<any> {
  const routePattern = /<AllRouteBusLists[^>]*>([\s\S]*?)<\/AllRouteBusLists>/g;
  const routes: any[] = [];
  
  let match;
  while ((match = routePattern.exec(xmlResponse)) !== null) {
    const routeXml = match[1];
    
    const extractField = (field: string) => {
      const regex = new RegExp(`<${field}>(.*?)</${field}>`, 's');
      const match = routeXml.match(regex);
      return match ? match[1] : null;
    };
    
    routes.push({
      companyId: extractField('CompanyID'),
      companyName: extractField('CompanyName'),
      fromCityId: extractField('FromCityId'),
      fromCityName: extractField('FromCityName'),
      toCityId: extractField('ToCityId'),
      toCityName: extractField('ToCityName'),
      routeId: extractField('RouteID'),
      routeTimeId: extractField('RouteTimeID'),
      routeName: extractField('RouteName'),
      routeTime: extractField('RouteTime'),
      kilometer: extractField('Kilometer'),
      cityTime: extractField('CityTime'),
      arrivalTime: extractField('ArrivalTime'),
      busType: extractField('BusType'),
      busTypeName: extractField('BusTypeName'),
      bookingDate: extractField('BookingDate'),
      arrangementId: extractField('ArrangementID'),
      arrangementName: extractField('ArrangementName'),
      acSeatRate: extractField('AcSeatRate'),
      acSleeperRate: extractField('AcSleeperRate'),
      acSlumberRate: extractField('AcSlumberRate'),
      nonAcSeatRate: extractField('NonAcSeatRate'),
      nonAcSleeperRate: extractField('NonAcSleeperRate'),
      nonAcSlumberRate: extractField('NonAcSlumberRate'),
      boardingPoints: extractField('BoardingPoints'),
      droppingPoints: extractField('DroppingPoints'),
      emptySeats: extractField('EmptySeats'),
      referenceNumber: extractField('ReferenceNumber'),
      acSeatServiceTax: extractField('AcSeatServiceTax'),
      acSlpServiceTax: extractField('AcSlpServiceTax'),
      acSlmbServiceTax: extractField('AcSlmbServiceTax'),
      nonAcSeatServiceTax: extractField('NonAcSeatServiceTax'),
      nonAcSlpServiceTax: extractField('NonAcSlpServiceTax'),
      nonAcSlmbServiceTax: extractField('NonAcSlmbServiceTax'),
      acSeatSurcharges: extractField('AcSeatSurcharges'),
      acSlpSurcharges: extractField('AcSlpSurcharges'),
      acSlmbSurcharges: extractField('AcSlmbSurcharges'),
      nonAcSeatSurcharges: extractField('NonAcSeatSurcharges'),
      nonAcSlpSurcharges: extractField('NonAcSlpSurcharges'),
      nonAcSlmbSurcharges: extractField('NonAcSlmbSurcharges'),
      approxArrival: extractField('ApproxArrival'),
      isApiCommission: extractField('IsAPICommission'),
      cityTime24: extractField('CityTime24'),
      busSeatType: extractField('BusSeatType'),
      discountType: extractField('DiscountType'),
      discountRate: extractField('DiscountRate'),
      allowReSchedule: extractField('AllowReSchedule'),
      reScheduleCharge: extractField('ReScheduleCharge'),
      stopReScheduleMinutes: extractField('StopReScheduleMinutes'),
      reScheduleChargeType: extractField('ReScheduleChargeType'),
      isSocialDistanceMaintain: extractField('IsSocialDistanceMaintain'),
    });
  }
  
  return routes;
}

// Public API functions
export async function getSources(config: ProviderConfig, endpoint: ApiEndpoint): Promise<Array<{ id: string; name: string }>> {
  const requestBody = replacePlaceholders(endpoint.requestTemplate, {
    'VerifyCall': config.verifyCall
  });
  
  const soapRequest = buildSoapRequest(requestBody);
  const response = await callSoapApi(config.baseUrl, 'GetSources', soapRequest);
  
  return extractCities(response, 'ITSSources');
}

export async function getDestinations(
  config: ProviderConfig,
  endpoint: ApiEndpoint,
  sourceId: string
): Promise<Array<{ id: string; name: string }>> {
  const requestBody = replacePlaceholders(endpoint.requestTemplate, {
    'SourceId': sourceId,
    'VerifyCall': config.verifyCall
  });
  
  const soapRequest = buildSoapRequest(requestBody);
  const response = await callSoapApi(config.baseUrl, 'GetDestinationsBasedOnSource', soapRequest);
  
  return extractCities(response, 'ITSDestinations');
}

export async function getAvailableRoutes(
  config: ProviderConfig,
  endpoint: ApiEndpoint,
  fromId: string,
  toId: string,
  travelDate: string
): Promise<Array<any>> {
  const requestBody = replacePlaceholders(endpoint.requestTemplate, {
    'FromId': fromId,
    'ToId': toId,
    'TravelDate': travelDate,
    'VerifyCall': config.verifyCall
  });
  
  const soapRequest = buildSoapRequest(requestBody);
  const response = await callSoapApi(config.baseUrl, 'GetAvailableRoutes', soapRequest);
  
  return extractRoutes(response);
}
