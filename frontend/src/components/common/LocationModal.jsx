import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaCrosshairs, FaSearch, FaMapMarkedAlt, FaBookmark, FaTimes, FaCheck, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import LeafletMap from './LeafletMap';
import { useAuth } from '../../context/AuthContext';

export default function LocationModal({ isOpen, onClose, onSelectLocation, initialLocation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('gps'); // 'gps' | 'search' | 'map' | 'saved'
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Address search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Selected location object state
  const [selectedLoc, setSelectedLoc] = useState({
    latitude: initialLocation?.latitude || user?.address?.latitude || 29.3803,
    longitude: initialLocation?.longitude || user?.address?.longitude || 79.5126,
    address: initialLocation?.formattedAddress || user?.address?.formattedAddress || '',
    locality: initialLocation?.locality || user?.address?.locality || '',
    city: initialLocation?.city || user?.address?.city || '',
    state: initialLocation?.state || user?.address?.state || '',
    pincode: initialLocation?.pincode || user?.address?.pincode || '',
  });

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchSavedAddresses();
    }
  }, [isOpen, user]);

  const fetchSavedAddresses = async () => {
    if (!user) return;
    setLoadingSaved(true);
    try {
      const res = await fetch('http://localhost:5000/api/addresses', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSavedAddresses(data.addresses || []);
      }
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  // 1. Browser Geolocation GPS Handler (triggered strictly on user click)
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Call backend Nominatim proxy reverse geocode
          const res = await fetch('http://localhost:5000/api/location/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });
          const data = await res.json();

          if (data.success) {
            const newLoc = {
              latitude,
              longitude,
              address: data.formattedAddress,
              locality: data.locality,
              city: data.city,
              state: data.state,
              country: data.country,
              pincode: data.pincode,
            };
            setSelectedLoc(newLoc);
            toast.success(`Location detected: ${data.city || data.locality || 'GPS Location'}`);
          } else {
            toast.error(data.message || 'Reverse geocoding failed.');
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to fetch address for GPS coordinates.');
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('GPS permission denied. You can search or select on the map.');
        } else {
          toast.error('Could not determine position. Try searching manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 2. Debounced Search Handler
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length < 3) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/location/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 600); // 600ms debounce
  };

  const handleSelectSearchResult = (result) => {
    const newLoc = {
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.formattedAddress,
      locality: result.locality,
      city: result.city,
      state: result.state,
      country: result.country,
      pincode: result.pincode,
    };
    setSelectedLoc(newLoc);
    toast.success(`Selected: ${result.city || result.locality || 'Location'}`);
  };

  // 3. Map Click Handler
  const handleMapPositionChange = async (lat, lng) => {
    try {
      const res = await fetch('http://localhost:5000/api/location/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLoc({
          latitude: lat,
          longitude: lng,
          address: data.formattedAddress,
          locality: data.locality,
          city: data.city,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Confirm Location & Persist to User DB
  const handleConfirmLocation = async () => {
    if (!selectedLoc.latitude || !selectedLoc.longitude) {
      toast.error('Please select a valid location.');
      return;
    }

    setLoading(true);
    try {
      // If user logged in, persist location to user profile
      if (user) {
        await fetch('http://localhost:5000/api/location/current', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            latitude: selectedLoc.latitude,
            longitude: selectedLoc.longitude,
            formattedAddress: selectedLoc.address,
            locality: selectedLoc.locality,
            city: selectedLoc.city,
            state: selectedLoc.state,
            pincode: selectedLoc.pincode,
          }),
        });
      }

      if (onSelectLocation) {
        onSelectLocation(selectedLoc);
      }

      toast.success('Location updated!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update location.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <FaMapMarkerAlt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Select Location</h3>
              <p className="text-xs text-primary-100">Find nearby service providers in your area</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/80 px-4 pt-2">
          <button
            onClick={() => setActiveTab('gps')}
            className={`flex-1 py-3 px-3 text-xs font-semibold rounded-t-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'gps'
                ? 'bg-white text-primary-600 border-t-2 border-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FaCrosshairs className="w-3.5 h-3.5" />
            <span>Current GPS</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 px-3 text-xs font-semibold rounded-t-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'search'
                ? 'bg-white text-primary-600 border-t-2 border-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FaSearch className="w-3.5 h-3.5" />
            <span>Search Address</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 px-3 text-xs font-semibold rounded-t-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'map'
                ? 'bg-white text-primary-600 border-t-2 border-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FaMapMarkedAlt className="w-3.5 h-3.5" />
            <span>Choose on Map</span>
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-3 px-3 text-xs font-semibold rounded-t-xl flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'saved'
                  ? 'bg-white text-primary-600 border-t-2 border-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <FaBookmark className="w-3.5 h-3.5" />
              <span>Saved</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: GPS */}
          {activeTab === 'gps' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto text-primary-600 text-2xl">
                <FaCrosshairs className={gpsLoading ? 'animate-spin' : ''} />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="font-bold text-gray-900 text-base">Detect Current Location</h4>
                <p className="text-xs text-gray-500">
                  Click the button below to allow browser GPS location access.
                </p>
              </div>

              <button
                onClick={handleDetectGPS}
                disabled={gpsLoading}
                className="btn-primary py-3 px-6 text-sm flex items-center justify-center space-x-2 mx-auto shadow-lg shadow-primary-500/25"
              >
                {gpsLoading ? (
                  <>
                    <FaSpinner className="animate-spin w-4 h-4" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <FaCrosshairs className="w-4 h-4" />
                    <span>Use My Current Location</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: SEARCH */}
          {activeTab === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Type city, area or street name (e.g. Haldwani)"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {searching && (
                  <FaSpinner className="animate-spin absolute right-3.5 top-3.5 text-primary-600 w-4 h-4" />
                )}
              </div>

              {/* Search Results */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="p-3 bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 rounded-xl cursor-pointer transition-colors flex items-start space-x-3 group"
                  >
                    <FaMapMarkerAlt className="w-4 h-4 text-gray-400 group-hover:text-primary-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-900 line-clamp-1">{item.formattedAddress}</p>
                      <p className="text-[11px] text-gray-500">
                        {[item.locality, item.city, item.state, item.pincode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
                {searchQuery.length >= 3 && !searching && searchResults.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-4">No matching locations found.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LEAFLET MAP */}
          {activeTab === 'map' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Click or drag the pin on the map to select exact location:</p>
              <LeafletMap
                center={[selectedLoc.latitude, selectedLoc.longitude]}
                zoom={14}
                markerPosition={[selectedLoc.latitude, selectedLoc.longitude]}
                onPositionChange={handleMapPositionChange}
                interactive={true}
                height="240px"
              />
            </div>
          )}

          {/* TAB 4: SAVED ADDRESSES */}
          {activeTab === 'saved' && (
            <div className="space-y-2">
              {loadingSaved ? (
                <div className="text-center py-6">
                  <FaSpinner className="animate-spin w-6 h-6 text-primary-600 mx-auto" />
                </div>
              ) : savedAddresses.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">No saved addresses yet.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => {
                        setSelectedLoc({
                          latitude: addr.latitude,
                          longitude: addr.longitude,
                          address: addr.address,
                          locality: addr.locality,
                          city: addr.city,
                          state: addr.state,
                          pincode: addr.pincode,
                        });
                        toast.success(`Selected saved address: ${addr.label}`);
                      }}
                      className="p-3 bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="p-2 bg-white rounded-lg shadow-sm text-primary-600 font-bold text-xs">
                          {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '🏢' : '📍'}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{addr.label}</p>
                          <p className="text-[11px] text-gray-500 line-clamp-1">{addr.address}</p>
                        </div>
                      </div>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Location Card */}
          {selectedLoc.address && (
            <div className="p-3.5 bg-primary-50/60 border border-primary-100 rounded-2xl flex items-start space-x-3">
              <div className="p-2 bg-primary-600 text-white rounded-xl shrink-0 mt-0.5">
                <FaMapMarkerAlt className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold tracking-wider uppercase text-primary-600">Selected Location</span>
                <p className="text-xs font-bold text-gray-900 truncate">{selectedLoc.address}</p>
                <p className="text-[11px] text-gray-500">
                  {[selectedLoc.locality, selectedLoc.city, selectedLoc.state, selectedLoc.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmLocation}
            disabled={loading || !selectedLoc.latitude}
            className="btn-primary py-2.5 px-6 text-xs flex items-center space-x-2 shadow-md"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin w-3.5 h-3.5" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaCheck className="w-3.5 h-3.5" />
                <span>Confirm & Set Location</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
