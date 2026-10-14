const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const uploadDirs = ["uploads", "uploads/images", "uploads/images/events", "uploads/images/actualites", "uploads/images/programmes", "uploads/images/gallery"];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = "uploads/images";
        
        if (req.baseUrl.includes("agenda")) {
            folder = "uploads/images/events";
        } else if (req.baseUrl.includes("actualites")) {
            folder = "uploads/images/actualites";
        } else if (req.baseUrl.includes("programmes")) {
            folder = "uploads/images/programmes";
        } else if (req.baseUrl.includes("galleries")) {
            folder = "uploads/images/gallery";
        }
        
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

// For multiple image uploads
const uploadMultiple = upload.array("images", 10);

const uploadSingle = upload.single("image");

module.exports = { upload, uploadMultiple, uploadSingle };