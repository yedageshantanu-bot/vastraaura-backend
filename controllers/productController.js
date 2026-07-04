const Product = require("../models/Product");
const { cloudinary } = require("../config/cloudinary");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");
const store = require("../src/data/store");

const parseMaybeJson = (value, fallback) => {
	if (value === undefined || value === null || value === "") {
		return fallback;
	}

	if (typeof value !== "string") {
		return value;
	}

	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
};

const toBoolean = (value, defaultValue = false) => {
	if (value === undefined || value === null || value === "") {
		return defaultValue;
	}

	if (typeof value === "boolean") {
		return value;
	}

	return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
};

const toNumber = (value, defaultValue = 0) => {
	if (value === undefined || value === null || value === "") {
		return defaultValue;
	}

	const parsed = Number(value);
	return Number.isNaN(parsed) ? defaultValue : parsed;
};

const toArray = (value) => {
	const parsed = parseMaybeJson(value, value);

	if (Array.isArray(parsed)) {
		return parsed.filter(Boolean).map((item) => String(item).trim());
	}

	if (typeof parsed === "string" && parsed.trim()) {
		return parsed
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
	}

	return [];
};

const toFaqs = (value, fallback = []) => {
	const parsed = parseMaybeJson(value, fallback);
	const values = Array.isArray(parsed) ? parsed : [];

	return values
		.map((item) => ({
			question: String(item?.question || "").trim(),
			answer: String(item?.answer || "").trim(),
		}))
		.filter((item) => item.question || item.answer);
};

const slugify = (value) =>
	String(value || "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const findProductByIdentifier = async (identifier, includeInactive = true) => {
	const value = String(identifier || "").trim();
	const activeFilter = includeInactive ? {} : { isActive: { $ne: false } };

	if (!value) {
		return null;
	}

	if (/^\d+$/.test(value)) {
		const index = Math.max(Number(value) - 1, 0);
		return Product.findOne(activeFilter)
			.sort({ displayOrder: 1, createdAt: -1 })
			.skip(index)
			.populate("createdBy", "name email role")
			.lean();
	}

	const query = isObjectId(value)
		? { ...activeFilter, $or: [{ _id: value }, { slug: value.toLowerCase() }] }
		: { ...activeFilter, slug: value.toLowerCase() };

	return Product.findOne(query)
		.populate("createdBy", "name email role")
		.lean();
};

const buildMediaFromFile = (file) => ({
	url: file.path,
	publicId: file.filename || file.public_id || "",
	order: 0,
	altText: file.originalname || "",
	resourceType: file.mimetype.startsWith("video/") ? "video" : "image",
	format: (file.format || file.mimetype.split("/")[1] || "").toLowerCase(),
	mimeType: file.mimetype,
});

const normalizeMediaInput = (input, resourceType) => {
	const parsed = parseMaybeJson(input, []);
	const values = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];

	return values
		.map((item, index) => {
			if (!item) {
				return null;
			}

			if (typeof item === "string") {
				return {
					url: item,
					publicId: item,
					order: index,
					altText: "",
					resourceType,
					format: "",
					mimeType: "",
				};
			}

			return {
				url: item.url || item.secureUrl || "",
				publicId: item.publicId || item.public_id || item.filename || "",
				order: item.order ?? index,
				altText: item.altText || item.alt || "",
				resourceType: item.resourceType || resourceType,
				format: item.format || "",
				mimeType: item.mimeType || "",
			};
		})
		.filter((item) => item && item.url);
};

const normalizeMediaObject = (input, resourceType = "image", order = 0) => {
	const normalized = normalizeMediaInput(input, resourceType);
	return normalized[0] ? { ...normalized[0], order } : null;
};

const normalizeMediaArray = (input, resourceType = "image") =>
	normalizeMediaInput(input, resourceType).map((item, index) => ({ ...item, order: index }));

const normalizeProductMediaInput = (input, fallback = {}) => {
	const parsed = parseMaybeJson(input, fallback || {});
	const source = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};

	return {
		frontImage: normalizeMediaObject(source.frontImage, "image") || fallback?.frontImage || null,
		backImage: normalizeMediaObject(source.backImage, "image") || fallback?.backImage || null,
		sideImage: normalizeMediaObject(source.sideImage, "image") || fallback?.sideImage || null,
		hoverImage: normalizeMediaObject(source.hoverImage, "image") || fallback?.hoverImage || null,
		thumbnail: normalizeMediaObject(source.thumbnail, "image") || fallback?.thumbnail || null,
		sizeChart: normalizeMediaObject(source.sizeChart, "image") || fallback?.sizeChart || null,
		galleryImages:
			source.galleryImages !== undefined
				? normalizeMediaArray(source.galleryImages, "image")
				: fallback?.galleryImages || [],
		videos:
			source.videos !== undefined
				? normalizeMediaArray(source.videos, "video")
				: fallback?.videos || [],
	};
};

const normalizeVariants = (value, fallback = []) => {
	const parsed = parseMaybeJson(value, fallback);
	const values = Array.isArray(parsed) ? parsed : [];

	return values
		.map((variant, index) => {
			const colorName = String(variant?.colorName || "").trim();
			const colorCode = String(variant?.colorCode || "").trim();
			const fallbackSku = colorName
				? `${slugify(colorName).toUpperCase()}-${String(index + 1).padStart(2, "0")}`
				: "";

			return {
				colorName,
				colorCode: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(colorCode)
					? colorCode
					: "#C4A55A",
				price: toNumber(variant?.price, 0),
				stock: toNumber(variant?.stock, 0),
				frontImage: normalizeMediaObject(variant?.frontImage, "image"),
				backImage: normalizeMediaObject(variant?.backImage, "image"),
				galleryImages: normalizeMediaArray(variant?.galleryImages || [], "image"),
				video: normalizeMediaObject(variant?.video, "video"),
				sku: String(variant?.sku || fallbackSku).trim(),
			};
		})
		.filter((variant) => variant.colorName);
};

const getUploadedMedia = (files = []) => {
	const imageFiles = [];
	const videoFiles = [];

	files.forEach((file, index) => {
		const media = buildMediaFromFile(file);
		media.order = index;

		if (media.resourceType === "video") {
			videoFiles.push(media);
			return;
		}

		imageFiles.push(media);
	});

	return { imageFiles, videoFiles };
};

const chooseThumbnail = (images, videos, requestedPublicId) => {
	if (requestedPublicId) {
		return (
			images.find((item) => item.publicId === requestedPublicId) ||
			videos.find((item) => item.publicId === requestedPublicId)
		);
	}

	return images[0] || videos[0] || null;
};

const deleteCloudinaryAsset = async (media) => {
	if (!media || !media.publicId) {
		return;
	}

	const resourceType = media.resourceType === "video" ? "video" : "image";
	await cloudinary.uploader.destroy(media.publicId, {
		resource_type: resourceType,
		invalidate: true,
	});
};

const deleteCloudinaryAssets = async (mediaList = []) => {
	await Promise.all(mediaList.map((media) => deleteCloudinaryAsset(media)));
};

const buildProductPayload = (req, existingProduct) => {
	const uploaded = getUploadedMedia(req.files || []);
	const bodyImages = normalizeMediaInput(req.body.images, "image");
	const bodyMainImage = normalizeMediaObject(req.body.mainImage, "image");
	const bodyVideos = normalizeMediaInput(req.body.videos, "video");
	const fallbackLegacyVideo = req.body.video
		? normalizeMediaInput([{ url: req.body.video, publicId: req.body.videoPublicId || req.body.video }], "video")
		: [];

	const imageMode = String(req.body.imageMode || "append").toLowerCase();
	const videoMode = String(req.body.videoMode || "append").toLowerCase();

	let images = existingProduct ? [...existingProduct.images] : [];
	let videos = existingProduct ? [...existingProduct.videos] : [];

	if (bodyImages.length || uploaded.imageFiles.length) {
		images = imageMode === "replace" ? [] : images;
		images = [...images, ...bodyImages, ...uploaded.imageFiles];
	}

	if (bodyVideos.length || fallbackLegacyVideo.length || uploaded.videoFiles.length) {
		videos = videoMode === "replace" ? [] : videos;
		videos = [...videos, ...bodyVideos, ...fallbackLegacyVideo, ...uploaded.videoFiles];
	}

	const normalizedImages = images
		.map((item, index) => ({ ...item, order: item.order ?? index }))
		.sort((a, b) => a.order - b.order);

	const normalizedVideos = videos
		.map((item, index) => ({ ...item, order: item.order ?? index }))
		.sort((a, b) => a.order - b.order);

	const thumbnailPublicId = req.body.thumbnailPublicId || req.body.thumbnail || "";
	const thumbnailSource = chooseThumbnail(normalizedImages, normalizedVideos, thumbnailPublicId);
	const media = req.body.media !== undefined
		? normalizeProductMediaInput(req.body.media, existingProduct?.media || {})
		: existingProduct?.media || {
				frontImage: normalizedImages[0] || null,
				backImage: normalizedImages[1] || null,
				sideImage: normalizedImages[2] || null,
				hoverImage: normalizedImages[1] || null,
				thumbnail: thumbnailSource || normalizedImages[0] || null,
				sizeChart: null,
				galleryImages: normalizedImages.slice(1),
				videos: normalizedVideos,
			};
	const variants = req.body.variants !== undefined
		? normalizeVariants(req.body.variants, existingProduct?.variants || [])
		: existingProduct?.variants || [];
	const variantColors = variants.map((variant) => variant.colorName);
	const variantStock = variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);

	return {
		title: req.body.title ?? existingProduct?.title,
		slug: slugify(req.body.slug || req.body.title || existingProduct?.slug || existingProduct?.title || ""),
		description: req.body.description ?? existingProduct?.description,
		descriptionSections: req.body.descriptionSections ?? existingProduct?.descriptionSections ?? "",
		declaration: req.body.declaration ?? existingProduct?.declaration ?? "",
		shippingReturns: req.body.shippingReturns ?? existingProduct?.shippingReturns ?? "",
		faqs: req.body.faqs !== undefined ? toFaqs(req.body.faqs) : existingProduct?.faqs || [],
		shortDescription: req.body.shortDescription ?? existingProduct?.shortDescription ?? "",
		price: toNumber(req.body.price, existingProduct?.price ?? 0),
		discountPrice: toNumber(req.body.discountPrice, existingProduct?.discountPrice ?? 0),
		images: normalizedImages,
		mainImage: bodyMainImage || existingProduct?.mainImage || normalizedImages[0] || null,
		videos: normalizedVideos,
		media,
		variants,
		thumbnail: thumbnailSource
			? {
					url: thumbnailSource.url,
					publicId: thumbnailSource.publicId,
					resourceType: thumbnailSource.resourceType,
				}
			: existingProduct?.thumbnail || { url: "", publicId: "", resourceType: "image" },
		category: req.body.category ?? existingProduct?.category,
		subCategory: req.body.subCategory ?? existingProduct?.subCategory ?? "",
		fabric: req.body.fabric ?? existingProduct?.fabric ?? "",
		occasion: req.body.occasion ?? existingProduct?.occasion ?? "",
		color: req.body.color ?? existingProduct?.color ?? variantColors[0] ?? "",
		stock: variants.length ? variantStock : toNumber(req.body.stock, existingProduct?.stock ?? 0),
		sizes: req.body.sizes !== undefined ? toArray(req.body.sizes) : existingProduct?.sizes || [],
		colors: req.body.colors !== undefined
			? Array.from(new Set([...toArray(req.body.colors), ...variantColors]))
			: Array.from(new Set([...(existingProduct?.colors || []), ...variantColors])),
		tags: req.body.tags !== undefined ? toArray(req.body.tags) : existingProduct?.tags || [],
		featured: toBoolean(req.body.featured, existingProduct?.featured ?? false),
		isActive: toBoolean(req.body.isActive, existingProduct?.isActive ?? true),
		displayOrder: toNumber(req.body.displayOrder, existingProduct?.displayOrder ?? 0),
		createdBy: req.body.createdBy || existingProduct?.createdBy,
		ratings: parseMaybeJson(req.body.ratings, existingProduct?.ratings || { average: 0, count: 0 }),
		reviews: parseMaybeJson(req.body.reviews, existingProduct?.reviews || []),
	};
};

exports.getProducts = asyncHandler(async (req, res) => {
	const filter = {};

	if (req.query.featured !== undefined) {
		filter.featured = toBoolean(req.query.featured);
	}

	if (req.query.isActive !== undefined) {
		filter.isActive = toBoolean(req.query.isActive, true);
	}

	if (req.query.category) {
		filter.category = req.query.category;
	}

	if (mongoose.connection.readyState !== 1) {
		const products = store.products.filter((product) =>
			Object.entries(filter).every(([key, value]) => product[key] === value),
		);

		return res.json({ success: true, count: products.length, products });
	}

	const products = await Product.find(filter)
		.sort({ displayOrder: 1, createdAt: -1 })
		.populate("createdBy", "name email role")
		.lean();

	res.json({ success: true, count: products.length, products });
});

exports.getProduct = asyncHandler(async (req, res) => {
	if (mongoose.connection.readyState !== 1) {
		const product = store.products.find((item) => item._id === req.params.id || item.slug === req.params.id);

		if (!product) {
			return res.status(404).json({ success: false, message: "Product not found" });
		}

		return res.json({ success: true, product });
	}

	const product = await findProductByIdentifier(req.params.id);

	if (!product) {
		return res.status(404).json({ success: false, message: "Product not found" });
	}

	return res.json({ success: true, product });
});

exports.createProduct = asyncHandler(async (req, res) => {
	const payload = buildProductPayload(req);

	if (
		!payload.title ||
		!payload.description ||
		req.body.price === undefined ||
		req.body.price === null ||
		req.body.price === "" ||
		!payload.category
	) {
		return res.status(400).json({
			success: false,
			message: "title, description, price, and category are required",
		});
	}

	if (mongoose.connection.readyState !== 1) {
		const baseSlug = payload.slug || slugify(payload.title);
		const slugExists = store.products.some((product) => product.slug === baseSlug);
		const finalSlug = slugExists ? `${baseSlug}-${Date.now().toString().slice(-6)}` : baseSlug;
		const product = {
			...payload,
			_id: `p${Date.now()}`,
			slug: finalSlug,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		store.products.unshift(product);
		console.info("[VastraAura products] created in local fallback store", {
			id: product._id,
			slug: product.slug,
			variants: product.variants?.length || 0,
		});

		return res.status(201).json({
			success: true,
			message: "Product created successfully",
			product,
		});
	}

	const baseSlug = payload.slug || slugify(payload.title);
	const slugExists = await Product.findOne({ slug: baseSlug }).select("_id");
	const finalSlug = slugExists ? `${baseSlug}-${Date.now().toString().slice(-6)}` : baseSlug;

	const product = await Product.create({
		...payload,
		slug: finalSlug,
	});

	res.status(201).json({
		success: true,
		message: "Product created successfully",
		product,
	});
});

exports.updateProduct = asyncHandler(async (req, res) => {
	if (mongoose.connection.readyState !== 1) {
		const index = store.products.findIndex(
			(item) => String(item._id) === String(req.params.id) || item.slug === req.params.id,
		);

		if (index === -1) {
			return res.status(404).json({ success: false, message: "Product not found" });
		}

		const existingProduct = store.products[index];
		const payload = buildProductPayload(req, existingProduct);
		const updatedProduct = {
			...existingProduct,
			...payload,
			_id: existingProduct._id,
			updatedAt: new Date().toISOString(),
		};

		store.products[index] = updatedProduct;
		console.info("[VastraAura products] updated in local fallback store", {
			id: updatedProduct._id,
			variants: updatedProduct.variants?.length || 0,
		});

		return res.json({
			success: true,
			message: "Product updated successfully",
			product: updatedProduct,
		});
	}

	const product = await Product.findById(req.params.id);

	if (!product) {
		return res.status(404).json({ success: false, message: "Product not found" });
	}

	const payload = buildProductPayload(req, product);

	const shouldReplaceMedia = toBoolean(req.body.replaceMedia, false);
	if (shouldReplaceMedia) {
		await deleteCloudinaryAssets([...(product.images || []), ...(product.videos || [])]);
	}

	if (req.body.title && req.body.title !== product.title) {
		const baseSlug = slugify(req.body.title);
		const slugExists = await Product.findOne({ slug: baseSlug, _id: { $ne: product._id } }).select("_id");
		payload.slug = slugExists ? `${baseSlug}-${Date.now().toString().slice(-6)}` : baseSlug;
	}

	Object.assign(product, payload);
	const updatedProduct = await product.save();

	res.json({
		success: true,
		message: "Product updated successfully",
		product: updatedProduct,
	});
});

exports.deleteProductMedia = asyncHandler(async (req, res) => {
	const product = await Product.findById(req.params.id);

	if (!product) {
		return res.status(404).json({ success: false, message: "Product not found" });
	}

	const body = parseMaybeJson(req.body, req.body || {});
	const mediaType = String(body.mediaType || "all").toLowerCase();
	const publicIds = [body.publicId, body.publicIds, body.mediaPublicId]
		.flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
		.filter(Boolean)
		.map(String);

	if (!publicIds.length) {
		return res.status(400).json({ success: false, message: "publicId or publicIds is required" });
	}

	const removedImages = product.images.filter(
		(media) => publicIds.includes(media.publicId) && (mediaType === "all" || mediaType === "image"),
	);
	const removedVideos = product.videos.filter(
		(media) => publicIds.includes(media.publicId) && (mediaType === "all" || mediaType === "video"),
	);

	product.images = product.images.filter((media) => !removedImages.includes(media));
	product.videos = product.videos.filter((media) => !removedVideos.includes(media));

	await deleteCloudinaryAssets([...removedImages, ...removedVideos]);

	if (product.thumbnail.publicId && publicIds.includes(product.thumbnail.publicId)) {
		const nextThumbnail = chooseThumbnail(product.images, product.videos, "");
		product.thumbnail = nextThumbnail
			? {
					url: nextThumbnail.url,
					publicId: nextThumbnail.publicId,
					resourceType: nextThumbnail.resourceType,
				}
			: { url: "", publicId: "", resourceType: "image" };
	}

	await product.save();

	res.json({
		success: true,
		message: "Product media deleted successfully",
		product,
	});
});

exports.reorderMedia = asyncHandler(async (req, res) => {
	const product = await Product.findById(req.params.id);

	if (!product) {
		return res.status(404).json({ success: false, message: "Product not found" });
	}

	const body = parseMaybeJson(req.body, req.body || {});
	const imageOrder = toArray(body.imageOrder);
	const videoOrder = toArray(body.videoOrder);

	if (!imageOrder.length && !videoOrder.length) {
		return res.status(400).json({
			success: false,
			message: "imageOrder or videoOrder is required",
		});
	}

	if (imageOrder.length) {
		const imageMap = new Map(product.images.map((item) => [item.publicId, item]));
		product.images = imageOrder
			.map((publicId, index) => ({ ...imageMap.get(publicId), order: index }))
			.filter((item) => item.url);
	}

	if (videoOrder.length) {
		const videoMap = new Map(product.videos.map((item) => [item.publicId, item]));
		product.videos = videoOrder
			.map((publicId, index) => ({ ...videoMap.get(publicId), order: index }))
			.filter((item) => item.url);
	}

	const thumbnailPublicId = body.thumbnailPublicId || body.thumbnail || "";
	if (thumbnailPublicId) {
		const thumbnailSource = chooseThumbnail(product.images, product.videos, thumbnailPublicId);
		if (thumbnailSource) {
			product.thumbnail = {
				url: thumbnailSource.url,
				publicId: thumbnailSource.publicId,
				resourceType: thumbnailSource.resourceType,
			};
		}
	}

	await product.save();

	res.json({
		success: true,
		message: "Product media reordered successfully",
		product,
	});
});

exports.setThumbnailImage = asyncHandler(async (req, res) => {
	const product = await Product.findById(req.params.id);

	if (!product) {
		return res.status(404).json({ success: false, message: "Product not found" });
	}

	const body = parseMaybeJson(req.body, req.body || {});
	const publicId = body.publicId || body.thumbnailPublicId;

	if (!publicId) {
		return res.status(400).json({ success: false, message: "publicId is required" });
	}

	const source =
		product.images.find((item) => item.publicId === publicId) ||
		product.videos.find((item) => item.publicId === publicId);

	if (!source) {
		return res.status(404).json({ success: false, message: "Thumbnail media not found" });
	}

	product.thumbnail = {
		url: source.url,
		publicId: source.publicId,
		resourceType: source.resourceType,
	};

	await product.save();

	res.json({
		success: true,
		message: "Thumbnail updated successfully",
		product,
	});
});

exports.toggleFeaturedProduct = asyncHandler(async (req, res) => {
	if (mongoose.connection.readyState !== 1) {
		const product = store.products.find((item) => String(item._id) === String(req.params.id));
		if (!product) {
			return res.status(404).json({ success: false, message: "Product not found" });
		}

		product.featured = !product.featured;
		product.updatedAt = new Date().toISOString();
		return res.json({
			success: true,
			message: `Product featured status set to ${product.featured}`,
			product,
		});
	}

	const product = await Product.findById(req.params.id);

	if (!product) {
		return res.status(404).json({ success: false, message: "Product not found" });
	}

	product.featured = !product.featured;
	await product.save();

	res.json({
		success: true,
		message: `Product featured status set to ${product.featured}`,
		product,
	});
});

exports.toggleActiveProduct = asyncHandler(async (req, res) => {
	if (mongoose.connection.readyState !== 1) {
		const product = store.products.find((item) => String(item._id) === String(req.params.id));
		if (!product) {
			return res.status(404).json({ success: false, message: "Product not found" });
		}

		product.isActive = !product.isActive;
		product.updatedAt = new Date().toISOString();
		return res.json({
			success: true,
			message: `Product active status set to ${product.isActive}`,
			product,
		});
	}

	const product = await Product.findById(req.params.id);

	if (!product) {
		return res.status(404).json({ success: false, message: "Product not found" });
	}

	product.isActive = !product.isActive;
	await product.save();

	res.json({
		success: true,
		message: `Product active status set to ${product.isActive}`,
		product,
	});
});

exports.deleteProduct = asyncHandler(async (req, res) => {
	if (mongoose.connection.readyState !== 1) {
		const index = store.products.findIndex((item) => String(item._id) === String(req.params.id));
		if (index === -1) {
			return res.status(404).json({ success: false, message: "Product not found" });
		}

		store.products.splice(index, 1);
		return res.json({
			success: true,
			message: "Product deleted successfully",
		});
	}

	const product = await Product.findById(req.params.id);

	if (!product) {
		return res.status(404).json({ success: false, message: "Product not found" });
	}

	const mediaToDelete = [...(product.images || []), ...(product.videos || [])].filter(
		(media) => media && media.publicId,
	);

	await Promise.allSettled(
		mediaToDelete.map((media) =>
			cloudinary.uploader.destroy(media.publicId, {
				resource_type: media.resourceType === "video" ? "video" : "image",
				invalidate: true,
			}),
		),
	);

	await product.deleteOne();

	res.json({
		success: true,
		message: "Product deleted successfully",
	});
});
