
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function setupTestAccounts() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up test accounts...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123456', 12);
    const agencyPassword = await bcrypt.hash('agency123456', 12);
    
    // Check if super admin already exists
    const existingAdmin = await client.query('SELECT id FROM admin_credentials LIMIT 1');
    
    if (existingAdmin.rows.length === 0) {
      // Create super admin
      await client.query(`
        INSERT INTO admin_credentials (
          email, name, password, created_at, updated_at
        ) VALUES (
          'admin@travelflow.com', 
          'Super Admin', 
          $1, 
          NOW(), 
          NOW()
        )
      `, [adminPassword]);
      
      console.log('✅ Super Admin created successfully!');
      console.log('📧 Email: admin@travelflow.com');
      console.log('🔑 Password: admin123456');
    } else {
      console.log('ℹ️  Super Admin already exists');
    }
    
    // Check if test agency already exists
    const existingAgency = await client.query('SELECT id FROM agencies WHERE email = $1', ['test@travelagency.com']);
    
    if (existingAgency.rows.length === 0) {
      // Create test agency
      const agencyResult = await client.query(`
        INSERT INTO agencies (
          user_id, name, email, contact_person, phone, city, state, 
          website, booking_website, password, status, created_at, updated_at
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
          'approved',
          NOW(),
          NOW()
        ) RETURNING id
      `, [agencyPassword]);
      
      const agencyId = agencyResult.rows[0].id;
      
      // Create test bus for the agency
      await client.query(`
        INSERT INTO buses (
          agency_id, number, name, from_location, to_location, 
          departure_time, arrival_time, bus_type, capacity, fare, 
          amenities, is_active, created_at, updated_at
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
          1200, 
          ARRAY['WiFi', 'Charging Point', 'Water Bottle', 'Blanket'], 
          true,
          NOW(),
          NOW()
        )
      `, [agencyId]);
      
      console.log('✅ Test Agency created successfully!');
      console.log('📧 Email: test@travelagency.com');
      console.log('🔑 Password: agency123456');
      console.log('🚌 Bus: Comfort Express (Bangalore to Chennai)');
      console.log('📱 Phone: +919876543210');
      console.log('✨ Status: Approved (can login immediately)');
    } else {
      console.log('ℹ️  Test Agency already exists');
    }
    
    console.log('\n🎉 Setup complete!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('👑 SUPER ADMIN:');
    console.log('   Email: admin@travelflow.com');
    console.log('   Password: admin123456');
    console.log('   Login at: /admin-login');
    console.log('\n🏢 TRAVEL AGENCY:');
    console.log('   Email: test@travelagency.com');
    console.log('   Password: agency123456');
    console.log('   Login at: /agency-login');
    
  } catch (error) {
    console.error('❌ Error setting up test accounts:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupTestAccounts();
