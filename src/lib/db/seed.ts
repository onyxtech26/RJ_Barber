import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './index';
import { shops, barbers, services, barberServices, barberShifts } from './schema';

async function seed() {
  console.log('🌱 Starting database seeding for RJ Barber Salon...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not defined in .env.local. Please provide a PostgreSQL connection string.');
    process.exit(1);
  }

  try {
    // 1. Create or ensure Shop
    const [shop] = await db.insert(shops).values({
      name: 'RJ Barber Salon',
      address: '123 Style Avenue, Grooming District, NY 10001',
      phone: '(555) 123-4567',
      email: 'concierge@rjbarbersalon.com',
      logoUrl: '/barber_logo.jpeg',
      operatingHours: {
        monday: { open: '09:00', close: '19:00', closed: false },
        tuesday: { open: '09:00', close: '19:00', closed: false },
        wednesday: { open: '09:00', close: '19:00', closed: false },
        thursday: { open: '09:00', close: '19:00', closed: false },
        friday: { open: '09:00', close: '19:00', closed: false },
        saturday: { open: '09:00', close: '19:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      }
    }).returning();

    console.log(`✅ Shop created: ${shop.name} (${shop.id})`);

    // 2. Insert Barbers
    const insertedBarbers = await db.insert(barbers).values([
      {
        shopId: shop.id,
        fullName: 'RJ (Master Barber & Founder)',
        email: 'rj@rjbarbersalon.com',
        phone: '+1 (555) 010-0001',
        avatarUrl: '/barber_logo.jpeg',
        commissionRate: '0.60',
        isActive: true,
      },
      {
        shopId: shop.id,
        fullName: 'Marcus (Senior Precision Stylist)',
        email: 'marcus@rjbarbersalon.com',
        phone: '+1 (555) 010-0002',
        commissionRate: '0.50',
        isActive: true,
      },
      {
        shopId: shop.id,
        fullName: 'David (Grooming Artisan)',
        email: 'david@rjbarbersalon.com',
        phone: '+1 (555) 010-0003',
        commissionRate: '0.50',
        isActive: true,
      }
    ]).returning();

    console.log(`✅ ${insertedBarbers.length} Barbers inserted.`);

    // 3. Insert Services
    const insertedServices = await db.insert(services).values([
      {
        shopId: shop.id,
        title: 'Signature Fade',
        description: 'Precision skin fade or taper with straight-edge razor line-up and styling finish.',
        durationMinutes: 45,
        bufferAfterMinutes: 5,
        priceCents: 4000,
        sortOrder: 1,
        isActive: true,
      },
      {
        shopId: shop.id,
        title: 'Classic Gentlemen’s Cut',
        description: 'Bespoke scissor and clipper architecture tailored to face profile and natural grain.',
        durationMinutes: 30,
        bufferAfterMinutes: 5,
        priceCents: 3500,
        sortOrder: 2,
        isActive: true,
      },
      {
        shopId: shop.id,
        title: 'Executive Buzz & Shape',
        description: 'Uniform clipper cut with crisp hairline perimeter work and neck shave.',
        durationMinutes: 20,
        bufferAfterMinutes: 5,
        priceCents: 2500,
        sortOrder: 3,
        isActive: true,
      },
      {
        shopId: shop.id,
        title: 'Young Gentlemen’s Cut',
        description: 'Tailored haircut for boys under 12, delivered with patience and precision craftsmanship.',
        durationMinutes: 30,
        bufferAfterMinutes: 5,
        priceCents: 3000,
        sortOrder: 4,
        isActive: true,
      },
      {
        shopId: shop.id,
        title: 'Beard Sculpt & Contour',
        description: 'Detailed beard trimming, cheek line razor definition, and organic beard oil treatment.',
        durationMinutes: 30,
        bufferAfterMinutes: 5,
        priceCents: 2500,
        sortOrder: 5,
        isActive: true,
      },
      {
        shopId: shop.id,
        title: 'Traditional Hot Towel Shave',
        description: 'Warm botanical mist, rich warm shaving lather, straight razor glide, and cold towel close.',
        durationMinutes: 45,
        bufferAfterMinutes: 10,
        priceCents: 3500,
        sortOrder: 6,
        isActive: true,
      },
      {
        shopId: shop.id,
        title: 'Quick Beard Tidy',
        description: 'Express clipper cleanup and mustache outline for the gentleman on the go.',
        durationMinutes: 15,
        bufferAfterMinutes: 5,
        priceCents: 1800,
        sortOrder: 7,
        isActive: true,
      },
      {
        shopId: shop.id,
        title: 'The Master Experience',
        description: 'Signature Fade + Beard Sculpting + Hot Towel Treatment + Hair Wash & Scalp Massage.',
        durationMinutes: 75,
        bufferAfterMinutes: 15,
        priceCents: 7500,
        sortOrder: 8,
        isActive: true,
      },
      {
        shopId: shop.id,
        title: 'The Executive Refresh',
        description: 'Classic Gentlemen’s Cut + Beard Tidy + Clarifying Shampoo & Charcoal Face Cleansing Mist.',
        durationMinutes: 60,
        bufferAfterMinutes: 10,
        priceCents: 5500,
        sortOrder: 9,
        isActive: true,
      }
    ]).returning();

    console.log(`✅ ${insertedServices.length} Services inserted.`);

    // 4. Link Barbers to all Services
    const barberServiceLinks = [];
    for (const barber of insertedBarbers) {
      for (const service of insertedServices) {
        barberServiceLinks.push({
          barberId: barber.id,
          serviceId: service.id,
        });
      }
    }
    await db.insert(barberServices).values(barberServiceLinks);
    console.log(`✅ ${barberServiceLinks.length} Barber-Service relationships mapped.`);

    // 5. Add Weekly Working Shifts (Mon - Sat, 09:00 - 19:00)
    const shifts = [];
    for (const barber of insertedBarbers) {
      for (let day = 1; day <= 6; day++) { // Monday (1) to Saturday (6)
        shifts.push({
          barberId: barber.id,
          dayOfWeek: day,
          startTime: '09:00:00',
          endTime: '19:00:00',
          breakStart: '12:00:00',
          breakEnd: '13:00:00',
        });
      }
    }
    await db.insert(barberShifts).values(shifts);
    console.log(`✅ ${shifts.length} Barber shifts assigned.`);

    console.log('🎉 Seeding successfully completed! RJ Barber Salon database is production-ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();
