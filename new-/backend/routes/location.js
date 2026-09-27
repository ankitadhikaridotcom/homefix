const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Service = require('../models/Service');
const { requireAuth, requireRole } = require('../middleware/auth');

// In-memory cache for Nominatim requests to strictly respect usage policies
const geocodeCache = new Map();
const searchCache = new Map();

// Helper: Nominatim Reverse Geocode
async function reverseGeocode(lat, lon) {
  const cacheKey = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'HomieFix/1.0 (contact@homiefix.com)',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.statusText}`);
  }

  const data = await response.json();
  const addr = data.address || {};

  const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village || addr.subdistrict || '';
  const city = addr.city || addr.town || addr.municipality || addr.county || addr.district || '';
  const state = addr.state || '';
  const country = addr.country || 'India';
  const pincode = addr.postcode || '';
  const formattedAddress = data.display_name || `${locality}, ${city}, ${state}`.replace(/^,\s*/, '');

  const result = {
    formattedAddress,
    locality,
    city,
    state,
    country,
    pincode,
    latitude: Number(lat),
    longitude: Number(lon),
  };

  geocodeCache.set(cacheKey, result);
  return result;
}

// 1. Reverse Geocode Endpoint
router.post('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon, latitude, longitude } = req.body;
    const finalLat = lat !== undefined ? lat : latitude;
    const finalLon = lon !== undefined ? lon : longitude;

    if (finalLat === undefined || finalLon === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required.' });
    }

    const result = await reverseGeocode(finalLat, finalLon);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Reverse Geocode Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to reverse geocode location.' });
  }
});

// 2. Address Search Endpoint (Nominatim with debouncing support)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, results: [] });
    }

    const cleanQuery = q.trim().toLowerCase();
    if (searchCache.has(cleanQuery)) {
      return res.json({ success: true, results: searchCache.get(cleanQuery) });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&addressdetails=1&limit=8`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HomieFix/1.0 (contact@homiefix.com)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim search error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.map(item => {
      const addr = item.address || {};
      return {
        formattedAddress: item.display_name,
        locality: addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village || '',
        city: addr.city || addr.town || addr.municipality || addr.county || addr.district || '',
        state: addr.state || '',
        country: addr.country || 'India',
        pincode: addr.postcode || '',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };
    });

    searchCache.set(cleanQuery, results);
    res.json({ success: true, results });
  } catch (err) {
    console.error('[Address Search Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to search address.' });
  }
});

// 3. Save User Current Location
router.post('/current', requireAuth, async (req, res) => {
  try {
    const { latitude, longitude, formattedAddress, locality, city, state, country, pincode } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.location = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)], // GeoJSON [lng, lat]
    };

    user.address = {
      formattedAddress: formattedAddress || user.address?.formattedAddress || '',
      locality: locality || user.address?.locality || '',
      city: city || user.address?.city || '',
      state: state || user.address?.state || '',
      country: country || user.address?.country || 'India',
      pincode: pincode || user.address?.pincode || '',
      latitude: Number(latitude),
      longitude: Number(longitude),
    };

    await user.save();

    res.json({
      success: true,
      message: 'Location saved successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        location: user.location,
      },
    });
  } catch (err) {
    console.error('[Save Location Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to save location.' });
  }
});

// 4. GET /api/providers/nearby - Geospatial search using $geoNear with fallback for all services
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, latitude, longitude, maxDistance, category, search, serviceId } = req.query;

    const customerLat = Number(lat !== undefined ? lat : latitude);
    const customerLng = Number(lng !== undefined ? lng : longitude);
    const maxKm = Number(maxDistance) || 100;

    let providers = [];
    if (!isNaN(customerLat) && !isNaN(customerLng)) {
      try {
        const pipeline = [
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [customerLng, customerLat] },
              distanceField: 'distanceInMeters',
              spherical: true,
              query: { role: 'provider' },
            },
          },
          {
            $addFields: {
              distanceInKm: { $round: [{ $divide: ['$distanceInMeters', 1000] }, 1] },
            },
          },
        ];
        providers = await User.aggregate(pipeline);
      } catch (geoErr) {
        console.warn('[geoNear warning]', geoErr.message);
      }
    }

    const providerMap = new Map();
    providers.forEach(p => providerMap.set(p._id.toString(), p));

    // Build service query
    let serviceQuery = {};
    if (serviceId) {
      serviceQuery._id = serviceId;
    }
    if (category) {
      serviceQuery.category = new RegExp(`^${category}$`, 'i');
    }
    if (search) {
      const q = new RegExp(search, 'i');
      serviceQuery.$or = [{ name: q }, { category: q }, { description: q }];
    }

    const services = await Service.find(serviceQuery).populate('provider', 'name email phone profileImage location address serviceRadius');

    const nearbyServices = [];
    const otherServices = [];

    services.forEach(s => {
      if (!s.provider) return;
      const providerIdStr = (s.provider._id || s.provider).toString();
      const providerData = providerMap.get(providerIdStr);

      const serviceObj = {
        id: s._id.toString(),
        name: s.name,
        category: s.category,
        description: s.description || '',
        price: s.basePrice,
        pricingType: s.pricingType,
        fixedPrice: s.fixedPrice || null,
        inspectionFee: s.inspectionFee || null,
        visitFee: s.visitFee || null,
        hourlyRate: s.hourlyRate || null,
        image: s.image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
        provider: {
          id: providerIdStr,
          name: s.provider.name || 'Provider',
          phone: s.provider.phone || '',
          profileImage: s.provider.profileImage || '',
          serviceRadius: s.provider.serviceRadius || 10,
          address: s.provider.address,
          location: s.provider.location,
        },
        rating: 4.8,
        reviewCount: 12,
      };

      if (providerData && providerData.distanceInKm !== undefined) {
        serviceObj.distance = providerData.distanceInKm;
        nearbyServices.push(serviceObj);
      } else {
        serviceObj.distance = null;
        otherServices.push(serviceObj);
      }
    });

    // Sort nearby services by distance first
    nearbyServices.sort((a, b) => a.distance - b.distance);

    // Combine nearby services first, then other available services
    const combinedServices = [...nearbyServices, ...otherServices];

    res.json({
      success: true,
      count: combinedServices.length,
      nearbyCount: nearbyServices.length,
      services: combinedServices,
      providers: providers.map(p => ({
        id: p._id.toString(),
        name: p.name,
        phone: p.phone,
        email: p.email,
        distance: p.distanceInKm,
        serviceRadius: p.serviceRadius || 10,
        address: p.address,
        location: p.location,
      })),
    });
  } catch (err) {
    console.error('[Nearby Providers Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to search nearby providers.' });
  }
});

// 5. Update Provider Service Location & Radius
router.put('/provider', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const { latitude, longitude, formattedAddress, locality, city, state, country, pincode, serviceRadius, openToCustomRequests } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required.' });
    }

    const provider = await User.findById(req.user.id);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found.' });

    provider.location = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)],
    };

    provider.address = {
      formattedAddress: formattedAddress || provider.address?.formattedAddress || '',
      locality: locality || provider.address?.locality || '',
      city: city || provider.address?.city || '',
      state: state || provider.address?.state || '',
      country: country || provider.address?.country || 'India',
      pincode: pincode || provider.address?.pincode || '',
      latitude: Number(latitude),
      longitude: Number(longitude),
    };

    if (serviceRadius !== undefined) {
      provider.serviceRadius = Number(serviceRadius);
    }
    if (openToCustomRequests !== undefined) {
      provider.openToCustomRequests = Boolean(openToCustomRequests);
    }

    await provider.save();

    res.json({
      success: true,
      message: 'Provider service location updated.',
      provider: {
        id: provider._id,
        name: provider.name,
        address: provider.address,
        location: provider.location,
        serviceRadius: provider.serviceRadius,
        openToCustomRequests: provider.openToCustomRequests,
      },
    });
  } catch (err) {
    console.error('[Provider Location Update Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to update provider service location.' });
  }
});

// 6. Get Provider Location Settings
router.get('/provider', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const provider = await User.findById(req.user.id).select('name address location serviceRadius openToCustomRequests');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found.' });

    res.json({
      success: true,
      provider: {
        id: provider._id,
        name: provider.name,
        address: provider.address,
        location: provider.location,
        serviceRadius: provider.serviceRadius || 10,
        openToCustomRequests: provider.openToCustomRequests || false,
      },
    });
  } catch (err) {
    console.error('[Get Provider Location Error]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch provider location.' });
  }
});

module.exports = router;
