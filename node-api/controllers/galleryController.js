const pool = require("../config/db");
const { formatMediaResponse } = require("../utils/imageHelper");
const fs = require("fs");
const path = require("path");

// Get all media with formats - FIXED
const getAllMedia = async (req, res) => {
    try {
        const [media] = await pool.query(
            `SELECT m.*, 
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'format_name', mf.format_name,
                            'url', mf.url,
                            'width', mf.width,
                            'height', mf.height,
                            'size', mf.size
                        )
                    ) as formats_json
             FROM media m
             LEFT JOIN media_formats mf ON m.id = mf.media_id
             GROUP BY m.id
             ORDER BY m.created_at DESC`
        );

        // Format the response
        const formattedMedia = media.map(item => {
            let formats = [];
            try {
                if (item.formats_json) {
                    // If it's a string, parse it
                    if (typeof item.formats_json === 'string') {
                        // Handle the case where GROUP_CONCAT returns a string
                        const formatStrings = item.formats_json.split('},{');
                        formats = formatStrings.map(str => {
                            // Clean up the string to make it valid JSON
                            let cleanStr = str;
                            if (!cleanStr.startsWith('{')) cleanStr = '{' + cleanStr;
                            if (!cleanStr.endsWith('}')) cleanStr = cleanStr + '}';
                            try {
                                return JSON.parse(cleanStr);
                            } catch (e) {
                                return null;
                            }
                        }).filter(f => f !== null);
                    } else {
                        formats = item.formats_json;
                    }
                }
            } catch (e) {
                console.error('Error parsing formats:', e.message);
                formats = [];
            }

            let providerMetadata = null;
            try {
                if (item.provider_metadata) {
                    providerMetadata = typeof item.provider_metadata === 'string' ? 
                        JSON.parse(item.provider_metadata) : 
                        item.provider_metadata;
                }
            } catch (e) {
                console.error('Error parsing provider_metadata:', e.message);
            }

            return {
                ...item,
                formats: formats,
                provider_metadata: providerMetadata,
                // Add image URL for easy access
                imageUrl: item.url || item.preview_url || null
            };
        });

        res.json({
            success: true,
            count: formattedMedia.length,
            data: formattedMedia
        });
    } catch (error) {
        console.error('Get all media error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching media",
            error: error.message
        });
    }
};

// Get media by document_id - FIXED
const getMediaByDocumentId = async (req, res) => {
    try {
        const [media] = await pool.query(
            `SELECT m.*, 
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'format_name', mf.format_name,
                            'url', mf.url,
                            'width', mf.width,
                            'height', mf.height,
                            'size', mf.size
                        )
                    ) as formats_json
             FROM media m
             LEFT JOIN media_formats mf ON m.id = mf.media_id
             WHERE m.document_id = ?
             GROUP BY m.id`,
            [req.params.documentId]
        );

        if (media.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Media not found"
            });
        }

        const item = media[0];
        let formats = [];
        try {
            if (item.formats_json) {
                if (typeof item.formats_json === 'string') {
                    const formatStrings = item.formats_json.split('},{');
                    formats = formatStrings.map(str => {
                        let cleanStr = str;
                        if (!cleanStr.startsWith('{')) cleanStr = '{' + cleanStr;
                        if (!cleanStr.endsWith('}')) cleanStr = cleanStr + '}';
                        try {
                            return JSON.parse(cleanStr);
                        } catch (e) {
                            return null;
                        }
                    }).filter(f => f !== null);
                } else {
                    formats = item.formats_json;
                }
            }
        } catch (e) {
            console.error('Error parsing formats:', e.message);
        }

        let providerMetadata = null;
        try {
            if (item.provider_metadata) {
                providerMetadata = typeof item.provider_metadata === 'string' ? 
                    JSON.parse(item.provider_metadata) : 
                    item.provider_metadata;
            }
        } catch (e) {
            console.error('Error parsing provider_metadata:', e.message);
        }

        res.json({
            success: true,
            data: {
                ...item,
                formats: formats,
                provider_metadata: providerMetadata,
                imageUrl: item.url || item.preview_url || null
            }
        });
    } catch (error) {
        console.error('Get media by documentId error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching media",
            error: error.message
        });
    }
};

// Upload new media (admin only) - FIXED
const uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const { name, alternative_text, caption } = req.body;
        const file = req.file;

        // Insert into media table
        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/images/gallery/${file.filename}`;
        
        const [result] = await pool.query(
            `INSERT INTO media (
                name, alternative_text, caption,
                width, height, size, url, mime,
                ext, hash, created_at, updated_at, published_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
            [
                name || file.originalname,
                alternative_text || null,
                caption || null,
                0, // width - would need to read image to get this
                0, // height - would need to read image to get this
                file.size,
                imageUrl,
                file.mimetype,
                path.extname(file.originalname).substring(1),
                file.filename.split('.')[0]
            ]
        );

        // Generate and insert formats
        await pool.query(
            `INSERT INTO media_formats (
                media_id, format_name, ext, url,
                hash, mime, name, size, width, height
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                result.insertId,
                'thumbnail',
                path.extname(file.originalname).substring(1),
                imageUrl,
                file.filename.split('.')[0],
                file.mimetype,
                name || file.originalname,
                file.size,
                0,
                0
            ]
        );

        const [newMedia] = await pool.query(
            "SELECT * FROM media WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Media uploaded successfully",
            data: {
                ...newMedia[0],
                imageUrl: newMedia[0].url || newMedia[0].preview_url || null
            }
        });
    } catch (error) {
        console.error('Upload media error:', error);
        res.status(500).json({
            success: false,
            message: "Error uploading media",
            error: error.message
        });
    }
};

// Delete media (admin only) - FIXED
const deleteMedia = async (req, res) => {
    try {
        const { id } = req.params;

        // Get media to delete file
        const [media] = await pool.query(
            "SELECT url FROM media WHERE id = ?",
            [id]
        );

        if (media.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Media not found"
            });
        }

        // Delete physical file if it exists locally
        const url = media[0].url;
        if (url) {
            // Only delete if it's a local file (not a Strapi Cloud URL)
            if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('/uploads/')) {
                const filename = url.split('/').pop();
                const filePath = path.join(__dirname, "../uploads/images/gallery", filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Deleted file:', filePath);
                }
            } else {
                console.log('Skipping deletion of remote file:', url);
            }
        }

        // Delete from database
        await pool.query("DELETE FROM media_formats WHERE media_id = ?", [id]);
        await pool.query("DELETE FROM media WHERE id = ?", [id]);

        res.json({
            success: true,
            message: "Media deleted successfully"
        });
    } catch (error) {
        console.error('Delete media error:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting media",
            error: error.message
        });
    }
};

module.exports = {
    getAllMedia,
    getMediaByDocumentId,
    uploadMedia,
    deleteMedia
};