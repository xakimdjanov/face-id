// middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const authMiddleware = {
  verifyToken: async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: "Token topilmadi" 
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Foydalanuvchi topilmadi" 
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: "Foydalanuvchi bloklangan" 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: "Token noto'g'ri yoki muddati o'tgan" 
      });
    }
  },

  checkRole: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: "Avtorizatsiya qilinmagan" 
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: "Sizda bu amalni bajarish uchun huquq yo'q" 
        });
      }

      next();
    };
  }
};

module.exports = authMiddleware;