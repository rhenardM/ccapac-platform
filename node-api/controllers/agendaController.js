const pool = require("../config/db");
const { deleteImage } = require("../utils/imageHelper");

// Get all events - FIXED for Strapi JSON data
const getAllEvents = async (req, res) => {
    try {
        const { featured, category, upcoming } = req.query;
        let query = "SELECT * FROM event WHERE 1=1";
        const params = [];

        if (featured !== undefined && featured !== null) {
            query += " AND featured = ?";
            params.push(parseInt(featured));
        }

        if (category) {
            query += " AND category = ?";
            params.push(category);
        }

        if (upcoming === "true") {
            query += " AND startDate >= NOW()";
        }

        query += " ORDER BY startDate DESC";

        const [events] = await pool.query(query, params);

        // Format events - image is already a JSON object from Strapi
        const formattedEvents = events.map(event => {
            // Image is already an object from Strapi
            let imageData = event.image;
            let imageUrl = null;
            
            if (imageData) {
                // If it's a string, parse it
                if (typeof imageData === 'string') {
                    try {
                        imageData = JSON.parse(imageData);
                    } catch (e) {
                        console.error('Error parsing image string:', e.message);
                        imageData = null;
                    }
                }
                // Get the URL from the image object
                if (imageData && typeof imageData === 'object') {
                    imageUrl = imageData.url || 
                              imageData.previewUrl || 
                              (imageData.formats && imageData.formats.thumbnail ? imageData.formats.thumbnail.url : null);
                }
            }
            
            // Tags are already an object from Strapi
            let tagsData = event.tags;
            if (typeof tagsData === 'string') {
                try {
                    tagsData = JSON.parse(tagsData);
                } catch (e) {
                    tagsData = [];
                }
            }

            return {
                ...event,
                image: imageData,
                tags: tagsData || [],
                imageUrl: imageUrl
            };
        });

        res.json({
            success: true,
            count: formattedEvents.length,
            data: formattedEvents
        });
    } catch (error) {
        console.error('Get all events error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching events",
            error: error.message
        });
    }
};

// Get event by slug - FIXED
const getEventBySlug = async (req, res) => {
    try {
        const [events] = await pool.query(
            "SELECT * FROM event WHERE slug = ?",
            [req.params.slug]
        );

        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const event = events[0];
        
        // Image is already an object from Strapi
        let imageData = event.image;
        let imageUrl = null;
        
        if (imageData) {
            if (typeof imageData === 'string') {
                try {
                    imageData = JSON.parse(imageData);
                } catch (e) {
                    imageData = null;
                }
            }
            if (imageData && typeof imageData === 'object') {
                imageUrl = imageData.url || 
                          imageData.previewUrl || 
                          (imageData.formats && imageData.formats.thumbnail ? imageData.formats.thumbnail.url : null);
            }
        }
        
        // Tags
        let tagsData = event.tags;
        if (typeof tagsData === 'string') {
            try {
                tagsData = JSON.parse(tagsData);
            } catch (e) {
                tagsData = [];
            }
        }

        res.json({
            success: true,
            data: {
                ...event,
                image: imageData,
                tags: tagsData || [],
                imageUrl: imageUrl
            }
        });
    } catch (error) {
        console.error('Get event by slug error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching event"
        });
    }
};

// Create event (admin only)
const createEvent = async (req, res) => {
    try {
        const {
            title, slug, description, slogan, category, location, public: publicField,
            startDate, endDate, startTime, endTime, capacity,
            targetAudience, requirements, impact, objective,
            organizer, contact, accessibility, discipline, featured,
            isRegistrationOpen, tags
        } = req.body;

        // Check if slug exists
        const [existing] = await pool.query(
            "SELECT id FROM event WHERE slug = ?",
            [slug]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Event slug already exists"
            });
        }

        // Handle image upload - store as JSON object (Strapi format)
        let imageData = null;
        if (req.file) {
            const imageUrl = `${req.protocol}://${req.get("host")}/uploads/images/events/${req.file.filename}`;
            imageData = {
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

        // Parse tags if provided as string
        let tagsData = tags;
        if (typeof tags === 'string') {
            try {
                tagsData = JSON.parse(tags);
            } catch (e) {
                tagsData = tags.split(',').map(t => t.trim());
            }
        }

        const [result] = await pool.query(
            `INSERT INTO event (
                title, slug, description, slogan, category, location, public,
                startDate, endDate, startTime, endTime, capacity,
                targetAudience, requirements, impact, objective,
                organizer, contact, accessibility, discipline, featured,
                isRegistrationOpen, image, tags, createdAt, updatedAt, publishedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
            [
                title, slug, description, slogan, category, location, publicField,
                startDate, endDate, startTime, endTime, capacity,
                targetAudience, requirements, impact, objective,
                organizer, contact, accessibility, discipline, 
                featured || 0, isRegistrationOpen || 1,
                imageData, // Store as object, MySQL will convert to JSON
                tagsData || []
            ]
        );

        const [newEvent] = await pool.query(
            "SELECT * FROM event WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            data: newEvent[0]
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({
            success: false,
            message: "Error creating event",
            error: error.message
        });
    }
};

// Update event (admin only)
const updateEvent = async (req, res) => {
    try {
        const { slug } = req.params;
        const updates = req.body;

        // Get existing event
        const [existing] = await pool.query(
            "SELECT * FROM event WHERE slug = ?",
            [slug]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Handle image upload
        if (req.file) {
            const imageUrl = `${req.protocol}://${req.get("host")}/uploads/images/events/${req.file.filename}`;
            updates.image = {
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
            const oldImage = existing[0].image;
            if (oldImage && typeof oldImage === 'object' && oldImage.url) {
                const oldFilename = oldImage.url.split('/').pop();
                deleteImage(oldFilename);
            }
        }

        // Handle tags
        if (updates.tags) {
            if (typeof updates.tags === 'string') {
                try {
                    updates.tags = JSON.parse(updates.tags);
                } catch (e) {
                    updates.tags = updates.tags.split(',').map(t => t.trim());
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
            `UPDATE event SET ${updateFields.join(', ')}, updatedAt = NOW() WHERE slug = ?`,
            [...values, slug]
        );

        const [updated] = await pool.query(
            "SELECT * FROM event WHERE slug = ?",
            [slug]
        );

        res.json({
            success: true,
            message: "Event updated successfully",
            data: updated[0]
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            success: false,
            message: "Error updating event",
            error: error.message
        });
    }
};

// Delete event (admin only)
const deleteEvent = async (req, res) => {
    try {
        const { slug } = req.params;

        // Get event to delete image
        const [existing] = await pool.query(
            "SELECT image FROM event WHERE slug = ?",
            [slug]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Delete image if exists
        const imageData = existing[0].image;
        if (imageData && typeof imageData === 'object' && imageData.url) {
            const filename = imageData.url.split('/').pop();
            deleteImage(filename);
        }

        await pool.query(
            "DELETE FROM event WHERE slug = ?",
            [slug]
        );

        res.json({
            success: true,
            message: "Event deleted successfully"
        });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting event"
        });
    }
};

module.exports = {
    getAllEvents,
    getEventBySlug,
    createEvent,
    updateEvent,
    deleteEvent
};