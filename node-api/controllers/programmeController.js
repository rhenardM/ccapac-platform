const pool = require("../config/db");
const { deleteImage } = require("../utils/imageHelper");

// Récupérer tous les programmes
const getAllProgrammes = async (req, res) => {
    try {
        const filters = [];
        const values = [];

        if (["INTERNE", "EXTERNE"].includes(req.query.eventType)) {
            filters.push("eventType = ?");
            values.push(req.query.eventType);
        }

        if (req.query.published === "true") {
            filters.push("publicationStatus = 'PUBLISHED'");
        }

        const where = filters.length
            ? `WHERE ${filters.join(" AND ")}`
            : "";

        const [programmes] = await pool.query(
            `SELECT
                programmes.*,
                DATE_FORMAT(eventDate, '%Y-%m-%d') AS eventDate
             FROM programmes
             ${where}
             ORDER BY
                COALESCE(eventDate, DATE(createdAt)) DESC,
                createdAt DESC`,
            values
        );

        const formattedProgrammes = programmes.map((programme) => {
            let imageData = programme.image;
            let imageUrl = null;

            if (imageData) {
                if (typeof imageData === "string") {
                    try {
                        imageData = JSON.parse(imageData);
                    } catch {
                        imageData = null;
                    }
                }

                if (imageData && typeof imageData === "object") {
                    imageUrl =
                        imageData.url ||
                        imageData.previewUrl ||
                        imageData.formats?.thumbnail?.url ||
                        null;
                }
            }

            return {
                ...programme,
                image: imageData,
                imageUrl,
            };
        });

        return res.json({
            success: true,
            count: formattedProgrammes.length,
            data: formattedProgrammes,
        });
    } catch (error) {
        console.error("Get all programmes error:", error);

        return res.status(500).json({
            success: false,
            message: "Error fetching programmes",
            error: error.message,
        });
    }
};

// Récupérer un programme avec son identifiant numérique
const getProgrammeById = async (req, res) => {
    try {
        const [programmes] = await pool.query(
            `SELECT
                programmes.*,
                DATE_FORMAT(eventDate, '%Y-%m-%d') AS eventDate
             FROM programmes
             WHERE id = ?`,
            [req.params.id]
        );

        if (programmes.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Programme not found",
            });
        }

        const programme = programmes[0];
        let imageData = programme.image;
        let imageUrl = null;

        if (imageData) {
            if (typeof imageData === "string") {
                try {
                    imageData = JSON.parse(imageData);
                } catch {
                    imageData = null;
                }
            }

            if (imageData && typeof imageData === "object") {
                imageUrl =
                    imageData.url ||
                    imageData.previewUrl ||
                    imageData.formats?.thumbnail?.url ||
                    null;
            }
        }

        return res.json({
            success: true,
            data: {
                ...programme,
                image: imageData,
                imageUrl,
            },
        });
    } catch (error) {
        console.error("Get programme by id error:", error);

        return res.status(500).json({
            success: false,
            message: "Error fetching programme",
            error: error.message,
        });
    }
};

// Récupérer un programme avec son documentId
const getProgrammeByDocumentId = async (req, res) => {
    try {
        const [programmes] = await pool.query(
            `SELECT
                programmes.*,
                DATE_FORMAT(eventDate, '%Y-%m-%d') AS eventDate
             FROM programmes
             WHERE documentId = ?`,
            [req.params.documentId]
        );

        if (programmes.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Programme not found",
            });
        }

        const programme = programmes[0];
        let imageData = programme.image;
        let imageUrl = null;

        if (imageData) {
            if (typeof imageData === "string") {
                try {
                    imageData = JSON.parse(imageData);
                } catch {
                    imageData = null;
                }
            }

            if (imageData && typeof imageData === "object") {
                imageUrl =
                    imageData.url ||
                    imageData.previewUrl ||
                    imageData.formats?.thumbnail?.url ||
                    null;
            }
        }

        return res.json({
            success: true,
            data: {
                ...programme,
                image: imageData,
                imageUrl,
            },
        });
    } catch (error) {
        console.error("Get programme by documentId error:", error);

        return res.status(500).json({
            success: false,
            message: "Error fetching programme",
            error: error.message,
        });
    }
};

// Créer un programme depuis le calendrier
const createProgramme = async (req, res) => {
    try {
        const {
            documentId,
            slogan,
            Objective,
            Public,
            impact,
            publishedAt,
            title,
            author,
            eventType,
            eventDate,
            spaceId,
            publicationStatus,
        } = req.body;

        const allowedRoles = [
            "ADMIN",
            "PROGRAMME_SUPERVISEUR",
            "PROGRAMME_ASSISTANT",
        ];

        if (
            req.user?.role &&
            !allowedRoles.includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Vous n’êtes pas autorisé à créer un programme.",
            });
        }

        const normalizedTitle = String(
            title || slogan || ""
        ).trim();

        const normalizedAuthor = String(
            author || ""
        ).trim();

        const normalizedType = String(
            eventType || ""
        ).toUpperCase();

        /*
         * Ne pas utiliser new Date(eventDate) ici.
         * Une date MySQL de type DATE ne possède pas de fuseau horaire.
         * Conserver YYYY-MM-DD évite que le 07 octobre devienne le
         * 06 octobre lors d'une conversion UTC.
         */
        const normalizedDate = String(
            eventDate || ""
        ).slice(0, 10);

        const normalizedSpaceId = Number(spaceId);

        const normalizedPublicationStatus =
            publicationStatus === "DRAFT"
                ? "DRAFT"
                : "PUBLISHED";

        if (!normalizedTitle || !normalizedAuthor) {
            return res.status(400).json({
                success: false,
                message:
                    "Le titre et l’auteur sont obligatoires.",
            });
        }

        if (
            !["INTERNE", "EXTERNE"].includes(
                normalizedType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Le type doit être INTERNE ou EXTERNE.",
            });
        }

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(
                normalizedDate
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "La date de l’événement est invalide.",
            });
        }

        if (
            !Number.isInteger(normalizedSpaceId) ||
            normalizedSpaceId < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "L’espace sélectionné est invalide.",
            });
        }

        if (documentId) {
            const [existing] = await pool.query(
                "SELECT id FROM programmes WHERE documentId = ?",
                [documentId]
            );

            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Programme with this documentId already exists",
                });
            }
        }

        /*
         * Vérifier que l'espace n'est pas déjà utilisé par un autre
         * programme à cette date.
         */
        const [programmeConflict] = await pool.query(
            `SELECT id
             FROM programmes
             WHERE eventDate = ?
               AND spaceId = ?
             LIMIT 1`,
            [normalizedDate, normalizedSpaceId]
        );

        /*
         * Vérifier également les demandes de réservation déjà validées.
         */
        const [reservationConflict] = await pool.query(
            `SELECT id
             FROM space_requests
             WHERE DATE(desired_date) = ?
               AND space_id = ?
               AND status IN ('completed', 'confirmed')
             LIMIT 1`,
            [normalizedDate, normalizedSpaceId]
        );

        if (
            programmeConflict.length > 0 ||
            reservationConflict.length > 0
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Cet espace est déjà occupé à cette date.",
            });
        }

        let imageData = null;

        if (req.file) {
            const imageUrl =
                `${req.protocol}://${req.get("host")}` +
                `/uploads/images/programmes/${req.file.filename}`;

            imageData = JSON.stringify({
                id: Date.now(),
                name: req.file.originalname,
                url: imageUrl,
                size: req.file.size,
                ext:
                    req.file.originalname
                        .split(".")
                        .pop() || "",
                mime: req.file.mimetype,
                formats: {
                    thumbnail: {
                        url: imageUrl,
                        width: 200,
                        height: 200,
                    },
                },
            });
        }

        const generatedDocumentId =
            documentId || `calendar-${Date.now()}`;

        const publicationDate =
            publishedAt ||
            (normalizedPublicationStatus === "PUBLISHED"
                ? new Date()
                : null);

        const [result] = await pool.query(
            `INSERT INTO programmes (
                documentId,
                slogan,
                Objective,
                Public,
                impact,
                image,
                title,
                author,
                eventType,
                eventDate,
                spaceId,
                publicationStatus,
                createdBy,
                createdAt,
                updatedAt,
                publishedAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                NOW(), NOW(), ?
            )`,
            [
                generatedDocumentId,
                normalizedTitle,
                Objective || null,
                Public || normalizedType,
                impact || null,
                imageData,
                normalizedTitle,
                normalizedAuthor,
                normalizedType,
                normalizedDate,
                normalizedSpaceId,
                normalizedPublicationStatus,
                req.user?.id || null,
                publicationDate,
            ]
        );

        /*
         * DATE_FORMAT empêche le pilote MySQL de convertir la date
         * en objet JavaScript UTC.
         */
        const [newProgramme] = await pool.query(
            `SELECT
                programmes.*,
                DATE_FORMAT(eventDate, '%Y-%m-%d') AS eventDate
             FROM programmes
             WHERE id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Événement créé avec succès.",
            data: newProgramme[0],
        });
    } catch (error) {
        console.error("Create programme error:", error);

        return res.status(500).json({
            success: false,
            message: "Error creating programme",
            error: error.message,
        });
    }
};

// Modifier un programme
const updateProgramme = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        const [existing] = await pool.query(
            `SELECT
                programmes.*,
                DATE_FORMAT(eventDate, '%Y-%m-%d') AS eventDate
             FROM programmes
             WHERE id = ?`,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Programme not found",
            });
        }

        /*
         * Préserver la date sous la forme YYYY-MM-DD.
         */
        if (updates.eventDate) {
            const normalizedDate = String(
                updates.eventDate
            ).slice(0, 10);

            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    normalizedDate
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "La date de l’événement est invalide.",
                });
            }

            updates.eventDate = normalizedDate;
        }

        if (updates.eventType) {
            const normalizedType = String(
                updates.eventType
            ).toUpperCase();

            if (
                !["INTERNE", "EXTERNE"].includes(
                    normalizedType
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Le type doit être INTERNE ou EXTERNE.",
                });
            }

            updates.eventType = normalizedType;
        }

        if (req.file) {
            const imageUrl =
                `${req.protocol}://${req.get("host")}` +
                `/uploads/images/programmes/${req.file.filename}`;

            updates.image = JSON.stringify({
                id: Date.now(),
                name: req.file.originalname,
                url: imageUrl,
                size: req.file.size,
                ext:
                    req.file.originalname
                        .split(".")
                        .pop() || "",
                mime: req.file.mimetype,
                formats: {
                    thumbnail: {
                        url: imageUrl,
                        width: 200,
                        height: 200,
                    },
                },
            });

            let oldImage = existing[0].image;

            if (
                oldImage &&
                typeof oldImage === "string"
            ) {
                try {
                    oldImage = JSON.parse(oldImage);
                } catch {
                    oldImage = null;
                }
            }

            if (
                oldImage &&
                typeof oldImage === "object" &&
                oldImage.url
            ) {
                const oldFilename = oldImage.url
                    .split("/")
                    .pop();

                if (oldFilename) {
                    deleteImage(oldFilename);
                }
            }
        }

        /*
         * Liste blanche des champs modifiables pour éviter qu'un nom
         * de colonne arbitraire soit injecté dans la requête SQL.
         */
        const allowedFields = [
            "documentId",
            "slogan",
            "Objective",
            "Public",
            "impact",
            "image",
            "title",
            "author",
            "eventType",
            "eventDate",
            "spaceId",
            "publicationStatus",
            "publishedAt",
        ];

        const sanitizedUpdates = {};

        for (const field of allowedFields) {
            if (
                Object.prototype.hasOwnProperty.call(
                    updates,
                    field
                )
            ) {
                sanitizedUpdates[field] =
                    updates[field];
            }
        }

        const updateFields = Object.keys(
            sanitizedUpdates
        );

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields to update",
            });
        }

        const assignments = updateFields.map(
            (field) => `${field} = ?`
        );

        const values = updateFields.map(
            (field) => sanitizedUpdates[field]
        );

        await pool.query(
            `UPDATE programmes
             SET ${assignments.join(", ")},
                 updatedAt = NOW()
             WHERE id = ?`,
            [...values, id]
        );

        const [updated] = await pool.query(
            `SELECT
                programmes.*,
                DATE_FORMAT(eventDate, '%Y-%m-%d') AS eventDate
             FROM programmes
             WHERE id = ?`,
            [id]
        );

        return res.json({
            success: true,
            message: "Programme updated successfully",
            data: updated[0],
        });
    } catch (error) {
        console.error("Update programme error:", error);

        return res.status(500).json({
            success: false,
            message: "Error updating programme",
            error: error.message,
        });
    }
};

// Supprimer un programme
const deleteProgramme = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.query(
            "SELECT image FROM programmes WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Programme not found",
            });
        }

        let imageData = existing[0].image;

        if (
            imageData &&
            typeof imageData === "string"
        ) {
            try {
                imageData = JSON.parse(imageData);
            } catch {
                imageData = null;
            }
        }

        if (
            imageData &&
            typeof imageData === "object" &&
            imageData.url
        ) {
            const filename = imageData.url
                .split("/")
                .pop();

            if (filename) {
                deleteImage(filename);
            }
        }

        await pool.query(
            "DELETE FROM programmes WHERE id = ?",
            [id]
        );

        return res.json({
            success: true,
            message: "Programme deleted successfully",
        });
    } catch (error) {
        console.error("Delete programme error:", error);

        return res.status(500).json({
            success: false,
            message: "Error deleting programme",
            error: error.message,
        });
    }
};

module.exports = {
    getAllProgrammes,
    getProgrammeById,
    getProgrammeByDocumentId,
    createProgramme,
    updateProgramme,
    deleteProgramme,
};