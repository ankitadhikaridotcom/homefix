const express = require('express');
const router = express.Router();
const Address = require('../models/Address');
const { requireAuth } = require('../middleware/auth');

// GET /api/addresses - Fetch all saved addresses for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, addresses });
  } catch (err) {
    console.error('[Get Addresses Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch saved addresses.' });
  }
});

// POST /api/addresses - Add a new saved address
router.post('/', requireAuth, async (req, res) => {
  try {
    const { label, customLabel, address, locality, city, state, country, pincode, latitude, longitude, isDefault } = req.body;

    if (!address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Address, latitude, and longitude are required.' });
    }

    // If setting as default, unset other default addresses for this user
    if (isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    // If first address of user, make it default automatically
    const existingCount = await Address.countDocuments({ user: req.user.id });
    const shouldBeDefault = isDefault || existingCount === 0;

    const newAddress = await Address.create({
      user: req.user.id,
      label: label || 'Home',
      customLabel,
      address,
      locality: locality || '',
      city: city || '',
      state: state || '',
      country: country || 'India',
      pincode: pincode || '',
      latitude: Number(latitude),
      longitude: Number(longitude),
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)], // [lng, lat]
      },
      isDefault: shouldBeDefault,
    });

    res.status(201).json({ success: true, address: newAddress });
  } catch (err) {
    console.error('[Create Address Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to save address.' });
  }
});

// PUT /api/addresses/:id - Update an address
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { label, customLabel, address, locality, city, state, country, pincode, latitude, longitude, isDefault } = req.body;

    const targetAddress = await Address.findOne({ _id: req.params.id, user: req.user.id });
    if (!targetAddress) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized.' });
    }

    if (isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    if (label) targetAddress.label = label;
    if (customLabel !== undefined) targetAddress.customLabel = customLabel;
    if (address) targetAddress.address = address;
    if (locality !== undefined) targetAddress.locality = locality;
    if (city !== undefined) targetAddress.city = city;
    if (state !== undefined) targetAddress.state = state;
    if (country !== undefined) targetAddress.country = country;
    if (pincode !== undefined) targetAddress.pincode = pincode;
    if (isDefault !== undefined) targetAddress.isDefault = isDefault;

    if (latitude !== undefined && longitude !== undefined) {
      targetAddress.latitude = Number(latitude);
      targetAddress.longitude = Number(longitude);
      targetAddress.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    await targetAddress.save();
    res.json({ success: true, address: targetAddress });
  } catch (err) {
    console.error('[Update Address Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to update address.' });
  }
});

// DELETE /api/addresses/:id - Delete an address
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized.' });
    }

    // If deleted address was default, set the newest address as default
    if (address.isDefault) {
      const latest = await Address.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (latest) {
        latest.isDefault = true;
        await latest.save();
      }
    }

    res.json({ success: true, message: 'Address deleted successfully.' });
  } catch (err) {
    console.error('[Delete Address Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete address.' });
  }
});

// PUT /api/addresses/:id/default - Set address as default
router.put('/:id/default', requireAuth, async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized.' });
    }

    await Address.updateMany({ user: req.user.id }, { isDefault: false });
    address.isDefault = true;
    await address.save();

    res.json({ success: true, message: 'Default address updated.', address });
  } catch (err) {
    console.error('[Set Default Address Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to set default address.' });
  }
});

module.exports = router;
