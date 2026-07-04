const {
  seedCoupons,
  seedOrders,
  seedProducts,
  seedUsers,
} = require("./seedData");

const store = {
  products: [...seedProducts],
  coupons: [...seedCoupons],
  orders: [...seedOrders],
  users: [...seedUsers],
};

module.exports = store;
