const nodemailer = require('nodemailer');

// Create transporter using your UAT mail gateway
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 25,
  secure: false, // Port 25 doesn't use TLS
  tls: {
    rejectUnauthorized: false // For internal mail gateways
  }
});

// Email templates
const templates = {
  checkoutApproved: (data) => ({
    subject: `✅ Device Checkout Approved - ${data.deviceModel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
        <!-- Header with DeviceHub Branding -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center; border-radius: 0;">
          <div style="background: white; display: inline-block; padding: 15px 30px; border-radius: 12px; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: bold;">
              <span style="background: linear-gradient(135deg, #1e3a8a, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">DeviceHub</span>
            </h1>
            <p style="color: #10b981; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">QA Device Management</p>
          </div>
          <h2 style="color: white; margin: 0; font-size: 20px; font-weight: 500;">QA Device Tracker</h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #1e3a8a; margin: 0 0 20px 0;">Your checkout request has been approved! 🎉</h2>
          <div style="background: #E6F2FF; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Device:</strong> <span style="color: #333;">${data.deviceModel} (${data.manufacturer})</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Asset Tag:</strong> <span style="color: #333;">${data.assetTag}</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Expected Return Date:</strong> <span style="color: #333;">${data.expectedReturnDate}</span></p>
            <p style="margin: 0;"><strong style="color: #1e3a8a;">Purpose:</strong> <span style="color: #333;">${data.purpose}</span></p>
          </div>
          <p style="color: #666; font-size: 15px; line-height: 1.6;">You can now collect the device from the QA inventory.</p>
          <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            Please return the device by <strong>${data.expectedReturnDate}</strong>. If you need an extension, please contact the admin.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #1e3a8a; padding: 20px; text-align: center;">
          <p style="color: #E6F2FF; margin: 0; font-size: 12px;">DeviceHub QA Device Management - Quality Assurance Team</p>
          <p style="color: #10b981; margin: 5px 0 0 0; font-size: 11px;">This is an automated notification from QA Device Tracker</p>
        </div>
      </div>
    `
  }),

  checkoutRejected: (data) => ({
    subject: `❌ Device Checkout Rejected - ${data.deviceModel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
        <!-- Header with DeviceHub Branding -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
          <div style="background: white; display: inline-block; padding: 15px 30px; border-radius: 12px; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: bold;">
              <span style="background: linear-gradient(135deg, #1e3a8a, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">DeviceHub</span>
            </h1>
            <p style="color: #10b981; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">QA Device Management</p>
          </div>
          <h2 style="color: white; margin: 0; font-size: 20px; font-weight: 500;">QA Device Tracker</h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #dc3545;">Your checkout request was rejected</h2>
          <div style="background: #fff5f5; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Device:</strong> <span style="color: #333;">${data.deviceModel} (${data.manufacturer})</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Asset Tag:</strong> <span style="color: #333;">${data.assetTag}</span></p>
            <p style="margin: 0;"><strong style="color: #dc3545;">Reason:</strong> <span style="color: #333;">${data.reason}</span></p>
          </div>
          <p style="color: #666; font-size: 15px;">If you have questions, please contact the QA admin.</p>
        </div>
        
        <!-- Footer -->
        <div style="background: #1e3a8a; padding: 20px; text-align: center;">
          <p style="color: #E6F2FF; margin: 0; font-size: 12px;">DeviceHub QA Device Management - Quality Assurance Team</p>
          <p style="color: #10b981; margin: 5px 0 0 0; font-size: 11px;">This is an automated notification from QA Device Tracker</p>
        </div>
      </div>
    `
  }),

  returnApproved: (data) => ({
    subject: `✅ Device Return Confirmed - ${data.deviceModel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
          <div style="background: white; display: inline-block; padding: 15px 30px; border-radius: 12px; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: bold;">
              <span style="background: linear-gradient(135deg, #1e3a8a, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">DeviceHub</span>
            </h1>
            <p style="color: #10b981; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">QA Device Management</p>
          </div>
          <h2 style="color: white; margin: 0; font-size: 20px; font-weight: 500;">QA Device Tracker</h2>
        </div>
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #10b981;">Device return confirmed! ✓</h2>
          <div style="background: #E6F2FF; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Device:</strong> <span style="color: #333;">${data.deviceModel} (${data.manufacturer})</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Asset Tag:</strong> <span style="color: #333;">${data.assetTag}</span></p>
            <p style="margin: 0;"><strong style="color: #1e3a8a;">Returned On:</strong> <span style="color: #333;">${data.returnDate}</span></p>
          </div>
          <p style="color: #666; font-size: 15px;">Thank you for returning the device on time!</p>
        </div>
        <div style="background: #1e3a8a; padding: 20px; text-align: center;">
          <p style="color: #E6F2FF; margin: 0; font-size: 12px;">DeviceHub QA Device Management - Quality Assurance Team</p>
          <p style="color: #10b981; margin: 5px 0 0 0; font-size: 11px;">This is an automated notification from QA Device Tracker</p>
        </div>
      </div>
    `
  }),

  waitlistNotification: (data) => ({
    subject: `🔔 Device Available - ${data.deviceModel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
        <!-- Header with DeviceHub Branding -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
          <div style="background: white; display: inline-block; padding: 15px 30px; border-radius: 12px; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: bold;">
              <span style="background: linear-gradient(135deg, #1e3a8a, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">DeviceHub</span>
            </h1>
            <p style="color: #10b981; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">QA Device Management</p>
          </div>
          <h2 style="color: white; margin: 0; font-size: 20px; font-weight: 500;">QA Device Tracker</h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #1e3a8a;">Good news! Your device is now available 🎉</h2>
          <div style="background: #E6F2FF; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Device:</strong> <span style="color: #333;">${data.deviceModel} (${data.manufacturer})</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Asset Tag:</strong> <span style="color: #333;">${data.assetTag}</span></p>
            <p style="margin: 0;"><strong style="color: #1e3a8a;">Your Position:</strong> <span style="color: #10b981; font-weight: bold;">#${data.position} in waitlist</span></p>
          </div>
          <p style="color: #666; font-size: 15px; line-height: 1.6;">The device you were waiting for has been returned and is now available for checkout.</p>
          <p style="color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">Please submit a checkout request as soon as possible to reserve it.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/devices/${data.deviceId}" 
               style="background: linear-gradient(135deg, #2563eb, #10b981); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              Request Checkout Now
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #1e3a8a; padding: 20px; text-align: center;">
          <p style="color: #E6F2FF; margin: 0; font-size: 12px;">DeviceHub QA Device Management - Quality Assurance Team</p>
          <p style="color: #10b981; margin: 5px 0 0 0; font-size: 11px;">This is an automated notification from QA Device Tracker</p>
        </div>
      </div>
    `
  }),

  reservationApproved: (data) => ({
    subject: `✅ Reservation Approved - ${data.deviceModel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
          <div style="background: white; display: inline-block; padding: 15px 30px; border-radius: 12px; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: bold;">
              <span style="background: linear-gradient(135deg, #1e3a8a, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">DeviceHub</span>
            </h1>
            <p style="color: #10b981; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">QA Device Management</p>
          </div>
          <h2 style="color: white; margin: 0; font-size: 20px; font-weight: 500;">QA Device Tracker</h2>
        </div>
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #1e3a8a;">Your reservation has been approved! 🎉</h2>
          <div style="background: #E6F2FF; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Device:</strong> <span style="color: #333;">${data.deviceModel} (${data.manufacturer})</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Asset Tag:</strong> <span style="color: #333;">${data.assetTag}</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Reserved From:</strong> <span style="color: #333;">${data.reserveFrom}</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Reserved To:</strong> <span style="color: #333;">${data.reserveTo}</span></p>
            <p style="margin: 0;"><strong style="color: #1e3a8a;">Purpose:</strong> <span style="color: #333;">${data.purpose}</span></p>
          </div>
          <p style="color: #666; font-size: 15px;">The device will be automatically checked out to you on ${data.reserveFrom}.</p>
          <p style="color: #999; font-size: 13px; margin-top: 20px;">You can collect the device on or after ${data.reserveFrom}.</p>
        </div>
        <div style="background: #1e3a8a; padding: 20px; text-align: center;">
          <p style="color: #E6F2FF; margin: 0; font-size: 12px;">DeviceHub QA Device Management - Quality Assurance Team</p>
          <p style="color: #10b981; margin: 5px 0 0 0; font-size: 11px;">This is an automated notification from QA Device Tracker</p>
        </div>
      </div>
    `
  }),

  reservationRejected: (data) => ({
    subject: `❌ Reservation Rejected - ${data.deviceModel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
          <div style="background: white; display: inline-block; padding: 15px 30px; border-radius: 12px; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: bold;">
              <span style="background: linear-gradient(135deg, #1e3a8a, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">DeviceHub</span>
            </h1>
            <p style="color: #10b981; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">QA Device Management</p>
          </div>
          <h2 style="color: white; margin: 0; font-size: 20px; font-weight: 500;">QA Device Tracker</h2>
        </div>
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #dc3545;">Your reservation request was rejected</h2>
          <div style="background: #fff5f5; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Device:</strong> <span style="color: #333;">${data.deviceModel} (${data.manufacturer})</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Asset Tag:</strong> <span style="color: #333;">${data.assetTag}</span></p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #1e3a8a;">Dates:</strong> <span style="color: #333;">${data.reserveFrom} to ${data.reserveTo}</span></p>
            <p style="margin: 0;"><strong style="color: #dc3545;">Reason:</strong> <span style="color: #333;">${data.reason}</span></p>
          </div>
          <p style="color: #666; font-size: 15px;">If you have questions, please contact the QA admin.</p>
        </div>
        <div style="background: #1e3a8a; padding: 20px; text-align: center;">
          <p style="color: #E6F2FF; margin: 0; font-size: 12px;">DeviceHub QA Device Management - Quality Assurance Team</p>
          <p style="color: #10b981; margin: 5px 0 0 0; font-size: 11px;">This is an automated notification from QA Device Tracker</p>
        </div>
      </div>
    `
  }),
};

// Send email function
async function sendEmail(to, templateName, data) {
  try {
    if (!to || !to.includes('@')) {
      console.error('Invalid email address:', to);
      return false;
    }

    const template = templates[templateName](data);
    const fromEmail = process.env.SMTP_FROM || 'qa-device-tracker@combank.lk';

    const mailOptions = {
      from: `"QA Device Tracker" <${fromEmail}>`,
      to: to,
      subject: template.subject,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✉️ Email sent:', templateName, 'to', to, '- Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return false;
  }
}

module.exports = { sendEmail };
