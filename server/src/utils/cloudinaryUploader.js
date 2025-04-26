// src/utils/cloudinaryUploader.js
import cloudinary from "../config/cloudinary.js"; // Import cấu hình cloudinary đã có
import streamifier from "streamifier"; // Cần cài đặt: npm install streamifier

/**
 * Extracts the public ID from a Cloudinary URL.
 * Example: https://res.cloudinary.com/demo/image/upload/v12345/folder/public_id.jpg -> folder/public_id
 * @param {string} url The Cloudinary URL
 * @returns {string|null} The public ID or null if extraction fails
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    // Tìm phần sau /upload/ và trước version (vXXXXX/) nếu có
    const regex1 = /\/upload\/(?:v\d+\/)?([^\.]+)/;
    const match1 = url.match(regex1);
    if (match1 && match1[1]) {
      return match1[1];
    }
    // Trường hợp không có version
    const regex2 = /\/([^\/]+\.[a-zA-Z0-9]+)$/; // Lấy phần cuối cùng trước dấu .
    const match2 = url.match(regex2);
    if (match2 && match2[1]) {
      // Cần loại bỏ phần extension
      const parts = match2[1].split(".");
      parts.pop(); // remove extension
      // Cần lấy phần sau upload/ cuối cùng
      const urlParts = url.split("/upload/");
      if (urlParts.length > 1) {
        const relevantPart = urlParts[1];
        const publicIdPart = relevantPart.split("/").slice(1).join("/"); // Bỏ qua version nếu có
        const finalId = publicIdPart.replace(/\.[^/.]+$/, ""); // Remove extension again just in case
        return finalId || parts.join("."); // Fallback
      }
      return parts.join("."); // Fallback if split fails
    }

    console.warn("Could not extract public_id from URL:", url);
    return null;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
};

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer The file buffer to upload.
 * @param {string} folder The folder name in Cloudinary (e.g., 'profile_pics').
 * @returns {Promise<object>} Promise resolving with Cloudinary upload result.
 */
const uploadToCloudinary = (fileBuffer, folder = "profile_pics") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder }, // Bạn có thể thêm các tùy chọn khác ở đây
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return reject(new Error("Failed to upload image to Cloudinary."));
        }
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Cloudinary upload result is undefined."));
        }
      }
    );
    // Pipe buffer vào stream upload
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Deletes an image from Cloudinary using its public ID.
 * @param {string} publicId The public ID of the image to delete.
 * @returns {Promise<object>} Promise resolving with Cloudinary deletion result.
 */
const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    if (!publicId) {
      return reject(new Error("Public ID is required for deletion."));
    }
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary Deletion Error:", error);
        // Không nên reject hoàn toàn nếu xóa lỗi, có thể chỉ log lỗi
        // return reject(new Error('Failed to delete image from Cloudinary.'));
        console.warn(
          `Failed to delete old image ${publicId} from Cloudinary. Continuing...`
        );
        resolve({ result: "failed_but_continued", error: error }); // Resolve để tiếp tục
      } else {
        resolve(result);
      }
    });
  });
};

export { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl };
