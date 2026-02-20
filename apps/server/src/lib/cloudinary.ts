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
    // Aquí definimos la carpeta
    return {
      folder: "findJob", // <--- Reemplaza con el nombre EXACTO de tu carpeta creada en Cloudinary
      allowed_formats: ["jpg", "png", "jpeg"],
      public_id: `${file.fieldname}-${Date.now()}`, // Usamos el nombre del campo (dniFront, etc) para identificar mejor
      resource_type: "image", // Forzamos a que se trate como imagen
    };
  },
});

export const upload = multer({ storage });
