// controllers/enroll.controller.js
const fsp = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const multer = require("multer");

const { DeviceConfig, Employee } = require("../models");
const WorkTimeService = require("../services/workTime.service");
const {
  hvGetSnapshotJpeg,
  hvCreateUser,
  hvAddCard,
  hvUploadFace,
} = require("../services/hikvision.service");

// Multer storage
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

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase();
    const allowed = ["image/jpeg", "image/jpg", "image/png", "video/webm"];
    if (allowed.includes(mime)) cb(null, true);
    else cb(new Error("Faqat JPEG/PNG/WEBM fayl qabul qilinadi"), false);
  },
});

// Session storage (ish vaqti ma'lumotlari bilan)
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
      // Ish vaqti ma'lumotlari (frontendga yuborilmaydi)
      workStartTime: null,
      workEndTime: null,
      workDays: null,
      timezone: null
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
      if (session.facePath) safeUnlink(session.facePath);
      enrollSessions.delete(id);
    }
  }
}
setInterval(cleanOldSessions, 5 * 60 * 1000);

// START ENROLL - ish vaqti generatsiya qilinadi
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
      return res.status(400).json({ success: false, message: "Qurilma sozlanmagan" });
    }

    const empNo = employeeNo.trim();
    const session = getSession(empNo);

    // Eski rasm bo'lsa o'chirish
    if (session.facePath) await safeUnlink(session.facePath);

    // ISH VAQTINI AVTOMATIK GENERATSIYA QILISH
    const workTime = WorkTimeService.generateWorkTime({
      employeeNo: empNo,
      department: department?.trim() || ''
    });

    // Sessiyani ish vaqti bilan saqlash
    session.active = true;
    session.name = name.trim();
    session.employeeNo = empNo;
    session.phone = phone?.trim() || "";
    session.department = department?.trim() || "";
    session.cardNo = "";
    session.facePath = "";
    session.createdAt = Date.now();
    
    // Ish vaqti ma'lumotlari (frontendga yuborilmaydi)
    session.workStartTime = workTime.workStartTime;
    session.workEndTime = workTime.workEndTime;
    session.workDays = workTime.workDays;
    session.timezone = workTime.timezone;

    // Frontendga faqat asosiy ma'lumotlar ketadi (ish vaqti YO'Q)
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

// Preview
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

// Capture Face
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

    if (session.facePath) await safeUnlink(session.facePath);
    session.facePath = filepath;

    res.json({
      success: true,
      message: "Yuz rasmi saqlandi",
      sizeKB: Number((jpeg.length / 1024).toFixed(1)),
    });
  } catch (err) {
    console.error("[capture-face]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Upload Face File
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
        return res.status(400).json({ success: false, message: "Enroll sessiyasi topilmadi" });
      }

      if (session.facePath) await safeUnlink(session.facePath);
      session.facePath = req.file.path;

      res.json({
        success: true,
        message: "Face fayl qabul qilindi",
        sizeKB: Number((req.file.size / 1024).toFixed(1)),
      });
    } catch (err) {
      if (req.file?.path) await safeUnlink(req.file.path);
      console.error("[upload-face-file]", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
];

// controllers/enroll.controller.js ichidagi confirm funksiyasini shu qismini almashtiring:

exports.confirm = async (req, res) => {
  try {
    

    // 1. Frontenddan kelgan barcha maydonlarni sug'urib olamiz
    const { 
      employeeNo, 
      name, 
      cardNo, 
      phone, 
      department,
      workStartTime: frontendStartTime, // Modal orqali kelgan vaqtlar
      workEndTime: frontendEndTime,
      workDays: frontendWorkDays,
      timezone: frontendTimezone
    } = req.body || {};

    if (!employeeNo || typeof employeeNo !== "string" || !employeeNo.trim()) {
      return res.status(400).json({ success: false, message: "employeeNo majburiy" });
    }

    const empNo = employeeNo.trim();
    const session = getSession(empNo);

    if (!session || !session.active) {
      return res.status(400).json({
        success: false, 
        message: "Sessiya topilmadi yoki faol emas. Avval 'Start Enroll' bosing",
      });
    }

    const cfg = await DeviceConfig.findOne({ where: { name: "main" } });
    if (!cfg?.ip) {
      return res.status(400).json({ success: false, message: "Qurilma sozlanmagan" });
    }

    // 2. MA'LUMOTLARNI MERGE QILISH (Frontenddan kelgani bo'lsa shuni olamiz, bo'lmasa sessiyadagini)
    const finalName = (name?.trim() || session.name || "").trim();
    const finalCard = (cardNo?.trim() || session.cardNo || "").trim();
    const finalPhone = (phone?.trim() || session.phone || "").trim();
    const finalDept = (department?.trim() || session.department || "").trim();

    // Ish vaqti: Birinchi frontend (Modal), keyin sessiya, keyin avto-generatsiya
    const finalStartTime = frontendStartTime || session.workStartTime || "09:00";
    const finalEndTime = frontendEndTime || session.workEndTime || "18:00";
    const finalDays = frontendWorkDays || session.workDays || [1, 2, 3, 4, 5];
    const finalTZ = frontendTimezone || session.timezone || "Asia/Tashkent";

    if (!finalName) {
      return res.status(400).json({ success: false, message: "Xodim ismi bo'sh bo'lmasligi kerak" });
    }

    const results = { db: false, user: false, card: false, face: false };

    // 3) DB saqlash (To'g'rilangan maydonlar bilan)
    try {
      const [employee, created] = await Employee.findOrCreate({
        where: { employeeNo: empNo },
        defaults: {
          employeeNo: empNo,
          name: finalName,
          cardNo: finalCard || null,
          phone: finalPhone || null,
          department: finalDept || null,
          workStartTime: finalStartTime,
          workEndTime: finalEndTime,
          workDays: finalDays,
          timezone: finalTZ
        },
      });

      if (!created) {
        // Agar xodim allaqachon bo'lsa, yangilaymiz
        await employee.update({
          name: finalName,
          cardNo: finalCard || null,
          phone: finalPhone || null,
          department: finalDept || null,
          workStartTime: finalStartTime,
          workEndTime: finalEndTime,
          workDays: finalDays,
          timezone: finalTZ
        });
      }

      results.db = true;
    } catch (dbErr) {
      console.error("[confirm:db] XATO:", dbErr);
      return res.status(500).json({ success: false, message: "Bazaga saqlashda xato: " + dbErr.message });
    }

    // 4) Qurilmaga yuborish (Hikvision)
    try {
      await hvCreateUser(cfg, { employeeNo: empNo, name: finalName });
      results.user = true;
      
      if (finalCard) {
        await hvAddCard(cfg, { employeeNo: empNo, cardNo: finalCard });
        results.card = true;
      }

      if (session.facePath && fsSync.existsSync(session.facePath)) {
        await hvUploadFace(cfg, { employeeNo: empNo, imagePath: session.facePath });
        results.face = true;
      }
    } catch (deviceErr) {
      console.warn("[confirm:device] Qurilma bilan ishlashda xato:", deviceErr.message);
      results.deviceError = deviceErr.message;
      // Eslatma: Qurilmada xato bo'lsa ham DBga yozildi, shuning uchun 200 qaytaramiz yoki xato haqida ogohlantiramiz
    }

    // Cleanup
    if (session.facePath) await safeUnlink(session.facePath);
    enrollSessions.delete(empNo);

    return res.json({
      success: true,
      message: "Xodim muvaffaqiyatli qo'shildi",
      results,
    });

  } catch (err) {
    console.error("[confirm] GLOBAL XATO:", err);
    return res.status(500).json({ success: false, message: "Serverda kutilmagan xato yuz berdi" });
  }
};

// Cancel
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

// Get State
exports.getState = async (req, res) => {
  try {
    const employeeNo = String(req.query?.employeeNo || "").trim();
    if (!employeeNo) {
      return res.status(400).json({ success: false, message: "employeeNo kerak" });
    }

    const session = enrollSessions.get(employeeNo);
    const cfg = await DeviceConfig.findOne({ where: { name: "main" } });

    // Sessiyadan ish vaqti ma'lumotlarini olib tashlash (frontendga ko'rinmasligi uchun)
    const sessionForFrontend = session ? {
      active: session.active,
      name: session.name,
      employeeNo: session.employeeNo,
      cardNo: session.cardNo,
      phone: session.phone,
      department: session.department,
      hasFace: !!session.facePath,
      createdAt: session.createdAt
      // workStartTime, workEndTime, workDays, timezone yuborilmaydi
    } : { active: false };

    res.json({
      success: true,
      session: sessionForFrontend,
      device: cfg ? { ip: cfg.ip, username: cfg.username } : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};