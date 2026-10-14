require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");

const { verifyMailer } = require("./utils/mailer");
const {
  cloudinary,
  isCloudinaryConfigured,
} = require("./config/cloudinary");

const app = express();

app.use(morgan("dev"));

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://centreculturel.cd",
  "https://www.centreculturel.cd",
  "https://site-public-reservation.vercel.app",
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map((origin) =>
    String(origin)
      .replace(/\/+$/, "")
      .toLowerCase()
  );

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin
      .replace(/\/+$/, "")
      .toLowerCase();

    const isExplicitlyAllowed =
      allowedOrigins.includes(normalizedOrigin);

    const isVercelOrigin =
      normalizedOrigin.startsWith("https://") &&
      normalizedOrigin.endsWith(".vercel.app");

    if (isExplicitlyAllowed || isVercelOrigin) {
      return callback(null, true);
    }

    console.error(
      "Origine CORS refusée :",
      normalizedOrigin
    );

    return callback(
      new Error(
        `Origine CORS non autorisée : ${normalizedOrigin}`
      )
    );
  },
  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);
app.use(cookieParser());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.get(
  "/uploads/space-requests/:filename",
  (req, res, next) => {
    if (!isCloudinaryConfigured()) {
      return next();
    }

    const filename = path.basename(
      String(req.params.filename || "")
    );

    if (
      !filename ||
      !/^[a-zA-Z0-9_.-]+$/.test(filename)
    ) {
      return res.status(400).json({
        success: false,
        message: "Nom de document invalide.",
      });
    }

    const publicId =
      `ccapac/space-requests/${filename}`;

    const cloudinaryUrl = cloudinary.url(
      publicId,
      {
        resource_type: "raw",
        type: "upload",
        secure: true,
      }
    );

    return res.redirect(302, cloudinaryUrl);
  }
);

app.get("/", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "CCAPAC Backend API Running",
  });
});

app.get("/api/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "API opérationnelle",
    timestamp: new Date().toISOString(),
    documentStorage:
      isCloudinaryConfigured()
        ? "cloudinary"
        : "local-unconfigured",
  });
});

app.use(
  "/api/agenda",
  require("./routes/agendaRoutes")
);

app.use(
  "/api/actualites",
  require("./routes/actualiteRoutes")
);

app.use(
  "/api/galleries",
  require("./routes/galleryRoutes")
);

app.use(
  "/api/programmes",
  require("./routes/programmeRoutes")
);

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use(
  "/api/space-requests",
  require("./routes/spaceRequestRoutes")
);

// Propositions culturelles transmises par les membres.
app.use(
  "/api/project-proposals",
  require("./routes/projectProposalRoutes")
);

app.use(
  "/api/auth/supervisor",
  require("./routes/supervisorRoutes")
);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route API introuvable",
    method: req.method,
    path: req.originalUrl,
  });
});

app.use((error, _req, res, next) => {
  console.error("Unhandled server error:", {
    message: error.message,
    stack: error.stack,
  });

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    success: false,
    message: "Erreur interne du serveur.",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : undefined,
  });
});

void verifyMailer();

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(
    `Space requests: http://localhost:${PORT}/api/space-requests`
  );
  console.log(
    `Project proposals: http://localhost:${PORT}/api/project-proposals`
  );
  console.log(
    "Frontend autorisé :",
    process.env.FRONTEND_URL ||
      "aucune variable FRONTEND_URL"
  );
  console.log(
    "Stockage des documents :",
    isCloudinaryConfigured()
      ? "Cloudinary"
      : "NON CONFIGURÉ"
  );
});
