# SAAS Bus Search REST API - CURL Test Commands

## 🚀 API Endpoints

All endpoints default to **Agency ID: 144** (which has the ITS SAAS provider configured)

---

## 1️⃣ **Get All Source Cities**

Fetches the complete list of source cities from the SAAS provider.

```bash
curl -X GET "http://localhost:5000/api/bus/sources" \
  -H "Content-Type: application/json"
```

**Optional: Specify agency ID**
```bash
curl -X GET "http://localhost:5000/api/bus/sources?agencyId=144" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {"id": "70", "name": "Rajkot"},
    {"id": "1", "name": "Ahmedabad"},
    {"id": "9292", "name": "Piluda"},
    ...
  ],
  "count": 545
}
```

---

## 2️⃣ **Get Destinations for a Source**

Fetches destination cities available from a specific source city.

```bash
curl -X GET "http://localhost:5000/api/bus/destinations?sourceId=70" \
  -H "Content-Type: application/json"
```

**Example with Rajkot (ID: 70) as source:**
```bash
curl -X GET "http://localhost:5000/api/bus/destinations?sourceId=70&agencyId=144" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {"id": "1", "name": "Ahmedabad"},
    {"id": "9292", "name": "Piluda"},
    {"id": "6418", "name": "16 No bus stop"},
    ...
  ],
  "count": 119,
  "sourceId": "70"
}
```

---

## 3️⃣ **Search Available Buses**

Search for available bus routes between source and destination on a specific date.

**Parameters:**
- `from` - Source city ID (required)
- `to` - Destination city ID (required)
- `date` - Travel date in DD-MM-YYYY format (required)
- `agencyId` - Agency ID (optional, defaults to 144)

```bash
curl -X GET "http://localhost:5000/api/bus/search?from=70&to=1&date=09-10-2025" \
  -H "Content-Type: application/json"
```

**Example: Rajkot to Ahmedabad on October 9, 2025**
```bash
curl -X GET "http://localhost:5000/api/bus/search?from=70&to=1&date=09-10-2025&agencyId=144" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "companyId": "1",
      "companyName": "Infinity Infoway Pvt. Ltd.",
      "fromCityId": "70",
      "fromCityName": "Rajkot",
      "toCityId": "1",
      "toCityName": "Ahmedabad",
      "routeId": "21994",
      "routeTimeId": "56128",
      "routeName": "Jamnagar To Ahmedabad",
      "routeTime": "8:00 PM",
      "kilometer": "250",
      "cityTime": "12:00 AM",
      "arrivalTime": "02:00 AM",
      "busType": "0",
      "busTypeName": "Multi exle volvo",
      "bookingDate": "20-06-2020",
      "arrangementId": "101",
      "arrangementName": "2 X 2 - (41) SEAT A/C VOLVO NEW BUS A",
      "acSeatRate": "500",
      "acSleeperRate": "0",
      "acSlumberRate": "0",
      "nonAcSeatRate": "0",
      "nonAcSleeperRate": "0",
      "nonAcSlumberRate": "0",
      "boardingPoints": "33|motitanki chowk 9998800038|12:00 AM",
      "droppingPoints": "6|abc Tempal, ABD|2:00 AM",
      "emptySeats": "10",
      "referenceNumber": "1#70#1#21994#56128#101#20062020#8:00 PM#12:00 AM#1",
      "acSeatServiceTax": "24",
      "acSeatSurcharges": "7",
      "approxArrival": "20-06-2020 02:00 AM",
      "isApiCommission": "1",
      "cityTime24": "00:00",
      "busSeatType": "1",
      "discountType": "0",
      "discountRate": "0",
      "allowReSchedule": "0",
      "reScheduleCharge": "0",
      "stopReScheduleMinutes": "0",
      "reScheduleChargeType": "0",
      "isSocialDistanceMaintain": "1"
    },
    ...
  ],
  "count": 3,
  "searchParams": {
    "from": "70",
    "to": "1",
    "date": "09-10-2025"
  }
}
```

---

## 📋 **Common City IDs for Testing**

| City ID | City Name |
|---------|-----------|
| 70      | Rajkot    |
| 1       | Ahmedabad |
| 9292    | Piluda    |
| 6418    | 16 No bus stop |
| 3755    | Aagariya  |

---

## 🔍 **Error Handling**

### Missing Parameters
```bash
curl -X GET "http://localhost:5000/api/bus/search?from=70&to=1" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": false,
  "error": "from, to, and date query parameters are required"
}
```

### Invalid Date Format
```bash
curl -X GET "http://localhost:5000/api/bus/search?from=70&to=1&date=2025-10-09" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": false,
  "error": "Invalid date format. Use DD-MM-YYYY (e.g., 09-10-2025)"
}
```

### No Provider Configured
```bash
curl -X GET "http://localhost:5000/api/bus/sources?agencyId=999" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": false,
  "error": "No SAAS provider configured for this agency"
}
```

---

## 🎯 **Quick Test Sequence**

Run these commands in order to test the complete bus search flow:

```bash
# 1. Get all sources
curl -X GET "http://localhost:5000/api/bus/sources" -H "Content-Type: application/json"

# 2. Get destinations from Rajkot (ID: 70)
curl -X GET "http://localhost:5000/api/bus/destinations?sourceId=70" -H "Content-Type: application/json"

# 3. Search buses from Rajkot to Ahmedabad tomorrow
curl -X GET "http://localhost:5000/api/bus/search?from=70&to=1&date=09-10-2025" -H "Content-Type: application/json"
```

---

## 📝 **Notes**

1. **Date Format**: Always use DD-MM-YYYY (e.g., 09-10-2025)
2. **Default Agency**: Defaults to agency 144 which has ITS provider configured
3. **Response Format**: All responses are JSON with `success` boolean
4. **Rate Limiting**: API endpoints have rate limiting enabled
5. **SOAP to REST**: These REST endpoints internally call the configured SOAP APIs

---

## ✅ **API Status**

All 3 SAAS APIs are confirmed working:
- ✅ GetSources
- ✅ GetDestinationsBasedOnSource  
- ✅ GetAvailableRoutes

The REST wrapper converts SOAP/XML responses to clean JSON for your frontend!
