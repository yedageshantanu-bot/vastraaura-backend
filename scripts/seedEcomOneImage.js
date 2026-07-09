const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Premium titles and descriptions for each category
const flowersData = [
  { title: "Crimson Velvet Rose Bouquet", desc: "A premium hand-tied bouquet of fresh crimson velvet roses wrapped in luxury pastel paper and tied with a satin ribbon." },
  { title: "Eternal Preserved Golden Rose", desc: "A real, hand-preserved red rose that lasts up to 3 years in a premium glass dome with micro LED lights." },
  { title: "Grand Celebration Flower Basket", desc: "An exquisite arrangement of fresh seasonal lilies, carnations, and velvet roses in a handcrafted wicker basket." },
  { title: "Pink Hydrangea Dreams", desc: "A gorgeous luxury bouquet of soft pink hydrangeas and baby's breath, perfect for delicate elegance." },
  { title: "Enchanted Garden Mix", desc: "A colorful, vibrant mix of fresh garden roses, daisies, and lavender sprigs wrapped in eco-friendly paper." },
  { title: "Royal White Lily Deluxe", desc: "Stunning royal white lilies accented with eucalyptus leaves in a sleek designer glass vase." },
  { title: "Sunset Tulip Harmony", desc: "Bright orange and yellow tulips arranged in a modern round box. Speaks warmth and joy." },
  { title: "Eternal Orchid Splendor", desc: "A premium double-stemmed white orchid plant in a gold-detailed ceramic pot." }
];

const jewelryData = [
  { title: "Twin Hearts Interlocking Pendant", desc: "Exquisite 925 sterling silver necklace featuring two interlocking hearts embellished with fine cubic zirconia." },
  { title: "Sun & Moon Celestial Necklace", desc: "Delicate magnetic matching pendants representing the sun and moon. They snap together when close." },
  { title: "Crystal Promise Hugging Ring", desc: "An elegant rose-gold plated promise ring featuring hugging hands holding a brilliant crystal heart." },
  { title: "Silver Infinity Love Bracelet", desc: "925 sterling silver bracelet featuring an infinity symbol interwoven with a tiny heart charm." },
  { title: "Eternal Love Drop Earrings", desc: "Classic teardrop earrings with sparkling amethyst crystals set in high-polish sterling silver." },
  { title: "Golden Solitaire Diamond Ring", desc: "A classic 18k gold-plated ring with a brilliant round-cut solitaire cubic zirconia center." },
  { title: "Midnight Star Sapphire Pendant", desc: "Deep blue star sapphire crystal set in a vintage-inspired silver filigree pendant." },
  { title: "Rose Gold Heartbeat Anklet", desc: "A dainty rose gold plated anklet with a subtle heartbeat lifeline and heart outline detail." }
];

const toysData = [
  { title: "Calming Lavender Plush Bear", desc: "An ultra-soft sleeping teddy bear infused with organic lavender aromatherapy to assist in calm, restful sleep." },
  { title: "Twin Magnetic Love Pandas", desc: "Two adorable plush pandas with hidden magnets in their paws. They hold hands and hug when placed near." },
  { title: "Blush Pink Fluffy Pillow Bear", desc: "A delightful, fluffy pink teddy bear that is super squeezable and doubles as a comfortable neck pillow." },
  { title: "Sleepy Cloud Plushie", desc: "A fluffy, cloud-shaped cuddle pillow with a warm stitched smiling face, made from premium cotton." },
  { title: "Premium Cotton Cuddle Puppy", desc: "An adorable floppy-eared puppy plushie made from organic cotton, perfect for children and adults alike." },
  { title: "Velvet Teddy Love Classic", desc: "A timeless, chocolate-brown classic teddy bear wearing a red velvet bowtie." },
  { title: "Cozy Kitten Sleep Companion", desc: "A long, squishy kitten plushie designed for side-sleeping support and maximum huggability." },
  { title: "Sweet Dream Bunny Plush", desc: "An incredibly soft bunny plush with long floppy ears and a pastel pink stitched nose." }
];

// Helper to generate unique descriptions and names dynamically if we run out of list items
function generateProductInfo(category, index) {
  let list = [];
  let prefix = "";
  if (category === "Flowers") {
    list = flowersData;
    prefix = "Luxe Rose Bouquet";
  } else if (category === "Jewelry") {
    list = jewelryData;
    prefix = "Sparkling Silver Pendant";
  } else if (category === "Toys") {
    list = toysData;
    prefix = "Cuddly Cotton Teddy";
  }

  if (index < list.length) {
    return list[index];
  }

  const num = index + 1;
  return {
    title: `${prefix} — Edition ${num}`,
    desc: `A premium handcrafted ${category.toLowerCase()} item designed with extreme attention to detail and high-quality materials. Makes a perfect, long-lasting gift for someone special.`
  };
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected successfully");

  // --- Seed/Find Users for Comments ---
  console.log("Setting up seed users...");
  const dummyUsersData = [
    { name: "Priya Sharma", email: "priya@example.com", avatar: "PS" },
    { name: "Rahul Patel", email: "rahul@example.com", avatar: "RP" },
    { name: "Ananya Singh", email: "ananya@example.com", avatar: "AS" }
  ];

  const seededUsers = [];
  for (const u of dummyUsersData) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      const passwordHash = await bcrypt.hash("SeededUser123!", 12);
      user = await User.create({
        name: u.name,
        email: u.email,
        passwordHash,
        avatar: u.avatar,
        role: "customer"
      });
      console.log(`Created user: ${user.name}`);
    } else {
      console.log(`Found existing user: ${user.name}`);
    }
    seededUsers.push(user);
  }

  // --- Read Images Dynamically ---
  const publicPath = path.join(__dirname, "../../client/public");
  const categoriesList = [
    { folder: "toys", category: "Toys" },
    { folder: "jewelley", category: "Jewelry" },
    { folder: "flowers", category: "Flowers" }
  ];

  const productsToInsert = [];

  let globalIndex = 0;
  for (const cat of categoriesList) {
    const dirPath = path.join(publicPath, cat.folder);
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory does not exist: ${dirPath}`);
      continue;
    }

    const files = fs.readdirSync(dirPath).filter(file => /\.(jpe?g|png)$/i.test(file));
    console.log(`Found ${files.length} images in ${cat.folder}`);

    files.forEach((file, index) => {
      const info = generateProductInfo(cat.category, index);
      const relativeUrl = `/${cat.folder}/${file}`;
      const slug = info.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") + `-${globalIndex}`; // Appended index for uniqueness

      // Generate randomized but structured pricing
      const basePrice = 900 + Math.floor(Math.random() * 40) * 100 + 99; // e.g. 1299, 2499, etc.
      const discountPrice = Math.round(basePrice * 0.75); // 25% off average

      const imageMediaObj = {
        url: relativeUrl,
        publicId: `${cat.folder}_img_${index}`,
        order: 0,
        resourceType: "image"
      };

      // Create reviews for a few products to test functionality
      const reviews = [];
      if (index === 0 || index === 2) {
        // Add 1 or 2 comments
        reviews.push({
          user: seededUsers[0]._id,
          rating: 5,
          comment: "Absolutely gorgeous! The item quality is supreme and the packaging is so beautiful."
        });
        if (index === 0) {
          reviews.push({
            user: seededUsers[1]._id,
            rating: 4,
            comment: "Very fast shipping. The product looks exactly like the photo, very cute."
          });
        }
      }

      const ratingsAverage = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : (4.5 + Math.random() * 0.5);
      const ratingsCount = reviews.length;

      productsToInsert.push({
        title: info.title,
        slug,
        description: info.desc,
        price: basePrice,
        discountPrice,
        category: cat.category,
        fabric: cat.category === "Flowers" ? "Fresh Cut" : cat.category === "Jewelry" ? "925 Sterling Silver" : "Soft Cloud Cotton",
        occasion: index % 2 === 0 ? "Anniversary" : "Birthday",
        color: index % 2 === 0 ? "Pastel" : "Classic Red",
        stock: 10 + Math.floor(Math.random() * 40),
        ratings: {
          average: Math.round(ratingsAverage * 10) / 10,
          count: ratingsCount
        },
        featured: index < 4, // Make the first 4 in each category featured
        isActive: true,
        images: [imageMediaObj],
        mainImage: imageMediaObj,
        media: {
          frontImage: imageMediaObj,
          backImage: imageMediaObj,
          galleryImages: [imageMediaObj],
          videos: []
        },
        thumbnail: {
          url: relativeUrl,
          publicId: `${cat.folder}_img_${index}`,
          resourceType: "image"
        },
        reviews,
        displayOrder: globalIndex
      });

      globalIndex++;
    });
  }

  console.log("Deleting existing products...");
  await Product.deleteMany({});
  console.log("Existing products cleared");

  console.log(`Inserting ${productsToInsert.length} new single-image products...`);
  await Product.insertMany(productsToInsert);
  console.log("Products successfully inserted!");

  mongoose.connection.close();
  console.log("Database connection closed");
}

run().catch(err => {
  console.error("Error during seeding:", err);
  process.exit(1);
});
