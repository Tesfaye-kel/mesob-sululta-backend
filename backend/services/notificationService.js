const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');

// ─── Email Notification ─────────────────────────────────────────
const sendEmailNotification = async ({ name, email, to, subject, message, html, type }) => {
  try {
    // For password resets, `to` is explicit. For contact messages, fall back to admin email from DB.
    let adminEmail = to;
    if (!adminEmail) {
      const contact = await Contact.findOne().sort({ createdAt: -1 });
      adminEmail = contact?.email || process.env.ADMIN_EMAIL;
    }

    if (!adminEmail) {
      console.warn('No destination email configured - skipping email notification');
      return { success: false, reason: 'no-email-configured' };
    }

    // If SMTP is not configured, log the notification instead
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS ||
        process.env.SMTP_PASS === 'your_gmail_app_password_here') {
      console.warn(`[EMAIL SKIPPED - SMTP not configured] To: ${adminEmail}, Subject: ${subject}`);
      return { success: false, reason: 'smtp-not-configured' };
    }

    // Force IPv4 (family=4) to avoid IPv6 ENETUNREACH, and set sane timeouts
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      // Prefer IPv4 over IPv6 (fixes ENETUNREACH on some networks)
      tls: { rejectUnauthorized: false },
      // Force IPv4 lookups
      lookup: require('dns').lookup,
    });

    const mailOptions = {
      from:    `"MESOB Sululta" <${process.env.SMTP_USER}>`,
      to:      adminEmail,
      replyTo: email,
      subject: subject || 'New Message — MESOB Sululta',
      text:    message,
      html:    html || undefined,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email notification sent to ${adminEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Failed to send email notification:', err.message);
    return { success: false, error: err.message };
  }
};

// ─── SMS Notification ───────────────────────────────────────────
const sendSmsNotification = async ({ name, email, subject, message, type }) => {
  try {
    // Get the contact settings to find the admin phone
    const contact = await Contact.findOne().sort({ createdAt: -1 });
    const adminPhone = contact?.phone || process.env.ADMIN_PHONE;

    if (!adminPhone) {
      console.warn('No admin phone configured - skipping SMS notification');
      return { success: false, reason: 'no-phone-configured' };
    }

    // If SMS provider is not configured, log the notification instead
    if (!process.env.SMS_PROVIDER) {
      console.log(`[SMS NOTIFICATION - SMS provider not configured] To: ${adminPhone}, From: ${name} (${email}), Subject: ${subject || 'New Contact Message'}`);
      return { success: false, reason: 'sms-not-configured' };
    }

    const smsText = `[MESOB Sululta] New ${type} message from ${name} (${email}). Subject: ${subject || 'N/A'}. Message: ${message.substring(0, 160)}`;

    // Support for different SMS providers
    if (process.env.SMS_PROVIDER === 'africastalking') {
      // Africa's Talking SMS API
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': process.env.SMS_API_KEY,
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username: process.env.SMS_USERNAME,
          to: adminPhone,
          message: smsText,
          from: process.env.SMS_SENDER_ID || 'MESOB',
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`SMS notification sent to ${adminPhone}`);
      return { success: true, data };
    } else if (process.env.SMS_PROVIDER === 'twilio') {
      // Twilio SMS API
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !twilioPhone) {
        throw new Error('Twilio credentials not fully configured');
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          },
          body: new URLSearchParams({
            To: adminPhone,
            From: twilioPhone,
            Body: smsText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`SMS API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`SMS notification sent to ${adminPhone}`);
      return { success: true, data };
    } else {
      console.warn(`Unknown SMS provider: ${process.env.SMS_PROVIDER}`);
      return { success: false, reason: 'unknown-sms-provider' };
    }
  } catch (err) {
    console.error('Failed to send SMS notification:', err.message);
    return { success: false, error: err.message };
  }
};

// ─── Combined Notification ──────────────────────────────────────
const sendNotifications = async (messageData) => {
  const results = {
    email: null,
    sms: null,
  };

  // Send email notification
  results.email = await sendEmailNotification(messageData);

  // Send SMS notification
  results.sms = await sendSmsNotification(messageData);

  return results;
};

module.exports = {
  sendEmailNotification,
  sendSmsNotification,
  sendNotifications,
};