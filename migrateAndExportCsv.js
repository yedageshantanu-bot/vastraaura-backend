const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const RETURNS_POLICY_TEXT = "Dispatch within 24–48 hours across Maharashtra. Because our orders include personalized handwritten-style letter cards and curated confections, standard change-of-mind returns are not supported once dispatched. If your item arrives damaged in transit or incorrect, notify us within 48 hours of delivery at support@alairahouse.com or WhatsApp (+91 78419 28485) with clear photos for an immediate free replacement or full refund within 5–7 business days.";

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB successfully.");

  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const products = await Product.find({});
  console.log(`Found ${products.length} products to audit and update.`);

  let updatedShippingReturns = 0;
  let updatedKittyPlush = 0;
  let updatedPricing = 0;
  let updatedFlags = 0;

  const csvRows = [
    ["SKU_or_ID", "Title", "Category", "Current_Image_Filename", "Current_Image_Path", "Price_MRP", "Discount_Price", "Photo_Needs_Review", "Notes"]
  ];

  for (const doc of products) {
    let modified = false;

    // 1. Update shippingReturns for ALL products to match Returns page
    if (doc.shippingReturns !== RETURNS_POLICY_TEXT) {
      doc.shippingReturns = RETURNS_POLICY_TEXT;
      modified = true;
      updatedShippingReturns++;
    }

    // 2. Set kitty plush altText to match its title
    if (/kitty/i.test(doc.title)) {
      const correctAlt = doc.title.trim();
      if (doc.mainImage) {
        doc.mainImage.altText = correctAlt;
      }
      if (doc.media) {
        if (doc.media.frontImage) doc.media.frontImage.altText = correctAlt;
        if (doc.media.thumbnail) doc.media.thumbnail.altText = correctAlt;
      }
      if (Array.isArray(doc.images)) {
        doc.images.forEach(img => {
          if (img) img.altText = correctAlt;
        });
      }
      doc.markModified('mainImage');
      doc.markModified('media');
      doc.markModified('images');
      modified = true;
      updatedKittyPlush++;
      console.log(`Updated Kitty Plush altText to: "${correctAlt}"`);
    }

    // 3. Make price / discountPrice consistent
    if (doc.title === "3-Feet Giant Sweet Dream Bunny" && doc.price === doc.discountPrice) {
      doc.price = 4500;
      doc.discountPrice = 3500;
      modified = true;
      updatedPricing++;
      console.log(`Updated 3-Feet Giant Sweet Dream Bunny price to: ${doc.price}, discountPrice to: ${doc.discountPrice}`);
    } else if (doc.title === "Cozy Bunny Hot Water Bag Comfort Pack" && doc.price === doc.discountPrice) {
      doc.price = 799;
      doc.discountPrice = 499;
      modified = true;
      updatedPricing++;
      console.log(`Updated Cozy Bunny Hot Water Bag Comfort Pack price to: ${doc.price}, discountPrice to: ${doc.discountPrice}`);
    } else if (doc.title === "2-Feet Fluffy Giant Kitty Plush" && doc.price === doc.discountPrice) {
      doc.price = 3499;
      doc.discountPrice = 2600;
      modified = true;
      updatedPricing++;
      console.log(`Updated 2-Feet Fluffy Giant Kitty Plush price to: ${doc.price}, discountPrice to: ${doc.discountPrice}`);
    }

    // 4. Admin photo review flag
    const isPhotoMismatch = /kitty/i.test(doc.title) || /sweet dream bunny/i.test(doc.title);
    if (isPhotoMismatch) {
      doc.photoNeedsReview = true;
      modified = true;
      updatedFlags++;
    } else if (doc.photoNeedsReview === undefined) {
      doc.photoNeedsReview = false;
      modified = true;
    }

    if (modified) {
      await doc.save();
    }

    // CSV Data Row preparation
    const imgUrl = doc.mainImage?.url || doc.media?.frontImage?.url || (doc.images && doc.images[0]?.url) || doc.thumbnail?.url || "";
    const filename = imgUrl ? path.basename(imgUrl) : "NO_IMAGE";
    const sku = doc.sku || doc.slug || String(doc._id);
    const photoFlag = doc.photoNeedsReview ? "YES" : "NO";
    const note = isPhotoMismatch ? "Reported mismatch - awaiting client photo verification" : "OK";

    csvRows.push([
      `"${sku.replace(/"/g, '""')}"`,
      `"${doc.title.replace(/"/g, '""')}"`,
      `"${(doc.category || '').replace(/"/g, '""')}"`,
      `"${filename.replace(/"/g, '""')}"`,
      `"${imgUrl.replace(/"/g, '""')}"`,
      doc.price ?? 0,
      doc.discountPrice ?? 0,
      photoFlag,
      `"${note.replace(/"/g, '""')}"`
    ]);
  }

  console.log(`\n=== Migration Summary ===`);
  console.log(`Shipping & Returns updated on: ${updatedShippingReturns}/${products.length} products`);
  console.log(`Kitty Plush altText updated: ${updatedKittyPlush}`);
  console.log(`Pricing consistency updated on: ${updatedPricing} products`);
  console.log(`Photo review flags set: ${updatedFlags}`);

  // Write CSV
  const csvContent = csvRows.map(row => row.join(",")).join("\n");
  const rootCsvPath = path.join(__dirname, '..', 'products_catalog_images.csv');
  const serverCsvPath = path.join(__dirname, 'products_catalog_images.csv');
  fs.writeFileSync(rootCsvPath, csvContent, 'utf8');
  fs.writeFileSync(serverCsvPath, csvContent, 'utf8');
  console.log(`Exported CSV successfully to:\n  - ${rootCsvPath}\n  - ${serverCsvPath}`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
