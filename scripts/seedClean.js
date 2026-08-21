require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Product = require("../models/Product");

const MONGODB_URI = process.env.MONGODB_URI;

const slugify = (value) =>
  String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const makeProduct = (idx, data) => {
  const slug = slugify(data.title) + "-" + (idx + 1);
  return {
    title: data.title,
    slug,
    description: data.description,
    descriptionSections: data.description,
    shortDescription: data.shortDescription || data.description,
    declaration: "Certified Authentic Alaira Premium Quality Gift.",
    shippingReturns: "Ships within 24-48 hours. Returns accepted within 14 days under original wrapper conditions.",
    faqs: [
      { question: "Is this wrapped ready for gifting?", answer: "Yes, every Alaira order comes with our signature presentation wrap and a blank matching greeting card." }
    ],
    price: data.price,
    discountPrice: data.discountPrice,
    category: data.category,
    subCategory: data.subCategory || "",
    fabric: data.fabric || "",
    occasion: data.occasion || "",
    color: data.color || "",
    stock: data.stock || 20,
    sizes: [],
    colors: [],
    tags: [data.category.toLowerCase()],
    featured: data.featured || false,
    isActive: true,
    displayOrder: idx + 1,
    images: [{ url: data.image, publicId: data.image, order: 0, altText: data.title, resourceType: "image", format: "", mimeType: "" }],
    mainImage: { url: data.image, publicId: data.image, order: 0, altText: data.title, resourceType: "image", format: "", mimeType: "" },
    videos: [],
    media: {
      frontImage: { url: data.image, publicId: data.image, order: 0, altText: data.title, resourceType: "image", format: "", mimeType: "" },
      backImage: null,
      sideImage: null,
      hoverImage: null,
      thumbnail: { url: data.image, publicId: data.image, order: 0, altText: data.title, resourceType: "image", format: "", mimeType: "" },
      sizeChart: null,
      galleryImages: [],
      videos: []
    },
    thumbnail: { url: data.image, publicId: data.image, resourceType: "image" },
    variants: [],
    ratings: { average: data.rating || 4.8, count: data.reviewCount || 50 },
    reviews: [],
  };
};

const products = [
  // ──────────── FLOWERS (12) ────────────
  { title: "Crimson Velvet Rose Bouquet", price: 2499, discountPrice: 1999, category: "Flowers", image: "/flowers/IMG_4930.PNG", description: "A premium hand-tied bouquet of fresh crimson velvet roses wrapped in luxury pastel parchment and tied with a silk satin ribbon. Perfect for anniversaries and romantic gestures.", occasion: "Anniversary", color: "Crimson Red", fabric: "Fresh Cut Velvet Roses", featured: true, rating: 4.9, reviewCount: 124 },
  { title: "Blush Pink Hydrangea Dreams", price: 3999, discountPrice: 2999, category: "Flowers", image: "/flowers/IMG_4931.PNG", description: "Gorgeous luxury bouquet of soft pink hydrangeas and baby's breath, packaged in signature Alaira wrapping. A dreamy arrangement for celebrating love.", occasion: "Birthday", color: "Pastel Pink", fabric: "Fresh Flowers", rating: 4.8, reviewCount: 87 },
  { title: "Eternal Preserved Golden Rose", price: 4499, discountPrice: 3499, category: "Flowers", image: "/flowers/IMG_4933.PNG", description: "A real rose preserved at peak bloom and dipped in 24K gold accents. Lasts a lifetime — just like your love. Comes in a luxury velvet box.", occasion: "Anniversary", color: "Gold", fabric: "Preserved Real Rose", rating: 5.0, reviewCount: 156 },
  { title: "Grand Celebration Flower Basket", price: 3299, discountPrice: 2499, category: "Flowers", image: "/flowers/IMG_4948.PNG", description: "An opulent wicker basket overflowing with fresh seasonal flowers — roses, lilies, and carnations — arranged by expert florists.", occasion: "Congratulations", color: "Multi", fabric: "Fresh Seasonal Flowers", featured: true, rating: 4.9, reviewCount: 98 },
  { title: "Royal White Lily Deluxe", price: 3599, discountPrice: 2799, category: "Flowers", image: "/flowers/IMG_4949.PNG", description: "An elegant arrangement of pristine white lilies symbolizing purity and devotion. Wrapped in matte white and gold foil paper.", occasion: "Wedding", color: "White", fabric: "Fresh White Lilies", rating: 4.7, reviewCount: 65 },
  { title: "Enchanted Garden Mix", price: 2399, discountPrice: 1899, category: "Flowers", image: "/flowers/IMG_4950.PNG", description: "A vibrant mix of garden-fresh wildflowers, sunflowers, and daisies bundled in a rustic kraft wrap. Sunshine in a bouquet.", occasion: "Just Because", color: "Multi", fabric: "Fresh Wildflowers", rating: 4.8, reviewCount: 72 },
  { title: "Sunset Tulip Harmony", price: 2899, discountPrice: 2299, category: "Flowers", image: "/flowers/IMG_4951.PNG", description: "Warm-toned tulips in shades of sunset orange, coral, and peach. A cheerful and sophisticated arrangement for someone special.", occasion: "Birthday", color: "Orange & Coral", fabric: "Fresh Tulips", rating: 4.6, reviewCount: 54 },
  { title: "Eternal Orchid & Rose Splendor", price: 4199, discountPrice: 3299, category: "Flowers", image: "/flowers/IMG_4954.PNG", description: "A stunning combination of exotic white orchids and premium red roses. The ultimate luxury floral statement for milestone celebrations.", occasion: "Anniversary", color: "White & Red", fabric: "Orchids & Roses", featured: true, rating: 4.9, reviewCount: 112 },
  { title: "Velvet Red Heart Bouquet", price: 2299, discountPrice: 1799, category: "Flowers", image: "/flowers/IMG_4955.PNG", description: "Deep red roses arranged in a heart-shaped formation, wrapped in soft velvet paper with a satin bow. Pure romance delivered.", occasion: "Valentine's Day", color: "Deep Red", fabric: "Fresh Red Roses", rating: 4.8, reviewCount: 89 },
  { title: "Sweet Carnation & Pink Rose Bunch", price: 1999, discountPrice: 1599, category: "Flowers", image: "/flowers/IMG_4956.PNG", description: "A gentle bunch of soft pink carnations paired with blush roses. Sweet, delicate, and perfect for expressing affection.", occasion: "Thank You", color: "Soft Pink", fabric: "Carnations & Roses", rating: 4.7, reviewCount: 63 },
  { title: "Imperial Pastel Luxury Bloom Basket", price: 4999, discountPrice: 3899, category: "Flowers", image: "/flowers/IMG_4958.PNG", description: "Our grandest floral masterpiece — a curated selection of premium pastel blooms arranged in a hand-crafted imperial gift basket.", occasion: "Wedding", color: "Pastel Mix", fabric: "Premium Mixed Blooms", rating: 5.0, reviewCount: 78 },
  { title: "Pure Elegance White Rose Bouquet", price: 2799, discountPrice: 2199, category: "Flowers", image: "/flowers/IMG_4959.PNG", description: "Timeless white roses symbolizing new beginnings and pure love. Expertly arranged and wrapped in our signature ivory tissue.", occasion: "Wedding", color: "White", fabric: "Fresh White Roses", rating: 4.8, reviewCount: 91 },

  // ──────────── TOYS (25) ────────────
  { title: "5-Feet Giant Pink Plush Bear", price: 9999, discountPrice: 7000, category: "Toys", image: "/toys/IMG_4912.PNG", description: "Five feet of pure fluff, love, and cuddles! Extra-large huggable plush bear made with organic cloud cotton. The ultimate surprise gift.", occasion: "Birthday", color: "Blush Pink", fabric: "Soft Plush", featured: true, rating: 4.9, reviewCount: 89 },
  { title: "5-Feet Giant Cream Plush Bear", price: 9999, discountPrice: 7000, category: "Toys", image: "/toys/IMG_4913.PNG", description: "An enormous cream-colored plush bear standing at 5 feet tall. Premium quality stuffing makes it incredibly soft and huggable.", occasion: "Birthday", color: "Cream", fabric: "Soft Plush", rating: 4.9, reviewCount: 76 },
  { title: "2-Feet Cozy Cream Teddy Bear", price: 3999, discountPrice: 2899, category: "Toys", image: "/toys/IMG_4914.PNG", description: "A perfectly sized 2-feet cream teddy bear with a温柔 smile and soft velvet paws. Ideal desk or bed companion.", occasion: "Anniversary", color: "Cream", fabric: "Velvet Plush", rating: 4.7, reviewCount: 64 },
  { title: "Fluffy Lavender Bear Pencil Pouch", price: 1199, discountPrice: 799, category: "Toys", image: "/toys/IMG_4916.PNG", description: "An adorable lavender-colored bear that doubles as a pencil pouch! Soft, fluffy, and functional — perfect for students.", occasion: "Just Because", color: "Lavender", fabric: "Fluffy Plush", rating: 4.6, reviewCount: 45 },
  { title: "2-Feet Cuddly Penguin Plushie", price: 3999, discountPrice: 2999, category: "Toys", image: "/toys/IMG_4917.PNG", description: "An adorable 2-feet tall penguin plushie with a soft belly and sweet embroidered eyes. The cutest waddle buddy.", occasion: "Birthday", color: "Black & White", fabric: "Premium Plush", rating: 4.8, reviewCount: 72 },
  { title: "3-Feet Cuddly Penguin Plushie", price: 4999, discountPrice: 3999, category: "Toys", image: "/toys/IMG_4919.PNG", description: "Our jumbo 3-feet penguin plushie — bigger hugs, bigger smiles. Ultra-soft with weighted bottom for sitting upright.", occasion: "Birthday", color: "Black & White", fabric: "Premium Plush", rating: 4.9, reviewCount: 58 },
  { title: "4-Feet Giant Fluffy Teddy Bear", price: 7999, discountPrice: 6000, category: "Toys", image: "/toys/IMG_4920.PNG", description: "A magnificent 4-feet fluffy teddy bear in classic golden brown. Huggable, lovable, and impossible to resist.", occasion: "Anniversary", color: "Golden Brown", fabric: "Fluffy Plush", featured: true, rating: 4.9, reviewCount: 103 },
  { title: "Dramatic Cuddly Goose Pillow", price: 3499, discountPrice: 2600, category: "Toys", image: "/toys/IMG_4921.PNG", description: "A hilarious and huggable goose-shaped pillow with dramatic facial expression. Soft, squishy, and guaranteed to make you smile.", occasion: "Just Because", color: "White", fabric: "Memory Foam Plush", rating: 4.7, reviewCount: 88 },
  { title: "3-Feet Fluffy Giant Kitty Plush", price: 4999, discountPrice: 3799, category: "Toys", image: "/toys/IMG_4924.PNG", description: "An oversized fluffy kitty cat plush with soft whiskers, embroidered paws, and a curly tail. Purr-fect for cat lovers.", occasion: "Birthday", color: "Grey", fabric: "Ultra-Soft Plush", rating: 4.8, reviewCount: 67 },
  { title: "3-Feet Giant Sweet Dream Bunny", price: 4500, discountPrice: 3500, category: "Toys", image: "/toys/IMG_4925.PNG", description: "A dreamy 3-feet bunny plush with floppy ears and the softest cotton body. Designed for the sweetest dreams.", occasion: "Birthday", color: "Soft White", fabric: "Cotton Plush", rating: 4.8, reviewCount: 54 },
  { title: "Cozy Bunny Hot Water Bag Comfort Pack", price: 799, discountPrice: 499, category: "Toys", image: "/toys/IMG_4927.PNG", description: "A cute bunny-shaped hot water bag with a removable plush cover. Provides warmth and comfort during cold nights.", occasion: "Get Well Soon", color: "Pink", fabric: "Plush & Rubber", rating: 4.6, reviewCount: 38 },
  { title: "Twin Magnetic Love Pandas", price: 3899, discountPrice: 2899, category: "Toys", image: "/toys/IMG_4928.PNG", description: "Two adorable panda plushies with built-in magnets — when placed close together, they hug each other! The perfect couple gift.", occasion: "Anniversary", color: "Black & White", fabric: "Premium Plush", featured: true, rating: 4.9, reviewCount: 145 },
  { title: "Sleepy Cloud Cotton Cuddle Pillow", price: 3200, discountPrice: 2600, category: "Toys", image: "/toys/IMG_4929.PNG", description: "A cloud-shaped cotton cuddle pillow with a sleepy face design. Ultra-soft filling makes it the perfect nap companion.", occasion: "Just Because", color: "White", fabric: "Cotton Fill", rating: 4.7, reviewCount: 42 },
  { title: "Cuddly Cotton Teddy 14", price: 6099, discountPrice: 5200, category: "Toys", image: "/toys/IMG_4960.PNG", description: "Premium handcrafted cotton teddy bear with embroidered features and a satin bow. Classic elegance meets cuddly comfort.", occasion: "Birthday", color: "Honey Brown", fabric: "Organic Cotton", rating: 4.8, reviewCount: 35 },
  { title: "Cuddly Cotton Teddy 15", price: 6299, discountPrice: 5400, category: "Toys", image: "/toys/IMG_4961.PNG", description: "A beautifully crafted cotton teddy bear with soft fur and a gentle expression. Each one is uniquely handstitched.", occasion: "Birthday", color: "Light Brown", fabric: "Organic Cotton", rating: 4.8, reviewCount: 29 },
  { title: "Cuddly Cotton Teddy 16", price: 6499, discountPrice: 5600, category: "Toys", image: "/toys/IMG_4962.PNG", description: "Premium cotton teddy bear with luxurious soft fur and a charming personality. A keepsake gift for special occasions.", occasion: "Anniversary", color: "Caramel", fabric: "Organic Cotton", rating: 4.9, reviewCount: 31 },
  { title: "Cuddly Cotton Teddy 17", price: 6699, discountPrice: 5800, category: "Toys", image: "/toys/IMG_4963.PNG", description: "Elegantly designed cotton teddy bear with premium stitching and ultra-soft fill. A timeless gift of love.", occasion: "Anniversary", color: "Toffee", fabric: "Organic Cotton", rating: 4.8, reviewCount: 27 },
  { title: "Cuddly Cotton Teddy 18", price: 6899, discountPrice: 6000, category: "Toys", image: "/toys/IMG_4964.PNG", description: "Large premium cotton teddy bear with a warm smile and the softest embrace. Made with love, for love.", occasion: "Birthday", color: "Dark Honey", fabric: "Organic Cotton", rating: 4.9, reviewCount: 33 },
  { title: "Cuddly Cotton Teddy 19", price: 7099, discountPrice: 6200, category: "Toys", image: "/toys/IMG_4966.PNG", description: "Our premium cotton teddy collection's finest — extra-large, extra-soft, and extra-lovable. The ultimate cuddle buddy.", occasion: "Anniversary", color: "Warm Brown", fabric: "Organic Cotton", rating: 4.9, reviewCount: 36 },
  { title: "Cuddly Cotton Teddy 20", price: 7299, discountPrice: 6400, category: "Toys", image: "/toys/IMG_4967.PNG", description: "A majestic cotton teddy bear with premium quality fur and hand-stitched details. Gift-wrapped in our signature box.", occasion: "Birthday", color: "Chocolate", fabric: "Organic Cotton", rating: 4.8, reviewCount: 24 },
  { title: "Cuddly Cotton Teddy 21", price: 7499, discountPrice: 6600, category: "Toys", image: "/toys/pdf_img_1.jpg", description: "Luxurious oversized cotton teddy bear with a satin ribbon and embroidered heart paw. The softest companion.", occasion: "Valentine's Day", color: "Soft Brown", fabric: "Organic Cotton", rating: 4.9, reviewCount: 28 },
  { title: "Cuddly Cotton Teddy 22", price: 7699, discountPrice: 6800, category: "Toys", image: "/toys/pdf_img_2.jpg", description: "Handcrafted premium teddy bear with the plushest cotton fur. Each bear has a unique personality and charm.", occasion: "Birthday", color: "Mocha", fabric: "Organic Cotton", rating: 4.8, reviewCount: 22 },
  { title: "Cuddly Cotton Teddy 23", price: 7899, discountPrice: 7000, category: "Toys", image: "/toys/pdf_img_3.jpg", description: "Extra-large cotton teddy bear with ultra-premium stuffing that holds its shape beautifully. A forever friend.", occasion: "Anniversary", color: "Espresso", fabric: "Organic Cotton", rating: 4.9, reviewCount: 26 },
  { title: "Cuddly Cotton Teddy 24", price: 8099, discountPrice: 7200, category: "Toys", image: "/toys/pdf_img_4.jpg", description: "The grandest teddy in our collection — premium cotton, hand-stitched, and designed to last a lifetime of cuddles.", occasion: "Wedding", color: "Rich Brown", fabric: "Organic Cotton", rating: 4.9, reviewCount: 30 },
  { title: "Cuddly Cotton Teddy 25", price: 8299, discountPrice: 7400, category: "Toys", image: "/toys/pdf_img_5.jpg", description: "Our ultimate collector's teddy bear — the largest, softest, and most luxurious bear in the entire Alaira collection.", occasion: "Wedding", color: "Dark Cocoa", fabric: "Organic Cotton", rating: 5.0, reviewCount: 34 },

  // ──────────── SWEETS / CHOCOLATES (5) ────────────
  { title: "Whole Raisins Coated with Fine Milk Chocolate 100gm", price: 399, discountPrice: 302, category: "Chocolates", image: "/sweets/IMG_4050.WEBP", description: "Plump juicy raisins enrobed in creamy fine milk chocolate. A delightful sweet treat for chocolate connoisseurs.", occasion: "Just Because", color: "Rich Brown", fabric: "Gourmet Cocoa", rating: 4.8, reviewCount: 110 },
  { title: "White Chocolate With Kesar, Badam And Pista Bar 50gm", price: 249, discountPrice: 203, category: "Chocolates", image: "/sweets/IMG_4054.JPG.jpeg", description: "Luxurious white chocolate bar infused with real saffron (kesar), roasted almonds, and pistachios. An Indian-fusion delicacy.", occasion: "Festival", color: "Cream Gold", fabric: "Premium White Chocolate", rating: 4.9, reviewCount: 85 },
  { title: "Mazaana Badam And Pista Bar 50gm", price: 249, discountPrice: 203, category: "Chocolates", image: "/sweets/IMG_4056.JPG.jpeg", description: "Rich milk chocolate studded with generous chunks of roasted almonds and pistachios. Crunchy, creamy, and irresistible.", occasion: "Just Because", color: "Milk Brown", fabric: "Milk Chocolate & Nuts", rating: 4.7, reviewCount: 72 },
  { title: "Dark Chocolate Caramelized Almond Crunch 50gm", price: 249, discountPrice: 203, category: "Chocolates", image: "/sweets/IMG_4057.JPG.jpeg", description: "Rich 50gm Belgian dark chocolate bar studded with roasted caramelized almond crunch. A bittersweet masterpiece.", occasion: "Anniversary", color: "Dark Cocoa", fabric: "Belgian Dark Chocolate", rating: 4.8, reviewCount: 95 },
  { title: "Dark Chocolate Caramelized Almond Crunch 50gm Pack", price: 249, discountPrice: 203, category: "Chocolates", image: "/sweets/IMG_4059.JPG.jpeg", description: "Value pack of our bestselling dark chocolate caramelized almond crunch bars. Perfect for sharing or gifting.", occasion: "Party", color: "Dark Cocoa", fabric: "Belgian Dark Chocolate", rating: 4.7, reviewCount: 68 },

  // ──────────── HEALTHY SWEETS (39) ────────────
  { title: "Falero Fruba Strawberry Real Fruit Chews 450gm", price: 380, discountPrice: 305, category: "Healthy Sweets", image: "/healthy-sweets/IMG_3999.WEBP", description: "Real strawberry fruit chews made with natural fruit pulp. No artificial colors or flavors. 450gm family pack.", occasion: "Everyday", color: "Strawberry Red", fabric: "Real Fruit" },
  { title: "Falero Fruity Assorted Real Fruit Chews 400gm", price: 290, discountPrice: 230, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4004.WEBP", description: "An assorted mix of real fruit chews in strawberry, mango, and guava flavors. 400gm pack of pure fruity goodness.", occasion: "Party", color: "Multi", fabric: "Real Fruit" },
  { title: "Mapro Frubbles Strawberry Real Fruit Pouch 180gm", price: 220, discountPrice: 176, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4009.WEBP", description: "Premium Mapro Frubbles made with real strawberry pulp. Soft, chewy, and bursting with natural fruit flavor.", occasion: "Everyday", color: "Strawberry Pink", fabric: "Real Fruit Pulp" },
  { title: "Mapro Frubbles Green Apple Real Fruit Pouch 180gm", price: 220, discountPrice: 176, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4010.WEBP", description: "Tangy green apple Frubbles from Mapro. Made with real apple pulp for an authentic fruity taste experience.", occasion: "Everyday", color: "Green", fabric: "Real Fruit Pulp" },
  { title: "Falero Fruba Mango Real Fruit Chews 450gm", price: 380, discountPrice: 305, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4011.WEBP", description: "Sweet mango flavored real fruit chews. Made with Alphonso mango pulp for an authentic taste of India.", occasion: "Summer", color: "Mango Yellow", fabric: "Real Fruit" },
  { title: "Falero Assorted Real Fruit Chews Gift Pack 1kg", price: 950, discountPrice: 761, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4012.WEBP", description: "Grand 1kg gift pack of assorted real fruit chews. Includes strawberry, mango, mixed fruit, and guava flavors.", occasion: "Festival", color: "Multi", fabric: "Real Fruit", featured: true },
  { title: "Matte Black Chocolate Chunk Cookie Canister", price: 399, discountPrice: 311, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4013.WEBP", description: "Premium dark chocolate chunk cookies in an elegant matte black canister. Crunchy, chocolatey, and addictive.", occasion: "Tea Time", color: "Matte Black", fabric: "Oats & Dark Chocolate" },
  { title: "Sparky Tamarind Spicy Fruit Chews 240gm", price: 299, discountPrice: 245, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4014.WEBP", description: "Tangy and spicy tamarind fruit chews with a kick of chili. A bold Indian street food inspired snack.", occasion: "Snack", color: "Tamarind Brown", fabric: "Real Tamarind" },
  { title: "Falero Strawberry Real Fruit Pouch 175gm", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4015.WEBP", description: "Compact pouch of real strawberry fruit chews. Perfect for on-the-go snacking with natural fruit goodness.", occasion: "Everyday", color: "Strawberry Red", fabric: "Real Fruit" },
  { title: "Sparky Guava Spicy Fruit Chews 240gm", price: 299, discountPrice: 245, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4016.WEBP", description: "Guava-flavored spicy fruit chews with a perfect balance of sweet, tangy, and spicy flavors.", occasion: "Snack", color: "Guava Green", fabric: "Real Fruit" },
  { title: "Falchoos Chewy Fruit Bites Pouch 180gm", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4017.WEBP", description: "Soft and chewy fruit bite pieces in assorted tropical flavors. A guilt-free healthy snack for all ages.", occasion: "Everyday", color: "Multi", fabric: "Real Fruit Bites" },
  { title: "Falero Jamun Real Fruit Pouch 175gm", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4018.WEBP", description: "Unique jamun (black plum) flavored fruit chews. A distinctly Indian taste in a convenient pouch.", occasion: "Everyday", color: "Deep Purple", fabric: "Real Jamun" },
  { title: "Falero Qubes Assorted Fruit Candy Box 250gm", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4019.WEBP", description: "Neatly cut fruit candy cubes in assorted flavors. Perfect for sharing at parties and gatherings.", occasion: "Party", color: "Multi", fabric: "Real Fruit Candy" },
  { title: "Falero Tamarind Real Fruit Pouch 175gm", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4020.WEBP", description: "Tangy tamarind real fruit chews in a compact pouch. Bold, sour, and utterly addictive.", occasion: "Snack", color: "Brown", fabric: "Real Tamarind" },
  { title: "Falero Mango Real Fruit Pouch 175gm", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4021.WEBP", description: "Sweet mango flavored fruit chews made with real mango pulp. A tropical delight in every bite.", occasion: "Summer", color: "Mango Yellow", fabric: "Real Mango" },
  { title: "Falero Guava Real Fruit Pouch 175gm", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4022.WEBP", description: "Fresh guava flavored real fruit chews. Natural fruit goodness packed in a convenient snack pouch.", occasion: "Everyday", color: "Guava Green", fabric: "Real Guava" },
  { title: "Mapro J-POP Fruit Lollipops Pouch", price: 299, discountPrice: 245, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4023.WEBP", description: "Assorted fruit-flavored lollipops from Mapro. Made with real fruit juice and natural colors.", occasion: "Kids", color: "Multi", fabric: "Real Fruit Juice" },
  { title: "Falero Raw Mango Katcha Aam Pouch 175gm", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4024.WEBP", description: "Raw mango flavored chews for those who love the tangy taste of katcha aam. Bold and refreshing.", occasion: "Summer", color: "Raw Green", fabric: "Real Raw Mango" },
  { title: "Falero Strawberry Real Fruit Pouch 175gm (Large)", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4025.WEBP", description: "Premium strawberry fruit chews in a generous pouch. Sweet, juicy, and made with real strawberry extract.", occasion: "Everyday", color: "Strawberry Red", fabric: "Real Fruit" },
  { title: "Falchoos Chewy Fruit Bites Pouch 180gm (Tropical)", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4026.WEBP", description: "Tropical flavor chewy fruit bites with a mix of mango, pineapple, and passion fruit flavors.", occasion: "Everyday", color: "Tropical Mix", fabric: "Real Fruit Bites" },
  { title: "Falero Jamun Real Fruit Pouch 175gm (Premium)", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4027.WEBP", description: "Premium jamun fruit chews made with real Indian black plum extract. Rich, tangy, and authentic.", occasion: "Festival", color: "Deep Purple", fabric: "Real Jamun" },
  { title: "Mapro Frubbles Guava Real Fruit Pouch 180gm", price: 220, discountPrice: 176, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4028.WEBP", description: "Premium Mapro Frubbles in guava flavor. Made with real guava pulp for an authentic fruity taste.", occasion: "Everyday", color: "Guava Pink", fabric: "Real Fruit Pulp" },
  { title: "Falero Qubes Assorted Fruit Candy Box 250gm (Party)", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4029.WEBP", description: "Party-sized box of assorted fruit candy cubes. Great for celebrations, events, and gifting.", occasion: "Party", color: "Multi", fabric: "Real Fruit Candy" },
  { title: "Falero Raw Mango Katcha Aam Pouch 175gm (Tangy)", price: 160, discountPrice: 131, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4032.WEBP", description: "Extra tangy raw mango chews for those who love intense flavors. Made with real katcha aam extract.", occasion: "Summer", color: "Raw Green", fabric: "Real Raw Mango" },
  { title: "Snackery Butter Coconut Cookies 150gm", price: 399, discountPrice: 302, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4033.WEBP", description: "Crispy butter cookies with real coconut flakes. Baked to golden perfection with premium ingredients.", occasion: "Tea Time", color: "Golden", fabric: "Butter & Coconut" },
  { title: "Snackery Butter Classic Cookie Coin 150gm", price: 399, discountPrice: 302, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4034.WEBP", description: "Classic round butter cookies with a rich, melt-in-your-mouth texture. A timeless tea-time companion.", occasion: "Tea Time", color: "Golden", fabric: "Premium Butter" },
  { title: "Snackery Choco Chip Cookie Coin 150gm", price: 399, discountPrice: 302, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4035.WEBP", description: "Loaded with real chocolate chips in a crispy butter cookie base. Every bite is a chocolate lover's dream.", occasion: "Tea Time", color: "Brown & Cream", fabric: "Butter & Chocolate Chips" },
  { title: "Snackery Oats Jaggery Cookie Coin 150gm", price: 399, discountPrice: 302, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4036.WEBP", description: "Healthy oats cookies sweetened with organic jaggery. Crunchy, wholesome, and guilt-free snacking.", occasion: "Health", color: "Brown", fabric: "Oats & Jaggery" },
  { title: "Snackery Butter Cashew Nut Cookies 150gm", price: 399, discountPrice: 302, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4037.WEBP", description: "Premium butter cookies loaded with whole roasted cashew nuts. Rich, nutty, and utterly delicious.", occasion: "Tea Time", color: "Golden", fabric: "Butter & Cashew" },
  { title: "Snackery Coffee Cookie Coin 150gm", price: 399, discountPrice: 302, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4038.WEBP", description: "Coffee-infused butter cookies with a rich espresso aroma. Perfect for coffee lovers and evening snacking.", occasion: "Tea Time", color: "Coffee Brown", fabric: "Butter & Coffee" },
  { title: "MAKHANA Royal White & Purple Luxury Gift Box", price: 850, discountPrice: 704, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4039.WEBP", description: "Premium roasted makhana presented in an elegant white and purple luxury gift box. Himalayan pink salt flavor.", occasion: "Festival", color: "Royal White & Purple", fabric: "Roasted Lotus Seeds", featured: true },
  { title: "MAKHANA Gourmet Flavored Fox Nuts Trio Pack", price: 450, discountPrice: 354, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4040.WEBP", description: "Three flavors of gourmet roasted fox nuts — salted, pepper, and herb. A trio of healthy crunch.", occasion: "Gifting", color: "Multi", fabric: "Roasted Lotus Seeds" },
  { title: "MAKHANA Roasted Lotus Seeds Assorted Gift Set", price: 550, discountPrice: 454, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4041.WEBP", description: "Assorted roasted lotus seeds in premium packaging. Rich in protein and fiber — healthy never tasted so good.", occasion: "Gifting", color: "Gold", fabric: "Roasted Lotus Seeds" },
  { title: "MAKHANA Tangy Tomato & Salted Fox Nuts Pouch Set", price: 380, discountPrice: 304, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4042.WEBP", description: "Dual-flavor makhana pouch set with tangy tomato and classic salted varieties. Crunchy and nutritious.", occasion: "Snack", color: "Red & White", fabric: "Roasted Lotus Seeds" },
  { title: "MAKHANA Bold Peri Peri Roasted Lotus Seeds", price: 320, discountPrice: 254, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4043.WEBP", description: "Spicy peri peri flavored roasted makhana for those who love a bold kick. Hot, crunchy, and addictive.", occasion: "Snack", color: "Fiery Red", fabric: "Roasted Lotus Seeds" },
  { title: "Snackery Choco Chip Cookie Coin 150gm (Premium)", price: 399, discountPrice: 302, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4044.WEBP", description: "Premium edition choco chip cookies with Belgian chocolate chunks. Elevated taste for chocolate enthusiasts.", occasion: "Tea Time", color: "Dark Brown", fabric: "Belgian Chocolate Chips" },
  { title: "Snackery Oats Jaggery Cookie Coin 150gm (Organic)", price: 399, discountPrice: 302, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4045.WEBP", description: "Organic oats and jaggery cookies made with whole grain flour. The healthiest treat for conscious snackers.", occasion: "Health", color: "Natural Brown", fabric: "Organic Oats & Jaggery" },
  { title: "Snackery Butter Cashew Nut Cookies 150gm (Deluxe)", price: 399, discountPrice: 302, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4047.WEBP", description: "Deluxe cashew nut cookies with extra butter and whole cashew pieces. Rich, crumbly, and premium.", occasion: "Tea Time", color: "Golden", fabric: "Butter & Premium Cashew" },
  { title: "Snackery Coffee Cookie Coin 150gm (Barista)", price: 399, discountPrice: 302, category: "Healthy Sweets", image: "/healthy-sweets/IMG_4048.WEBP", description: "Barista-blend coffee cookies with a double shot of espresso flavor. For the ultimate coffee cookie experience.", occasion: "Tea Time", color: "Espresso", fabric: "Premium Coffee & Butter" },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Atlas");

    console.log("Deleting all existing products...");
    const deleteResult = await Product.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} products`);

    console.log(`Creating ${products.length} new products...`);
    const docs = products.map((p, i) => makeProduct(i, p));
    const insertResult = await Product.insertMany(docs, { ordered: false });
    console.log(`Inserted ${insertResult.length} products successfully`);

    const finalCount = await Product.countDocuments();
    console.log(`Total products in database: ${finalCount}`);

    console.log("\nCategory breakdown:");
    const cats = await Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    cats.forEach(c => console.log(`  ${c._id}: ${c.count}`));

    console.log("\nSeed complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message);
    if (err.insertedDocs) {
      console.log(`Partial insert: ${err.insertedDocs.length} products were inserted before error`);
    }
    process.exit(1);
  }
}

seed();
