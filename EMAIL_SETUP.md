# Email Notification Setup

The system now sends **real-time email notifications** for:

✅ **Checkout Approved** - User gets notified when admin approves their checkout request  
✅ **Checkout Rejected** - User gets notified with reason  
✅ **Return Confirmed** - User gets confirmation when admin approves return  
✅ **Waitlist Alert** - User gets notified when their waited device becomes available  
✅ **Reservation Approved** - User gets confirmation with dates  
✅ **Reservation Rejected** - User gets notified with reason  

---

## Setup Steps:

### 1. Install nodemailer package
In the `backend` folder, run:
```bash
npm install
```

### 2. Update your `.env` file
Add these lines to `backend/.env`:

```env
# Email (SMTP) Settings
SMTP_HOST=192.168.x.x         # Replace with your UAT mail gateway IP
SMTP_PORT=25
SMTP_FROM=qa-device-tracker@combank.lk
FRONTEND_URL=http://localhost:5173
```

**Important:** Replace `192.168.x.x` with your actual UAT mail gateway IP address.

### 3. Restart the backend
```bash
Ctrl + C
npm run dev
```

---

## How It Works:

### For Users:
- When admin approves/rejects their request → **instant email**
- When device on waitlist becomes available → **instant email with link to checkout**
- All emails are professional HTML templates with Commercial Bank branding

### For Admins:
- Nothing changes in the UI
- Emails are sent automatically in the background
- Check backend terminal - you'll see: `✉️ Email sent: checkoutApproved to user@email.com`

---

## Testing:

1. **Request a checkout** with a real email address
2. **Admin approves** it
3. **Check your email** - you should receive a nicely formatted approval email

If emails don't arrive:
- Check backend terminal for email errors
- Verify SMTP_HOST IP is correct
- Verify port 25 is open between your server and mail gateway
- Check spam/junk folder

---

## Email Templates:

All emails include:
- Commercial Bank branding (navy + blue gradient header)
- Device details (model, asset tag, dates)
- Clear call-to-action buttons where needed
- Professional formatting

You can customize the templates in:
`backend/src/services/emailService.js`

---

## Troubleshooting:

**No emails received?**
1. Check backend console for `✉️ Email sent` messages
2. If you see `❌ Email send failed`, check the error message
3. Verify SMTP_HOST is reachable: `ping <your-mail-gateway-ip>`
4. Confirm port 25 is not blocked by firewall

**Emails going to spam?**
- Add `qa-device-tracker@combank.lk` to your safe senders
- This is normal for internal mail gateways

---

That's it! Email notifications are now live! 📧
