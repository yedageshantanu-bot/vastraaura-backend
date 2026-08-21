const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/Product");

const pdfUpdates = [
  // Page 1: Fluffy Lavender Bear Pencil Pouch
  {
    image: "/toys/IMG_4916.PNG",
    title: "Fluffy Lavender Bear Pencil Pouch",
    price: 1199,
    discountPrice: 799,
    description: "A little bundle of cuteness made for everyday moments! This adorable fluffy lavender bear doubles as a soft toy and a handy pencil pouch—perfect for keeping your favourite pens and little essentials close. A charming gift for birthdays, anniversaries, or simply to make someone smile.",
  },
  // Page 1: 2-Feet Cuddly Penguin Plushie
  {
    image: "/toys/IMG_4917.PNG",
    title: "2-Feet Cuddly Penguin Plushie",
    price: 3999,
    discountPrice: 2999,
    description: "Cute enough to steal your heart and cuddly enough to keep it! This irresistibly fluffy penguin is here to give you all the warm hugs, sweet smiles, and butterflies you didn’t know you needed.",
  },
  // Page 1: 3-Feet Cuddly Penguin Plushie
  {
    image: "/toys/IMG_4919.PNG",
    title: "3-Feet Cuddly Penguin Plushie",
    price: 4999,
    discountPrice: 3999,
    description: "Cute enough to steal your heart and cuddly enough to keep it! This irresistibly fluffy penguin is here to give you all the warm hugs, sweet smiles, and butterflies you didn’t know you needed.",
  },

  // Page 2: 2-Feet Cozy Cream Teddy Bear
  {
    image: "/toys/IMG_4914.PNG",
    title: "2-Feet Cozy Cream Teddy Bear",
    price: 4200,
    discountPrice: 3200,
    description: "Four feet of pure fluff, cuddles, and irresistible charm! This giant teddy is made to steal hearts, become your favourite cuddle buddy, and make every hug feel a little more special.",
  },
  // Page 2: 4-Feet Giant Fluffy Teddy Bear
  {
    image: "/toys/IMG_4920.PNG",
    title: "4-Feet Giant Fluffy Teddy Bear",
    price: 7999,
    discountPrice: 6000,
    description: "Four feet of pure fluff, cuddles, and irresistible charm! This giant teddy is made to steal hearts, become your favourite cuddle buddy, and make every hug feel a little more special.",
  },

  // Page 2: Dramatic Cuddly Goose Pillow
  {
    image: "/toys/IMG_4921.PNG",
    title: "Dramatic Cuddly Goose Pillow",
    price: 3499,
    discountPrice: 2600,
    description: "Long, fluffy, and impossible to resist—this adorable goose is ready to steal your heart and become your favourite cuddle partner. Soft enough to hug, cute enough to make you smile, and just a little bit dramatic… because your new crush deserves attention too.",
  },

  // Page 3: 2-Feet Fluffy Kitty Cat Plush
  {
    image: "/toys/IMG_4929.PNG",
    title: "2-Feet Fluffy Kitty Cat Plush",
    price: 3200,
    discountPrice: 2600,
    description: "Three feet of pure cuteness, fluff, and cuddles! This giant kitty is soft, huggable, and ready to become your favourite cuddle buddy. With those adorable eyes and irresistibly fluffy paws, how could you possibly say no?",
  },
  // Page 3: 3-Feet Fluffy Giant Kitty Plush
  {
    image: "/toys/IMG_4924.PNG",
    title: "3-Feet Fluffy Giant Kitty Plush",
    price: 4999,
    discountPrice: 3799,
    description: "Three feet of pure cuteness, fluff, and cuddles! This giant kitty is soft, huggable, and ready to become your favourite cuddle buddy. With those adorable eyes and irresistibly fluffy paws, how could you possibly say no?",
  },

  // Page 4: 3-Feet Giant Sweet Dream Bunny (Beige/Brown)
  {
    image: "/toys/IMG_4925.PNG",
    title: "3-Feet Giant Sweet Dream Bunny",
    price: 4500,
    discountPrice: 3500,
    description: "Big, fluffy, and impossible to resist! This giant bunny is made for the biggest hugs, sweetest moments, and all the cuddles you’ve been waiting for. Soft, adorable, and always ready to keep you company. Warning: One cuddle and you might never want to let go.",
  },

  // Page 4: 2-Feet Giant Pink Plush Bunny
  {
    image: "/toys/IMG_4913.PNG",
    title: "2-Feet Giant Pink Plush Bunny",
    price: 3999,
    discountPrice: 2899,
    description: "Five feet of pure fluff, love, and cuddles! This giant pink bunny is made to steal hearts with its adorable face, super-soft fur, and extra-large huggable size. The perfect surprise for birthdays, anniversaries, proposals, or simply for someone who deserves a really, really big hug. 🎀💕 Warning: This much cuteness may cause instant obsession.",
  },
  // Page 4: 5-Feet Giant Pink Plush Bear
  {
    image: "/toys/IMG_4912.PNG",
    title: "5-Feet Giant Pink Plush Bear",
    price: 9999,
    discountPrice: 7000,
    description: "Five feet of pure fluff, love, and cuddles! This giant pink bunny is made to steal hearts with its adorable face, super-soft fur, and extra-large huggable size. The perfect surprise for birthdays, anniversaries, proposals, or simply for someone who deserves a really, really big hug. 🎀💕 Warning: This much cuteness may cause instant obsession.",
  },

  // Page 5: Cozy Bunny Hot Water Bag Comfort Pack
  {
    image: "/toys/IMG_4927.PNG",
    title: "Cozy Bunny Hot Water Bag Comfort Pack",
    price: 799,
    discountPrice: 499,
    description: "A Little Love for Her Tough Days 🎀💗\n\nBecause sometimes she doesn’t need a solution—she just needs to feel cared for. Gift her this adorable bunny hot water bag as a sweet little reminder that you’re there for her, even on the not-so-easy days. 🐰\n\nWarm hugs, cozy comfort, and a little piece of your love—all in one cute gift. ❤️\nFor her cramps, her comfort, and all the cuddles in between.",
  },
];

async function applyPdfUpdates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for PDF product update...");

    for (const item of pdfUpdates) {
      const filter = {
        $or: [
          { "mainImage.url": item.image },
          { "images.url": item.image }
        ]
      };

      const existing = await Product.findOne(filter);
      if (existing) {
        existing.title = item.title;
        existing.price = item.price;
        existing.discountPrice = item.discountPrice;
        existing.description = item.description;
        existing.shortDescription = item.description.slice(0, 120) + "...";
        existing.stock = existing.stock || 15;
        existing.isActive = true;
        await existing.save();
        console.log(`[UPDATED] "${item.title}" (ID: ${existing._id}) -> Price: ₹${item.price}, Discount: ₹${item.discountPrice}`);
      } else {
        const created = await Product.create({
          title: item.title,
          category: "Toys",
          price: item.price,
          discountPrice: item.discountPrice,
          description: item.description,
          shortDescription: item.description.slice(0, 120) + "...",
          images: [{ url: item.image, publicId: item.image, order: 0 }],
          mainImage: { url: item.image, publicId: item.image },
          stock: 15,
          isActive: true,
          rating: 4.9,
          reviews: []
        });
        console.log(`[CREATED] "${item.title}" (ID: ${created._id}) -> Price: ₹${item.price}, Discount: ₹${item.discountPrice}`);
      }
    }

    console.log("PDF Product Update completed successfully!");
  } catch (err) {
    console.error("Error updating PDF products:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
}

applyPdfUpdates();
