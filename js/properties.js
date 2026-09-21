// Properties database & Agency portfolio manager for Wangwana Real Estate & Serviced Living

export const DEFAULT_PROPERTIES = [
  {
    id: 'whitehouse',
    agencyRef: 'WNG-MLM-01',
    name: 'White House Serviced Residence',
    location: 'Milimani, Kisumu City',
    neighborhood: 'Milimani',
    coordinates: { lat: -0.1065, lng: 34.7518 },
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
    airbnbUrl: 'https://www.airbnb.com/rooms/114829101?source_impression_id=p3_wangwana_whitehouse',
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
    ],
    bedroomsDetail: [
      {
        name: 'Master Suite',
        bed: '1 King Bed (Plush Orthopedic)',
        bath: 'En-suite Bathroom with Rain Shower',
        features: 'Private Balcony Access, Wardrobe & Vanity, Blackout Drapes'
      },
      {
        name: 'Second Bedroom',
        bed: '1 Queen Bed',
        bath: 'Adjacent Private Bathroom',
        features: 'Garden Views, Built-in Closets, Dedicated Reading Desk'
      }
    ],
    policies: {
      checkIn: '2:00 PM – 10:00 PM',
      checkOut: '10:00 AM',
      cancellation: '100% Free cancellation up to 48 hours before check-in. Flexible terms.',
      deposit: 'No advance security deposit required. 100% Pay on Arrival guarantee.',
      payment: 'M-Pesa (Till / Paybill), Cash on arrival, or Credit/Debit Card.',
      rules: [
        'No indoor smoking (open-air veranda and garden areas provided)',
        'Quiet hours strictly observed 10:00 PM – 7:00 AM',
        'No unauthorized parties or commercial shoots without prior written notice',
        'Pets permitted upon prior inquiry'
      ]
    },
    host: {
      name: 'Blasio Odhiambo',
      role: 'Superhost & Wangwana Host Manager',
      experience: '5+ Years Hosting in Kisumu',
      responseRate: '100%',
      responseTime: 'Within an hour',
      phone: '0703165843',
      whatsapp: '+254703165843',
      rating: 4.96,
      reviews: 130
    },
    reviews: [
      {
        guest: 'Dr. Angela Achieng',
        origin: 'Nairobi, Kenya',
        date: 'August 2026',
        rating: 5,
        source: 'Verified Airbnb Stay',
        text: 'Exceptional stay. The high-speed fiber internet made my remote work seamless. Pristine cleanliness and very secure compound in Milimani. Blasio was always prompt and attentive.'
      },
      {
        guest: 'Marcus van den Berg',
        origin: 'Amsterdam, Netherlands',
        date: 'July 2026',
        rating: 5,
        source: 'Verified Stay',
        text: 'Traveling for a public health project in Kisumu. This was by far the best serviced apartment experience in Western Kenya. Hot water, uninterrupted power, and a fantastic kitchen.'
      },
      {
        guest: 'Sarah & Kevin Otieno',
        origin: 'Mombasa, Kenya',
        date: 'May 2026',
        rating: 5,
        source: 'Verified Stay',
        text: 'The photos are 100% genuine. The location in Milimani is whisper-quiet yet 5 minutes from West End Mall. The pay-on-arrival option gave us complete confidence.'
      }
    ]
  },
  {
    id: 'delpiero',
    agencyRef: 'WNG-RHT-02',
    name: 'Delpiero Luxury Hilltop Villa',
    location: 'Riat Hills, Kisumu',
    neighborhood: 'Riat Hills',
    coordinates: { lat: -0.0520, lng: 34.7730 },
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
    airbnbUrl: 'https://www.airbnb.com/rooms/114829202?source_impression_id=p3_wangwana_delpiero',
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
    ],
    bedroomsDetail: [
      {
        name: 'Panoramic Master Suite',
        bed: '1 King Bed',
        bath: 'En-suite Jacuzzi & Rain Shower',
        features: 'Wraparound Sunset Balcony, Lake Victoria View, Walk-in Closet'
      },
      {
        name: 'Executive Bedroom 2',
        bed: '1 Queen Bed',
        bath: 'En-suite Modern Bath',
        features: 'Hillside Garden Vista, Work Station, Custom Hardwood Wardrobes'
      },
      {
        name: 'Garden Bedroom 3',
        bed: '2 Twin Beds (or 1 King)',
        bath: 'En-suite Bathroom',
        features: 'Private Garden Terrace Access, Ideal for Family or Colleagues'
      }
    ],
    policies: {
      checkIn: '2:00 PM – 10:00 PM',
      checkOut: '10:00 AM',
      cancellation: '100% Free cancellation up to 48 hours before check-in.',
      deposit: 'Zero deposit required. Pay upon check-in directly.',
      payment: 'M-Pesa, Bank Transfer, or Cash upon arrival.',
      rules: [
        'Smoking allowed on outdoor terrace and gazebo only',
        'Strict 10:00 PM quiet hours for neighborhood tranquility',
        'Up to 6 registered guests; additional visitors by arrangement',
        'BBQ grill cleaning service included'
      ]
    },
    host: {
      name: 'Blasio Odhiambo',
      role: 'Superhost & Wangwana Host Manager',
      experience: '5+ Years Hosting in Kisumu',
      responseRate: '100%',
      responseTime: 'Within an hour',
      phone: '0703165843',
      whatsapp: '+254703165843',
      rating: 4.96,
      reviews: 130
    },
    reviews: [
      {
        guest: 'Caroline & David Wanjala',
        origin: 'Geneva, Switzerland',
        date: 'August 2026',
        rating: 5,
        source: 'Airbnb Superhost Stay',
        text: 'The sunset view over Lake Victoria from the Riat Hills terrace is simply priceless. The kitchen is fully stocked, the beds are exceptionally comfortable, and the security team was polite and vigilant.'
      },
      {
        guest: 'Eng. Peter Ochola',
        origin: 'Eldoret, Kenya',
        date: 'June 2026',
        rating: 5,
        source: 'Verified Stay',
        text: 'Wangwana exceeded every expectation. Beautiful architectural layout, standby generator that kicked in seamlessly during grid dips, and superb hospitality from host Blasio.'
      }
    ]
  },
  {
    id: 'beach',
    agencyRef: 'WNG-DNG-03',
    name: 'Dunga Beachfront Waterfront Villa',
    location: 'Dunga Beachfront, Kisumu',
    neighborhood: 'Dunga Beach',
    coordinates: { lat: -0.1340, lng: 34.7390 },
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
    airbnbUrl: 'https://www.airbnb.com/rooms/114829303?source_impression_id=p3_wangwana_beachfront',
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
    ],
    bedroomsDetail: [
      {
        name: 'Lakeside Master Suite',
        bed: '1 King Bed',
        bath: 'En-suite Lake View Bath',
        features: 'French Doors opening onto Waterfront Lawn, Breezy Lake Air'
      },
      {
        name: 'Garden Bedroom 2',
        bed: '1 Queen Bed',
        bath: 'Jack & Jill Shared Bath',
        features: 'Palm Garden Outlook, Fitted Wardrobe'
      },
      {
        name: 'Twin Bedroom 3',
        bed: '2 Single Beds',
        bath: 'Shared Bath with Guest Powder Room',
        features: 'Bright Natural Light, Built-in Storage'
      }
    ],
    policies: {
      checkIn: '2:00 PM – 9:00 PM',
      checkOut: '10:00 AM',
      cancellation: '100% Free cancellation up to 48 hours prior to check-in.',
      deposit: 'Zero deposit. Pay upon arrival.',
      payment: 'M-Pesa, Cash, or Card.',
      rules: [
        'Children must be supervised near lakeside waters',
        'Outdoor smoking permitted; no smoking in bedrooms',
        'Eco-conscious lakeside living; quiet hours after 10:00 PM'
      ]
    },
    host: {
      name: 'Blasio Odhiambo',
      role: 'Superhost & Wangwana Host Manager',
      experience: '5+ Years Hosting in Kisumu',
      responseRate: '100%',
      responseTime: 'Within an hour',
      phone: '0703165843',
      whatsapp: '+254703165843',
      rating: 4.96,
      reviews: 130
    },
    reviews: [
      {
        guest: 'Naomi Kibet',
        origin: 'Nakuru, Kenya',
        date: 'July 2026',
        rating: 5,
        source: 'Airbnb Verified Stay',
        text: 'Waking up to birds chirping over Lake Victoria and watching fishermen in the distance was magical. Dunga Hill Camp is just minutes away. Truly a slice of heaven in Kisumu.'
      },
      {
        guest: 'Thomas & Grace Miller',
        origin: 'London, UK',
        date: 'May 2026',
        rating: 5,
        source: 'Verified Stay',
        text: 'Our family spent 5 days here. Safe for kids, pristine lawn, and the host team helped arrange fresh tilapia directly from the fishermen. Highly recommended!'
      }
    ]
  },
  {
    id: 'victoria',
    agencyRef: 'WNG-TMB-04',
    name: 'Victoria Executive Corporate Suite',
    location: 'Tom Mboya Estate, Kisumu',
    neighborhood: 'Tom Mboya',
    coordinates: { lat: -0.0820, lng: 34.7780 },
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
    airbnbUrl: 'https://www.airbnb.com/rooms/114829404?source_impression_id=p3_wangwana_victoria',
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
    ],
    bedroomsDetail: [
      {
        name: 'Studio Suite',
        bed: '1 Queen Bed (Hotel Collection)',
        bath: 'En-suite High-Pressure Shower',
        features: 'Ergonomic Desk & Mesh Chair, Dual Monitor Space, High-Speed Fiber'
      }
    ],
    policies: {
      checkIn: '2:00 PM – 11:00 PM (Keypad Self Check-in)',
      checkOut: '10:00 AM',
      cancellation: '100% Free cancellation up to 48 hours before check-in.',
      deposit: 'Zero deposit. Pay upon arrival.',
      payment: 'M-Pesa, Corporate LPO, Card, or Cash.',
      rules: [
        'Quiet residential business environment',
        'Strictly non-smoking interior',
        'Single or couple occupancy (max 2 adults)'
      ]
    },
    host: {
      name: 'Blasio Odhiambo',
      role: 'Superhost & Wangwana Host Manager',
      experience: '5+ Years Hosting in Kisumu',
      responseRate: '100%',
      responseTime: 'Within an hour',
      phone: '0703165843',
      whatsapp: '+254703165843',
      rating: 4.96,
      reviews: 130
    },
    reviews: [
      {
        guest: 'Brian Mwangi',
        origin: 'Nairobi, Kenya',
        date: 'August 2026',
        rating: 5,
        source: 'Airbnb Business Stay',
        text: 'The fiber WiFi was rock solid (over 50 Mbps) which allowed smooth Zoom calls all week. Self check-in with the smart lock was super convenient after a delayed flight into Kisumu.'
      },
      {
        guest: 'Dr. Judith Omondi',
        origin: 'Kisumu, Kenya',
        date: 'June 2026',
        rating: 5,
        source: 'Verified Corporate Stay',
        text: 'Clean, compact, and very quiet in Tom Mboya. Easy 5-minute commute to the CBD and Aga Khan Hospital. Will book again.'
      }
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
  const NEIGHBORHOOD_COORDS = {
    'milimani': { lat: -0.1065, lng: 34.7518 },
    'riat hills': { lat: -0.0520, lng: 34.7730 },
    'dunga beach': { lat: -0.1340, lng: 34.7390 },
    'tom mboya': { lat: -0.0820, lng: 34.7780 }
  };
  const normNeigh = (newPropData.neighborhood || '').toLowerCase().trim();
  const defaultCoords = NEIGHBORHOOD_COORDS[normNeigh] || {
    lat: -0.0917 + (Math.random() - 0.5) * 0.02,
    lng: 34.7680 + (Math.random() - 0.5) * 0.02
  };

  const propertyPayload = {
    ...newPropData,
    coordinates: newPropData.coordinates || defaultCoords,
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
