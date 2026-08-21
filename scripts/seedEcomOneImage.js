const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Premium titles and descriptions for each category
const flowersData = [
  { file: "IMG_4930.PNG", title: "Crimson Velvet Rose Bouquet", price: 1999, mrp: 2499, desc: "A premium hand-tied bouquet of fresh crimson velvet roses wrapped in luxury pastel parchment and tied with a satin ribbon." },
  { file: "IMG_4931.PNG", title: "Blush Pink Hydrangea Dreams", price: 2999, mrp: 3999, desc: "A gorgeous luxury bouquet of soft pink hydrangeas and baby's breath, perfect for delicate elegance." },
  { file: "IMG_4933.PNG", title: "Eternal Preserved Golden Rose", price: 3499, mrp: 4499, desc: "A real, hand-preserved red rose that lasts up to 3 years in a premium glass dome with micro LED lights." },
  { file: "IMG_4948.PNG", title: "Grand Celebration Flower Basket", price: 2499, mrp: 3299, desc: "An exquisite arrangement of fresh seasonal lilies, carnations, and velvet roses in a handcrafted wicker basket." },
  { file: "IMG_4949.PNG", title: "Royal White Lily Deluxe", price: 2799, mrp: 3599, desc: "Stunning royal white lilies accented with eucalyptus leaves in a sleek designer presentation wrap." },
  { file: "IMG_4950.PNG", title: "Enchanted Garden Mix", price: 1899, mrp: 2399, desc: "A colorful, vibrant mix of fresh garden roses, daisies, and lavender sprigs wrapped in eco-friendly paper." },
  { file: "IMG_4951.PNG", title: "Sunset Tulip Harmony", price: 2299, mrp: 2899, desc: "Bright orange and yellow tulips arranged in a modern round gift box. Speaks warmth and joy." },
  { file: "IMG_4954.PNG", title: "Eternal Orchid & Rose Splendor", price: 3299, mrp: 4199, desc: "A premium double-stemmed orchid and crimson rose pairing in a gold-detailed gift box." },
  { file: "IMG_4955.PNG", title: "Velvet Red Heart Bouquet", price: 1799, mrp: 2299, desc: "Deep velvet red roses shaped with romantic precision and bound with a satin ribbon." },
  { file: "IMG_4956.PNG", title: "Sweet Carnation & Pink Rose Bunch", price: 1599, mrp: 1999, desc: "Delicate pastel pink carnations and roses designed for sweet celebrations." },
  { file: "IMG_4958.PNG", title: "Imperial Pastel Luxury Bloom Basket", price: 3899, mrp: 4999, desc: "Grand arrangement of imported Dutch blooms in an ornate handcrafted gift hamper." },
  { file: "IMG_4959.PNG", title: "Pure Elegance White Rose Bouquet", price: 2199, mrp: 2799, desc: "Pristine white roses wrapped in sleek black parchment with gold foil typography." }
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
  { file: "IMG_4912.PNG", title: "5-Feet Giant Pink Plush Bear", price: 7000, mrp: 9999, desc: "Five feet of pure fluff, love, and cuddles! This giant pink bear is made to steal hearts with its adorable face, super-soft fur, and extra-large huggable size. The perfect grand gesture gift!" },
  { file: "IMG_4913.PNG", title: "5-Feet Giant Cream Plush Bear", price: 7000, mrp: 9999, desc: "Five feet of pure fluff, love, and cuddles! This giant cream bear is made to steal hearts with its adorable face, super-soft fur, and extra-large huggable size." },
  { file: "IMG_4914.PNG", title: "2-Feet Cozy Cream Teddy Bear", price: 2899, mrp: 3999, desc: "Two feet of pure fluff and cuddles! This cozy cream teddy bear is soft, huggable, and ready to become your favourite cuddle buddy." },
  { file: "IMG_4916.PNG", title: "Fluffy Lavender Bear Pencil Pouch", price: 799, mrp: 1199, desc: "A little bundle of cuteness made for everyday moments! This adorable fluffy lavender bear doubles as a soft toy and a handy pencil pouch—perfect for keeping your favourite pens and little essentials close." },
  { file: "IMG_4917.PNG", title: "2-Feet Cuddly Penguin Plushie", price: 2999, mrp: 3999, desc: "Cute enough to steal your heart and cuddly enough to keep it! This irresistibly fluffy penguin is here to give you all the warm hugs, sweet smiles, and butterflies you didn’t know you needed." },
  { file: "IMG_4919.PNG", title: "3-Feet Cuddly Penguin Plushie", price: 3999, mrp: 4999, desc: "Three feet of pure fluff, warm hugs, and sweet smiles! Made from organic cloud cotton." },
  { file: "IMG_4920.PNG", title: "4-Feet Giant Fluffy Teddy Bear", price: 6000, mrp: 7999, desc: "Four feet of pure fluff, cuddles, and irresistible charm! This giant teddy is made to steal hearts, become your favourite cuddle buddy, and make every hug feel a little more special." },
  { file: "IMG_4921.PNG", title: "Dramatic Cuddly Goose Pillow", price: 2600, mrp: 3499, desc: "Long, fluffy, and impossible to resist—this adorable goose is ready to steal your heart and become your favourite cuddle partner. Soft enough to hug, cute enough to make you smile." },
  { file: "IMG_4924.PNG", title: "3-Feet Fluffy Giant Kitty Plush", price: 3799, mrp: 4999, desc: "Three feet of pure cuteness, fluff, and cuddles! This giant kitty is soft, huggable, and ready to become your favourite cuddle buddy with its adorable eyes and fluffy paws." },
  { file: "IMG_4925.PNG", title: "3-Feet Giant Sweet Dream Bunny", price: 3500, mrp: 4500, desc: "Big, fluffy, and impossible to resist! This giant bunny is made for the biggest hugs, sweetest moments, and all the cuddles you’ve been waiting for." },
  { file: "IMG_4927.PNG", title: "Cozy Bunny Hot Water Bag Comfort Pack", price: 499, mrp: 799, desc: "A Little Love for Her Tough Days 🎀💗 Because sometimes she doesn’t need a solution—she just needs to feel cared for. Gift her this adorable bunny hot water bag as a sweet little reminder." },
  { file: "IMG_4928.PNG", title: "Twin Magnetic Love Pandas", price: 2899, mrp: 3899, desc: "Two adorable plush pandas with hidden magnets in their paws. They hold hands and hug when placed near." },
  { file: "IMG_4929.PNG", title: "Sleepy Cloud Cotton Cuddle Pillow", price: 2600, mrp: 3200, desc: "A fluffy, cloud-shaped cuddle pillow with a warm stitched smiling face, made from premium cotton." }
];

const sweetsData = [
  { title: "Whole Raisins Coated with Fine Milk Chocolate 100gm", price: 302, mrp: 399, desc: "Juicy sun-dried raisins enveloped in velvety milk chocolate." },
  { title: "Bittersweet Dark Chocolate 65% Cocoa 50gm", price: 203, mrp: 249, desc: "65% intense cocoa dark chocolate bar for true connoisseurs." },
  { title: "Dark Chocolate Coated Fig Pouch 100gm", price: 257, mrp: 320, desc: "Sun-dried exotic figs coated in rich Belgian dark chocolate." },
  { title: "Mazaana Peanut Butter Crunchy Chocolate Spread 300gm", price: 203, mrp: 249, desc: "Gourmet chocolate spread loaded with roasted peanut crunch." },
  { file: "IMG_4057.JPG.jpeg", title: "Dark Chocolate Caramelized Almond Crunch 50gm", price: 203, mrp: 249, desc: "Rich 50gm Belgian dark chocolate bar with caramelized almond crunch." },
  { title: "Mazaana Assorted Chocolate Bars Gift Pack 250gm", price: 995, mrp: 1250, desc: "Luxury wooden keepsake gift box filled with 5 specialty chocolate bars." },
  { title: "Extra Dark Chocolate 80% Cocoa Bar 50gm", price: 203, mrp: 249, desc: "Ultra-rich 80% dark cocoa bar crafted for intense chocolate lovers." },
  { title: "Subtle Dark Chocolate 46% Cocoa Bar 50gm", price: 203, mrp: 249, desc: "Smooth 46% mild dark chocolate bar with balanced sweetness." },
  { title: "Whole Cashews Coated with Fine Milk Chocolate 100gm", price: 302, mrp: 399, desc: "Crunchy whole cashews drenched in rich milk chocolate." },
  { file: "IMG_4062.JPG.jpeg", title: "Mazaana Milk Chocolate Bar 50gm", price: 203, mrp: 249, desc: "Classic smooth & creamy milk chocolate bar." },
  { title: "Mazaana Chocolate Almond Dates 100gm", price: 203, mrp: 249, desc: "Rich Arabian dates stuffed with almonds and coated in chocolate." },
  { title: "Mazaana Chocolate Paan 80gm", price: 203, mrp: 249, desc: "Refreshing betel leaf paan bites coated in dark chocolate." },
  { title: "Whole Cashews Coated with Fine Dark Chocolate 100gm", price: 302, mrp: 399, desc: "Whole cashews covered in bittersweet dark cocoa." },
  { title: "Whole Almonds Coated with Fine Dark Chocolate 100gm", price: 302, mrp: 399, desc: "Slow-roasted almonds enveloped in 60% dark chocolate." },
  { title: "Chocolate Spread With Choco Chips 300gm", price: 302, mrp: 399, desc: "Creamy chocolate spread studded with crunchy choco chips." },
  { title: "Whole Almonds Coated with Fine Milk Chocolate 100gm", price: 302, mrp: 399, desc: "Crunchy Californian almonds coated in smooth milk chocolate." },
  { file: "IMG_4055.JPG.jpeg", title: "Mazaana Dark Chocolate with Almonds Bar 50gm", price: 203, mrp: 249, desc: "Dark chocolate bar loaded with roasted almond pieces." },
  { title: "Mazaana Pure Chocolate Spread Jar 300gm", price: 302, mrp: 399, desc: "Rich hazelnut and cocoa chocolate spread jar." },
  { file: "IMG_4054.JPG.jpeg", title: "White Chocolate With Kesar, Badam And Pista Bar 50gm", price: 203, mrp: 249, desc: "Royal white chocolate bar infused with saffron strands, almonds, and pistachios." },
  { title: "Whole Raisins Coated With Fine Dark Chocolate 100gm", price: 302, mrp: 399, desc: "Sweet raisins coated in rich dark chocolate." },
  { file: "IMG_4056.JPG.jpeg", title: "Mazaana Badam And Pista Bar 50gm", price: 203, mrp: 249, desc: "Traditional dry fruit chocolate bar packed with almonds & pistachios." }
];

const healthySweetsData = [
  // Photo 1: Cookie Coins & Canisters (Mapro ₹297/306 + ₹5 = ₹302/311)
  { file: "image45.jpeg", title: "Snackery Choco Chip Cookie Coin 150gm", price: 302, mrp: 399, desc: "Crispy cookie coins loaded with rich chocolate chips. Mapro Snackery signature." },
  { file: "image47.jpeg", title: "Snackery Oats Jaggery Cookie Coin 150gm", price: 302, mrp: 399, desc: "Healthy rolled oats and natural sugarcane jaggery cookie coins." },
  { file: "image49.jpeg", title: "Snackery Butter Cashew Nut Cookies 150gm", price: 302, mrp: 399, desc: "Rich butter cookies packed with real cashew nut crunch." },
  { file: "image50.jpeg", title: "Snackery Coffee Cookie Coin 150gm", price: 302, mrp: 399, desc: "Aromatic espresso coffee infused butter cookie coins." },
  { file: "image41.jpeg", title: "Snackery Butter Coconut Cookies 150gm", price: 302, mrp: 399, desc: "Toasted coconut flakes blended into rich butter shortbread cookies." },
  { file: "image43.jpeg", title: "Snackery Butter Classic Cookie Coin 150gm", price: 302, mrp: 399, desc: "Classic pure butter cookie coins with melting texture." },
  { file: "image15.jpeg", title: "Matte Black Chocolate Chunk Cookie Canister", price: 311, mrp: 399, desc: "Sleek matte black airtight canister filled with Belgian chocolate chunk cookies." },

  // Photo 2: Frubbles Pouches & Sparky Guava (Mapro ₹171/240 + ₹5 = ₹176/245)
  { file: "image2.jpeg", title: "Sparky Guava Spicy Fruit Chews 240gm", price: 245, mrp: 299, desc: "Zesty spicy pink guava fruit chews dusted with chili rock salt." },
  { file: "image5.jpeg", title: "Mapro Frubbles Guava Real Fruit Pouch 180gm", price: 176, mrp: 220, desc: "Delicious guava flavored chewy real fruit bites in a pouch." },
  { file: "image7.jpeg", title: "Mapro Frubbles Watermelon Real Fruit Pouch 180gm", price: 176, mrp: 220, desc: "Refreshing watermelon real fruit juice chews." },
  { file: "image11.jpeg", title: "Mapro Frubbles Strawberry Real Fruit Pouch 180gm", price: 176, mrp: 220, desc: "Juicy Mahabaleshwar strawberry real fruit chews." },
  { file: "image12.jpeg", title: "Mapro Frubbles Green Apple Real Fruit Pouch 180gm", price: 176, mrp: 220, desc: "Tangy green apple chewy fruit bites pouch." },

  // Photo 3: Fruba 450gm & Falero 1kg (Mapro ₹225/300/756 + ₹5 = ₹230/305/761)
  { file: "image0.jpeg", title: "Falero Fruba Strawberry Real Fruit Chews 450gm", price: 305, mrp: 380, desc: "Large 450gm jar of luscious strawberry fruit chews." },
  { file: "image1.jpeg", title: "Falero Fruity Assorted Real Fruit Chews 400gm", price: 230, mrp: 290, desc: "Assorted fruity chews featuring mango, strawberry, and guava." },
  { file: "image13.jpeg", title: "Falero Fruba Mango Real Fruit Chews 450gm", price: 305, mrp: 380, desc: "Rich Alphonso mango fruit chews in a 450gm pack." },
  { file: "image14.jpeg", title: "Falero Assorted Real Fruit Chews Gift Pack 1kg", price: 761, mrp: 950, desc: "Grand 1kg mega pack containing 6 assorted Falero fruit chews varieties." },
  { file: "image17.jpeg", title: "Sparky Tamarind Spicy Fruit Chews 240gm", price: 245, mrp: 299, desc: "Tangy tamarind fruit chews with authentic Indian spice kick." },

  // Photo 4: Falero 175gm Standup Pouches (Mapro ₹126 + ₹5 = ₹131)
  { file: "image19.jpeg", title: "Falero Strawberry Real Fruit Pouch 175gm", price: 131, mrp: 160, desc: "Authentic Mahabaleshwar strawberry pulp fruit chews." },
  { file: "image20.jpeg", title: "Falchoos Chewy Fruit Bites Pouch 180gm", price: 131, mrp: 160, desc: "Fun chewy fruit bites pouch made with real fruit pulp." },
  { file: "image21.jpeg", title: "Falero Jamun Real Fruit Pouch 175gm", price: 131, mrp: 160, desc: "Exotic black jamun real fruit pulp chews." },
  { file: "image22.jpeg", title: "Falero Qubes Assorted Fruit Candy Box 250gm", price: 131, mrp: 160, desc: "Bite-sized fruity qubes made from real fruit juice." },
  { file: "image23.jpeg", title: "Falero Tamarind Real Fruit Pouch 175gm", price: 131, mrp: 160, desc: "Tangy sweet & sour tamarind real fruit pulp chews." },
  { file: "image24.jpeg", title: "Falero Mango Real Fruit Pouch 175gm", price: 131, mrp: 160, desc: "Sun-ripened Alphonso mango pulp fruit chews." },
  { file: "image25.jpeg", title: "Falero Guava Real Fruit Pouch 175gm", price: 131, mrp: 160, desc: "Pink guava real fruit pulp chews in a 175gm standup pouch." },
  { file: "image28.jpeg", title: "Mapro J-POP Fruit Lollipops Pouch", price: 245, mrp: 299, desc: "Fun assorted real fruit juice lollipops pouch." },
  { file: "image29.jpeg", title: "Falero Raw Mango Katcha Aam Pouch 175gm", price: 131, mrp: 160, desc: "Zesty raw green mango katcha aam fruit chews." },

  // Special Canister & Gift Box Items (+ ₹5 Rule & User Overrides)
  { file: "image41.jpeg", title: "Matte Black Truffle Roasted Makhana Canister", price: 311, mrp: 399, desc: "Sleek matte black airtight canister filled with black truffle oil infused gourmet makhana." },
  { file: "image13.jpeg", title: "MAKHANA Royal White & Purple Luxury Gift Box", price: 704, mrp: 850, desc: "Regal white and gold gift box packed with premium saffron and ghee roasted makhana." },
  { file: "IMG_4009.WEBP", title: "MAKHANA Gourmet Flavored Fox Nuts Trio Pack", price: 354, mrp: 450, desc: "Artisanal roasted Makhana in three signature flavors — Creamy Cheese, Spicy Peri Peri, and Minty Pudina." },
  { file: "IMG_4004.WEBP", title: "MAKHANA Roasted Lotus Seeds Assorted Gift Set", price: 454, mrp: 550, desc: "Premium handpicked lotus seeds slow-roasted with desi ghee and aromatic Indian spices." },
  { file: "IMG_4010.WEBP", title: "MAKHANA Tangy Tomato & Salted Fox Nuts Pouch Set", price: 304, mrp: 380, desc: "Crispy roasted fox nuts infused with tangy sun-dried tomato and sea salt flavor." },
  { file: "IMG_4012.WEBP", title: "MAKHANA Bold Peri Peri Roasted Lotus Seeds", price: 254, mrp: 320, desc: "Spicy and bold Peri Peri seasoned makhana for a fiery yet healthy guilt-free crunch." }
];

// Helper to generate unique descriptions and names dynamically if we run out of list items
function generateProductInfo(category, index, fileName) {
  if (category === "Flowers") {
    const found = flowersData.find(f => f.file && fileName && f.file.toLowerCase() === fileName.toLowerCase());
    if (found) return found;
    const item = flowersData[index % flowersData.length];
    return {
      ...item,
      title: `${item.title} (Variant ${index + 1})`
    };
  }

  if (category === "Toys") {
    const found = toysData.find(t => t.file && fileName && t.file.toLowerCase() === fileName.toLowerCase());
    if (found) return found;
    return {
      title: `Cuddly Cotton Teddy ${index + 1}`,
      desc: "A soft fluffy cotton teddy bear designed for cozy hugs.",
      price: 2600 + (index * 200),
      mrp: 3499 + (index * 200)
    };
  }

  if (category === "Chocolates") {
    const found = sweetsData.find(s => s.file && fileName && s.file.toLowerCase() === fileName.toLowerCase());
    if (found) return found;
    const item = sweetsData[index % sweetsData.length];
    return {
      ...item,
      title: `${item.title} (Pack ${index + 1})`
    };
  }

  if (category === "Healthy Sweets") {
    const found = healthySweetsData.find(s => s.file && fileName && s.file.toLowerCase() === fileName.toLowerCase());
    if (found) return found;
    const item = healthySweetsData[index % healthySweetsData.length];
    return {
      ...item,
      title: `${item.title} (Variant ${index + 1})`
    };
  }

  return {
    title: `Alaira Gift Pack ${index + 1}`,
    desc: "A premium handcrafted item designed with extreme attention to detail.",
    price: 899,
    mrp: 1299
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
    { name: "Priya Sharma", email: "priya@example.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
    { name: "Rahul Patel", email: "rahul@example.com", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    { name: "Ananya Singh", email: "ananya@example.com", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" }
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

  const publicPath = path.join(__dirname, "../../frontend from emergent/public");
  const categoriesList = [
    { folder: "toys", category: "Toys" },
    { folder: "flowers", category: "Flowers" },
    { folder: "sweets", category: "Chocolates" },
    { folder: "healthy-sweets", category: "Healthy Sweets" }
  ];

  const productsToInsert = [];

  let globalIndex = 0;
  for (const cat of categoriesList) {
    const dirPath = path.join(publicPath, cat.folder);
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory does not exist: ${dirPath}`);
      continue;
    }

    let files = fs.readdirSync(dirPath).filter(file => /\.(jpe?g|png|webp)$/i.test(file));
    console.log(`Found ${files.length} images in ${cat.folder}`);

    files.forEach((file, index) => {
      const info = generateProductInfo(cat.category, index, file);
      const relativeUrl = `/${cat.folder}/${file}`;
      const slug = (info.title + "-" + file + "-" + globalIndex + "-" + Math.random().toString(36).substring(2, 6))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const discountPrice = info.price;
      const basePrice = info.mrp || Math.round(info.price * 1.35);

      const imageMediaObj = {
        url: relativeUrl,
        publicId: `${cat.folder}_img_${index}`,
        order: 0,
        resourceType: "image"
      };

      const reviews = [];
      if (index === 0 || index === 2) {
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
        featured: index < 4,
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
