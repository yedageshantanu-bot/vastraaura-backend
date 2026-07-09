const mongoose = require("mongoose");
const Product = require("../models/Product");
require("dotenv").config();

const productsToSeed = [
  // --- FLOWERS ---
  {
    _id: new mongoose.Types.ObjectId("607f1f77bcf8000000000001"),
    title: "Crimson Velvet Rose Bouquet",
    slug: "crimson-velvet-rose-bouquet",
    description: "A premium hand-tied bouquet of fresh crimson velvet roses wrapped in luxury pastel paper and tied with a satin ribbon. An classic expression of love.",
    price: 1999,
    discountPrice: 1499,
    category: "Flowers",
    fabric: "Fresh Flowers",
    occasion: "Valentine's Day",
    color: "Crimson Red",
    stock: 25,
    ratings: { average: 4.8, count: 45 },
    featured: true,
    isActive: true,
    images: [
      { url: "/flowers/IMG_3520.JPG.jpeg", publicId: "flowers/img_3520", order: 0, resourceType: "image" },
      { url: "/flowers/IMG_3521.JPG.jpeg", publicId: "flowers/img_3521", order: 1, resourceType: "image" },
      { url: "/flowers/IMG_3525.JPG.jpeg", publicId: "flowers/img_3525", order: 2, resourceType: "image" }
    ],
    mainImage: { url: "/flowers/IMG_3520.JPG.jpeg", publicId: "flowers/img_3520", order: 0, resourceType: "image" }
  },
  {
    _id: new mongoose.Types.ObjectId("607f1f77bcf8000000000002"),
    title: "Eternal Preserved Golden Rose",
    slug: "eternal-preserved-golden-rose",
    description: "A real, hand-preserved red rose that lasts up to 3 years in a premium glass dome. Adorned with micro LED fairy lights and a solid wooden base.",
    price: 3999,
    discountPrice: 2999,
    category: "Flowers",
    fabric: "Real Preserved Flower",
    occasion: "Anniversary",
    color: "Golden Red",
    stock: 15,
    ratings: { average: 4.9, count: 62 },
    featured: true,
    isActive: true,
    images: [
      { url: "/flowers/IMG_3527.JPG.jpeg", publicId: "flowers/img_3527", order: 0, resourceType: "image" },
      { url: "/flowers/IMG_3528.JPG.jpeg", publicId: "flowers/img_3528", order: 1, resourceType: "image" }
    ],
    mainImage: { url: "/flowers/IMG_3527.JPG.jpeg", publicId: "flowers/img_3527", order: 0, resourceType: "image" }
  },
  {
    _id: new mongoose.Types.ObjectId("607f1f77bcf8000000000003"),
    title: "Grand Celebration Flower Basket",
    slug: "grand-celebration-flower-basket",
    description: "An exquisite arrangement of fresh seasonal lilies, carnations, and velvet roses in a handcrafted rustic wicker basket. Ideal for anniversaries and birthdays.",
    price: 2499,
    discountPrice: 1999,
    category: "Flowers",
    fabric: "Fresh Flowers",
    occasion: "Celebration",
    color: "Mixed Pastels",
    stock: 20,
    ratings: { average: 4.7, count: 31 },
    featured: false,
    isActive: true,
    images: [
      { url: "/flowers/IMG_3531.JPG.jpeg", publicId: "flowers/img_3531", order: 0, resourceType: "image" },
      { url: "/flowers/IMG_3532.JPG.jpeg", publicId: "flowers/img_3532", order: 1, resourceType: "image" }
    ],
    mainImage: { url: "/flowers/IMG_3531.JPG.jpeg", publicId: "flowers/img_3531", order: 0, resourceType: "image" }
  },

  // --- JEWELRY ---
  {
    _id: new mongoose.Types.ObjectId("607f1f77bcf8000000000004"),
    title: "Twin Hearts Interlocking Pendant",
    slug: "twin-hearts-interlocking-pendant",
    description: "Exquisite 925 sterling silver necklace featuring two interlocking hearts. Embellished with fine cubic zirconia stones, representing eternal connection.",
    price: 4999,
    discountPrice: 3499,
    category: "Jewelry",
    fabric: "925 Sterling Silver",
    occasion: "Anniversary",
    color: "Polished Silver",
    stock: 40,
    ratings: { average: 5.0, count: 112 },
    featured: true,
    isActive: true,
    images: [
      { url: "/jewelley/IMG_3611.JPG.jpeg", publicId: "jewelry/img_3611", order: 0, resourceType: "image" },
      { url: "/jewelley/IMG_3612.JPG.jpeg", publicId: "jewelry/img_3612", order: 1, resourceType: "image" },
      { url: "/jewelley/IMG_3613.JPG.jpeg", publicId: "jewelry/img_3613", order: 2, resourceType: "image" }
    ],
    mainImage: { url: "/jewelley/IMG_3611.JPG.jpeg", publicId: "jewelry/img_3611", order: 0, resourceType: "image" }
  },
  {
    _id: new mongoose.Types.ObjectId("607f1f77bcf8000000000005"),
    title: "Sun & Moon Celestial Necklace",
    slug: "sun-moon-celestial-necklace",
    description: "Delicate magnetic matching pendants representing the sun and moon. When held close, they magnetically attract and connect. Comes in a plush box.",
    price: 2999,
    discountPrice: 1999,
    category: "Jewelry",
    fabric: "Premium Alloy",
    occasion: "Dating Anniversary",
    color: "Gold & Silver",
    stock: 35,
    ratings: { average: 4.8, count: 85 },
    featured: true,
    isActive: true,
    images: [
      { url: "/jewelley/IMG_3617.JPG.jpeg", publicId: "jewelry/img_3617", order: 0, resourceType: "image" },
      { url: "/jewelley/IMG_3618.JPG.jpeg", publicId: "jewelry/img_3618", order: 1, resourceType: "image" },
      { url: "/jewelley/IMG_3619.JPG.jpeg", publicId: "jewelry/img_3619", order: 2, resourceType: "image" }
    ],
    mainImage: { url: "/jewelley/IMG_3617.JPG.jpeg", publicId: "jewelry/img_3617", order: 0, resourceType: "image" }
  },
  {
    _id: new mongoose.Types.ObjectId("607f1f77bcf8000000000006"),
    title: "Crystal Promise Hugging Ring",
    slug: "crystal-promise-hugging-ring",
    description: "An elegant rose-gold plated promise ring featuring hugging hands holding a brilliant, heart-shaped crystal center. Speaks volumes of love in a minimalist design.",
    price: 1899,
    discountPrice: 1299,
    category: "Jewelry",
    fabric: "Rose Gold Plated",
    occasion: "Promise Day",
    color: "Rose Gold",
    stock: 50,
    ratings: { average: 4.9, count: 96 },
    featured: false,
    isActive: true,
    images: [
      { url: "/jewelley/IMG_3652.JPG.jpeg", publicId: "jewelry/img_3652", order: 0, resourceType: "image" },
      { url: "/jewelley/IMG_3653.JPG.jpeg", publicId: "jewelry/img_3653", order: 1, resourceType: "image" },
      { url: "/jewelley/IMG_3654.JPG.jpeg", publicId: "jewelry/img_3654", order: 2, resourceType: "image" }
    ],
    mainImage: { url: "/jewelley/IMG_3652.JPG.jpeg", publicId: "jewelry/img_3652", order: 0, resourceType: "image" }
  },

  // --- TOYS ---
  {
    _id: new mongoose.Types.ObjectId("607f1f77bcf8000000000007"),
    title: "Calming Lavender Plush Bear",
    slug: "calming-lavender-plush-bear",
    description: "An ultra-soft sleeping teddy bear infused with organic lavender aromatherapy to assist in calming, restful sleep. Made from premium cloud-plush material.",
    price: 2999,
    discountPrice: 2199,
    category: "Toys",
    fabric: "Soft Plush",
    occasion: "Birthday",
    color: "Lavender Purple",
    stock: 30,
    ratings: { average: 4.9, count: 120 },
    featured: true,
    isActive: true,
    images: [
      { url: "/toys/IMG_2867.JPG.jpeg", publicId: "toys/img_2867", order: 0, resourceType: "image" },
      { url: "/toys/IMG_2870.JPG.jpeg", publicId: "toys/img_2870", order: 1, resourceType: "image" },
      { url: "/toys/IMG_2872.JPG.jpeg", publicId: "toys/img_2872", order: 2, resourceType: "image" }
    ],
    mainImage: { url: "/toys/IMG_2867.JPG.jpeg", publicId: "toys/img_2867", order: 0, resourceType: "image" }
  },
  {
    _id: new mongoose.Types.ObjectId("607f1f77bcf8000000000008"),
    title: "Twin Magnetic Love Pandas",
    slug: "twin-magnetic-love-pandas",
    description: "Two adorable plush pandas with hidden magnets in their paws. They hold hands and hug when placed near each other. An adorable couple keepsake.",
    price: 3499,
    discountPrice: 2499,
    category: "Toys",
    fabric: "Soft Cotton",
    occasion: "Anniversary",
    color: "Black & White",
    stock: 22,
    ratings: { average: 4.9, count: 54 },
    featured: true,
    isActive: true,
    images: [
      { url: "/toys/IMG_3524.JPG.jpeg", publicId: "toys/img_3524", order: 0, resourceType: "image" },
      { url: "/toys/IMG_3529.JPG.jpeg", publicId: "toys/img_3529", order: 1, resourceType: "image" }
    ],
    mainImage: { url: "/toys/IMG_3524.JPG.jpeg", publicId: "toys/img_3524", order: 0, resourceType: "image" }
  },
  {
    _id: new mongoose.Types.ObjectId("607f1f77bcf8000000000009"),
    title: "Blush Pink Fluffy Pillow Bear",
    slug: "blush-pink-fluffy-pillow-bear",
    description: "A delightful, fluffy pink teddy bear that is super squeezable and doubles as a comfortable neck pillow. A cute gift for sweet dreams.",
    price: 1999,
    discountPrice: 1499,
    category: "Toys",
    fabric: "Cotton Plush",
    occasion: "Get Well Soon",
    color: "Blush Pink",
    stock: 45,
    ratings: { average: 4.8, count: 77 },
    featured: false,
    isActive: true,
    images: [
      { url: "/toys/IMG_3674.JPG.jpeg", publicId: "toys/img_3674", order: 0, resourceType: "image" },
      { url: "/toys/IMG_3675.JPG.jpeg", publicId: "toys/img_3675", order: 1, resourceType: "image" },
      { url: "/toys/IMG_3676.JPG.jpeg", publicId: "toys/img_3676", order: 2, resourceType: "image" }
    ],
    mainImage: { url: "/toys/IMG_3674.JPG.jpeg", publicId: "toys/img_3674", order: 0, resourceType: "image" }
  }
];

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from environment variables");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected successfully to database");

  console.log("Clearing existing products...");
  await Product.deleteMany({});
  console.log("Existing products cleared");

  console.log("Seeding new web-optimized products...");
  const formatted = productsToSeed.map((p, idx) => ({
    ...p,
    displayOrder: idx,
    media: {
      frontImage: p.images[0],
      backImage: p.images[1] || p.images[0],
      galleryImages: p.images,
      videos: []
    },
    thumbnail: {
      url: p.images[0].url,
      publicId: p.images[0].publicId,
      resourceType: "image"
    }
  }));

  await Product.insertMany(formatted);
  console.log(`Successfully seeded ${formatted.length} products!`);
  
  mongoose.connection.close();
  console.log("Database connection closed");
}

run().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
