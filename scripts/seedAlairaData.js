const mongoose = require("mongoose");
const Product = require("../models/Product");
require("dotenv").config();

const productsToSeed = [
  // --- TOYS (3 products) ---
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf8000000000001"),
    title: "Cloud Bear — Lavender Edition",
    slug: "cloud-bear-lavender-edition",
    description: "An ultra-soft sleeping cloud bear infused with calming lavender scent. Designed to bring cozy comforting nights to your partner.",
    price: 4999,
    discountPrice: 3499,
    category: "Toys",
    fabric: "Soft Plush",
    occasion: "Anniversary",
    color: "Lavender",
    stock: 25,
    rating: 4.9,
    featured: true,
    isActive: true,
    images: [
      { url: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600&auto=format&fit=crop&q=80", publicId: "alaira/toy-1a", order: 0, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1582062952239-ef65c2dda6b6?w=600&auto=format&fit=crop&q=80", publicId: "alaira/toy-1b", order: 1, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80", publicId: "alaira/toy-1c", order: 2, resourceType: "image" }
    ],
    mainImage: { url: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600&auto=format&fit=crop&q=80", publicId: "alaira/toy-1a", order: 0, resourceType: "image" },
    videos: [
      { url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", publicId: "alaira/toy-video-1", order: 0, resourceType: "video" }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf8000000000002"),
    title: "Blush Cuddle Bear",
    slug: "blush-cuddle-bear",
    description: "A sweet blushing teddy bear holding a small velvet heart. Made from premium cotton-plush, it makes the perfect cuddle companion.",
    price: 3200,
    discountPrice: 2200,
    category: "Toys",
    fabric: "Cotton Plush",
    occasion: "Birthday",
    color: "Blush Pink",
    stock: 12,
    rating: 4.8,
    featured: true,
    isActive: true,
    images: [
      { url: "https://images.unsplash.com/photo-1596495572065-1d48c1073d89?w=600&auto=format&fit=crop&q=80", publicId: "alaira/toy-2a", order: 0, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=600&auto=format&fit=crop&q=80", publicId: "alaira/toy-2b", order: 1, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80", publicId: "alaira/toy-2c", order: 2, resourceType: "image" }
    ],
    mainImage: { url: "https://images.unsplash.com/photo-1596495572065-1d48c1073d89?w=600&auto=format&fit=crop&q=80", publicId: "alaira/toy-2a", order: 0, resourceType: "image" }
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf8000000000003"),
    title: "Twin Cuddly Magnetic Pandas",
    slug: "twin-cuddly-magnetic-pandas",
    description: "Two cute cuddly magnetic plush pandas that hold hands when close. Perfect symbolic couple gift.",
    price: 3900,
    discountPrice: 2999,
    category: "Toys",
    fabric: "Soft Cotton",
    occasion: "Anniversary",
    color: "Black & White",
    stock: 15,
    rating: 4.9,
    featured: false,
    isActive: true,
    images: [
      { url: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=600&auto=format&fit=crop&q=80", publicId: "alaira/toy-3a", order: 0, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80", publicId: "alaira/toy-3b", order: 1, resourceType: "image" }
    ],
    mainImage: { url: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=600&auto=format&fit=crop&q=80", publicId: "alaira/toy-3a", order: 0, resourceType: "image" }
  },

  // --- JEWELRY (3 products) ---
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf8000000000004"),
    title: "Twin Hearts Necklace",
    slug: "twin-hearts-necklace",
    description: "Elegant 925 sterling silver chain with double interlocking hearts. Symbolizes two hearts connected across any distance.",
    price: 6900,
    discountPrice: 4999,
    category: "Jewelry",
    fabric: "925 Sterling Silver",
    occasion: "Anniversary",
    color: "Silver",
    stock: 35,
    rating: 5.0,
    featured: true,
    isActive: true,
    images: [
      { url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80", publicId: "alaira/jewelry-1a", order: 0, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&auto=format&fit=crop&q=80", publicId: "alaira/jewelry-1b", order: 1, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80", publicId: "alaira/jewelry-1c", order: 2, resourceType: "image" }
    ],
    mainImage: { url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80", publicId: "alaira/jewelry-1a", order: 0, resourceType: "image" },
    videos: [
      { url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", publicId: "alaira/jewelry-video-1", order: 0, resourceType: "video" }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf8000000000005"),
    title: "Sun & Moon Magnetic Pendants",
    slug: "sun-moon-magnetic-pendants",
    description: "Cute celestial sun and moon necklaces. When held close, they magnetically attract and connect. Beautifully polished design.",
    price: 2500,
    discountPrice: 1999,
    category: "Jewelry",
    fabric: "Sterling Silver",
    occasion: "Dating Anniversary",
    color: "Gold & Silver",
    stock: 22,
    rating: 4.7,
    featured: false,
    isActive: true,
    images: [
      { url: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&auto=format&fit=crop&q=80", publicId: "alaira/jewelry-2a", order: 0, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1611085583191-a3b1a1a274fc?w=600&auto=format&fit=crop&q=80", publicId: "alaira/jewelry-2b", order: 1, resourceType: "image" }
    ],
    mainImage: { url: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&auto=format&fit=crop&q=80", publicId: "alaira/jewelry-2a", order: 0, resourceType: "image" }
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf8000000000006"),
    title: "Crystal Heart Promise Ring",
    slug: "crystal-heart-promise-ring",
    description: "A gorgeous rose-gold plated ring with a sparkling heart-shaped crystal center. Speaks volumes of love in a minimal look.",
    price: 1900,
    discountPrice: 1599,
    category: "Jewelry",
    fabric: "Rose Gold Plated",
    occasion: "Anniversary",
    color: "Rose Gold",
    stock: 24,
    rating: 4.9,
    featured: false,
    isActive: true,
    images: [
      { url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80", publicId: "alaira/jewelry-3a", order: 0, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&auto=format&fit=crop&q=80", publicId: "alaira/jewelry-3b", order: 1, resourceType: "image" }
    ],
    mainImage: { url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80", publicId: "alaira/jewelry-3a", order: 0, resourceType: "image" }
  },

  // --- FLOWERS (3 products) ---
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf8000000000007"),
    title: "Red Velvet Rose Bouquet",
    slug: "red-velvet-rose-bouquet",
    description: "A beautiful hand-tied bouquet of fresh crimson roses wrapped in premium pastel paper. Express your feelings elegantly.",
    price: 2999,
    discountPrice: 1999,
    category: "Flowers",
    fabric: "Fresh Flowers",
    occasion: "Valentine's Day",
    color: "Crimson",
    stock: 15,
    rating: 4.8,
    featured: true,
    isActive: true,
    images: [
      { url: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80", publicId: "alaira/flower-1a", order: 0, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1548849170-3668748a5159?w=600&auto=format&fit=crop&q=80", publicId: "alaira/flower-1b", order: 1, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=600&auto=format&fit=crop&q=80", publicId: "alaira/flower-1c", order: 2, resourceType: "image" }
    ],
    mainImage: { url: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80", publicId: "alaira/flower-1a", order: 0, resourceType: "image" },
    videos: [
      { url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4", publicId: "alaira/flower-video-1", order: 0, resourceType: "video" }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf8000000000008"),
    title: "Eternal Preserved Crimson Rose",
    slug: "eternal-preserved-crimson-rose",
    description: "A real, hand-preserved red rose that lasts for up to 3 years in a luxury glass dome. A timeless expression of love.",
    price: 5500,
    discountPrice: 4500,
    category: "Flowers",
    fabric: "Real Preserved Flower",
    occasion: "Valentine's Day",
    color: "Soft Crimson",
    stock: 10,
    rating: 4.9,
    featured: false,
    isActive: true,
    images: [
      { url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80", publicId: "alaira/flower-2a", order: 0, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80", publicId: "alaira/flower-2b", order: 1, resourceType: "image" }
    ],
    mainImage: { url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80", publicId: "alaira/flower-2a", order: 0, resourceType: "image" }
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf8000000000009"),
    title: "Sweethearts Chocolate & Rose Hamper",
    slug: "sweethearts-chocolate-rose-hamper",
    description: "A premium gift box containing fresh roses, artisanal chocolates, and a custom greeting card.",
    price: 4999,
    discountPrice: 3999,
    category: "Flowers",
    fabric: "Luxury Box",
    occasion: "Anniversary",
    color: "Romantic Red",
    stock: 15,
    rating: 4.9,
    featured: false,
    isActive: true,
    images: [
      { url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80", publicId: "alaira/flower-3a", order: 0, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80", publicId: "alaira/flower-3b", order: 1, resourceType: "image" },
      { url: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80", publicId: "alaira/flower-3c", order: 2, resourceType: "image" }
    ],
    mainImage: { url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80", publicId: "alaira/flower-3a", order: 0, resourceType: "image" }
  }
];

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected successfully");

  console.log("Deleting existing products...");
  await Product.deleteMany({});

  console.log("Seeding new products...");
  
  const formatted = productsToSeed.map(p => ({
    ...p,
    media: {
      frontImage: p.images[0],
      backImage: p.images[0],
      galleryImages: p.images,
      videos: p.videos || []
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
}

run().catch(console.error);
