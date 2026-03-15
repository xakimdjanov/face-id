// controllers/enroll.controller.js
const fsp = require("fs").promises;
const fsSync = require("fs"); // multer va existsSync uchun
const path = require("path");
const multer = require("multer");

const { DeviceConfig, Employee } = require("../models");
const {
  hvGetSnapshotJpeg,
  hvCreateUser,
  hvAddCard,
  hvUploadFace,
} = require("../services/hikvision.service");

// ────────────────────────────────────────────────
// Multer storage (faces folder)
// ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "faces");
    try {
      await fsp.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },

  filename: (req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase();

    let ext = path.extname(file.originalname || "");
    if (!ext) {
      if (mime === "image/jpeg" || mime === "image/jpg") ext = ".jpg";
      else if (mime === "image/png") ext = ".png";
      else if (mime === "video/webm") ext = ".webm";
      else ext = ".bin";
    }

    cb(null, `face_${Date.now()}${ext}`);
  },
});

// JPEG/PNG/WEBM qabul qilamiz (sizga kerak bo‘lsa webm ham)
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase();
    const allowed = ["image/jpeg", "image/jpg", "image/png", "video/webm"];
    if (allowed.includes(mime)) cb(null, true);
    else cb(new Error("Faqat JPEG/PNG/WEBM fayl qabul qilinadi"), false);
  },
});

// ────────────────────────────────────────────────
// Session storage
// ────────────────────────────────────────────────
const enrollSessions = new Map();

function getSession(sessionId) {
  const key = String(sessionId).trim();
  if (!enrollSessions.has(key)) {
    enrollSessions.set(key, {
      active: false,
      name: "",
      employeeNo: "",
      cardNo: "",
      phone: "",
      department: "",
      facePath: "",
      createdAt: Date.now(),
    });
  }
  return enrollSessions.get(key);
}

async function safeUnlink(p) {
  if (!p) return;
  try {
    await fsp.unlink(p);
  } catch {}
}

function cleanOldSessions() {
  const now = Date.now();
  for (const [id, session] of enrollSessions.entries()) {
    if (now - session.createdAt > 30 * 60 * 1000) {
      // 30 min
      if (session.facePath) safeUnlink(session.facePath);
      enrollSessions.delete(id);
    }
  }
}
setInterval(cleanOldSessions, 5 * 60 * 1000);

// ────────────────────────────────────────────────
// ENDPOINTS
// ────────────────────────────────────────────────

// POST /api/enroll/start
exports.start = async (req, res) => {
  try {
    const { name, employeeNo, phone, department } = req.body || {};

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Ism majburiy" });
    }
    if (!employeeNo?.trim()) {
      return res.status(400).json({ success: false, message: "EmployeeNo majburiy" });
    }

    const cfg = await DeviceConfig.findOne({ where: { name: "main" } });
    if (!cfg?.ip) {
      return res.status(400).json({ success: false, message: "Qurilma sozlanmagan (main.ip yo‘q)" });
    }

    const empNo = employeeNo.trim();
    const session = getSession(empNo);

    // eski rasm bo‘lsa o‘chiramiz
    if (session.facePath) await safeUnlink(session.facePath);

    session.active = true;
    session.name = name.trim();
    session.employeeNo = empNo;
    session.phone = phone?.trim() || "";
    session.department = department?.trim() || "";
    session.cardNo = "";
    session.facePath = "";
    session.createdAt = Date.now();

    res.json({
      success: true,
      message: "Enroll boshlandi",
      sessionId: empNo,
    });
  } catch (err) {
    console.error("[enroll:start]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/enroll/preview.jpg
exports.preview = async (req, res) => {
  try {
    const cfg = await DeviceConfig.findOne({ where: { name: "main" } });
    if (!cfg?.ip) {
      return res.status(400).send("Qurilma IP sozlanmagan");
    }

    const jpeg = await hvGetSnapshotJpeg(cfg);

    res.set({
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
      "Content-Length": jpeg.length,
    });

    res.end(jpeg);
  } catch (err) {
    console.error("[preview]", err.message);
    res.status(500).send("Preview olishda xatolik");
  }
};

// POST /api/enroll/capture-face?employeeNo=1001
exports.captureFace = async (req, res) => {
  try {
    const { employeeNo } = req.query || {};
    if (!employeeNo?.trim()) {
      return res.status(400).json({ success: false, message: "employeeNo kerak" });
    }

    const empNo = employeeNo.trim();
    const session = getSession(empNo);

    if (!session.active) {
      return res.status(400).json({
        success: false,
        message: "Avval /api/enroll/start endpointini chaqiring",
      });
    }

    const cfg = await DeviceConfig.findOne({ where: { name: "main" } });
    if (!cfg?.ip) {
      return res.status(400).json({ success: false, message: "Qurilma sozlanmagan" });
    }

    const jpeg = await hvGetSnapshotJpeg(cfg);
    if (!jpeg || jpeg.length < 2000) {
      throw new Error("Qurilmadan rasm olinmadi yoki juda kichik");
    }

    const dir = path.join(process.cwd(), "uploads", "faces");
    await fsp.mkdir(dir, { recursive: true });

    const filename = `face_${empNo}_${Date.now()}.jpg`;
    const filepath = path.join(dir, filename);

    await fsp.writeFile(filepath, jpeg);

    // eski rasm bo‘lsa o‘chiramiz
    if (session.facePath) await safeUnlink(session.facePath);

    session.facePath = filepath;

    res.json({
      success: true,
      message: "Yuz rasmi saqlandi",
      facePath: filepath,
      sizeKB: Number((jpeg.length / 1024).toFixed(1)),
    });
  } catch (err) {
    console.error("[capture-face]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/enroll/upload-webm   (form-data: faceFile, employeeNo)
exports.uploadFaceFile = [
  upload.single("faceFile"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Fayl yuklanmadi" });
      }

      const { employeeNo } = req.body || {};
      if (!employeeNo?.trim()) {
        await safeUnlink(req.file.path);
        return res.status(400).json({ success: false, message: "employeeNo majburiy" });
      }

      const empNo = employeeNo.trim();
      const session = getSession(empNo);

      if (!session.active) {
        await safeUnlink(req.file.path);
        return res.status(400).json({ success: false, message: "Enroll sessiyasi topilmadi (Start Enroll qiling)" });
      }

      // eski rasm bo‘lsa o‘chirish
      if (session.facePath) await safeUnlink(session.facePath);

      session.facePath = req.file.path;

      res.json({
        success: true,
        message: "Face fayl qabul qilindi",
        path: req.file.path,
        sizeKB: Number((req.file.size / 1024).toFixed(1)),
        mimetype: req.file.mimetype,
      });
    } catch (err) {
      if (req.file?.path) await safeUnlink(req.file.path);
      console.error("[upload-face-file]", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
];

// POST /api/enroll/confirm
exports.confirm = async (req, res) => {
  try {
    console.log("[confirm] body:", JSON.stringify(req.body, null, 2));

    const { employeeNo, name, cardNo, phone, department } = req.body || {};

    if (!employeeNo || typeof employeeNo !== "string" || !employeeNo.trim()) {
      return res.status(400).json({
        success: false,
        message: "employeeNo majburiy va string bo'lishi kerak",
      });
    }

    const empNo = employeeNo.trim();
    const session = getSession(empNo);

    console.log("[confirm] session active:", session?.active, "facePath:", session?.facePath || "yo‘q");

    if (!session || !session.active) {
      return res.status(400).json({
        success: false,
        message: "Sessiya topilmadi yoki faol emas. Avval 'Start Enroll' bosing",
      });
    }

    const cfg = await DeviceConfig.findOne({ where: { name: "main" } });
    if (!cfg?.ip) {
      return res.status(400).json({
        success: false,
        message: "Qurilma sozlanmagan (main konfiguratsiyasi yoki IP yo'q)",
      });
    }

    const finalName = (name?.trim() || session.name || "").trim();
    const finalCard = (cardNo?.trim() || session.cardNo || "").trim();
    const finalPhone = (phone?.trim() || session.phone || "").trim();
    const finalDept = (department?.trim() || session.department || "").trim();

    if (!finalName) {
      return res.status(400).json({ success: false, message: "Xodim ismi bo'sh bo'lmasligi kerak" });
    }

    if (!finalCard && !session.facePath) {
      return res.status(400).json({
        success: false,
        message: "Karta raqami yoki yuz rasmi kamida bittasi bo'lishi kerak",
      });
    }

    const results = { db: false, user: false, card: false, face: false };

    // 1) DB save/update
    try {
      const [employee, created] = await Employee.findOrCreate({
        where: { employeeNo: empNo },
        defaults: {
          employeeNo: empNo,
          name: finalName,
          cardNo: finalCard || null,
          phone: finalPhone || null,
          department: finalDept || null,
        },
      });

      if (!created) {
        const updates = {};
        if (finalName && employee.name !== finalName) updates.name = finalName;
        if (finalCard && employee.cardNo !== finalCard) updates.cardNo = finalCard;
        if (finalPhone && employee.phone !== finalPhone) updates.phone = finalPhone;
        if (finalDept && employee.department !== finalDept) updates.department = finalDept;

        if (Object.keys(updates).length > 0) await employee.update(updates);
      }

      results.db = true;
    } catch (dbErr) {
      console.error("[confirm:db]", dbErr.name, dbErr.message);

      if (dbErr.name === "SequelizeUniqueConstraintError") {
        const field = dbErr.errors?.[0]?.path || "unknown";
        const value = dbErr.errors?.[0]?.value || "unknown";
        return res.status(409).json({
          success: false,
          message: `Bu ${field} (${value}) allaqachon mavjud`,
          errorType: "duplicate_key",
          field,
          value,
        });
      }

      if (dbErr.name === "SequelizeValidationError") {
        const errors =
          dbErr.errors?.map((e) => ({
            field: e.path,
            message: e.message,
            value: e.value,
          })) || [];
        return res.status(400).json({
          success: false,
          message: "Ma'lumotlar validatsiyadan o'tmadi",
          errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Ma'lumotlar bazasiga saqlashda ichki xato",
        devError: dbErr.message,
      });
    }

    // 2) Device user create
    try {
      await hvCreateUser(cfg, { employeeNo: empNo, name: finalName });
      results.user = true;
    } catch (e) {
      results.userError = e.message;
      console.warn("[confirm:user]", e.message);
    }

    // 3) Device card add
    if (finalCard) {
      try {
        await hvAddCard(cfg, { employeeNo: empNo, cardNo: finalCard });
        results.card = true;
      } catch (e) {
        results.cardError = e.message;
        console.warn("[confirm:card]", e.message);
      }
    }

    // 4) Face upload
    if (session.facePath) {
      try {
        const exists = fsSync.existsSync(session.facePath);
        if (!exists) {
          results.faceError = "Face file topilmadi: " + session.facePath;
        } else {
          const st = await fsp.stat(session.facePath);

          // tavsiya: 1KB..400KB
          if (st.size < 1024) {
            results.faceError = `Face juda kichik: ${st.size} bytes`;
          } else if (st.size > 450 * 1024) {
            results.faceError = `Face juda katta: ${(st.size / 1024).toFixed(1)} KB (maks ~450KB)`;
          } else {
            await hvUploadFace(cfg, { employeeNo: empNo, imagePath: session.facePath });
            results.face = true;
          }
        }
      } catch (faceErr) {
        results.faceError = faceErr.message;
        console.warn("[confirm:face]", faceErr.message);
      }
    }

    // cleanup
    if (session.facePath) await safeUnlink(session.facePath);
    enrollSessions.delete(empNo);

    return res.json({
      success: true,
      message: "Xodim muvaffaqiyatli qo'shildi",
      results,
    });
  } catch (err) {
    console.error("[confirm] KATTA XATO:", err.message);
    console.error(err.stack);

    return res.status(500).json({
      success: false,
      message: "Server ichki xatosi yuz berdi",
      devError: err.message,
    });
  }
};

// POST /api/enroll/cancel  (body yoki query: employeeNo)
exports.cancel = async (req, res) => {
  try {
    const employeeNo = (req.body?.employeeNo || req.query?.employeeNo || "").trim();
    if (!employeeNo) {
      return res.status(400).json({ success: false, message: "employeeNo kerak" });
    }

    const session = enrollSessions.get(employeeNo);
    if (session?.facePath) await safeUnlink(session.facePath);

    enrollSessions.delete(employeeNo);

    res.json({ success: true, message: "Enroll bekor qilindi" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/enroll/state?employeeNo=1001
exports.getState = async (req, res) => {
  try {
    const employeeNo = String(req.query?.employeeNo || "").trim();
    if (!employeeNo) {
      return res.status(400).json({ success: false, message: "employeeNo kerak" });
    }

    const session = enrollSessions.get(employeeNo);
    const cfg = await DeviceConfig.findOne({ where: { name: "main" } });

    res.json({
      success: true,
      session: session || { active: false },
      device: cfg ? { ip: cfg.ip, username: cfg.username } : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
