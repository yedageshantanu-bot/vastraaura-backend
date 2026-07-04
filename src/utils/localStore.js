const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const store = require("../data/store");
const { resolveRole, normalizeEmail } = require("./auth");

const isDbConnected = () => mongoose.connection.readyState === 1;

const nextId = (prefix, values) => {
  const number = values.length + 1;
  return `${prefix}${Date.now()}${number}`;
};

const ensureUserShape = (user) => {
  if (!user) {
    return null;
  }

  user.addresses = Array.isArray(user.addresses) ? user.addresses : [];
  user.wishlist = Array.isArray(user.wishlist) ? user.wishlist : [];
  user.authProvider = user.authProvider || user.provider || "local";
  user.provider = user.provider || user.authProvider;
  user.role = resolveRole(user.email);
  return user;
};

const findUserById = (id) =>
  ensureUserShape(store.users.find((user) => String(user._id) === String(id)));

const findUserByEmail = (email) =>
  ensureUserShape(store.users.find((user) => normalizeEmail(user.email) === normalizeEmail(email)));

const findOrCreateGoogleUser = ({ email, googleId, name, profileImage }) => {
  const normalizedEmail = normalizeEmail(email);
  let user = store.users.find(
    (item) => item.googleId === googleId || normalizeEmail(item.email) === normalizedEmail,
  );

  if (!user) {
    user = {
      _id: nextId("u", store.users),
      name: name || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      googleId,
      authProvider: "google",
      provider: "google",
      profileImage: profileImage || "",
      avatar: profileImage || "",
      phone: "",
      addresses: [],
      wishlist: [],
      orders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.unshift(user);
  }

  user.name = name || user.name || normalizedEmail.split("@")[0];
  user.email = normalizedEmail;
  user.googleId = googleId || user.googleId;
  user.profileImage = profileImage || user.profileImage || "";
  user.avatar = profileImage || user.avatar || "";
  user.authProvider = user.passwordHash ? "hybrid" : "google";
  user.provider = user.authProvider;
  user.updatedAt = new Date().toISOString();

  return ensureUserShape(user);
};

const createEmailUser = async ({ name, email, password }) => {
  const user = {
    _id: nextId("u", store.users),
    name,
    email: normalizeEmail(email),
    passwordHash: await bcrypt.hash(password, 12),
    authProvider: "local",
    provider: "local",
    profileImage: "",
    avatar: "",
    phone: "",
    addresses: [],
    wishlist: [],
    orders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.users.unshift(user);
  return ensureUserShape(user);
};

const getProductById = (id) =>
  store.products.find((product) => String(product._id) === String(id) || product.slug === id);

const getWishlistProducts = (user) =>
  (user.wishlist || []).map((id) => getProductById(id)).filter(Boolean);

const getOrdersForUser = (userId) =>
  store.orders.filter(
    (order) =>
      String(order.userId || "") === String(userId) ||
      findUserById(userId)?.email === order.userEmail,
  );

const createOrder = ({ user, body }) => {
  const { items = [], address, subtotal, couponCode, couponDiscount = 0, total, paymentMethod } = body;
  const order = {
    _id: nextId("o", store.orders),
    orderId: `VA${String(store.orders.length + 1).padStart(5, "0")}`,
    userId: user._id,
    userEmail: user.email,
    customer: address?.fullName || user.name,
    phone: address?.phone || user.phone || "",
    products: items.map((item) => ({
      productId: item._id,
      title: item.title,
      image: item.image || getProductById(item._id)?.images?.[0] || "",
      price: item.discountPrice || item.price || 0,
      quantity: item.quantity || 1,
      size: item.size || "",
      color: item.color || "",
    })),
    shippingAddress: address,
    couponCode: couponCode || "",
    couponDiscount: Number(couponDiscount) || 0,
    subtotal: Number(subtotal) || 0,
    total: Number(total) || 0,
    paymentMethod: "Razorpay",
    paymentStatus: "Paid",
    deliveryStatus: "Pending",
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.orders.unshift(order);
  user.orders = Array.from(new Set([...(user.orders || []), order._id]));
  return order;
};

module.exports = {
  createEmailUser,
  createOrder,
  findOrCreateGoogleUser,
  findUserByEmail,
  findUserById,
  getOrdersForUser,
  getProductById,
  getWishlistProducts,
  isDbConnected,
  normalizeEmail,
  resolveRole,
};
