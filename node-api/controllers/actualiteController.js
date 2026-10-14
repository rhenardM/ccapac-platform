const pool = require("../config/db");
const { deleteImage } = require("../utils/imageHelper");

// Get all actualites - FIXED for Strapi JSON data
const getAllActualites = async (req, res) => {
    try {
        const { isFeatured, year, mois } = req.query;
        let query = "SELECT * FROM actualite WHERE 1=1";
        const params = [];

        if (isFeatured !== undefined && isFeatured !== null) {
            query += " AND isFeatured = ?";
            params.push(parseInt(isFeatured));
        }

        if (year) {
            query += " AND annee = ?";
            params.push(parseInt(year));
        }

        if (mois) {
            query += " AND mois = ?";
            params.push(mois);
        }

        query += " ORDER BY createdAt DESC";

        const [actualites] = await pool.query(query, params);

        // Format actualites - handle Strapi JSON data
        const formattedActualites = actualites.map(article => {
            // CoverImage is already an object from Strapi
            let coverImageData = article.coverImage;
            let imageUrl = null;
            
            if (coverImageData) {
                // If it's a string, parse it
                if (typeof coverImageData === 'string') {
                    try {
                        coverImageData = JSON.parse(coverImageData);
                    } catch (e) {
                        console.error('Error parsing coverImage string:', e.message);
                        coverImageData = null;
                    }
                }
                // Get the URL from the image object
                if (coverImageData && typeof coverImageData === 'object') {
                    imageUrl = coverImageData.url || 
                              coverImageData.previewUrl || 
                              (coverImageData.formats && coverImageData.formats.thumbnail ? coverImageData.formats.thumbnail.url : null);
                }
            }
            
            // Blocks - handle JSON
            let blocksData = article.blocks;
            if (typeof blocksData === 'string') {
                try {
                    blocksData = JSON.parse(blocksData);
                } catch (e) {
                    blocksData = [];
                }
            }
            
            // PDF - handle JSON
            let pdfData = article.pdf;
            if (typeof pdfData === 'string') {
                try {
                    pdfData = JSON.parse(pdfData);
                } catch (e) {
                    pdfData = null;
                }
            }

            return {
                ...article,
                coverImage: coverImageData,
                blocks: blocksData || [],
                pdf: pdfData,
                imageUrl: imageUrl
            };
        });

        res.json({
            success: true,
            count: formattedActualites.length,
            data: formattedActualites
        });
    } catch (error) {
        console.error('Get all actualites error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching actualites",
            error: error.message
        });
    }
};

// Get actualite by slug - FIXED
const getActualiteBySlug = async (req, res) => {
    try {
        const [actualites] = await pool.query(
            "SELECT * FROM actualite WHERE slug = ?",
            [req.params.slug]
        );

        if (actualites.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Article not found"
            });
        }

        const article = actualites[0];
        
        // CoverImage is already an object from Strapi
        let coverImageData = article.coverImage;
        let imageUrl = null;
        
        if (coverImageData) {
            if (typeof coverImageData === 'string') {
                try {
                    coverImageData = JSON.parse(coverImageData);
                } catch (e) {
                    coverImageData = null;
                }
            }
            if (coverImageData && typeof coverImageData === 'object') {
                imageUrl = coverImageData.url || 
                          coverImageData.previewUrl || 
                          (coverImageData.formats && coverImageData.formats.thumbnail ? coverImageData.formats.thumbnail.url : null);
            }
        }
        
        // Blocks
        let blocksData = article.blocks;
        if (typeof blocksData === 'string') {
            try {
                blocksData = JSON.parse(blocksData);
            } catch (e) {
                blocksData = [];
            }
        }
        
        // PDF
        let pdfData = article.pdf;
        if (typeof pdfData === 'string') {
            try {
                pdfData = JSON.parse(pdfData);
            } catch (e) {
                pdfData = null;
            }
        }

        res.json({
            success: true,
            data: {
                ...article,
                coverImage: coverImageData,
                blocks: blocksData || [],
                pdf: pdfData,
                imageUrl: imageUrl
            }
        });
    } catch (error) {
        console.error('Get actualite by slug error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching article"
        });
    }
};

// Create actualite (admin only)
const createActualite = async (req, res) => {
    try {
        const {
            slug, title, mois, datePublication, sourceNewsletterId,
            type, pageCount, summary, annee, isFeatured, blocks, pdf
        } = req.body;

        // Check if slug exists
        const [existing] = await pool.query(
            "SELECT id FROM actualite WHERE slug = ?",
            [slug]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Article slug already exists"
            });
        }

        // Handle cover image upload - store as JSON object (Strapi format)
        let coverImageData = null;
        if (req.file) {
            const imageUrl = `${req.protocol}://${req.get("host")}/uploads/images/actualites/${req.file.filename}`;
            coverImageData = {
                id: Date.now(),
                name: req.file.originalname,
                url: imageUrl,
                size: req.file.size,
                ext: req.file.originalname.split('.').pop(),
                mime: req.file.mimetype,
                formats: {
                    thumbnail: {
                        url: imageUrl,
                        width: 200,
                        height: 200
                    }
                }
            };
        }

        // Parse JSON fields if they are strings
        let blocksData = blocks;
        if (typeof blocks === 'string') {
            try {
                blocksData = JSON.parse(blocks);
            } catch (e) {
                blocksData = blocks;
            }
        }

        let pdfData = pdf;
        if (typeof pdf === 'string') {
            try {
                pdfData = JSON.parse(pdf);
            } catch (e) {
                pdfData = pdf;
            }
        }

        const [result] = await pool.query(
            `INSERT INTO actualite (
                slug, title, mois, datePublication, sourceNewsletterId,
                type, pageCount, summary, annee, isFeatured,
                coverImage, blocks, pdf, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                slug, title, mois, datePublication, sourceNewsletterId,
                type, pageCount, summary, annee, isFeatured || 0,
                coverImageData,
                blocksData || [],
                pdfData
            ]
        );

        const [newArticle] = await pool.query(
            "SELECT * FROM actualite WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Article created successfully",
            data: newArticle[0]
        });
    } catch (error) {
        console.error('Create actualite error:', error);
        res.status(500).json({
            success: false,
            message: "Error creating article",
            error: error.message
        });
    }
};

// Update actualite (admin only)
const updateActualite = async (req, res) => {
    try {
        const { slug } = req.params;
        const updates = req.body;

        // Get existing article
        const [existing] = await pool.query(
            "SELECT * FROM actualite WHERE slug = ?",
            [slug]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Article not found"
            });
        }

        // Handle cover image upload
        if (req.file) {
            const imageUrl = `${req.protocol}://${req.get("host")}/uploads/images/actualites/${req.file.filename}`;
            updates.coverImage = {
                id: Date.now(),
                name: req.file.originalname,
                url: imageUrl,
                size: req.file.size,
                ext: req.file.originalname.split('.').pop(),
                mime: req.file.mimetype,
                formats: {
                    thumbnail: {
                        url: imageUrl,
                        width: 200,
                        height: 200
                    }
                }
            };

            // Delete old image if exists
            const oldImage = existing[0].coverImage;
            if (oldImage && typeof oldImage === 'object' && oldImage.url) {
                const oldFilename = oldImage.url.split('/').pop();
                deleteImage(oldFilename);
            }
        }

        // Handle blocks
        if (updates.blocks) {
            if (typeof updates.blocks === 'string') {
                try {
                    updates.blocks = JSON.parse(updates.blocks);
                } catch (e) {
                    updates.blocks = updates.blocks;
                }
            }
        }

        // Handle pdf
        if (updates.pdf) {
            if (typeof updates.pdf === 'string') {
                try {
                    updates.pdf = JSON.parse(updates.pdf);
                } catch (e) {
                    updates.pdf = updates.pdf;
                }
            }
        }

        // Build update query
        const updateFields = Object.keys(updates)
            .filter(key => key !== 'slug')
            .map(key => `${key} = ?`);

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields to update"
            });
        }

        const values = Object.keys(updates)
            .filter(key => key !== 'slug')
            .map(key => updates[key]);

        await pool.query(
            `UPDATE actualite SET ${updateFields.join(', ')}, updatedAt = NOW() WHERE slug = ?`,
            [...values, slug]
        );

        const [updated] = await pool.query(
            "SELECT * FROM actualite WHERE slug = ?",
            [slug]
        );

        res.json({
            success: true,
            message: "Article updated successfully",
            data: updated[0]
        });
    } catch (error) {
        console.error('Update actualite error:', error);
        res.status(500).json({
            success: false,
            message: "Error updating article",
            error: error.message
        });
    }
};

// Delete actualite (admin only)
const deleteActualite = async (req, res) => {
    try {
        const { slug } = req.params;

        // Get article to delete image
        const [existing] = await pool.query(
            "SELECT coverImage FROM actualite WHERE slug = ?",
            [slug]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Article not found"
            });
        }

        // Delete image if exists
        const imageData = existing[0].coverImage;
        if (imageData && typeof imageData === 'object' && imageData.url) {
            const filename = imageData.url.split('/').pop();
            deleteImage(filename);
        }

        await pool.query(
            "DELETE FROM actualite WHERE slug = ?",
            [slug]
        );

        res.json({
            success: true,
            message: "Article deleted successfully"
        });
    } catch (error) {
        console.error('Delete actualite error:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting article"
        });
    }
};

module.exports = {
    getAllActualites,
    getActualiteBySlug,
    createActualite,
    updateActualite,
    deleteActualite
};