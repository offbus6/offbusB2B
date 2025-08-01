# WhatsApp API Implementation Documentation

## Overview
The WhatsApp scheduler now properly uses the agency's profile settings for:
- **Booking Website URL** (`agency.bookingWebsite` or `agency.website`)
- **WhatsApp Image URL** (`agency.whatsappImageUrl`)

## API Endpoints

### 1. Send WhatsApp to All Travelers in a Batch
**Endpoint:** `POST /api/agency/whatsapp/send-batch/:uploadId`
**Authentication:** Agency access required

**What it does:**
- Fetches all unsent travelers from a specific upload batch
- Uses agency's `bookingWebsite` URL in the message
- Uses agency's `whatsappImageUrl` for the image attachment
- Sends personalized WhatsApp messages with image

**API Call Example:**
```
http://bhashsms.com/api/sendmsg.php?user=eddygoo1&pass=123456&sender=BUZWAP&phone=9876543210&text=Hi%20John%2C%20thanks%20for%20traveling%20with%20ABC%20Travels!%20Get%2020%25%20off%20your%20next%20trip%20with%20code%20SAVE20.%20Valid%20for%2090%20days.%20Book%20at%20https://agency-website.com&priority=wa&stype=normal&Params=54,877,966,52&htype=image&url=https://agency-image-url.com/image.jpg
```

### 2. Send WhatsApp to Individual Traveler
**Endpoint:** `POST /api/agency/whatsapp/send-individual/:id`
**Authentication:** Agency access required

**What it does:**
- Sends WhatsApp to a specific traveler by ID
- Uses agency's `bookingWebsite` URL and `whatsappImageUrl`
- Updates traveler's WhatsApp status

### 3. Send WhatsApp to All Unsent Travelers
**Endpoint:** `POST /api/agency/whatsapp/send-all`
**Authentication:** Agency access required

**What it does:**
- Sends WhatsApp to all travelers who haven't received messages yet
- Uses detailed journey information (route, bus name, travel date)
- Uses agency's profile URLs

## Configuration Sources

### Agency Profile Settings
The system pulls the following from the agency's profile:
1. **Booking Website URL:** `agency.bookingWebsite` or fallback to `agency.website`
2. **WhatsApp Image URL:** `agency.whatsappImageUrl`
3. **Agency Name:** `agency.name`

### Fallback Values
- **Default Booking URL:** `https://testtravelagency.com`
- **Default Image URL:** `https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg`

## Message Templates

### Batch/Individual Message Template:
```
Hi [TravelerName], thanks for traveling with [AgencyName]! Get 20% off your next trip with code [CouponCode]. Valid for 90 days. Book at [BookingWebsiteURL]
```

### Send All Message Template (more detailed):
```
Hi [TravelerName], thanks for traveling with us at [AgencyName]! 

Your [Route] journey on [BusName] ([TravelDate]) was amazing! 🚌

Get 20% off on your next trip – use Coupon Code [CouponCode] 🚀 

Valid for Next 90 days at: [BookingWebsiteURL] ✨ 

Book your next [Route] trip or explore new routes! 

Hurry Up!
```

## API Response Format
**Success Response:**
```json
{
  "success": true,
  "message": "WhatsApp messages sent successfully to 5 travelers",
  "sentCount": 5,
  "totalCount": 5
}
```

**Error Response:**
```json
{
  "error": "Failed to send WhatsApp messages",
  "success": false
}
```

## Key Features

1. **Dynamic URL Integration:** All messages now use the agency's actual booking website URL from their profile
2. **Custom Image Support:** WhatsApp messages include the agency's custom image from their profile
3. **Personalized Messages:** Each message includes traveler name, coupon code, and route details
4. **Status Tracking:** Updates each traveler's WhatsApp status (sent/failed)
5. **Error Handling:** Robust phone number validation and API error handling
6. **Rate Limiting:** 1-second delay between messages to avoid rate limiting

## Testing
Use the WhatsApp Scheduler interface to:
1. View upload batches with their WhatsApp status
2. Send WhatsApp messages to entire batches
3. Track delivery status and success rates

## Console Logging
The system provides detailed console logs for debugging:
- Phone number validation
- Booking URL and image URL usage
- API response details
- Success/failure status for each message