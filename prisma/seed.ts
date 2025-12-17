import { PrismaClient, Role, ApprovalState, OperationalState, OrderStatus, PaymentStatus, paymentMethod, Category } from '@prisma/client';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import fs from 'fs';

const prisma = new PrismaClient();

const PLAIN_PASSWORD = '123456';
const SALT_ROUNDS = 10;

const seededUsers: {
  email: string;
  role: Role;
  password: string;
}[] = [];

async function main() {
  console.log('🌱 Seeding started...');

  const hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, SALT_ROUNDS);

  // ---------------- USERS ----------------
  for (let i = 0; i < 60; i++) {
    const role = faker.helpers.arrayElement([
      Role.Admin,
      Role.Seller,
      Role.Buyer,
      Role.Rider,
    ]);

    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLocaleLowerCase(),
        dob: faker.date.birthdate({ mode: "age", min: 18, max: 60 }),
        password: hashedPassword,
        role,
        gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
        approvalState: faker.helpers.arrayElement([
          ApprovalState.Pending,
          ApprovalState.Approved,
          ApprovalState.Rejected,
        ]),
        operationalState: faker.helpers.arrayElement([
          OperationalState.Active,
          OperationalState.Blocked,
          OperationalState.Suspended,
        ]),
      },
    });

    seededUsers.push({
      email: user.email,
      role: user.role,
      password: PLAIN_PASSWORD,
    });

    if (role === Role.Buyer) {
      await prisma.buyer.create({
        data: {
          userId: user.id,
          walletAmount: faker.number.float({ min: 0, max: 5000 }),
        },
      });
    }

    if (role === Role.Seller) {
      await prisma.seller.create({
        data: {
          userId: user.id,
          businessId: faker.string.uuid(),
          IBAN: faker.finance.iban(),
        },
      });
    }

    if (role === Role.Rider) {
      await prisma.rider.create({
        data: {
          userId: user.id,
          vehicleRegNo: faker.vehicle.vin(),
          companyPhone: faker.phone.number(),
        },
      });
    }
  }

  // ---------------- CATEGORIES ----------------
  const categories: Category[] = [];
  for (let i = 0; i < 5; i++) {
    categories.push(
      await prisma.category.create({
        data: { name: faker.commerce.department() },
      })
    );
  }

  // ---------------- STORES + PRODUCTS ----------------
  const sellers = await prisma.seller.findMany();

  for (let i = 0; i < 10; i++) {
    const seller = faker.helpers.arrayElement(sellers);

    const store = await prisma.store.create({
      data: {
        sellerId: seller.id,
        storeName: faker.company.name(),
        description: faker.company.catchPhrase(),
        bannerImageUrl: faker.image.urlLoremFlickr({ category: 'business' }),
        bannerImageName: faker.system.fileName(),
        iconImageUrl: faker.image.urlLoremFlickr({ category: 'shop' }),
        iconImageName: faker.system.fileName(),
        categoryId: faker.helpers.arrayElement(categories).id,
        approvalState: faker.helpers.arrayElement([
          ApprovalState.Pending,
          ApprovalState.Approved,
        ]),
        operationalState: faker.helpers.arrayElement([
          OperationalState.Active,
          OperationalState.Suspended,
        ]),
      },
    });

    // 100 PRODUCTS PER STORE
    for (let j = 0; j < 100; j++) {
      await prisma.product.create({
        data: {
          storeId: store.id,
          stock: faker.number.int({ min: 5, max: 200 }),
          title: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          brand: faker.company.name(),
          color: ['Red', 'Blue', 'Black', 'White'],
          size: ['S', 'M', 'L', 'XL'],
          images: [faker.image.urlLoremFlickr({ category: 'product' })],
          tags: faker.helpers.arrayElements(
            ['new', 'sale', 'popular', 'featured'],
            { min: 1, max: 3 }
          ),
          price: faker.number.float({ min: 20, max: 1000 }),
          salePrice: faker.datatype.boolean()
            ? faker.number.float({ min: 10, max: 900 })
            : null,
          returnPolicy: faker.datatype.boolean(),
          warranty: faker.datatype.boolean(),
          rating: faker.number.float({ min: 1, max: 5 }),
          approvalState: ApprovalState.Approved,
          operationalState: OperationalState.Active,
        },
      });
    }
  }

  // ---------------- ORDERS ----------------
  const buyers = await prisma.buyer.findMany();
  const products = await prisma.product.findMany();
  const riders = await prisma.rider.findMany();

  for (let i = 0; i < 200; i++) {
    const buyer = faker.helpers.arrayElement(buyers);
    const product = faker.helpers.arrayElement(products);
    const rider = faker.helpers.arrayElement(riders);

    const address = await prisma.address.create({
      data: {
        userId: buyer.userId,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        province: faker.location.state(),
        postalCode: faker.location.zipCode(),
        phone: faker.phone.number(),
        isPrimary: true,
      },
    });

    await prisma.order.create({
      data: {
        buyerId: buyer.id,
        deliveryAddressId: address.id,
        paymentMethod: faker.helpers.arrayElement([
          paymentMethod.Prepaid,
          paymentMethod.PostPaid,
        ]),
        paymentStatus: faker.helpers.arrayElement([
          PaymentStatus.Paid,
          PaymentStatus.Pending,
        ]),
        status: faker.helpers.arrayElement([
          OrderStatus.Processing,
          OrderStatus.OutForDeliver,
          OrderStatus.Delivered,
          OrderStatus.Canceled,
          OrderStatus.FailedToDeliver,
        ]),
        riderId: rider.id,
        orderItems: {
          create: {
            productId: product.id,
            qty: faker.number.int({ min: 1, max: 5 }),
            size: 'M',
            color: product.color[0],
            priceAtPurchase: product.price,
            salePriceAtPurchase: product.salePrice ?? product.price,
          },
        },
      },
    });
  }

  // ---------------- OUTPUT LOGIN DETAILS ----------------
  console.log('\n========== SEEDED USERS ==========');
  seededUsers.forEach(u => {
    console.log(`Role: ${u.role} | Email: ${u.email} | Password: ${u.password}`);
  });

  fs.writeFileSync(
    'seed-users.json',
    JSON.stringify(seededUsers, null, 2)
  );

  console.log('\n📄 Credentials saved to seed-users.json');
  console.log('🌱 Seeding completed successfully');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
