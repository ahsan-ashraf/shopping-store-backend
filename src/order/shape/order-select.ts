export const OrderSelect = {
  id: true,
  paymentMethod: true,
  paymentStatus: true,
  totalPrice: true,
  createdAt: true,

  buyer: {
    select: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  },

  deliveryAddress: {
    select: {
      id: true,
      city: true,
      province: true,
      postalCode: true,
      phone: true
    }
  },

  orderItems: {
    select: {
      qty: true,
      size: true,
      color: true,
      priceAtPurchase: true,
      salePriceAtPurchase: true,
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          salePrice: true
        }
      }
    }
  }
};
