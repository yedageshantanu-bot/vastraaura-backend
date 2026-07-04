const Order = require("../../models/Order");
const Product = require("../../models/Product");
const User = require("../../models/User");
const Coupon = require("../../models/Coupon");
const asyncHandler = require("../../middleware/asyncHandler");
const { isDbConnected } = require("../utils/localStore");
const store = require("../data/store");

exports.getStats = asyncHandler(async (req, res) => {
  const today = new Date().toDateString();

  if (!isDbConnected()) {
    const revenue = store.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    return res.json({
      success: true,
      totalOrders: store.orders.length,
      todayOrders: store.orders.filter(
        (order) => new Date(order.createdAt || order.date).toDateString() === today,
      ).length,
      pendingOrders: store.orders.filter((order) => order.deliveryStatus === "Pending").length,
      deliveredOrders: store.orders.filter((order) => order.deliveryStatus === "Delivered").length,
      revenue,
      totalProducts: store.products.length,
      totalCustomers: store.users.length,
      activeCoupons: store.coupons.filter((coupon) => coupon.isActive).length,
    });
  }

  const orders = await Order.find().lean();
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  const [totalProducts, totalCustomers, activeCoupons] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments(),
    Coupon.countDocuments({ isActive: true }),
  ]);

  res.json({
    success: true,
    totalOrders: orders.length,
    todayOrders: orders.filter(
      (order) => new Date(order.createdAt || order.date).toDateString() === today,
    ).length,
    pendingOrders: orders.filter((order) => order.deliveryStatus === "Pending").length,
    deliveredOrders: orders.filter((order) => order.deliveryStatus === "Delivered").length,
    revenue,
    totalProducts,
    totalCustomers,
    activeCoupons,
  });
});
