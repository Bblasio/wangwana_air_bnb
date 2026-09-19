const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Middleware for parsing JSON and form bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const DATA_DIR = path.join(__dirname, 'data');
const PROPERTIES_FILE = path.join(DATA_DIR, 'properties.json');
const LANDLORDS_FILE = path.join(DATA_DIR, 'landlord-inquiries.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// Ensure data folder and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSONFile(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8');
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJSONFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// ----------------------------------------------------
// REST API Routes
// ----------------------------------------------------

// 1. Get all properties
app.get('/api/properties', (req, res) => {
  const properties = readJSONFile(PROPERTIES_FILE, []);
  res.json({ success: true, count: properties.length, data: properties });
});

// 2. Get single property by ID
app.get('/api/properties/:id', (req, res) => {
  const properties = readJSONFile(PROPERTIES_FILE, []);
  const prop = properties.find(p => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (!prop) {
    return res.status(404).json({ success: false, message: 'Property not found in agency portfolio' });
  }
  res.json({ success: true, data: prop });
});

// 3. Acquire / Add new property to Wangwana Agency portfolio
app.post('/api/properties', (req, res) => {
  try {
    const properties = readJSONFile(PROPERTIES_FILE, []);
    const {
      name,
      location,
      neighborhood,
      price,
      monthlyLease,
      beds,
      baths,
      guests,
      type,
      status,
      badge,
      images,
      description,
      amenities,
      agencyRef
    } = req.body;

    if (!name || !neighborhood || !price) {
      return res.status(400).json({ success: false, message: 'Name, neighborhood, and price are required.' });
    }

    // Generate unique slug/ID
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'property';
    let newId = baseSlug;
    let counter = 1;
    while (properties.some(p => p.id === newId)) {
      newId = `${baseSlug}-${counter++}`;
    }

    const newProperty = {
      id: newId,
      agencyRef: agencyRef || `WNG-KS-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      location: location || `${neighborhood}, Kisumu City`,
      neighborhood: neighborhood.trim(),
      price: Number(price),
      monthlyLease: monthlyLease ? Number(monthlyLease) : Math.round(Number(price) * 22),
      rating: 5.0,
      reviewsCount: 1,
      beds: Number(beds) || 2,
      baths: Number(baths) || 2,
      guests: Number(guests) || 4,
      type: type || 'Serviced Residence',
      status: status || 'Available',
      badge: badge || 'Newly Acquired',
      images: Array.isArray(images) && images.length > 0 ? images : ['assets/images/whitehouse.jpg'],
      description: description || 'Exclusive furnished Kisumu residence managed directly by Wangwana Real Estate Agency.',
      amenities: Array.isArray(amenities) && amenities.length > 0 ? amenities : ['High-Speed WiFi', 'Backup Power', 'Dedicated Parking', '24/7 Security'],
      createdAt: new Date().toISOString()
    };

    properties.unshift(newProperty);
    writeJSONFile(PROPERTIES_FILE, properties);

    res.status(201).json({ success: true, message: 'Property successfully added to Wangwana Agency portfolio', data: newProperty });
  } catch (err) {
    console.error('Error adding property:', err);
    res.status(500).json({ success: false, message: 'Internal server error acquiring property' });
  }
});

// 4. Update an existing property
app.put('/api/properties/:id', (req, res) => {
  try {
    const properties = readJSONFile(PROPERTIES_FILE, []);
    const index = properties.findIndex(p => p.id.toLowerCase() === req.params.id.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const existing = properties[index];
    const updated = {
      ...existing,
      ...req.body,
      id: existing.id, // ID remains constant
      price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
      monthlyLease: req.body.monthlyLease !== undefined ? Number(req.body.monthlyLease) : existing.monthlyLease,
      beds: req.body.beds !== undefined ? Number(req.body.beds) : existing.beds,
      baths: req.body.baths !== undefined ? Number(req.body.baths) : existing.baths,
      guests: req.body.guests !== undefined ? Number(req.body.guests) : existing.guests,
      updatedAt: new Date().toISOString()
    };

    properties[index] = updated;
    writeJSONFile(PROPERTIES_FILE, properties);

    res.json({ success: true, message: 'Property updated successfully', data: updated });
  } catch (err) {
    console.error('Error updating property:', err);
    res.status(500).json({ success: false, message: 'Failed to update property' });
  }
});

// 5. Delete / Decommission a property
app.delete('/api/properties/:id', (req, res) => {
  try {
    const properties = readJSONFile(PROPERTIES_FILE, []);
    const filtered = properties.filter(p => p.id.toLowerCase() !== req.params.id.toLowerCase());
    if (filtered.length === properties.length) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    writeJSONFile(PROPERTIES_FILE, filtered);
    res.json({ success: true, message: 'Property successfully removed from portfolio' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove property' });
  }
});

// 6. Reset properties to initial default portfolio
app.post('/api/properties/reset', (req, res) => {
  const defaultFile = path.join(__dirname, 'data', 'properties.json');
  // Re-seed from standard catalog
  const seed = [
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
      amenities: ['Fast Fiber WiFi', 'Fully Fitted Kitchen', 'Secure Free Parking', '24/7 Security Guard', 'Smart TV & Netflix', 'Washing Machine', 'Balcony with Garden View', 'Backup Power Generator']
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
      amenities: ['Panoramic Lake & City View', 'High-Speed WiFi', 'Chef-Grade Kitchen', 'En-Suite Bathrooms', 'Private Terrace & Garden', '24/7 Manned Gate & CCTV', 'Standby Generator', 'BBQ Facility']
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
      amenities: ['Direct Lakeside Access', 'Private Lawn & Sunset Patio', 'Outdoor Dining & BBQ Grill', 'High-Speed WiFi', 'Fully Equipped Kitchen', 'Free On-Premises Parking', 'Quiet Natural Atmosphere', '24/7 Security']
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
      amenities: ['Dedicated Ergonomic Workstation', 'High-Speed Fiber WiFi', 'Compact Equipped Kitchenette', 'Smart TV with Streaming', 'Solar Hot Water', 'Secure Gated Compound', 'Self Check-in Available']
    }
  ];
  writeJSONFile(PROPERTIES_FILE, seed);
  res.json({ success: true, message: 'Portfolio reset to default 4 prime residences', data: seed });
});

// 7. Landlord Partnership Submissions (Property Owners entrusting spaces to Wangwana Agency)
app.get('/api/landlords', (req, res) => {
  const inquiries = readJSONFile(LANDLORDS_FILE, []);
  res.json({ success: true, count: inquiries.length, data: inquiries });
});

app.post('/api/landlords', (req, res) => {
  try {
    const inquiries = readJSONFile(LANDLORDS_FILE, []);
    const { name, phone, email, neighborhood, propertyType, bedrooms, expectedYield, notes } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const newInquiry = {
      id: 'LND-' + Date.now(),
      name,
      phone,
      email: email || '',
      neighborhood: neighborhood || 'Kisumu',
      propertyType: propertyType || 'Apartment',
      bedrooms: bedrooms || '2',
      expectedYield: expectedYield || '',
      notes: notes || '',
      submittedAt: new Date().toISOString(),
      status: 'Under Evaluation'
    };

    inquiries.unshift(newInquiry);
    writeJSONFile(LANDLORDS_FILE, inquiries);
    res.status(201).json({ success: true, message: 'Property submitted to Wangwana Real Estate Agency successfully', data: newInquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record landlord inquiry' });
  }
});

// 8. Bookings and Reservation Inquiries
app.get('/api/bookings', (req, res) => {
  const bookings = readJSONFile(BOOKINGS_FILE, []);
  res.json({ success: true, count: bookings.length, data: bookings });
});

app.post('/api/bookings', (req, res) => {
  try {
    const bookings = readJSONFile(BOOKINGS_FILE, []);
    const { propertyId, propertyName, guestName, guestPhone, guestEmail, checkIn, checkOut, guests, totalAmount, paymentMethod, notes } = req.body;

    const newBooking = {
      id: 'BKG-' + Date.now().toString(36).toUpperCase(),
      propertyId: propertyId || 'general',
      propertyName: propertyName || 'Wangwana Serviced Property',
      guestName: guestName || 'Guest',
      guestPhone: guestPhone || '',
      guestEmail: guestEmail || '',
      checkIn: checkIn || '',
      checkOut: checkOut || '',
      guests: guests || 1,
      totalAmount: totalAmount || 0,
      paymentMethod: paymentMethod || 'Pay on Arrival (M-Pesa / Cash)',
      notes: notes || '',
      status: 'Confirmed - Pending Arrival',
      createdAt: new Date().toISOString()
    };

    bookings.unshift(newBooking);
    writeJSONFile(BOOKINGS_FILE, bookings);
    res.status(201).json({ success: true, message: 'Reservation recorded with Wangwana Agency', data: newBooking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record reservation' });
  }
});

// Serve static files from root directory with clean URLs support
app.use(express.static(path.join(__dirname), { extensions: ['html', 'htm'] }));

// Fallback to index.html
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Wangwana Real Estate Agency Server running at http://${HOST}:${PORT}`);
});
