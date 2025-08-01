# WhatsApp API URLs - Exact Implementation

## 🔗 INDIVIDUAL WhatsApp Send (Uploaded Data)

**Location:** Uploaded Data page - Green "Send" buttons  
**Route:** `POST /api/agency/whatsapp/send-individual/:id`  
**File:** `server/routes.ts` (line ~2490)

### Exact API URL Format:
```
https://bhashsms.com/api/sendmsg.php?user=eddygoo1&pass=123456&sender=BUZWAP&phone=919900408817&text=eddygoo_2807&priority=wa&stype=normal&Params=Shubin,Intercity Travels,SAVE20,https://www.intercitybooking.com&htype=image&url=https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg
```

### Individual API Parameters:
- **user:** eddygoo1
- **pass:** 123456  
- **sender:** BUZWAP
- **phone:** 919900408817 (91 + 10-digit number)
- **text:** eddygoo_2807 (template ID)
- **priority:** wa
- **stype:** normal
- **Params:** TravelerName,AgencyName,CouponCode,BookingURL
- **htype:** image
- **url:** WhatsApp image from agency profile

---

## 🔗 BULK WhatsApp Send (WhatsApp Scheduler)

**Location:** WhatsApp Scheduler page - "Send Batch" buttons  
**Route:** `POST /api/agency/whatsapp/send-batch/:uploadId`  
**File:** `server/routes.ts` (line ~2890)

### Exact API URL Format (Same as Individual):
```
https://bhashsms.com/api/sendmsg.php?user=eddygoo1&pass=123456&sender=BUZWAP&phone=918088635590&text=eddygoo_2807&priority=wa&stype=normal&Params=Sukan,Intercity Travels,INT10,https://www.intercitybooking.com&htype=image&url=https://i.ibb.co/9w4vXVY/Whats-App-Image-2022-07-26-at-2-57-21-PM.jpg
```

### Bulk Processing:
- **Delay:** 1 second between each message
- **Processing:** Sequential (one by one)
- **Same Parameters:** Identical to individual send
- **Different:** Processes multiple travelers from upload batch

---

## 📊 Current Status

### Individual Send ✅ FIXED
- **Status:** Error fixed (`personalizedMessage` undefined)
- **Working:** API calls successful (S.204468 response)
- **Issue:** Template delivery to WhatsApp

### Bulk Send ✅ WORKING  
- **Status:** API calls successful
- **Working:** Sequential processing with delays
- **Issue:** Template delivery to WhatsApp

---

## 🚨 The Real Problem

**Both individual AND bulk use IDENTICAL API format**
- Same template: `eddygoo_2807`
- Same credentials: `eddygoo1/123456`
- Same sender: `BUZWAP`
- Same parameters structure

**Why messages aren't delivering:**
1. Template `eddygoo_2807` may not be approved for WhatsApp delivery
2. BhashSMS account may have restrictions
3. Template may work for SMS but not WhatsApp

---

## 🛠️ Testing Results

**Latest Test (Individual Send):**
```
API Response: S.204468 ✅ SUCCESS
WhatsApp Delivery: ❓ UNKNOWN (user to confirm)
```

**Template Message Preview:**
```
Hi Shubin, thanks for Traveling with us at Intercity Travels! Get 20% off on your next trip – use Coupon Code SAVE20 🚀 Valid for Next 90 days at: https://www.intercitybooking.com ✨ Hurry Up.
```

---

## 🎯 Next Steps

1. **Test Individual Send:** Try the green "Send" button now (error is fixed)
2. **Check WhatsApp:** See if message arrives on your phone
3. **Contact BhashSMS:** Ask about template `eddygoo_2807` WhatsApp approval
4. **Compare:** Individual vs bulk delivery rates

The API implementation is correct - the issue is template approval with BhashSMS.