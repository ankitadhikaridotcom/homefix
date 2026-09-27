const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const connectDB = require('./db');
const User = require('./models/User');
const otpRoutes = require('./routes/otp');
const locationRoutes = require('./routes/location');
const addressRoutes = require('./routes/address');
const Service = require('./models/Service');
const Booking = require('./models/Booking');
const CustomServiceRequest = require('./models/CustomServiceRequest');
const Quote = require('./models/Quote');
const Notification = require('./models/Notification');
const Review = require('./models/Review');
const { requireAuth, requireRole } = require('./middleware/auth');

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Setup Multer for simulated Cloud Storage (local uploads folder)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
});
const upload = multer({ storage });

// Serve uploads statically
app.use('/uploads', express.static(uploadDir));

// Image Upload Endpoint (Simulates Cloud Storage)
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const photoUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ success: true, photoUrl });
});

// OTP routes (WhatsApp via Twilio Verify)
app.use('/api/otp', otpRoutes);

// Location & Address routes
app.use('/api/location', locationRoutes);
app.use('/api/addresses', addressRoutes);
app.get('/api/providers/nearby', (req, res, next) => {
  req.url = '/nearby' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
  locationRoutes(req, res, next);
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('HomeFix API is running');
});

// ---------- Auth Routes ----------

// Register route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, profession, experience, city, about } = req.body;
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!['customer', 'provider'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be customer or provider.' });
    }
    if (!email.match(/.+@.+\..+/)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (role === 'provider') {
      if (!profession) return res.status(400).json({ success: false, message: 'Service category is required for providers.' });
      if (!city) return res.status(400).json({ success: false, message: 'Service area is required for providers.' });
    }
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone,
      password: hashed,
      role,
      phoneVerified: false,
      verificationStatus: role === 'provider' ? 'pending' : 'approved',
    };
    if (role === 'provider') {
      if (profession) userData.profession = profession;
      if (experience) userData.experience = Number(experience);
      if (city) { userData.city = city; userData.address = { city }; }
      if (about) userData.about = about;
    }
    const user = await User.create(userData);
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, message: 'Registration successful', user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, verificationStatus: user.verificationStatus } });
  } catch (err) {
    console.error('[Register Error]', err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      const msg = field === 'phone' ? 'This phone number is already registered.' : 'An account with this email already exists.';
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// OTP-verified registration (new preferred flow)
app.post('/api/auth/register-verified', async (req, res) => {
  try {
    const { name, email, phone, password, role, profession, experience, city, about } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!['customer', 'provider'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Admin accounts cannot be created through signup.' });
    }
    if (!email.match(/.+@.+\..+/)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (role === 'provider') {
      if (!profession) return res.status(400).json({ success: false, message: 'Service category is required for providers.' });
      if (!city) return res.status(400).json({ success: false, message: 'Service area is required for providers.' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone,
      password: hashed,
      role,
      phoneVerified: true,
      verificationStatus: role === 'provider' ? 'pending' : 'approved',
    };
    if (role === 'provider') {
      if (profession) userData.profession = profession;
      if (experience) userData.experience = Number(experience);
      if (city) { userData.city = city; userData.address = { city }; }
      if (about) userData.about = about;
    }
    const user = await User.create(userData);

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({
      success: true,
      message: 'Account created successfully.',
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, phoneVerified: user.phoneVerified, verificationStatus: user.verificationStatus },
    });
  } catch (err) {
    console.error('[Register-Verified Error]', err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      const msg = field === 'phone' ? 'This phone number is already registered.' : 'An account with this email already exists.';
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: 'Account creation failed. Please try again.' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, role } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential missing.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account must have an email.' });
    }

    // Check if user exists by googleId
    let user = await User.findOne({ googleId: sub });

    if (!user) {
      // Check if user exists by email
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        // Link google account to existing user
        user.googleId = sub;
        user.authProvider = 'google';
        if (!user.profileImage && picture) {
          user.profileImage = picture;
        }
        await user.save();
      } else {
        // New Google user — if no role provided, ask frontend to show role selection
        if (!role || !['customer', 'provider'].includes(role)) {
          return res.json({
            success: true,
            needsRole: true,
            googleData: { googleId: sub, name, email: email.toLowerCase(), picture },
          });
        }
        // Create new user with the selected role
        const dummyPhone = `google_${sub}`;
        user = await User.create({
          name: name,
          email: email.toLowerCase(),
          phone: dummyPhone,
          role,
          googleId: sub,
          authProvider: 'google',
          profileImage: picture,
          phoneVerified: true,
          verificationStatus: role === 'provider' ? 'pending' : 'approved',
        });
      }
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, phoneVerified: user.phoneVerified, profileImage: user.profileImage, verificationStatus: user.verificationStatus } });
  } catch (err) {
    console.error('[Google Auth Error]', err.message);
    res.status(500).json({ success: false, message: 'Google authentication failed. Please try again.' });
  }
});

// Google signup completion — when a new Google user selects their role
app.post('/api/auth/google/complete-signup', async (req, res) => {
  try {
    const { googleId, name, email, picture, role, profession, experience, city, about } = req.body;
    if (!googleId || !email || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    if (!['customer', 'provider'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    if (role === 'provider') {
      if (!profession) return res.status(400).json({ success: false, message: 'Service category is required for providers.' });
      if (!city) return res.status(400).json({ success: false, message: 'Service area is required for providers.' });
    }

    // Check if already exists
    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });
    if (user) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const dummyPhone = `google_${googleId}`;
    const userData = {
      name: name || 'User',
      email: email.toLowerCase(),
      phone: dummyPhone,
      role,
      googleId,
      authProvider: 'google',
      profileImage: picture || '',
      phoneVerified: true,
      verificationStatus: role === 'provider' ? 'pending' : 'approved',
    };
    if (role === 'provider') {
      if (profession) userData.profession = profession;
      if (experience) userData.experience = Number(experience);
      if (city) { userData.city = city; userData.address = { city }; }
      if (about) userData.about = about;
    }
    user = await User.create(userData);

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, verificationStatus: user.verificationStatus, profileImage: user.profileImage } });
  } catch (err) {
    console.error('[Google Complete Signup Error]', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }
    res.status(500).json({ success: false, message: 'Google signup failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Support login by email OR phone (including raw 10-digit or +91 prefixed)
    const loginIdentifier = email.trim();
    let phoneWithCountryCode = loginIdentifier;
    // If it's exactly 10 digits, also try the +91 version
    if (loginIdentifier.length === 10 && /^\d+$/.test(loginIdentifier)) {
      phoneWithCountryCode = `+91${loginIdentifier}`;
    }

    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { phone: loginIdentifier },
        { phone: phoneWithCountryCode }
      ],
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email or phone number.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    // Role is always from DB — frontend must redirect based on this, not its own state
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, phoneVerified: user.phoneVerified, verificationStatus: user.verificationStatus } });
  } catch (err) {
    console.error('[Login Error]', err.message);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, user });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
});

// ---------- Helper: map service to frontend format ----------
function mapService(s) {
  return {
    id: s._id.toString(),
    _id: s._id.toString(),
    name: s.name,
    category: s.category,
    description: s.description || '',
    price: s.basePrice,
    priceType: s.pricingType,
    pricingType: s.pricingType,
    fixedPrice: s.fixedPrice || null,
    inspectionFee: s.inspectionFee || null,
    visitFee: s.visitFee || null,
    hourlyRate: s.hourlyRate || null,
    billingIncrement: s.billingIncrement || 60,
    isActive: s.isActive !== undefined ? s.isActive : true,
    image: s.image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    provider: s.provider ? { id: (s.provider._id || s.provider).toString(), name: s.provider.name || '' } : null,
    rating: s.rating || 0,
    reviewCount: s.reviewCount || 0,
  };
}

// ---------- Services Routes ----------

// Services endpoint (public)
app.get('/api/services', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = {};
    if (category) query.category = new RegExp(`^${category}$`, 'i');
    if (search) {
      const q = new RegExp(search, 'i');
      query.$or = [{ name: q }, { category: q }, { description: q }];
    }
    let services = await Service.find(query).populate('provider', 'name email phone verificationStatus');
    // Only show services whose provider is approved (or services without a provider)
    services = services.filter(s => !s.provider || s.provider.verificationStatus === 'approved' || !s.provider.verificationStatus);
    let result = services.map(mapService);
    if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
    res.json({ success: true, services: result });
  } catch (err) {
    console.error('Fetch services error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch services.' });
  }
});

// Get Provider's Services endpoint (provider only) — must be above /:id so Express doesn't treat "me" as an ID
app.get('/api/services/me', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const services = await Service.find({ provider: req.user.id });
    let result = services.map(mapService);
    res.json({ success: true, services: result });
  } catch (err) {
    console.error('Fetch provider services error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch your services.' });
  }
});

// Get single service by ID (public)
app.get('/api/services/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('provider', 'name email phone');
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
    res.json({ success: true, service: mapService(service) });
  } catch (err) {
    console.error('Fetch single service error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch service.' });
  }
});

// Add Service endpoint (provider only)
app.post('/api/services', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const { name, category, description, pricingType, fixedPrice, inspectionFee, visitFee, hourlyRate, billingIncrement, image } = req.body;
    if (!name || !category || !pricingType) {
      return res.status(400).json({ success: false, message: 'Name, category, and pricing type are required.' });
    }
    if (!['fixed', 'inspection', 'hourly'].includes(pricingType)) {
      return res.status(400).json({ success: false, message: 'Invalid pricing type.' });
    }
    // Build service data — basePrice is auto-computed by the model pre-validate hook
    const serviceData = { name, category, description, pricingType, image, provider: req.user.id, basePrice: 0 };
    if (pricingType === 'fixed') serviceData.fixedPrice = Number(fixedPrice);
    if (pricingType === 'inspection') serviceData.inspectionFee = Number(inspectionFee);
    if (pricingType === 'hourly') {
      serviceData.visitFee = Number(visitFee);
      serviceData.hourlyRate = Number(hourlyRate);
      serviceData.billingIncrement = Number(billingIncrement) || 60;
    }
    const newService = await Service.create(serviceData);
    res.status(201).json({ success: true, service: newService });
  } catch (err) {
    console.error('Create service error:', err);
    const msg = err.message || 'Failed to create service.';
    res.status(400).json({ success: false, message: msg });
  }
});

// Delete Service endpoint (provider only)
app.delete('/api/services/:id', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, provider: req.user.id });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found or you do not have permission to delete it.' });
    }
    await Service.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Service deleted successfully.' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete service.' });
  }
});

// Edit Service endpoint (provider only)
app.put('/api/services/:id', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, provider: req.user.id });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found or access denied.' });
    const { name, category, description, image, pricingType, fixedPrice, inspectionFee, visitFee, hourlyRate, billingIncrement } = req.body;
    if (name) service.name = name;
    if (category) service.category = category;
    if (description !== undefined) service.description = description;
    if (image !== undefined) service.image = image;
    if (pricingType && ['fixed', 'inspection', 'hourly'].includes(pricingType)) {
      service.pricingType = pricingType;
      if (pricingType === 'fixed' && fixedPrice) service.fixedPrice = Number(fixedPrice);
      if (pricingType === 'inspection' && inspectionFee) service.inspectionFee = Number(inspectionFee);
      if (pricingType === 'hourly') {
        if (visitFee) service.visitFee = Number(visitFee);
        if (hourlyRate) service.hourlyRate = Number(hourlyRate);
        if (billingIncrement) service.billingIncrement = Number(billingIncrement);
      }
    }
    await service.save();
    res.json({ success: true, service: mapService(service) });
  } catch (err) {
    console.error('Edit service error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to update service.' });
  }
});

// Toggle Service Active/Inactive (provider only)
app.put('/api/services/:id/toggle', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, provider: req.user.id });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
    service.isActive = !service.isActive;
    await service.save();
    res.json({ success: true, isActive: service.isActive, service: mapService(service) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle service.' });
  }
});

// Provider Dashboard Stats
app.get('/api/providers/me/stats', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const providerId = req.user.id;
    const allBookings = await Booking.find({ provider: providerId });
    const completedBookings = allBookings.filter(b => b.status === 'completed');

    // This month earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthBookings = completedBookings.filter(b => new Date(b.createdAt) >= startOfMonth);
    const thisMonthEarnings = thisMonthBookings.reduce((sum, b) => sum + ((b.finalTotal || b.total) - (b.platformFee || 0)), 0);

    // Reviews / Rating from completed bookings (via Review model if exists, else mock)
    let avgRating = 0;
    let totalReviews = 0;
    try {
      const Review = require('./models/Review');
      const reviews = await Review.find({ providerId });
      totalReviews = reviews.length;
      if (totalReviews > 0) {
        avgRating = reviews.reduce((s, r) => s + r.rating, 0) / totalReviews;
      }
    } catch (e) { /* Review model may not exist yet */ }

    const servicesCount = await Service.countDocuments({ provider: providerId });

    res.json({
      success: true,
      stats: {
        totalBookings: allBookings.length,
        completedJobs: completedBookings.length,
        thisMonthEarnings: Math.round(thisMonthEarnings),
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews,
        servicesCount,
        pendingBookings: allBookings.filter(b => b.status === 'pending').length,
        activeBookings: allBookings.filter(b => ['confirmed', 'upcoming', 'ongoing'].includes(b.status)).length,
      }
    });
  } catch (err) {
    console.error('[Provider Stats Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// Update Provider Availability (working days/hours/unavailable dates)
app.put('/api/providers/me/availability', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const { workingDays, startTime, endTime, unavailableDates } = req.body;
    const provider = await User.findById(req.user.id);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found.' });

    if (!provider.availability) provider.availability = {};
    if (workingDays !== undefined) provider.availability.workingDays = workingDays;
    if (startTime || endTime) {
      provider.availability.workingHours = {
        start: startTime || provider.availability.workingHours?.start || '09:00',
        end: endTime || provider.availability.workingHours?.end || '18:00',
      };
    }
    if (unavailableDates !== undefined) provider.availability.unavailableDates = unavailableDates;
    provider.markModified('availability');
    await provider.save();
    res.json({ success: true, availability: provider.availability, message: 'Availability updated successfully.' });
  } catch (err) {
    console.error('[Availability Update Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to update availability.' });
  }
});

// Get Provider Reviews
app.get('/api/providers/me/reviews', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    let reviews = [];
    let avgRating = 0;
    try {
      const Review = require('./models/Review');
      reviews = await Review.find({ providerId: req.user.id })
        .populate('customerId', 'name profileImage')
        .sort({ createdAt: -1 });
      if (reviews.length > 0) {
        avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      }
    } catch (e) { /* Review model may not exist */ }
    res.json({ success: true, reviews, avgRating: Math.round(avgRating * 10) / 10, totalReviews: reviews.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
});

// Mark all notifications read
app.put('/api/notifications/read-all', requireAuth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications.' });
  }
});

// Provider Profile Update (name, profession, about, skills etc)
app.put('/api/providers/me/profile', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const { name, phone, profession, about, skills, experience, city, profileImage } = req.body;
    const provider = await User.findById(req.user.id);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found.' });
    if (name) provider.name = name;
    if (phone) provider.phone = phone;
    if (profession !== undefined) provider.profession = profession;
    if (about !== undefined) provider.about = about;
    if (skills !== undefined) provider.skills = skills;
    if (experience !== undefined) provider.experience = experience;
    if (city) { provider.address = provider.address || {}; provider.address.city = city; provider.city = city; }
    if (profileImage !== undefined) provider.profileImage = profileImage;
    await provider.save();
    res.json({ success: true, user: provider, message: 'Profile updated.' });
  } catch (err) {
    console.error('[Provider Profile Update Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// ---------- Bookings Routes (MongoDB) ----------

// Get bookings (role-aware: admin sees all, provider sees their jobs, customer sees their bookings)
app.get('/api/bookings', requireAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'provider') {
      query.provider = req.user.id;
    } else if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }
    // admin sees all

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('service', 'name category image basePrice')
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone');

    const result = bookings.map(b => ({
      id: b.bookingId,
      _id: b._id.toString(),
      serviceName: b.serviceName,
      serviceCategory: b.serviceCategory || '',
      serviceImage: b.serviceImage || '',
      customerName: b.customerName,
      customerPhone: b.customerPhone || '',
      providerName: b.providerName,
      providerId: b.provider?._id?.toString() || '',
      customerId: b.customer?._id?.toString() || '',
      date: b.date,
      time: b.time,
      duration: b.duration,
      description: b.description || '',
      address: b.address?.street
        ? `${b.address.street}${b.address.city ? ', ' + b.address.city : ''}${b.address.pincode ? ' ' + b.address.pincode : ''}`
        : 'Address not provided',
      pricingType: b.pricingType || 'fixed',
      visitCharge: b.visitCharge,
      labourCharge: b.labourCharge,
      platformFee: b.platformFee,
      total: b.total,
      initialPayment: b.initialPayment || b.total,
      finalTotal: b.finalTotal || null,
      quote: b.quote || null,
      hourlyRate: b.hourlyRate || null,
      actualHours: b.actualHours || null,
      materialCharge: b.materialCharge || 0,
      paymentMethod: b.paymentMethod,
      paymentStatus: b.paymentStatus,
      status: b.status,
      isReviewed: b.isReviewed,
      createdAt: b.createdAt,
    }));

    res.json({ success: true, bookings: result });
  } catch (err) {
    console.error('[Get Bookings Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
});

// Get single booking by bookingId (e.g. HF1001)
app.get('/api/bookings/:id', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id })
      .populate('service', 'name category image basePrice')
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Ensure user can only see their own bookings (unless admin)
    if (req.user.role !== 'admin'
      && booking.customer._id.toString() !== req.user.id
      && booking.provider._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, booking });
  } catch (err) {
    console.error('[Get Single Booking Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch booking.' });
  }
});

// Create booking (customer) — pricing-model-aware
app.post('/api/bookings', requireAuth, async (req, res) => {
  try {
    const { serviceId, providerId, date, time, duration, paymentMethod,
      address, city, pincode, landmark, description,
      latitude, longitude, locality, state, formattedAddress } = req.body;

    if (!serviceId || !date || !time) {
      return res.status(400).json({ success: false, message: 'Service, date and time are required.' });
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

    const finalProviderId = providerId || (service.provider?._id || service.provider)?.toString();
    if (!finalProviderId) {
      return res.status(400).json({ success: false, message: 'Provider ID is required.' });
    }

    const customer = await User.findById(req.user.id).select('name phone');
    const provider = await User.findById(finalProviderId).select('name');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found.' });

    // Compute pricing based on model
    let visitCharge = 0, labourCharge = 0, platformFee = 0, total = 0, initialPayment = 0;
    const pt = service.pricingType || 'fixed';

    if (pt === 'fixed') {
      labourCharge = Number(service.fixedPrice || service.basePrice || 0);
      platformFee = Math.round(labourCharge * 0.03);
      total = labourCharge + platformFee;
      initialPayment = total;
    } else if (pt === 'inspection') {
      visitCharge = Number(service.inspectionFee || service.basePrice || 0);
      platformFee = Math.round(visitCharge * 0.03);
      total = visitCharge + platformFee;
      initialPayment = total;
    } else if (pt === 'hourly') {
      visitCharge = Number(service.visitFee || service.basePrice || 0);
      const hrs = Number(duration) || 1;
      labourCharge = Number(service.hourlyRate || 0) * hrs;
      platformFee = Math.round((visitCharge + labourCharge) * 0.03);
      total = visitCharge + labourCharge + platformFee;
      initialPayment = visitCharge + Math.round(visitCharge * 0.03);
    }

    // Double Booking Prevention Check
    const conflictingBooking = await Booking.findOne({
      provider: finalProviderId,
      date,
      time,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    if (conflictingBooking) {
      return res.status(409).json({ success: false, message: 'Provider is already booked for this exact date and time.' });
    }

    const booking = await Booking.create({
      service: serviceId,
      serviceName: service.name,
      serviceCategory: service.category,
      serviceImage: service.image || '',
      customer: req.user.id,
      customerName: customer?.name || 'Customer',
      customerPhone: customer?.phone || '',
      provider: finalProviderId,
      providerName: provider.name,
      date, time,
      duration: Number(duration) || 1,
      description: description || '',
      address: {
        formattedAddress: formattedAddress || address || '',
        street: address || '',
        locality: locality || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        landmark: landmark || '',
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      },
      serviceLocation: (latitude && longitude) ? {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      } : undefined,
      pricingType: pt,
      visitCharge, labourCharge, platformFee, total,
      initialPayment,
      hourlyRate: pt === 'hourly' ? (service.hourlyRate || 0) : undefined,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'partial',
      status: 'pending',
    });

    // Notify provider of new booking
    try {
      await Notification.create({
        userId: finalProviderId,
        title: 'New Booking Request',
        message: `New booking request for ${service.name} from ${customer?.name || 'Customer'}.`,
        type: 'NEW_BOOKING_REQUEST',
        link: '/provider/bookings',
      });
    } catch (notifErr) {
      console.error('[Booking Notification Error]', notifErr.message);
    }

    res.status(201).json({
      success: true,
      booking: {
        id: booking.bookingId, _id: booking._id.toString(),
        serviceName: booking.serviceName, providerName: booking.providerName,
        date: booking.date, time: booking.time,
        total: booking.total, initialPayment: booking.initialPayment,
        pricingType: booking.pricingType, status: booking.status,
      },
    });
  } catch (err) {
    console.error('[Create Booking Error]', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to create booking.' });
  }
});

// Update booking status helper
const handleBookingStatusUpdate = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'upcoming', 'ongoing', 'quote_sent', 'quote_approved', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const booking = await Booking.findOne({ $or: [{ bookingId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }] });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (req.user.role !== 'admin'
      && booking.customer.toString() !== req.user.id
      && booking.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    booking.status = status;
    if (status === 'cancelled' && (booking.paymentStatus === 'paid' || booking.paymentStatus === 'partial')) {
      booking.paymentStatus = 'refunded';
    }
    await booking.save();

    // Send notification to customer on status update
    try {
      const recipientId = req.user.role === 'provider' ? booking.customer : booking.provider;
      await Notification.create({
        userId: recipientId,
        title: `Booking ${status.toUpperCase()}`,
        message: `Booking #${booking.bookingId} (${booking.serviceName}) has been updated to ${status}.`,
        type: status === 'confirmed' ? 'SUCCESS' : status === 'cancelled' ? 'WARNING' : 'INFO',
        link: req.user.role === 'provider' ? '/my-bookings' : '/provider/bookings',
      });
    } catch (notifErr) {
      console.error('[Status Notification Error]', notifErr.message);
    }

    res.json({ success: true, booking: { id: booking.bookingId, status: booking.status } });
  } catch (err) {
    console.error('[Update Booking Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to update booking.' });
  }
};

app.put('/api/bookings/:id', requireAuth, handleBookingStatusUpdate);
app.put('/api/bookings/:id/status', requireAuth, handleBookingStatusUpdate);

// Provider submits a quote for inspection-type booking
app.post('/api/bookings/:id/quote', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.provider.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (booking.pricingType !== 'inspection') return res.status(400).json({ success: false, message: 'Quote is only for inspection-type bookings.' });

    const { labourCharge, partsCharge, additionalCharge, description } = req.body;
    if (!labourCharge || labourCharge <= 0) return res.status(400).json({ success: false, message: 'Labour charge is required.' });

    const quoteTotal = Number(labourCharge) + Number(partsCharge || 0) + Number(additionalCharge || 0);
    booking.quote = {
      labourCharge: Number(labourCharge), partsCharge: Number(partsCharge || 0),
      additionalCharge: Number(additionalCharge || 0), description: description || '',
      total: quoteTotal, status: 'pending', createdAt: new Date(),
    };
    booking.status = 'quote_sent';
    await booking.save();
    res.json({ success: true, booking: { id: booking.bookingId, status: booking.status, quote: booking.quote } });
  } catch (err) {
    console.error('[Quote Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to submit quote.' });
  }
});

// Customer approves or rejects a quote
app.put('/api/bookings/:id/quote-response', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.customer.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (booking.status !== 'quote_sent') return res.status(400).json({ success: false, message: 'No pending quote.' });

    const { action } = req.body; // 'approve' or 'reject'
    if (action === 'approve') {
      booking.quote.status = 'approved';
      booking.finalTotal = booking.initialPayment + booking.quote.total + Math.round(booking.quote.total * 0.03);
      booking.status = 'quote_approved';
    } else {
      booking.quote.status = 'rejected';
      booking.status = 'cancelled';
      booking.paymentStatus = 'refunded';
    }
    await booking.save();
    res.json({ success: true, booking: { id: booking.bookingId, status: booking.status, finalTotal: booking.finalTotal } });
  } catch (err) {
    console.error('[Quote Response Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to process quote response.' });
  }
});

// Provider completes hourly-type booking with actual hours
app.put('/api/bookings/:id/complete-hourly', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.provider.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (booking.pricingType !== 'hourly') return res.status(400).json({ success: false, message: 'Only for hourly bookings.' });

    const { actualHours, materialCharge } = req.body;
    if (!actualHours || actualHours <= 0) return res.status(400).json({ success: false, message: 'Actual hours required.' });

    booking.actualHours = Number(actualHours);
    booking.materialCharge = Number(materialCharge || 0);
    const labour = booking.hourlyRate * booking.actualHours;
    booking.finalTotal = booking.visitCharge + labour + booking.materialCharge + Math.round((booking.visitCharge + labour + booking.materialCharge) * 0.03);
    booking.status = 'completed';
    booking.paymentStatus = 'paid';
    await booking.save();
    res.json({ success: true, booking: { id: booking.bookingId, status: booking.status, finalTotal: booking.finalTotal, actualHours: booking.actualHours } });
  } catch (err) {
    console.error('[Complete Hourly Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to complete hourly booking.' });
  }
});

// Get provider availability
app.get('/api/providers/:id/availability', async (req, res) => {
  try {
    const { date } = req.query; // e.g. YYYY-MM-DD
    if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });

    const provider = await User.findById(req.params.id);
    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }

    const avail = provider.availability || {};
    const workingHours = avail.workingHours || { start: '09:00', end: '18:00' };

    // Check if the date is in unavailableDates
    if (avail.unavailableDates && avail.unavailableDates.includes(date)) {
      return res.json({ success: true, availableSlots: [] });
    }

    // Convert date string to day of week (e.g., 'Mon')
    const dateObj = new Date(date);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = days[dateObj.getDay()];

    if (avail.workingDays && avail.workingDays.length > 0 && !avail.workingDays.includes(dayOfWeek)) {
      return res.json({ success: true, availableSlots: [] });
    }

    // Find all bookings for this provider on this date
    const existingBookings = await Booking.find({
      provider: provider._id,
      date,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    const bookedTimes = existingBookings.map(b => b.time);

    // Generate slots (1-hour slots for simplicity)
    const availableSlots = [];
    let currentHour = parseInt(workingHours.start.split(':')[0]);
    const endHour = parseInt(workingHours.end.split(':')[0]);

    while (currentHour < endHour) {
      const slotStr = `${currentHour.toString().padStart(2, '0')}:00`;

      // Check if inside a break
      let isBreak = false;
      if (avail.breaks) {
        for (const b of avail.breaks) {
          if (slotStr >= b.start && slotStr < b.end) {
            isBreak = true;
            break;
          }
        }
      }

      if (!isBreak && !bookedTimes.includes(slotStr)) {
        availableSlots.push(slotStr);
      }
      currentHour++;
    }

    res.json({ success: true, availableSlots });
  } catch (err) {
    console.error('[Provider Availability Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch availability.' });
  }
});

// Get Provider Earnings
app.get('/api/providers/me/earnings', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const bookings = await Booking.find({
      provider: req.user.id,
      paymentStatus: { $in: ['paid', 'partial'] }
    });

    let totalEarnings = 0;
    let platformFees = 0;
    const transactions = [];

    bookings.forEach(b => {
      const net = b.total - b.platformFee;
      totalEarnings += b.total;
      platformFees += b.platformFee;
      transactions.push({
        id: b.bookingId,
        bookingId: b.bookingId,
        amount: b.total,
        fee: b.platformFee,
        net: net,
        date: b.date,
        status: 'completed'
      });
    });

    const netEarnings = totalEarnings - platformFees;

    res.json({
      success: true,
      earnings: {
        totalEarnings,
        platformFees,
        netEarnings,
        availableBalance: netEarnings, // Mock available balance
        weekly: [{ week: 'W1', earnings: netEarnings }], // Simplified mock structure
        monthly: [{ month: 'Aug', earnings: netEarnings }],
        transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
        bankDetails: { accountNumber: '****1234', bankName: 'Mock Bank', ifsc: 'MOCK0001234' }
      }
    });
  } catch (err) {
    console.error('[Earnings Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch earnings' });
  }
});

// ---------- Custom Service Requests Routes ----------

// Haversine distance helper (returns distance in km)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 1. Create a Custom Service Request (Customer)
app.post('/api/custom-requests', requireAuth, async (req, res) => {
  try {
    const { serviceTitle, description, photos, location, date, time, budget } = req.body;
    if (!description || !location || !location.latitude || !location.longitude || !date || !time) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const request = await CustomServiceRequest.create({
      customerId: req.user.id,
      serviceTitle, description, photos,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        address: location.address,
        houseOrFlat: location.houseOrFlat,
        landmark: location.landmark
      },
      date, time, budget
    });

    // Find eligible providers and notify them safely
    try {
      const providers = await User.find({ role: 'provider' });
      for (const provider of providers) {
        let isEligible = true;
        if (provider.location && provider.location.coordinates && provider.location.coordinates[0] !== 0) {
          const distKm = getDistanceFromLatLonInKm(
            location.latitude, location.longitude,
            provider.location.coordinates[1], provider.location.coordinates[0]
          );
          if (distKm > (provider.serviceRadius || 50)) {
            isEligible = false;
          }
        }
        if (isEligible) {
          await Notification.create({
            userId: provider._id,
            title: 'New Custom Request',
            message: `A new custom request "${serviceTitle || 'Custom Service'}" is available nearby.`,
            type: 'CUSTOM_REQUEST',
            link: '/provider/custom-requests'
          });
        }
      }
    } catch (notifErr) {
      console.error('[Notification Dispatch Warning]', notifErr.message);
    }

    res.status(201).json({ success: true, request });
  } catch (err) {
    console.error('[Create Custom Request Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to create request.' });
  }
});

// 2. Get Custom Requests
app.get('/api/custom-requests', requireAuth, async (req, res) => {
  try {
    let requests = [];
    if (req.user.role === 'customer') {
      requests = await CustomServiceRequest.find({ customerId: req.user.id })
        .populate('acceptedProviders', 'name profileImage')
        .populate('selectedProviderId', 'name profileImage')
        .populate('quoteId')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'provider') {
      const provider = await User.findById(req.user.id);

      // Fetch all pending requests not declined by this provider
      const pendingRaw = await CustomServiceRequest.find({
        status: 'PENDING',
        declinedProviders: { $ne: req.user.id }
      }).populate('customerId', 'name').sort({ createdAt: -1 });

      let filteredPending = pendingRaw;

      // If provider has location coordinates, filter by operating radius (default 50km if radius not specified)
      if (provider && provider.location && provider.location.coordinates && provider.location.coordinates[0] !== 0) {
        const provLng = provider.location.coordinates[0];
        const provLat = provider.location.coordinates[1];
        const maxDistKm = provider.serviceRadius || 50;

        filteredPending = pendingRaw.filter(r => {
          if (r.location && r.location.coordinates && r.location.coordinates[0] && r.location.coordinates[1]) {
            const dist = getDistanceFromLatLonInKm(provLat, provLng, r.location.coordinates[1], r.location.coordinates[0]);
            return dist <= maxDistKm;
          }
          return true; // Include if location format varies
        });
      }

      // Fetch requests where provider is accepted or selected
      const myAccepted = await CustomServiceRequest.find({
        $or: [
          { acceptedProviders: req.user.id },
          { selectedProviderId: req.user.id }
        ]
      }).populate('customerId', 'name').populate('quoteId').sort({ createdAt: -1 });

      requests = [...filteredPending, ...myAccepted];

      // Remove duplicates
      const uniqueIds = new Set();
      requests = requests.filter(r => {
        const idStr = r._id.toString();
        if (!uniqueIds.has(idStr)) {
          uniqueIds.add(idStr);
          return true;
        }
        return false;
      });

      requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, requests });
  } catch (err) {
    console.error('[Get Custom Requests Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
});

// 3. Provider Accepts Request
app.post('/api/custom-requests/:id/accept', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const request = await CustomServiceRequest.findById(req.params.id);
    if (!request || request.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Request not available.' });

    if (!request.acceptedProviders.includes(req.user.id)) {
      request.acceptedProviders.push(req.user.id);
      await request.save();

      await Notification.create({
        userId: request.customerId,
        title: 'Provider Accepted Request',
        message: `A provider has accepted your custom request "${request.serviceTitle || 'Custom Service'}".`,
        type: 'SUCCESS'
      });
    }

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to accept request.' });
  }
});

// 4. Provider Declines Request
app.post('/api/custom-requests/:id/decline', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const request = await CustomServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    if (!request.declinedProviders.includes(req.user.id)) {
      request.declinedProviders.push(req.user.id);
      request.acceptedProviders = request.acceptedProviders.filter(id => id.toString() !== req.user.id);
      await request.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to decline request.' });
  }
});

// 5. Customer Selects Provider
app.post('/api/custom-requests/:id/select-provider', requireAuth, async (req, res) => {
  try {
    const { providerId } = req.body;
    const request = await CustomServiceRequest.findOne({ _id: req.params.id, customerId: req.user.id });
    if (!request || request.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Invalid request.' });

    if (!request.acceptedProviders.includes(providerId)) {
      return res.status(400).json({ success: false, message: 'Provider has not accepted this request.' });
    }

    request.selectedProviderId = providerId;
    request.status = 'PROVIDER_SELECTED';
    await request.save();

    await Notification.create({
      userId: providerId,
      title: 'You were selected!',
      message: `Customer selected you for the request "${request.serviceTitle || 'Custom Service'}". Please send a quote.`,
      type: 'SUCCESS'
    });

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to select provider.' });
  }
});

// 6. Selected Provider Sends Quote
app.post('/api/custom-requests/:id/quote', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const request = await CustomServiceRequest.findOne({ _id: req.params.id, selectedProviderId: req.user.id });
    if (!request || request.status !== 'PROVIDER_SELECTED') return res.status(400).json({ success: false, message: 'Invalid request.' });

    const { inspectionFee, labourFee, materialFee, additionalFee } = req.body;
    const totalAmount = Number(inspectionFee || 0) + Number(labourFee || 0) + Number(materialFee || 0) + Number(additionalFee || 0);

    const quote = await Quote.create({
      requestId: request._id,
      providerId: req.user.id,
      inspectionFee, labourFee, materialFee, additionalFee, totalAmount
    });

    request.quoteId = quote._id;
    request.status = 'QUOTE_SENT';
    await request.save();

    await Notification.create({
      userId: request.customerId,
      title: 'Quote Received',
      message: `You received a quote of ₹${totalAmount} for your custom request.`,
      type: 'INFO'
    });

    res.json({ success: true, quote, request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send quote.' });
  }
});

// 7. Customer Responds to Quote (Accept & Pay)
app.post('/api/custom-requests/:id/quote-response', requireAuth, async (req, res) => {
  try {
    const { action, paymentMethod } = req.body; // action = 'accept' or 'reject'
    const request = await CustomServiceRequest.findOne({ _id: req.params.id, customerId: req.user.id }).populate('quoteId').populate('selectedProviderId');
    if (!request || request.status !== 'QUOTE_SENT' || !request.quoteId) {
      return res.status(400).json({ success: false, message: 'Invalid request.' });
    }

    const quote = request.quoteId;

    if (action === 'accept') {
      quote.status = 'ACCEPTED';
      await quote.save();

      request.status = 'QUOTE_ACCEPTED';

      const customer = await User.findById(req.user.id);

      // Double Booking Prevention Check
      const conflictingBooking = await Booking.findOne({
        provider: request.selectedProviderId._id,
        date: request.date,
        time: request.time,
        status: { $nin: ['cancelled', 'rejected'] }
      });

      if (conflictingBooking) {
        return res.status(409).json({ success: false, message: 'Provider is already booked for this exact date and time. Please coordinate a new time.' });
      }

      // Create Booking
      const booking = await Booking.create({
        customRequestId: request._id,
        serviceName: request.serviceTitle || 'Custom Service',
        serviceCategory: 'Custom',
        customer: req.user.id,
        customerName: customer.name,
        provider: request.selectedProviderId._id,
        providerName: request.selectedProviderId.name,
        date: request.date,
        time: request.time,
        description: request.description,
        address: { street: request.location.address },
        pricingType: 'fixed',
        visitCharge: quote.inspectionFee,
        labourCharge: quote.labourFee + quote.materialFee + quote.additionalFee,
        platformFee: Math.round(quote.totalAmount * 0.03),
        total: quote.totalAmount + Math.round(quote.totalAmount * 0.03),
        initialPayment: quote.totalAmount + Math.round(quote.totalAmount * 0.03),
        paymentMethod: paymentMethod || 'cash',
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
        status: 'confirmed'
      });

      request.bookingId = booking._id;
      await request.save();

      await Notification.create({
        userId: request.selectedProviderId._id,
        title: 'Quote Accepted & Booked!',
        message: `Customer accepted your quote for ₹${quote.totalAmount} and confirmed the booking.`,
        type: 'SUCCESS'
      });

      res.json({ success: true, booking, request });
    } else {
      quote.status = 'REJECTED';
      await quote.save();
      request.status = 'PROVIDER_SELECTED'; // Fallback to select another or re-quote
      request.quoteId = null;
      await request.save();
      res.json({ success: true, request });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process quote response.' });
  }
});

// ---------- Notifications Routes ----------
app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    await Notification.updateOne({ _id: req.params.id, userId: req.user.id }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// Provider settings toggle endpoint
app.patch('/api/provider/settings', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const { openToCustomRequests, acceptingRequests, serviceRadius } = req.body;
    const provider = await User.findById(req.user.id);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found.' });

    const targetToggle = openToCustomRequests !== undefined ? openToCustomRequests : acceptingRequests;

    if (targetToggle !== undefined) {
      if (targetToggle && (!provider.location || !provider.location.coordinates || (provider.location.coordinates[0] === 0 && provider.location.coordinates[1] === 0))) {
        return res.status(400).json({ success: false, message: 'Please add your service location before receiving service requests.' });
      }
      provider.openToCustomRequests = Boolean(targetToggle);
    }

    if (serviceRadius !== undefined) {
      provider.serviceRadius = Number(serviceRadius);
    }

    await provider.save();
    res.json({ success: true, message: 'Provider settings updated.', user: provider });
  } catch (err) {
    console.error('[Provider Settings Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to update provider settings.' });
  }
});

// Profile update (protected)
app.put('/api/profile', requireAuth, async (req, res) => {
  try {
    const updatedData = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    Object.assign(user, updatedData);
    await user.save();
    res.json({ success: true, user, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('[Profile Update Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Provider earnings (protected)
app.get('/api/earnings', requireAuth, requireRole('provider'), (req, res) => {
  // In a real implementation, compute earnings from bookings
  res.json({ success: true, earnings: { total: 0, recent: [] } });
});
// ---------- Admin Routes ----------

// Admin: Get all providers
app.get('/api/admin/providers', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const providers = await User.find({ role: 'provider' }).select('-password').sort({ createdAt: -1 });
    const formatted = providers.map(p => ({
      id: p._id.toString(),
      name: p.name,
      email: p.email,
      phone: p.phone,
      profession: p.profession || '',
      experience: p.experience || 0,
      city: p.address?.city || p.city || '',
      status: p.verificationStatus || 'pending',
      avatar: p.profileImage || '',
      joinDate: p.createdAt,
      about: p.about || '',
      skills: p.skills || [],
      services: p.skills || [],
    }));
    res.json({ success: true, providers: formatted });
  } catch (err) {
    console.error('[Admin Providers Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch providers.' });
  }
});

// Admin: Update provider verification status
app.put('/api/admin/providers/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body; // 'approved', 'rejected', 'pending', 'suspended'
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const provider = await User.findById(req.params.id);
    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }
    provider.verificationStatus = status;
    await provider.save();
    res.json({ success: true, message: `Provider ${status} successfully.`, provider: { id: provider._id, verificationStatus: provider.verificationStatus } });
  } catch (err) {
    console.error('[Admin Provider Status Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to update provider status.' });
  }
});

// Admin: Get all users
app.get('/api/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error('[Admin Users Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// Admin: Platform stats
app.get('/api/admin/stats', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProviders = await User.countDocuments({ role: 'provider' });
    const pendingProviders = await User.countDocuments({ role: 'provider', verificationStatus: 'pending' });
    const approvedProviders = await User.countDocuments({ role: 'provider', verificationStatus: 'approved' });
    const totalServices = await Service.countDocuments();
    const totalBookings = await Booking.countDocuments();
    res.json({
      success: true,
      stats: { totalUsers, totalCustomers, totalProviders, pendingProviders, approvedProviders, totalServices, totalBookings },
    });
  } catch (err) {
    console.error('[Admin Stats Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// ---------- Reviews Route ----------
app.post('/api/reviews', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const { bookingId, providerId, rating, reviewText } = req.body;
    
    // Check if booking exists and belongs to customer
    const booking = await Booking.findOne({ _id: bookingId, customer: req.user.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'completed') return res.status(400).json({ success: false, message: 'Can only review completed bookings.' });
    if (booking.isReviewed) return res.status(400).json({ success: false, message: 'Booking already reviewed.' });

    if (!providerId) return res.status(400).json({ success: false, message: 'Provider ID is missing. The provider may have been removed.' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Valid rating between 1 and 5 is required.' });

    const review = new Review({
      customerId: req.user.id,
      providerId,
      bookingId,
      rating,
      reviewText
    });
    await review.save();

    booking.isReviewed = true;
    await booking.save();

    res.json({ success: true, message: 'Review submitted successfully.', review });
  } catch (err) {
    console.error('[Submit Review Error]', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this booking.' });
    }
    res.status(500).json({ success: false, message: 'Failed to submit review: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`HomeFix Backend running on http://localhost:${PORT}`);
});
