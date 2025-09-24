const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const City = require('./models/City');
const Label = require('./models/Label');
const Product = require('./models/Product');

// Seed data
const seedData = {
  users: [
    {
      username: 'superadmin',
      email: 'admin@warranty.com',
      password: 'admin123',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      phone: '+1234567890'
    },
    {
      username: 'admin',
      email: 'admin2@warranty.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      phone: '+1234567891'
    },
    {
      username: 'agent1',
      email: 'agent@warranty.com',
      password: 'agent123',
      firstName: 'John',
      lastName: 'Agent',
      role: 'agent',
      phone: '+1234567892'
    }
  ],
  cities: [
    {
      name: 'New York',
      code: 'NYC',
      country: 'USA',
      state: 'New York',
      pincode: '10001'
    },
    {
      name: 'Los Angeles',
      code: 'LAX',
      country: 'USA',
      state: 'California',
      pincode: '90210'
    },
    {
      name: 'Chicago',
      code: 'CHI',
      country: 'USA',
      state: 'Illinois',
      pincode: '60601'
    },
    {
      name: 'Mumbai',
      code: 'BOM',
      country: 'India',
      state: 'Maharashtra',
      pincode: '400001'
    },
    {
      name: 'Delhi',
      code: 'DEL',
      country: 'India',
      state: 'Delhi',
      pincode: '110001'
    }
  ],
  labels: [
    {
      name: 'Premium',
      description: 'Premium quality products',
      color: '#FFD700'
    },
    {
      name: 'Standard',
      description: 'Standard quality products',
      color: '#32CD32'
    },
    {
      name: 'Budget',
      description: 'Budget-friendly products',
      color: '#FF6347'
    },
    {
      name: 'New',
      description: 'Newly launched products',
      color: '#00BFFF'
    },
    {
      name: 'Sale',
      description: 'Products on sale',
      color: '#FF1493'
    }
  ]
};

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await City.deleteMany({});
    await Label.deleteMany({});
    await Product.deleteMany({});
    
    console.log('🗑️  Cleared existing data');

    // Seed users
    console.log('👥 Seeding users...');
    for (const userData of seedData.users) {
      const user = new User(userData);
      await user.save();
    }
    console.log(`✅ Created ${seedData.users.length} users`);

    // Seed cities
    console.log('🏙️  Seeding cities...');
    for (const cityData of seedData.cities) {
      const city = new City(cityData);
      await city.save();
    }
    console.log(`✅ Created ${seedData.cities.length} cities`);

    // Seed labels
    console.log('🏷️  Seeding labels...');
    const createdLabels = [];
    for (const labelData of seedData.labels) {
      const label = new Label({
        ...labelData,
        createdBy: await User.findOne({ role: 'superadmin' }).then(u => u._id)
      });
      await label.save();
      createdLabels.push(label);
    }
    console.log(`✅ Created ${seedData.labels.length} labels`);

    // Seed sample products
    console.log('📦 Seeding products...');
    const sampleProducts = [
      {
        name: 'Smartphone Pro Max',
        sku: 'SPM-001',
        description: 'Latest flagship smartphone with advanced features',
        warrantyPeriod: 12,
        warrantyTerms: 'This warranty covers manufacturing defects and material faults. It does not cover damage caused by misuse, accidents, or normal wear and tear.',
        price: 999.99,
        category: 'Electronics',
        brand: 'TechCorp',
        model: 'Pro Max 2024',
        cities: await City.find().limit(3).then(cities => cities.map(c => c._id)),
        labels: [createdLabels[0]._id, createdLabels[3]._id] // Premium, New
      },
      {
        name: 'Laptop Ultra',
        sku: 'LU-002',
        description: 'High-performance laptop for professionals',
        warrantyPeriod: 24,
        warrantyTerms: 'This warranty covers manufacturing defects and material faults. It does not cover damage caused by misuse, accidents, or normal wear and tear.',
        price: 1299.99,
        category: 'Electronics',
        brand: 'TechCorp',
        model: 'Ultra 2024',
        cities: await City.find().limit(2).then(cities => cities.map(c => c._id)),
        labels: [createdLabels[0]._id] // Premium
      },
      {
        name: 'Tablet Basic',
        sku: 'TB-003',
        description: 'Affordable tablet for everyday use',
        warrantyPeriod: 6,
        warrantyTerms: 'This warranty covers manufacturing defects and material faults. It does not cover damage caused by misuse, accidents, or normal wear and tear.',
        price: 299.99,
        category: 'Electronics',
        brand: 'TechCorp',
        model: 'Basic 2024',
        cities: await City.find().then(cities => cities.map(c => c._id)),
        labels: [createdLabels[2]._id] // Budget
      }
    ];

    const superadmin = await User.findOne({ role: 'superadmin' });
    for (const productData of sampleProducts) {
      const product = new Product({
        ...productData,
        createdBy: superadmin._id,
        qrCodeData: `PROD-${productData.sku}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      });
      
      // Generate QR code
      const QRCode = require('qrcode');
      product.qrCode = await QRCode.toDataURL(product.qrCodeData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      await product.save();
    }
    console.log(`✅ Created ${sampleProducts.length} sample products`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('Superadmin: admin@warranty.com / admin123');
    console.log('Admin: admin2@warranty.com / admin123');
    console.log('Agent: agent@warranty.com / agent123');
    console.log('\n🚀 You can now start the application!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;