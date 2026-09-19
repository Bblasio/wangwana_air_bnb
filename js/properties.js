// Properties database & Agency portfolio manager for Wangwana Real Estate & Serviced Living

export const DEFAULT_PROPERTIES = [
  {
    id: 'whitehouse',
    agencyRef: 'WNG-MLM-01',
    name: 'White House Serviced Residence',
    location: 'Milimani, Kisumu City',
    neighborhood: 'Milimani',
    price: 10500,
    monthlyLease: 185000,
    rating: 4.94,
    reviewsCount: 34,
    beds: 2,
    baths: 2,
    guests: 4,
    type: 'Serviced Apartment',
    status: 'Available',
    badge: 'Agency Managed',
    images: [
      'assets/images/whitehouse.jpg',
      'assets/rooms/living room whitehouse.jpg',
      'assets/rooms/bedroom, whitehouse.jpg',
      'assets/rooms/kitchen whitehouse.jpg',
      'assets/rooms/outside, whitehouse.jpg'
    ],
    description: 'An agency-represented two-bedroom luxury residence in prime Milimani. Maintained directly by Wangwana Agency with daily housekeeping, chef-fitted kitchen, high-speed fiber connectivity, and dedicated on-site concierge.',
    amenities: [
      'Fast Fiber WiFi',
      'Fully Fitted Kitchen',
      'Secure Free Parking',
      '24/7 Security Guard',
      'Smart TV & Netflix',
      'Washing Machine',
      'Balcony with Garden View',
      'Backup Power Generator'
    ]
  },
  {
    id: 'delpiero',
    agencyRef: 'WNG-RHT-02',
    name: 'Delpiero Luxury Hilltop Villa',
    location: 'Riat Hills, Kisumu',
    neighborhood: 'Riat Hills',
    price: 15200,
    monthlyLease: 290000,
    rating: 4.98,
    reviewsCount: 46,
    beds: 3,
    baths: 3,
    guests: 6,
    type: 'Executive Villa',
    status: 'Available',
    badge: 'Exclusive Mandate',
    images: [
      'assets/images/delpiero.jpg',
      'assets/rooms/livingroom.delpiero.jpg',
      'assets/rooms/bedroom.delpiero.jpg',
      'assets/rooms/kitchen.delpier.jpg',
      'assets/rooms/outside.delpiero.jpg'
    ],
    description: 'Perched upon the prestigious Riat Hills with uncompromised panoramic vistas of Kisumu City and Lake Victoria. Managed exclusively by Wangwana Agency, offering master en-suite bedrooms, open-plan architectural living, sunset veranda, and private grounds.',
    amenities: [
      'Panoramic Lake & City View',
      'High-Speed WiFi',
      'Chef-Grade Kitchen',
      'En-Suite Bathrooms',
      'Private Terrace & Garden',
      '24/7 Manned Gate & CCTV',
      'Standby Generator',
      'BBQ Facility'
    ]
  },
  {
    id: 'beach',
    agencyRef: 'WNG-DNG-03',
    name: 'Dunga Beachfront Waterfront Villa',
    location: 'Dunga Beachfront, Kisumu',
    neighborhood: 'Dunga Beach',
    price: 16000,
    monthlyLease: 310000,
    rating: 4.92,
    reviewsCount: 29,
    beds: 3,
    baths: 2.5,
    guests: 6,
    type: 'Waterfront Residence',
    status: 'Available',
    badge: 'Waterfront Mandate',
    images: [
      'assets/images/beach.jpg',
      'assets/rooms/outside.beach.jpg',
      'assets/rooms/livingroom.beach.jpg',
      'assets/rooms/bedroom.beach.jpg',
      'assets/rooms/kitchen.beach.jpg'
    ],
    description: 'A waterfront sanctuary situated on the tranquil shores of Lake Victoria in Dunga. Managed by Wangwana Real Estate with private lakeside garden, outdoor entertaining terrace, private jetty access, and full security perimeter.',
    amenities: [
      'Direct Lakeside Access',
      'Private Lawn & Sunset Patio',
      'Outdoor Dining & BBQ Grill',
      'High-Speed WiFi',
      'Fully Equipped Kitchen',
      'Free On-Premises Parking',
      'Quiet Natural Atmosphere',
      '24/7 Security'
    ]
  },
  {
    id: 'victoria',
    agencyRef: 'WNG-TMB-04',
    name: 'Victoria Executive Corporate Suite',
    location: 'Tom Mboya Estate, Kisumu',
    neighborhood: 'Tom Mboya',
    price: 8800,
    monthlyLease: 140000,
    rating: 4.88,
    reviewsCount: 21,
    beds: 1,
    baths: 1,
    guests: 2,
    type: 'Executive Studio',
    status: 'Available',
    badge: 'Corporate Suite',
    images: [
      'assets/images/property 3.jpg',
      'assets/rooms/pexels-jonathanborba-30628725.jpg',
      'assets/rooms/pexels-matthew-2148834898-30298283.jpg'
    ],
    description: 'Tailor-crafted for corporate executives, medical consultants, and NGO travelers on short or extended assignments. Fully managed by Wangwana Agency in a private gated compound in Tom Mboya, minutes from the Kisumu CBD.',
    amenities: [
      'Dedicated Ergonomic Workstation',
      'High-Speed Fiber WiFi',
      'Compact Equipped Kitchenette',
      'Smart TV with Streaming',
      'Solar Hot Water',
      'Secure Gated Compound',
      'Self Check-in Available'
    ]
  }
];

const LOCAL_STORAGE_KEY = 'wangwana_agency_portfolio';

// Initial retrieval from local cache or defaults
function loadInitialProperties() {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read properties cache:', e);
  }
  return [...DEFAULT_PROPERTIES];
}

// Export mutable array for synchronous backwards-compatible access
export let PROPERTIES = loadInitialProperties();

/**
 * Returns latest list of properties
 */
export function getProperties() {
  return PROPERTIES;
}

/**
 * Persists properties to localStorage cache
 */
function cacheProperties(props) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(props));
  } catch (e) {
    console.warn('Could not write properties cache:', e);
  }
}

/**
 * Fetches latest properties from the server REST API
 */
export async function syncPropertiesWithServer() {
  try {
    const res = await fetch('/api/properties');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      PROPERTIES = json.data;
      cacheProperties(PROPERTIES);
      window.dispatchEvent(new CustomEvent('wangwana:properties-updated', { detail: PROPERTIES }));
      return PROPERTIES;
    }
  } catch (err) {
    console.info('Using local properties cache (offline/static fallback):', err.message);
  }
  return PROPERTIES;
}

// Automatically initiate sync in browser environments
if (typeof window !== 'undefined') {
  syncPropertiesWithServer();
}

/**
 * Acquires a new property and adds it to Wangwana Agency's portfolio
 */
export async function acquireProperty(newPropData) {
  const propertyPayload = {
    ...newPropData,
    agencyRef: newPropData.agencyRef || `WNG-KS-${Math.floor(100 + Math.random() * 900)}`,
    status: newPropData.status || 'Available',
    badge: newPropData.badge || 'Newly Acquired',
    rating: 5.0,
    reviewsCount: 1,
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(propertyPayload)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        PROPERTIES.unshift(json.data);
        cacheProperties(PROPERTIES);
        window.dispatchEvent(new CustomEvent('wangwana:properties-updated', { detail: PROPERTIES }));
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Server API unavailable, saving to client state:', err);
  }

  // Fallback client-side generation
  const slug = (newPropData.name || 'property').toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fallbackProp = {
    id: `${slug}-${Date.now().toString(36)}`,
    ...propertyPayload
  };
  PROPERTIES.unshift(fallbackProp);
  cacheProperties(PROPERTIES);
  window.dispatchEvent(new CustomEvent('wangwana:properties-updated', { detail: PROPERTIES }));
  return fallbackProp;
}

/**
 * Updates an existing property
 */
export async function updateProperty(id, updateData) {
  try {
    const res = await fetch(`/api/properties/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (res.ok) {
      const json = await res.json();
      const updated = json.data;
      const index = PROPERTIES.findIndex(p => p.id.toLowerCase() === id.toLowerCase());
      if (index !== -1) {
        PROPERTIES[index] = updated;
        cacheProperties(PROPERTIES);
        window.dispatchEvent(new CustomEvent('wangwana:properties-updated', { detail: PROPERTIES }));
      }
      return updated;
    }
  } catch (err) {
    console.warn('Server update failed, updating local cache:', err);
  }

  const index = PROPERTIES.findIndex(p => p.id.toLowerCase() === id.toLowerCase());
  if (index !== -1) {
    PROPERTIES[index] = { ...PROPERTIES[index], ...updateData };
    cacheProperties(PROPERTIES);
    window.dispatchEvent(new CustomEvent('wangwana:properties-updated', { detail: PROPERTIES }));
    return PROPERTIES[index];
  }
  return null;
}

/**
 * Deletes / Decommissions a property
 */
export async function deleteProperty(id) {
  try {
    await fetch(`/api/properties/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Server delete failed, deleting locally:', err);
  }

  PROPERTIES = PROPERTIES.filter(p => p.id.toLowerCase() !== id.toLowerCase());
  cacheProperties(PROPERTIES);
  window.dispatchEvent(new CustomEvent('wangwana:properties-updated', { detail: PROPERTIES }));
  return true;
}

/**
 * Resets portfolio to default prime residences
 */
export async function resetPortfolio() {
  try {
    const res = await fetch('/api/properties/reset', { method: 'POST' });
    if (res.ok) {
      const json = await res.json();
      PROPERTIES = json.data;
      cacheProperties(PROPERTIES);
      window.dispatchEvent(new CustomEvent('wangwana:properties-updated', { detail: PROPERTIES }));
      return PROPERTIES;
    }
  } catch (e) {
    console.warn('Server reset failed, falling back to local defaults:', e);
  }
  PROPERTIES = [...DEFAULT_PROPERTIES];
  cacheProperties(PROPERTIES);
  window.dispatchEvent(new CustomEvent('wangwana:properties-updated', { detail: PROPERTIES }));
  return PROPERTIES;
}

/**
 * Find property by ID
 */
export function getPropertyById(id) {
  if (!id) return PROPERTIES[0] || DEFAULT_PROPERTIES[0];
  const found = PROPERTIES.find(p => p.id.toLowerCase() === id.toLowerCase());
  return found || PROPERTIES[0] || DEFAULT_PROPERTIES[0];
}

/**
 * Formats KES currency
 */
export function formatKsh(amount) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 })
    .format(amount)
    .replace('KES', 'KSH');
}
