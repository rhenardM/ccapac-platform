const fs = require("fs");
const path = require("path");

const getImageUrl = (req, filename) => {
    if (!filename) return null;
    const protocol = req.protocol;
    const host = req.get("host");
    return `${protocol}://${host}/uploads/images/${filename}`;
};

const deleteImage = (filename) => {
    if (!filename) return;
    const filePath = path.join(__dirname, "../uploads/images", filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const formatMediaResponse = (media) => {
    return {
        id: media.id,
        name: media.name,
        alternativeText: media.alternative_text,
        caption: media.caption,
        width: media.width,
        height: media.height,
        url: media.url,
        previewUrl: media.preview_url,
        formats: media.formats ? JSON.parse(media.formats) : null,
        mime: media.mime,
        size: media.size
    };
};

module.exports = { getImageUrl, deleteImage, formatMediaResponse };