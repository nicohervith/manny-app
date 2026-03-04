import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Definimos la carpeta base
        let folderPath = "findJob";
        if (file.fieldname === "images") {
            folderPath = "findJob/jobs_images";
        }
        else if (file.fieldname === "avatar") {
            folderPath = "findJob/avatars";
        }
        return {
            folder: folderPath,
            allowed_formats: ["jpg", "png", "jpeg"],
            public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
            resource_type: "image",
        };
    },
});
export const upload = multer({ storage });
