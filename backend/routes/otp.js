const express = require('express');
const router = express.Router();
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// ─── Rate Limiter ───────────────────────────────────────────────────────────
// Max 5 OTP send requests per phone per 15 minutes
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  // Use phone as key when available, fall back to IP via the official helper
  keyGenerator: (req) => req.body?.phone || ipKeyGenerator(req),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many OTP requests. Please try again in 15 minutes.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});


// ─── Twilio Verify Client ────────────────────────────────────────────────────
const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!sid || !token || !serviceSid) {
    return null;
  }

  // Lazy-require so missing creds don't crash the whole server
  const twilio = require('twilio');
  return { client: twilio(sid, token), serviceSid };
};

// ─── Normalize phone to E.164 ────────────────────────────────────────────────
const normalizePhone = (phone) => {
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If already starts with country code (e.g. 91xxxxxxxxxx), prepend +
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  // 10-digit Indian number → prepend +91
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  // Already has + prefix stored without it
  if (digits.length > 10) {
    return `+${digits}`;
  }
  return null;
};

// ─── POST /api/otp/send ──────────────────────────────────────────────────────
router.post('/send', otpSendLimiter, async (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.trim() === '') {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return res.status(400).json({ success: false, message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.' });
  }

  const twilio = getTwilioClient();
  if (!twilio) {
    return res.status(503).json({
      success: false,
      message: 'WhatsApp OTP is not configured on this server. Please contact support.',
    });
  }

  try {
    await twilio.client.verify.v2
      .services(twilio.serviceSid)
      .verifications.create({
        to: normalized,
        channel: 'sms',
      });

    res.json({
      success: true,
      message: `OTP sent via SMS to ${normalized.slice(0, 3)}****${normalized.slice(-4)}`,
      phone: normalized,
    });
  } catch (err) {
    // Log error server-side but never expose raw Twilio errors to client
    console.error('[OTP Send Error]', err.code, err.message);

    if (err.code === 60200) {
      return res.status(400).json({ success: false, message: 'Invalid phone number.' });
    }
    if (err.code === 60203) {
      return res.status(429).json({ success: false, message: 'Max OTP attempts reached. Please try again later.' });
    }
    if (err.code === 21608) {
      return res.status(400).json({ success: false, message: 'This phone number is not verified in your Twilio Trial account.' });
    }

    res.status(500).json({ success: false, message: 'OTP could not be sent. Please try again.' });
  }
});

// ─── POST /api/otp/verify ────────────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP code are required.' });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ success: false, message: 'OTP must be a 6-digit number.' });
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return res.status(400).json({ success: false, message: 'Invalid phone number.' });
  }

  const twilio = getTwilioClient();
  if (!twilio) {
    return res.status(503).json({
      success: false,
      message: 'WhatsApp OTP is not configured on this server. Please contact support.',
    });
  }

  try {
    const check = await twilio.client.verify.v2
      .services(twilio.serviceSid)
      .verificationChecks.create({
        to: normalized,
        code,
      });

    if (check.status === 'approved') {
      return res.json({ success: true, message: 'Phone number verified successfully.', phone: normalized });
    }

    // Twilio returns 'pending' for wrong code, 'expired' for expired
    if (check.status === 'expired') {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
  } catch (err) {
    console.error('[OTP Verify Error]', err.code, err.message);

    if (err.code === 60202) {
      return res.status(400).json({ success: false, message: 'Max OTP check attempts reached. Please request a new OTP.' });
    }
    if (err.status === 404) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    res.status(500).json({ success: false, message: 'OTP verification failed. Please try again.' });
  }
});

module.exports = router;
