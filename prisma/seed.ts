import { PrismaClient, Role, Gender, paymentMethod, PaymentStatus, OrderStatus, ReturnRequestStatus, ApprovalState, OperationalState } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // For debugging logins
  const userPasswords: { email: string; password: string; role: Role }[] = [];

  // Minimal typings so arrays are not inferred as never[]
  const buyers: { id: string; userId: string }[] = [];
  const sellers: { id: string; userId: string }[] = [];
  const riders: { id: string; userId: string }[] = [];
  const stores: { id: string }[] = [];
  const products: any[] = []; // we'll use id, price, salePrice, size, color
  const addresses: { id: string; userId: string }[] = [];

  // 1️⃣ Create fixed SuperAdmin & Admin (idempotent via upsert)
  const superAdminPassword = "superadmin123";
  const adminPassword = "admin123";

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@example.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@example.com",
      dob: faker.date.birthdate({ min: 30, max: 50, mode: "age" }),
      password: superAdminPassword,
      role: Role.SuperAdmin,
      gender: Gender.Male,
      approvalState: ApprovalState.Approved,
      operationalState: OperationalState.Active
    }
  });
  userPasswords.push({
    email: superAdmin.email,
    password: superAdminPassword,
    role: Role.SuperAdmin
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      dob: faker.date.birthdate({ min: 25, max: 45, mode: "age" }),
      password: adminPassword,
      role: Role.Admin,
      gender: Gender.Female,
      approvalState: ApprovalState.Approved,
      operationalState: OperationalState.Active
    }
  });
  userPasswords.push({
    email: adminUser.email,
    password: adminPassword,
    role: Role.Admin
  });

  // Helper to create random users with role
  async function createUserWithRole(role: Role): Promise<{
    id: string;
    userId: string;
  }> {
    const password = faker.internet.password({ length: 10 });
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        dob: faker.date.birthdate({ min: 18, max: 65, mode: "age" }),
        password,
        role,
        gender: faker.helpers.arrayElement([Gender.Male, Gender.Female, Gender.Other]),
        approvalState: faker.helpers.weightedArrayElement([
          { weight: 7, value: ApprovalState.Approved },
          { weight: 2, value: ApprovalState.Pending },
          { weight: 1, value: ApprovalState.Rejected }
        ]),
        operationalState: faker.helpers.weightedArrayElement([
          { weight: 7, value: OperationalState.Active },
          { weight: 2, value: OperationalState.Suspended },
          { weight: 1, value: OperationalState.Blocked }
        ])
      }
    });

    userPasswords.push({ email: user.email, password, role });

    if (role === Role.Buyer) {
      const buyer = await prisma.buyer.create({
        data: {
          userId: user.id,
          walletAmount: Number(faker.finance.amount({ min: 0, max: 3000, dec: 2 }))
        }
      });
      return { id: buyer.id, userId: user.id };
    }

    if (role === Role.Seller) {
      const seller = await prisma.seller.create({
        data: {
          userId: user.id,
          businessId: faker.string.uuid(),
          IBAN: faker.finance.iban()
        }
      });
      return { id: seller.id, userId: user.id };
    }

    if (role === Role.Rider) {
      const rider = await prisma.rider.create({
        data: {
          userId: user.id,
          vehicleRegNo: faker.vehicle.vin(),
          companyPhone: faker.phone.number(),
          amountToRecieve: 0
        }
      });
      return { id: rider.id, userId: user.id };
    }

    // fallback, should never hit for this script
    return { id: user.id, userId: user.id };
  }

  // Buyers, Sellers, Riders
  for (let i = 0; i < 40; i++) {
    buyers.push(await createUserWithRole(Role.Buyer));
  }
  for (let i = 0; i < 10; i++) {
    sellers.push(await createUserWithRole(Role.Seller));
  }
  for (let i = 0; i < 10; i++) {
    riders.push(await createUserWithRole(Role.Rider));
  }

  console.log("✅ Users, buyers, sellers, riders created.");

  // 2️⃣ Categories
  const categories = await Promise.all(
    Array.from({ length: 6 }).map(() =>
      prisma.category.create({
        data: {
          name: faker.commerce.department()
        }
      })
    )
  );
  console.log("✅ Categories created.");

  // 3️⃣ Stores (1–2 per seller)
  for (const seller of sellers) {
    const numStores = faker.number.int({ min: 1, max: 2 });
    for (let i = 0; i < numStores; i++) {
      const store = await prisma.store.create({
        data: {
          sellerId: seller.id,
          bannerImageUrl: "https://picsum.photos/seed/banner-" + faker.string.uuid() + "/800/200",
          bannerImageName: "banner-" + faker.string.uuid(),
          iconImageUrl: "https://picsum.photos/seed/icon-" + faker.string.uuid() + "/200/200",
          iconImageName: "icon-" + faker.string.uuid(),
          storeName: faker.company.name(),
          description: faker.commerce.productDescription(),
          categoryId: faker.helpers.arrayElement(categories).id,
          youtube: faker.datatype.boolean() && faker.datatype.boolean() ? "https://youtube.com/" + faker.string.alphanumeric(10) : null,
          facebook: faker.datatype.boolean() && faker.datatype.boolean() ? "https://facebook.com/" + faker.internet.username() : null,
          instagram: faker.datatype.boolean() && faker.datatype.boolean() ? "https://instagram.com/" + faker.internet.username() : null,
          tiktok: faker.datatype.boolean() && faker.datatype.boolean() ? "https://tiktok.com/@" + faker.internet.username() : null
        }
      });

      stores.push({ id: store.id });
    }
  }
  console.log("✅ Stores created.");

  // 4️⃣ Products per store
  const baseColors = ["Red", "Blue", "Green", "Black", "White", "Yellow"];
  const baseSizes = ["XS", "S", "M", "L", "XL"];

  for (const store of stores) {
    const numProducts = faker.number.int({ min: 5, max: 12 });
    for (let i = 0; i < numProducts; i++) {
      const price = faker.number.float({
        min: 10,
        max: 500,
        fractionDigits: 2
      });
      const hasSale = faker.datatype.boolean();
      const salePrice = hasSale ? Number((price * faker.number.float({ min: 0.6, max: 0.9, fractionDigits: 2 })).toFixed(2)) : null;

      const product = await prisma.product.create({
        data: {
          storeId: store.id,
          stock: faker.number.int({ min: 5, max: 500 }),
          title: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          brand: faker.company.name(),
          color: faker.helpers.shuffle(baseColors).slice(0, faker.number.int({ min: 1, max: 4 })),
          size: faker.helpers.shuffle(baseSizes).slice(0, faker.number.int({ min: 1, max: 5 })),
          images: ["https://picsum.photos/seed/product-" + faker.string.uuid() + "/400/400", "https://picsum.photos/seed/product-" + faker.string.uuid() + "/400/400"],
          tags: faker.helpers.arrayElements(["new", "popular", "sale", "limited", "bestseller"], { min: 1, max: 3 }),
          video: faker.datatype.boolean() && faker.datatype.boolean() ? "https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4" : null,
          returnPolicy: faker.datatype.boolean(),
          warranty: faker.datatype.boolean(),
          rating: faker.number.float({
            min: 2,
            max: 5,
            fractionDigits: 1
          }),
          price,
          salePrice: salePrice ?? undefined,
          saleExpiresAt: salePrice ? faker.date.soon({ days: 30 }) : undefined
        }
      });

      products.push(product);
    }
  }
  console.log("✅ Products created.");

  // 5️⃣ Addresses for each buyer (1 primary)
  for (const buyer of buyers) {
    const addr = await prisma.address.create({
      data: {
        userId: buyer.userId,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        province: faker.location.state(),
        postalCode: faker.location.zipCode(),
        isPrimary: true,
        phone: faker.phone.number()
      }
    });
    addresses.push({ id: addr.id, userId: addr.userId });
  }
  console.log("✅ Addresses created.");

  // 6️⃣ Orders + OrderItems with realistic statuses/payment states
  const deliveredOrdersForPossibleReturns: { id: string; buyerId: string | null }[] = [];

  for (const buyer of buyers) {
    const buyerAddress = addresses.find((a) => a.userId === buyer.userId);
    if (!buyerAddress) continue;

    const numOrders = faker.number.int({ min: 0, max: 5 }); // some buyers may not have orders
    for (let i = 0; i < numOrders; i++) {
      // Decide status first
      const status = faker.helpers.weightedArrayElement([
        { weight: 4, value: OrderStatus.Processing },
        { weight: 3, value: OrderStatus.OutForDeliver },
        { weight: 4, value: OrderStatus.Delivered },
        { weight: 1, value: OrderStatus.FailedToDeliver }
      ]);

      // Decide payment method
      const method = faker.helpers.arrayElement([paymentMethod.Prepaid, paymentMethod.PostPaid]);

      // Derive paymentStatus from status + method for more realistic behaviour
      let paymentStatus: PaymentStatus;

      if (method === paymentMethod.Prepaid) {
        // Prepaid is charged before/at shipping
        paymentStatus = PaymentStatus.Paid;
      } else {
        // PostPaid (COD) – depends on delivery status
        if (status === OrderStatus.Delivered) {
          paymentStatus = faker.datatype.boolean() ? PaymentStatus.Paid : PaymentStatus.Pending;
        } else if (status === OrderStatus.FailedToDeliver) {
          paymentStatus = PaymentStatus.Pending; // never paid
        } else {
          paymentStatus = PaymentStatus.Pending; // not delivered yet
        }
      }

      // Rider assignment only if out for delivery / delivered / failed
      let riderId: string | null = null;
      if ((status === OrderStatus.OutForDeliver || status === OrderStatus.Delivered || status === OrderStatus.FailedToDeliver) && riders.length > 0) {
        riderId = faker.helpers.arrayElement(riders).id;
      }

      let totalPrice = 0;

      const order = await prisma.order.create({
        data: {
          buyerId: buyer.id,
          deliveryAddressId: buyerAddress.id,
          paymentMethod: method,
          paymentStatus,
          status,
          riderId
        }
      });

      const numItems = faker.number.int({ min: 1, max: 5 });
      for (let j = 0; j < numItems; j++) {
        const product = faker.helpers.arrayElement(products);
        const qty = faker.number.int({ min: 1, max: 5 });

        const priceNumber = typeof product.price === "number" ? product.price : Number(product.price);
        const salePriceNumber = product.salePrice != null ? (typeof product.salePrice === "number" ? product.salePrice : Number(product.salePrice)) : priceNumber;

        totalPrice += salePriceNumber * qty;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            qty,
            size: faker.helpers.arrayElement(product.size),
            color: faker.helpers.arrayElement(product.color),
            priceAtPurchase: priceNumber,
            salePriceAtPurchase: salePriceNumber
          }
        });
      }

      if (status === OrderStatus.Delivered) {
        deliveredOrdersForPossibleReturns.push({
          id: order.id,
          buyerId: order.buyerId
        });
      }
    }
  }
  console.log("✅ Orders & OrderItems created with realistic states.");

  // 7️⃣ Some ReturnRequests for delivered orders
  const maxReturns = Math.min(deliveredOrdersForPossibleReturns.length, 20);
  const ordersForReturn = faker.helpers.arrayElements(deliveredOrdersForPossibleReturns, { min: 0, max: maxReturns });

  for (const orderInfo of ordersForReturn) {
    const order = await prisma.order.findUnique({
      where: { id: orderInfo.id },
      include: { orderItems: true }
    });
    if (!order || order.orderItems.length === 0) continue;

    const anyItem = faker.helpers.arrayElement(order.orderItems);
    const productId = anyItem.productId;

    await prisma.returnRequest.create({
      data: {
        buyerId: order.buyerId ?? null,
        productId,
        riderId: order.riderId ?? null,
        orderId: order.id,
        reason: faker.lorem.sentence(),
        images: ["https://picsum.photos/seed/return-" + faker.string.uuid() + "/300/300"],
        status: faker.helpers.arrayElement([ReturnRequestStatus.ReturnRequested, ReturnRequestStatus.ReturnInProgress, ReturnRequestStatus.Returned]),
        amountReceived: faker.number.float({
          min: 5,
          max: 200,
          fractionDigits: 2
        })
      }
    });
  }
  console.log("✅ ReturnRequests created for some delivered orders.");

  // 8️⃣ Product Reviews
  for (const product of products) {
    const reviewCount = faker.number.int({ min: 0, max: 6 });
    for (let i = 0; i < reviewCount; i++) {
      const buyer = faker.helpers.arrayElement(buyers);

      await prisma.productReview.create({
        data: {
          productId: product.id,
          buyerId: buyer.id,
          comment: faker.lorem.sentence(),
          reply: faker.datatype.boolean() ? faker.lorem.sentence() : null,
          images: ["https://picsum.photos/seed/review-" + faker.string.uuid() + "/300/300"],
          date: faker.date.past(),
          rating: faker.number.float({
            min: 2,
            max: 5,
            fractionDigits: 1
          })
        }
      });
    }
  }
  console.log("✅ ProductReviews created.");

  // 9️⃣ Some Wishlist & Cart data
  for (const buyer of buyers) {
    const wishCount = faker.number.int({ min: 0, max: 6 });
    const cartCount = faker.number.int({ min: 0, max: 4 });

    const wishProducts = faker.helpers.arrayElements(products, {
      min: 0,
      max: wishCount
    });

    for (const p of wishProducts) {
      try {
        await prisma.wishlist.create({
          data: {
            buyerId: buyer.id,
            productId: p.id
          }
        });
      } catch {
        // ignore duplicates due to unique(buyerId, productId)
      }
    }

    const cartProducts = faker.helpers.arrayElements(products, {
      min: 0,
      max: cartCount
    });

    for (const p of cartProducts) {
      try {
        const priceNumber = typeof p.price === "number" ? p.price : Number(p.price);

        await prisma.cart.create({
          data: {
            buyerId: buyer.id,
            productId: p.id,
            qty: faker.number.int({ min: 1, max: 3 }),
            price: priceNumber
          }
        });
      } catch {
        // ignore duplicates due to unique(buyerId, productId)
      }
    }
  }
  console.log("✅ Wishlist & Cart entries created.");

  console.log("🎉 Seeding complete!");
  console.table(userPasswords);
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
