
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function setupTestAgency() {
  const client = await pool.connect();
  
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('test123456', 12);
    
    // Create test agency
    const agencyResult = await client.query(`
      INSERT INTO agencies (
        user_id, name, email, contact_person, phone, city, state, 
        website, booking_website, password, status
      ) VALUES (
        'test_agency_001', 
        'Test Travel Agency', 
        'test@travelagency.com', 
        'Test Manager', 
        '+919876543210', 
        'Bangalore', 
        'Karnataka', 
        'https://testtravelagency.com', 
        'https://book.testtravelagency.com', 
        $1, 
        'approved'
      ) RETURNING id
    `, [hashedPassword]);
    
    const agencyId = agencyResult.rows[0].id;
    
    // Create test bus
    await client.query(`
      INSERT INTO buses (
        agency_id, number, name, from_location, to_location, 
        departure_time, arrival_time, bus_type, capacity, fare, 
        amenities, is_active
      ) VALUES (
        $1, 
        'KA01AB1234', 
        'Comfort Express', 
        'Bangalore', 
        'Chennai', 
        '10:00 PM', 
        '06:00 AM', 
        'AC Sleeper', 
        40, 
        '1200', 
        ARRAY['WiFi', 'Charging Point', 'Water Bottle', 'Blanket'], 
        true
      )
    `, [agencyId]);
    
    console.log('✅ Test agency created successfully!');
    console.log('📧 Email: test@travelagency.com');
    console.log('🔑 Password: test123456');
    console.log('🚌 Bus: Comfort Express (Bangalore to Chennai)');
    console.log('📱 Phone: +919876543210');
    console.log('✨ Status: Approved (can login immediately)');
    
  } catch (error) {
    console.error('❌ Error setting up test agency:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupTestAgency();
