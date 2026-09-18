import sharp from "sharp";
import crypto from "node:crypto";
import path from "path";
import fs from "fs/promises";
import { unlink } from 'fs/promises';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageDirectory = path.join(
    __dirname,
    "../../public/uploads/images"
);

/**
 * 
 * @param {Request} req request object
 * @returns {Array} array of image urls uploaded
 */
export const processImages = async (req) => {
    if (!req.files || req.files.length === 0) {
        return [];
    }

    await fs.mkdir(imageDirectory, {
        recursive: true,
    });

    const imageUrls = [];

    for (const file of req.files) {
        const filename = `${crypto.randomUUID()}.webp`;

        const outputPath = path.join(
            imageDirectory,
            filename
        );

        await sharp(file.buffer)
            .rotate()
            .resize({
                width: 1600,
                height: 1600,
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({
                quality: 80,
            })
            .toFile(outputPath);

        imageUrls.push(`/uploads/images/${filename}`);
    }

    return imageUrls;
};

/**
 * 
 * @param {String} fileName name of image file to delete
 * @returns {Boolean} true if success
 */
export const deleteImage = async (fileName) => {
    
    //extract original filename even if path is passed
    const safeFileName = path.basename(fileName);

    // creating file path
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'images', safeFileName);

    try {
        //deleting the file
        await unlink(filePath);
        console.log(`Successfully deleted: ${safeFileName}`);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`File not found: ${safeFileName}`);
            return false;
        }
        console.error(`Error deleting file: ${error.message}`);
        throw error;
    }
};

