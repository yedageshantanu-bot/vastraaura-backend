const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    order: { type: Number, default: 0 },
    altText: { type: String, default: "" },
    resourceType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    format: { type: String, default: "" },
    mimeType: { type: String, default: "" },
  },
  { _id: true },
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true },
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, default: "", trim: true },
    answer: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const productMediaSchema = new mongoose.Schema(
  {
    frontImage: { type: mediaSchema, default: null },
    backImage: { type: mediaSchema, default: null },
    sideImage: { type: mediaSchema, default: null },
    hoverImage: { type: mediaSchema, default: null },
    thumbnail: { type: mediaSchema, default: null },
    sizeChart: { type: mediaSchema, default: null },
    galleryImages: { type: [mediaSchema], default: [] },
    videos: { type: [mediaSchema], default: [] },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema(
  {
    colorName: { type: String, required: true, trim: true },
    colorCode: {
      type: String,
      required: true,
      trim: true,
      match: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    frontImage: { type: mediaSchema, default: null },
    backImage: { type: mediaSchema, default: null },
    galleryImages: { type: [mediaSchema], default: [] },
    video: { type: mediaSchema, default: null },
    sku: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    descriptionSections: { type: String, default: "", trim: true },
    declaration: { type: String, default: "", trim: true },
    shippingReturns: { type: String, default: "", trim: true },
    faqs: { type: [faqSchema], default: [] },
    shortDescription: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    images: { type: [mediaSchema], default: [] },
    mainImage: { type: mediaSchema, default: null },
    videos: { type: [mediaSchema], default: [] },
    media: { type: productMediaSchema, default: () => ({}) },
    variants: { type: [variantSchema], default: [] },
    thumbnail: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
      resourceType: { type: String, enum: ["image", "video"], default: "image" },
    },
    category: { type: String, required: true, trim: true },
    subCategory: { type: String, default: "", trim: true },
    fabric: { type: String, default: "", trim: true },
    occasion: { type: String, default: "", trim: true },
    color: { type: String, default: "", trim: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    sizes: [{ type: String, trim: true }],
    colors: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    reviews: { type: [reviewSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
