const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ success: false, message: "Token manquant" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.query("SELECT id,email,first_name,last_name,role FROM users WHERE id=?", [decoded.id]);
    if (!users.length) return res.status(401).json({ success: false, message: "Utilisateur non trouvé" });
    req.user = users[0]; next();
  } catch { return res.status(401).json({ success: false, message: "Token invalide ou expiré" }); }
};
const admin = (req,res,next) => req.user.role === "ADMIN" ? next() : res.status(403).json({success:false,message:"Accès administrateur requis"});
const authorize = (...roles) => (req,res,next) => !req.user ? res.status(401).json({success:false,message:"Non authentifié"}) : roles.includes(req.user.role) ? next() : res.status(403).json({success:false,message:"Accès refusé – rôle insuffisant"});
module.exports = { auth, admin, authorize };
