# Cloudinary Media API Examples

## POST /api/upload/image

Form-data:
- image: file

Response:
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "file": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "vastraaura/products/images/sample",
    "originalName": "front.jpg",
    "mimeType": "image/jpeg",
    "size": 345678
  }
}
```

## POST /api/upload/images

Form-data:
- images: multiple files

Response:
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "files": []
}
```

## POST /api/upload/video

Form-data:
- video: file

## POST /api/upload/mixed

Form-data:
- media: multiple image and video files

## POST /api/products

Example JSON fields:
```json
{
  "title": "Banarasi Silk Saree",
  "description": "Premium festive saree",
  "shortDescription": "Festive wear",
  "price": 7999,
  "discountPrice": 6999,
  "category": "Silk Sarees",
  "subCategory": "Wedding",
  "stock": 25,
  "sizes": ["S", "M", "L"],
  "colors": ["Red", "Gold"],
  "tags": ["festive", "premium"],
  "featured": true,
  "isActive": true,
  "displayOrder": 1,
  "createdBy": "USER_OBJECT_ID"
}
```

Multipart form-data can also include `images` and `videos` files directly.

## PUT /api/products/:id

Use form-data to update product fields and optionally attach more media.

## DELETE /api/products/:id/media

Example body:
```json
{
  "publicIds": ["vastraaura/products/images/sample-1"],
  "mediaType": "image"
}
```

## PUT /api/products/:id/reorder-media

Example body:
```json
{
  "imageOrder": ["image-public-id-1", "image-public-id-2"],
  "videoOrder": ["video-public-id-1"],
  "thumbnailPublicId": "image-public-id-1"
}
```

## PUT /api/products/:id/thumbnail

Example body:
```json
{
  "publicId": "image-public-id-1"
}
```

## PATCH /api/products/:id/featured

Toggles the featured flag.

## PATCH /api/products/:id/active

Toggles product visibility.