// services/hikvision.service.js (ATTENDANCE FIX VERSION)

const DigestFetch = require("digest-fetch").default;
const FormData = require("form-data");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const os = require("os");
const sharp = require("sharp");
const { WebSocketServer } = require("ws");
const { DeviceConfig, AttendanceLog, } = require("../models");
const { Op } = require("sequelize");

let wss = null;
let streamAbort = { stop: false };
let isReadingStream = false;

const crypto = require("crypto");

function md5(s) {
  return crypto.createHash("md5").update(s).digest("hex");
}

function parseWwwAuthenticate(hdr) {
  if (!hdr) return null;
  const s = hdr.replace(/^Digest\s+/i, "");
  const out = {};
  const re = /(\w+)=("([^"]*)"|([^\s,]+))/g;
  let m;
  while ((m = re.exec(s))) {
    const k = m[1];
    const v = m[3] ?? m[4] ?? "";
    out[k] = v;
  }
  return out;
}

function buildDigestAuth({ username, password, method, uri, challenge }) {
  const realm = challenge.realm;
  const nonce = challenge.nonce;
  const qop = (challenge.qop || "auth").split(",")[0].trim();
  const opaque = challenge.opaque;
  const algorithm = (challenge.algorithm || "MD5").toUpperCase();

  if (algorithm !== "MD5") {
    throw new Error("Digest algorithm MD5 emas: " + algorithm);
  }

  const nc = "00000001";
  const cnonce = crypto.randomBytes(8).toString("hex");

  const ha1 = md5(`${username}:${realm}:${password}`);
  const ha2 = md5(`${method}:${uri}`);
  const response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);

  let auth =
    `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", ` +
    `response="${response}", algorithm=MD5, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;

  if (opaque) auth += `, opaque="${opaque}"`;
  return auth;
}

// ────────────────────────────────────────────────
// WS
// ────────────────────────────────────────────────
function broadcast(obj) {
  if (!wss) return;
  const msg = JSON.stringify(obj);
  for (const c of wss.clients) {
    if (c.readyState === 1) c.send(msg);
  }
}

function attachWSS(server) {
  wss = new WebSocketServer({ server, path: "/ws/enroll" });

  wss.on("connection", (ws) => {
    console.log("🟢 Yangi WebSocket ulanish");
    ws.send(JSON.stringify({ type: "HELLO", message: "enroll ws connected" }));
    ws.on("close", () => console.log("🔴 WebSocket uzildi"));
    ws.on("error", (err) => console.log("⚠️ WebSocket xato:", err.message));
  });
}

// ────────────────────────────────────────────────
// Hikvision base client
// ────────────────────────────────────────────────
function makeClient(cfg) {
  if (!cfg?.ip) throw new Error("Device IP yo‘q");
  const base = `http://${cfg.ip}`;
  const client = new DigestFetch(cfg.username || "admin", cfg.password || "", {
    algorithm: "MD5",
  });
  return { client, base };
}

function normalizeFPID(employeeNo) {
  const n = parseInt(String(employeeNo), 10);
  if (Number.isNaN(n)) return String(employeeNo).trim();
  return String(n);
}

// ────────────────────────────────────────────────
// RASMNI TAYYORLASH (YUZNI ANIQLASH UCHUN OPTIMAL)
// ────────────────────────────────────────────────
async function prepareImageForHikvision(imagePath) {
  
  const tempFilePath = path.join(os.tmpdir(), `hikvision_face_${Date.now()}.jpg`);
  
  try {
    const metadata = await sharp(imagePath).metadata();

    const size = Math.min(metadata.width, metadata.height);
    const left = Math.floor((metadata.width - size) / 2);
    const top = Math.floor((metadata.height - size) / 2);
    
    await sharp(imagePath)
      .extract({
        left: Math.max(0, left),
        top: Math.max(0, top),
        width: size,
        height: size
      })
      .resize({
        width: 480,
        height: 480,
        fit: 'cover',
        position: 'center',
        kernel: 'lanczos3'
      })
      .sharpen({
        sigma: 1.2,
        m1: 0.5,
        m2: 0.8,
        x1: 2,
        y2: 10,
        y3: 20
      })
      .modulate({
        brightness: 1.05,
        contrast: 1.1,
        saturation: 1.05
      })
      .normalize()
      .jpeg({
        quality: 90,
        mozjpeg: true,
        chromaSubsampling: '4:4:4',
        force: true
      })
      .toFile(tempFilePath);
    
    const stats = await fsp.stat(tempFilePath);
    
    if (stats.size < 5000) {
      throw new Error("Rasm juda kichik (5KB dan kichik)");
    }
    if (stats.size > 200 * 1024) {
      throw new Error("Rasm juda katta (200KB dan katta)");
    }
    
    return tempFilePath;
    
  } catch (error) {
    console.error("[FACE-UPLOAD] Rasm tayyorlashda xato:", error);
    throw error;
  }
}

// ────────────────────────────────────────────────
// Simple APIs
// ────────────────────────────────────────────────
async function hvSystemStatus(cfg) {
  const { client, base } = makeClient(cfg);
  const res = await client.fetch(`${base}/ISAPI/System/status`, { method: "GET", timeout: 5000 });
  const text = await res.text();
  if (!res.ok) throw new Error(`Status xato: ${res.status} - ${text}`);
  return text;
}

async function hvGetDeviceInfo(cfg) {
  const { client, base } = makeClient(cfg);
  const res = await client.fetch(`${base}/ISAPI/System/deviceInfo`, { method: "GET", timeout: 8000 });
  const text = await res.text();
  if (!res.ok) throw new Error(`Device info failed: ${text}`);
  return text;
}

async function hvGetSnapshotJpeg(cfg) {
  const { client, base } = makeClient(cfg);
  const res = await client.fetch(`${base}/ISAPI/Streaming/channels/101/picture`, {
    method: "GET",
    timeout: 5000,
  });

  const buf = Buffer.from(await res.arrayBuffer());
  if (!res.ok || buf.length < 2000) throw new Error(`Snapshot failed: ${res.status}`);
  return buf;
}

// ────────────────────────────────────────────────
// User + Card
// ────────────────────────────────────────────────
async function hvCreateUser(cfg, { employeeNo, name }) {
  const { client, base } = makeClient(cfg);

  const body = {
    UserInfo: {
      employeeNo: String(employeeNo),
      name: String(name),
      userType: "normal",
      Valid: { 
        enable: true, 
        beginTime: "2020-01-01T00:00:00", 
        endTime: "2030-12-31T23:59:59" 
      },
    },
  };

  const res = await client.fetch(`${base}/ISAPI/AccessControl/UserInfo/Record?format=json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    if (text.includes('statusCode="4"') || text.includes("already exists") || text.includes("existed")) {
      return { success: true, exists: true, raw: text };
    }
    throw new Error(`createUser failed: ${text}`);
  }
  return { success: true, raw: text };
}

 async function hvAddCard(cfg, { employeeNo, cardNo }) {
  const { client, base } = makeClient(cfg);

  if (!employeeNo) {
    throw new Error("employeeNo required");
  }

  if (!cardNo) {
    throw new Error("cardNo required");
  }

  // Hikvision boshidagi nolni yomon ko‘radi 🙂
  const cleanCard = String(Number(cardNo));

  const body = {
    CardInfo: {
      employeeNo: String(employeeNo),
      cardNo: cleanCard,
      cardType: "normalCard",
    },
  };

  try {
    const res = await client.fetch(
      `${base}/ISAPI/AccessControl/CardInfo/Record?format=json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify(body),
        timeout: 10000,
      }
    );

    const text = await res.text();

    // 🔥 Hikvision ba'zida HTTP 200 bilan error yuboradi
    const lower = text.toLowerCase();

    if (
      lower.includes("statuscode") &&
      (lower.includes("invalid") ||
        lower.includes("error") ||
        lower.includes("<statuscode>4</statuscode>"))
    ) {
      throw new Error(text);
    }

    // ✅ success
    if (
      lower.includes("<statuscode>1</statuscode>") ||
      lower.includes('"statusCode":1') ||
      lower.includes("ok")
    ) {
      return { success: true };
    }

    // ✅ duplicate karta
    if (
      lower.includes("already exists") ||
      lower.includes("existed")
    ) {
      return { success: true, exists: true };
    }

    // fallback
    if (res.ok) {
      return { success: true, raw: text };
    }

    throw new Error(`addCard failed -> ${text}`);
  } catch (err) {
    console.error("❌ CARD ADD ERROR:", err.message);
    throw err;
  }
}


// ────────────────────────────────────────────────
// FDLib
// ────────────────────────────────────────────────
async function hvGetFaceLibInfo(cfg) {
  const { client, base } = makeClient(cfg);

  const res = await client.fetch(`${base}/ISAPI/Intelligent/FDLib?format=json`, {
    method: "GET",
    headers: { Accept: "application/json" },
    timeout: 8000,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`FDLib xato ${res.status}: ${text}`);

  try {
    const j = JSON.parse(text);
    const list = j?.FDLibList?.FDLib || j?.FDLib || j?.FDLibs || [];
    const first = Array.isArray(list) ? list[0] : list;
    const info = first?.FDLibInfo || first || {};

    return {
      FDID: String(info?.FDID ?? "1"),
      faceLibType: String(info?.faceLibType ?? "blackFD"),
      raw: j,
    };
  } catch {
    return { FDID: "1", faceLibType: "blackFD", raw: text };
  }
}

// ────────────────────────────────────────────────
// ✅ FACE UPLOAD
// ────────────────────────────────────────────────
async function hvUploadFace(cfg, { employeeNo, imagePath }) {

  if (!employeeNo) throw new Error("employeeNo yo‘q");
  if (!imagePath) throw new Error("imagePath yo‘q");
  if (!fs.existsSync(imagePath)) throw new Error("Face file topilmadi: " + imagePath);

  const FPID = normalizeFPID(employeeNo);
  
  let preparedImagePath = null;
  let tempCreated = false;
  
  try {
    preparedImagePath = await prepareImageForHikvision(imagePath);
    tempCreated = true;

    const lib = await hvGetFaceLibInfo(cfg);

    const { base } = makeClient(cfg);
    const url = `${base}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json`;
    
    const form = new FormData();
    
    const jsonData = {
      faceLibType: "blackFD",
      FDID: "1",
      FPID: FPID,
      name: `user_${FPID}`,
      gender: "unknown",
      age: 30,
      birthdate: "1990-01-01",
      enable: true,
      userType: "normal",
      valid: {
        enable: true,
        beginTime: "2020-01-01T00:00:00",
        endTime: "2030-12-31T23:59:59"
      }
    };
    
    form.append("FaceDataRecord", JSON.stringify(jsonData), {
      contentType: "application/json",
      filename: "blob"
    });
    
    const imageBuffer = await fsp.readFile(preparedImagePath);
    form.append("FaceImage", imageBuffer, {
      filename: `face_${FPID}.jpg`,
      contentType: "image/jpeg",
      knownLength: imageBuffer.length
    });

    const headers = {
      ...form.getHeaders(),
      "Accept": "application/json",
      "Connection": "close",
      "Content-Length": String(form.getBuffer().length)
    };

    const client = new DigestFetch(cfg.username || "admin", cfg.password || "", {
      algorithm: "MD5"
    });

    const response = await client.fetch(url, {
      method: "POST",
      headers: headers,
      body: form.getBuffer(),
      timeout: 30000
    });

    const responseText = await response.text();

    if (!response.ok) {
      if (responseText.includes('statusCode="4"') || responseText.includes('faceExist')) {
        return { success: true, exists: true, raw: responseText };
      }
      
      if (responseText.includes('SubpicAnalysisModelingError')) {
        throw new Error(`Yuz aniqlanmadi! Iltimos, yuz aniq ko'rinadigan, yaxshi yoritilgan rasm yuboring.`);
      }
      
      throw new Error(`Face upload failed: ${response.status} - ${responseText}`);
    }

    return { success: true, raw: responseText };
    
  } catch (error) {
    console.error("[FACE-UPLOAD] ❌ Xato:", error.message);
    throw error;
  } finally {
    if (tempCreated && preparedImagePath && preparedImagePath !== imagePath) {
      try {
        await fsp.unlink(preparedImagePath);
      } catch (e) {
        console.log("[FACE-UPLOAD] Vaqtinchalik faylni o'chirishda xato:", e.message);
      }
    }
  }
}

// ────────────────────────────────────────────────
// ALTERNATIV: Base64 format bilan
// ────────────────────────────────────────────────
async function hvUploadFaceBase64(cfg, { employeeNo, imagePath }) {
  
  const FPID = normalizeFPID(employeeNo);
  
  const preparedImagePath = await prepareImageForHikvision(imagePath);
  
  try {
    const imageBuffer = await fsp.readFile(preparedImagePath);
    const base64Image = imageBuffer.toString('base64');
    
    const { base } = makeClient(cfg);
    
    const jsonBody = {
      FaceDataRecord: {
        faceLibType: "blackFD",
        FDID: "1",
        FPID: FPID,
        name: `user_${FPID}`,
        enable: true,
        userType: "normal",
        FaceImage: {
          id: 1,
          data: base64Image
        }
      }
    };
    
    
    const client = new DigestFetch(cfg.username || "admin", cfg.password || "", {
      algorithm: "MD5"
    });
    
    const response = await client.fetch(
      `${base}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Connection": "close"
        },
        body: JSON.stringify(jsonBody),
        timeout: 30000
      }
    );
    
    const responseText = await response.text();

    
    if (!response.ok) {
      if (responseText.includes('statusCode="4"') || responseText.includes('faceExist')) {
        return { success: true, exists: true, raw: responseText };
      }
      throw new Error(`Face upload failed: ${response.status} - ${responseText}`);
    }
    
    return { success: true, raw: responseText };
    
  } finally {
    await fsp.unlink(preparedImagePath).catch(() => {});
  }
}

// ────────────────────────────────────────────────
// DIAGNOSTIKA FUNKSIYASI
// ────────────────────────────────────────────────
async function diagnoseFaceUpload(cfg, { employeeNo, imagePath }) {
  
  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false
  };
  
  try {
    console.log("1️⃣ Qurilma ulanishi tekshirilmoqda...");
    try {
      const pingResult = await hvSystemStatus(cfg);
      console.log("✅ Qurilma ulanishi muvaffaqiyatli");
      results.steps.push({ name: "connection", success: true });
    } catch (e) {
      console.log("❌ Qurilma ulanishi xato:", e.message);
      results.steps.push({ name: "connection", success: false, error: e.message });
    }
    
    try {
      const lib = await hvGetFaceLibInfo(cfg);
      results.steps.push({ name: "fdlib", success: true, data: lib });
    } catch (e) {
      results.steps.push({ name: "fdlib", success: false, error: e.message });
    }
    
    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = await fsp.stat(imagePath);
      const imageInfo = {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: (stats.size / 1024).toFixed(2) + 'KB',
        channels: metadata.channels
      };
      results.steps.push({ name: "imageAnalysis", success: true, data: imageInfo });
    } catch (e) {
      results.steps.push({ name: "imageAnalysis", success: false, error: e.message });
    }
    
    try {
      const preparedPath = await prepareImageForHikvision(imagePath);
      const preparedStats = await fsp.stat(preparedPath);
      console.log("✅ Rasm tayyorlandi:", (preparedStats.size / 1024).toFixed(2) + 'KB');
      await fsp.unlink(preparedPath).catch(() => {});
      results.steps.push({ name: "imagePreparation", success: true });
    } catch (e) {
      console.log("❌ Rasm tayyorlash xato:", e.message);
      results.steps.push({ name: "imagePreparation", success: false, error: e.message });
    }
    
    console.log("\n5️⃣ Test so'rov yuborilmoqda...");
    try {
      const testImage = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 200, g: 200, b: 200 }
        }
      })
      .jpeg()
      .toBuffer();
      
      const { base } = makeClient(cfg);
      const form = new FormData();
      
      form.append("FaceDataRecord", JSON.stringify({
        faceLibType: "blackFD",
        FDID: "1",
        FPID: "999999",
        name: "test_user"
      }), { contentType: "application/json" });
      
      form.append("FaceImage", testImage, {
        filename: "test.jpg",
        contentType: "image/jpeg"
      });
      
      const client = new DigestFetch(cfg.username || "admin", cfg.password || "");
      const testRes = await client.fetch(
        `${base}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json`,
        {
          method: "POST",
          headers: {
            ...form.getHeaders(),
            "Accept": "application/json",
            "Connection": "close"
          },
          body: form.getBuffer()
        }
      );
      
      const testText = await testRes.text();
      console.log("📥 Test javob:", {
        status: testRes.status,
        body: testText.substring(0, 200)
      });
      
      results.steps.push({ 
        name: "testRequest", 
        success: testRes.ok, 
        status: testRes.status,
        response: testText.substring(0, 100)
      });
      
      results.success = testRes.ok;
      
    } catch (e) {
      console.log("❌ Test so'rov xato:", e.message);
      results.steps.push({ name: "testRequest", success: false, error: e.message });
    }
    
    console.log("=".repeat(50));
    return results;
    
  } catch (error) {
    console.error("❌ Diagnostika xatosi:", error);
    results.error = error.message;
    return results;
  }
}

// ────────────────────────────────────────────────
// Users helpers
// ────────────────────────────────────────────────
async function hvGetUser(cfg, employeeNo) {
  const { client, base } = makeClient(cfg);

  const res = await client.fetch(`${base}/ISAPI/AccessControl/UserInfo/Search?format=json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ UserInfoSearch: { employeeNo: String(employeeNo) } }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Get user failed: ${text}`);
  return text;
}

async function hvGetAllUsers(cfg) {
  const { client, base } = makeClient(cfg);

  const res = await client.fetch(`${base}/ISAPI/AccessControl/UserInfo/All?format=json`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Get all users failed: ${text}`);
  return text;
}

async function hvDeleteUser(cfg, employeeNo) {
  const { client, base } = makeClient(cfg);

  const body = { EmployeeNoList: [String(employeeNo)] };

  const res = await client.fetch(`${base}/ISAPI/AccessControl/UserInfo/Delete?format=json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Delete user failed: ${text}`);
  return text;
}

async function hvGetFaceRecords(cfg) {
  const { client, base } = makeClient(cfg);
  const res = await client.fetch(`${base}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json`, {
    method: "GET",
    timeout: 8000,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Face records xato ${res.status}: ${text}`);
  return text;
}

// ────────────────────────────────────────────────
// ATTENDANCE EVENT PROCESSING (CHECK-IN/OUT VERSION)
// ────────────────────────────────────────────────
async function processEvent(event, cfg) {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🔍 DEBUG - Yangi event qabul qilindi:");
    console.log("=".repeat(60));
    
    // Event ma'lumotlarini olish
    const info = event?.AccessControllerEvent || event?.EventNotificationAlert || event;
    
    if (!info) {
      console.log("❌ Info topilmadi");
      return;
    }

    // Attendance eventlarini filter qilish (majorEventType=5 va subEventType=75)
    const majorEventType = info.majorEventType;
    const subEventType = info.subEventType;
    
    // Faqat attendance eventlarini olish (majorEventType=5, subEventType=75)
    if (majorEventType !== 5 || subEventType !== 75) {
      console.log(`⏭️ Attendance event emas (major=${majorEventType}, sub=${subEventType}), skip`);
      return;
    }

    console.log("✅ ATTENDANCE EVENT TOPILDI!");

    // Employee No ni olish
    let employeeNo = info.employeeNoString || info.employeeNo || info.userId || info.personId;
    
    if (!employeeNo) {
      console.log("❌ Employee No topilmadi");
      return;
    }

    // Name ni olish
    let name = info.name || info.employeeName || info.personName || info.userName || `User ${employeeNo}`;

    // Card No ni olish
    let cardNo = info.cardNo || null;

    // Door No ni olish
    let doorNo = info.doorNo || info.doorName || info.accessDoor || "1";

    // Date/Time ni olish
    let dateTime = event.dateTime || info.dateTime || info.currentTime || info.time || info.eventTime || new Date();
    const eventDate = new Date(dateTime);

    // Attendance status (checkIn/checkOut)
    let attendanceStatus = info.attendanceStatus || 'unknown';
    let label = info.label || '';

    // Verify mode
    let verifyMode = info.currentVerifyMode || info.verifyMode || info.authMode || 'unknown';

    console.log("\n📝 ATTENDANCE MA'LUMOTLARI:");
    console.log("-".repeat(40));
    console.log(`Employee: ${employeeNo} - ${name}`);
    console.log(`Status: ${attendanceStatus} (${label})`);
    console.log(`Vaqt: ${eventDate.toLocaleString()}`);
    console.log(`Verify mode: ${verifyMode}`);

    // Avvalgi loglarni tekshirish (bugungi kun uchun)
    const startOfDay = new Date(eventDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(eventDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Qidiruv oralig'i: ${startOfDay.toLocaleString()} - ${endOfDay.toLocaleString()}`);

    const existingLog = await AttendanceLog.findOne({
      where: { 
        employeeNo: String(employeeNo),
        dateTime: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      },
      order: [['dateTime', 'DESC']]
    });

    if (existingLog) {
      console.log(`Eski log topildi: ID=${existingLog.id}, Status=${existingLog.attendanceStatus}`);
    } else {
      console.log("Eski log topilmadi");
    }

    let log;

    if (attendanceStatus === 'checkIn') {
      // Check-in uchun
      log = await AttendanceLog.create({
        employeeNo: String(employeeNo),
        name: String(name).substring(0, 100),
        cardNo: cardNo ? String(cardNo) : null,
        doorNo: String(doorNo),
        dateTime: eventDate,
        deviceName: cfg?.name || "Hikvision Device",
        verifyMode: String(verifyMode),
        attendanceStatus: 'checkIn',
        checkInTime: eventDate,
        checkOutTime: null,
        label: String(label)
      });
      console.log(`✅ CHECK-IN saqlandi! ID: ${log.id}`);

    } else if (attendanceStatus === 'checkOut') {
      
      // Check-out uchun - agar bugun check-in qilgan bo'lsa, o'sha logga checkOutTime qo'shamiz
      if (existingLog && existingLog.attendanceStatus === 'checkIn' && !existingLog.checkOutTime) {
        // Eski logni yangilash
        await existingLog.update({
          checkOutTime: eventDate,
          attendanceStatus: 'checkOut',
          dateTime: eventDate,
          label: label || existingLog.label
        });
        console.log(`✅ CHECK-OUT yangilandi! Log ID: ${existingLog.id}`);
        log = existingLog;
      } else {
        // Agar check-in bo'lmasa, yangi log yaratish
        log = await AttendanceLog.create({
          employeeNo: String(employeeNo),
          name: String(name).substring(0, 100),
          cardNo: cardNo ? String(cardNo) : null,
          doorNo: String(doorNo),
          dateTime: eventDate,
          deviceName: cfg?.name || "Hikvision Device",
          verifyMode: String(verifyMode),
          attendanceStatus: 'checkOut',
          checkInTime: null,
          checkOutTime: eventDate,
          label: String(label)
        });
        console.log(`✅ CHECK-OUT saqlandi! ID: ${log.id}`);
      }
    } else {
      // Noma'lum status - oddiy log
      log = await AttendanceLog.create({
        employeeNo: String(employeeNo),
        name: String(name).substring(0, 100),
        cardNo: cardNo ? String(cardNo) : null,
        doorNo: String(doorNo),
        dateTime: eventDate,
        deviceName: cfg?.name || "Hikvision Device",
        verifyMode: String(verifyMode),
        attendanceStatus: 'unknown',
        checkInTime: null,
        checkOutTime: null,
        label: String(label)
      });
      console.log(`✅ Attendance log saqlandi! ID: ${log.id}`);
    }

    console.log("\n💾 SAQLANGAN MA'LUMOTLAR:");
    console.log("-".repeat(40));
    console.log(JSON.stringify({
      id: log.id,
      employeeNo: log.employeeNo,
      name: log.name,
      attendanceStatus: log.attendanceStatus,
      checkInTime: log.checkInTime ? new Date(log.checkInTime).toLocaleString() : null,
      checkOutTime: log.checkOutTime ? new Date(log.checkOutTime).toLocaleString() : null,
      dateTime: new Date(log.dateTime).toLocaleString(),
      label: log.label
    }, null, 2));

    // WebSocket orqali broadcast
    broadcast({
      type: "ATTENDANCE",
      payload: {
        id: log.id,
        employeeNo: log.employeeNo,
        name: log.name,
        cardNo: log.cardNo,
        doorNo: log.doorNo,
        dateTime: log.dateTime,
        deviceName: log.deviceName,
        verifyMode: log.verifyMode,
        attendanceStatus: log.attendanceStatus,
        checkInTime: log.checkInTime,
        checkOutTime: log.checkOutTime,
        label: log.label,
        createdAt: log.createdAt
      }
    });

    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ Event processing error:", error);
    console.error("Error stack:", error.stack);
    console.log("=".repeat(60) + "\n");
  }
}

// ────────────────────────────────────────────────
// ATTENDANCE LOGLARNI QO'LDA OLISH (SUBEVENTTYPE ASOSIDA FILTR)
// ────────────────────────────────────────────────
async function hvGetAttendanceLogs(cfg, startTime, endTime) {
  const { client, base } = makeClient(cfg);
  
  const body = {
    AccessControlEvent: {
      searchID: "1",
      searchResultPosition: 0,
      maxResults: 100,
      startTime: startTime || new Date(Date.now() - 24*60*60*1000).toISOString(),
      endTime: endTime || new Date().toISOString()
    }
  };
  
  console.log("📤 So'rov yuborilmoqda:", JSON.stringify(body, null, 2));
  
  const res = await client.fetch(`${base}/ISAPI/AccessControl/AccessEvent?format=json`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Accept": "application/json" 
    },
    body: JSON.stringify(body),
    timeout: 10000
  });
  
  const text = await res.text();
  console.log("📥 Javob status:", res.status);
  
  if (!res.ok) {
    console.log("❌ Xato javob:", text.substring(0, 200));
    throw new Error(`Get attendance logs failed: ${text}`);
  }
  
  try {
    const data = JSON.parse(text);
    console.log(`✅ ${data.AccessControlEvent?.InfoList?.length || 0} ta log topildi`);
    return data;
  } catch (e) {
    console.log("❌ JSON parse error:", e.message);
    return { raw: text };
  }
}

// ────────────────────────────────────────────────
// ALERT STREAM (DEBUG VERSION)
// ────────────────────────────────────────────────
async function readAlertStreamOnce(cfg) {
  if (isReadingStream) {
    console.log("⚠️ Stream allaqachon o'qilmoqda");
    return;
  }
  
  isReadingStream = true;
  const abortRef = streamAbort;

  console.log("📡 Hikvision alertStream ulanmoqda...", cfg.ip);

  try {
    const { client, base } = makeClient(cfg);

    const res = await client.fetch(
      `${base}/ISAPI/Event/notification/alertStream`,
      {
        method: "GET",
        timeout: 0,
        headers: {
          "Connection": "keep-alive",
          "Accept": "*/*",
          "Cache-Control": "no-cache"
        }
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.log("❌ Stream error:", res.status, errorText.substring(0, 200));
      return;
    }

    console.log("✅ AlertStream ulandi, ma'lumotlar kutilmoqda...");

    const contentType = res.headers.get("content-type") || "";
    let boundary = null;
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (boundaryMatch) {
      boundary = boundaryMatch[1] || boundaryMatch[2];
      console.log(`🔍 Detected boundary: --${boundary}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let eventCount = 0;

    while (!abortRef.stop) {
      const { value, done } = await reader.read();
      
      if (done) {
        console.log("📴 Stream tugadi (done)");
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      // Eventlarni qayta ishlash
      if (boundary) {
        const boundaryStr = `--${boundary}`;
        let boundaryIndex;
        
        while ((boundaryIndex = buffer.indexOf(boundaryStr)) !== -1) {
          const nextBoundaryIndex = buffer.indexOf(boundaryStr, boundaryIndex + boundaryStr.length);
          
          if (nextBoundaryIndex === -1) break;
          
          const part = buffer.substring(boundaryIndex + boundaryStr.length, nextBoundaryIndex).trim();
          
          // JSON ni topish
          const jsonStart = part.indexOf("{");
          if (jsonStart !== -1) {
            const possibleJson = part.substring(jsonStart);
            try {
              let cleanJson = possibleJson;
              const lastBrace = cleanJson.lastIndexOf("}");
              if (lastBrace !== -1) {
                cleanJson = cleanJson.substring(0, lastBrace + 1);
              }
              
              console.log(`\n📦 Part #${eventCount + 1} (${part.length} bytes)`);
              console.log("JSON:", cleanJson.substring(0, 200));
              
              const event = JSON.parse(cleanJson);
              eventCount++;
              console.log(`📨 Event #${eventCount} qabul qilindi`);
              await processEvent(event, cfg);
              
            } catch (e) {
              console.log("⚠️ JSON parse error:", e.message);
              console.log("Xatoli JSON:", possibleJson.substring(0, 100));
            }
          }
          
          buffer = buffer.substring(nextBoundaryIndex);
        }
      } else {
        // Boundary bo'lmasa, JSON larni ajratib olish
        let startIdx = 0;
        while ((startIdx = buffer.indexOf("{", startIdx)) !== -1) {
          let braceCount = 0;
          let endIdx = startIdx;
          
          for (let i = startIdx; i < buffer.length; i++) {
            if (buffer[i] === "{") braceCount++;
            if (buffer[i] === "}") braceCount--;
            if (braceCount === 0) {
              endIdx = i;
              break;
            }
          }
          
          if (braceCount !== 0) break;
          
          const jsonStr = buffer.substring(startIdx, endIdx + 1);
          try {
            const event = JSON.parse(jsonStr);
            eventCount++;
            console.log(`📨 Event #${eventCount} qabul qilindi`);
            await processEvent(event, cfg);
          } catch (e) {
            console.log("⚠️ JSON parse error:", e.message);
          }
          
          buffer = buffer.substring(endIdx + 1);
          startIdx = 0;
        }
      }
    }
    
    console.log(`📊 Jami qabul qilingan eventlar: ${eventCount}`);
    
  } catch (err) {
    console.log("❌ AlertStream xato:", err.message);
    console.log("Error stack:", err.stack);
  } finally {
    isReadingStream = false;
    console.log("🔄 AlertStream to'xtadi");
  }
}

// ────────────────────────────────────────────────
// ALERT STREAM (TO'LIQ TUZATILGAN)
// ────────────────────────────────────────────────
function restartAlertStream() {
  streamAbort.stop = true;
  streamAbort = { stop: false };
}

async function readAlertStreamOnce(cfg) {
  if (isReadingStream) {
    console.log("⚠️ Stream allaqachon o'qilmoqda");
    return;
  }
  
  isReadingStream = true;
  const abortRef = streamAbort;

  console.log("📡 Hikvision alertStream ulanmoqda...", cfg.ip);

  try {
    const { client, base } = makeClient(cfg);

    const res = await client.fetch(
      `${base}/ISAPI/Event/notification/alertStream`,
      {
        method: "GET",
        timeout: 0,
        headers: {
          "Connection": "keep-alive",
          "Accept": "*/*",
          "Cache-Control": "no-cache"
        }
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.log("❌ Stream error:", res.status, errorText.substring(0, 200));
      return;
    }

    console.log("✅ AlertStream ulandi, ma'lumotlar kutilmoqda...");

    const contentType = res.headers.get("content-type") || "";
    let boundary = null;
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (boundaryMatch) {
      boundary = boundaryMatch[1] || boundaryMatch[2];
      console.log(`🔍 Detected boundary: --${boundary}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let eventCount = 0;

    while (!abortRef.stop) {
      const { value, done } = await reader.read();
      
      if (done) {
        console.log("📴 Stream tugadi (done)");
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      // Eventlarni qayta ishlash
      if (boundary) {
        // Boundary bo'yicha ajratish
        const boundaryStr = `--${boundary}`;
        let boundaryIndex;
        
        while ((boundaryIndex = buffer.indexOf(boundaryStr)) !== -1) {
          const nextBoundaryIndex = buffer.indexOf(boundaryStr, boundaryIndex + boundaryStr.length);
          
          if (nextBoundaryIndex === -1) break;
          
          const part = buffer.substring(boundaryIndex + boundaryStr.length, nextBoundaryIndex).trim();
          
          // JSON ni topish
          const jsonStart = part.indexOf("{");
          if (jsonStart !== -1) {
            const possibleJson = part.substring(jsonStart);
            try {
              // JSON ni tozalash (oxiridagi ortiqcha belgilarni olib tashlash)
              let cleanJson = possibleJson;
              const lastBrace = cleanJson.lastIndexOf("}");
              if (lastBrace !== -1) {
                cleanJson = cleanJson.substring(0, lastBrace + 1);
              }
              
              const event = JSON.parse(cleanJson);
              eventCount++;
              console.log(`📨 Event #${eventCount} qabul qilindi`);
              await processEvent(event, cfg);
              
            } catch (e) {
              // JSON parse xatosi - debug uchun
              // console.log("⚠️ JSON parse error:", e.message);
            }
          }
          
          buffer = buffer.substring(nextBoundaryIndex);
        }
      } else {
        // Boundary bo'lmasa, JSON larni ajratib olish
        let startIdx = 0;
        while ((startIdx = buffer.indexOf("{", startIdx)) !== -1) {
          let braceCount = 0;
          let endIdx = startIdx;
          
          for (let i = startIdx; i < buffer.length; i++) {
            if (buffer[i] === "{") braceCount++;
            if (buffer[i] === "}") braceCount--;
            if (braceCount === 0) {
              endIdx = i;
              break;
            }
          }
          
          if (braceCount !== 0) break;
          
          const jsonStr = buffer.substring(startIdx, endIdx + 1);
          try {
            const event = JSON.parse(jsonStr);
            eventCount++;
            console.log(`📨 Event #${eventCount} qabul qilindi`);
            await processEvent(event, cfg);
          } catch (e) {
            // JSON parse xatosi
          }
          
          buffer = buffer.substring(endIdx + 1);
          startIdx = 0;
        }
      }
    }
    
    console.log(`📊 Jami qabul qilingan eventlar: ${eventCount}`);
    
  } catch (err) {
    console.log("❌ AlertStream xato:", err.message);
  } finally {
    isReadingStream = false;
    console.log("🔄 AlertStream to'xtadi");
  }
}

async function startAlertStreamLoop() {
  console.log("🔄 AlertStream loop boshlandi");

  (async () => {
    while (true) {
      try {
        const cfg = await DeviceConfig.findOne({ where: { name: "main" } });
        
        if (!cfg || !cfg.ip || !cfg.streamEnabled) {
          console.log("⏳ Device config topilmadi yoki stream o'chirilgan, 5 soniya kutish...");
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        
        if (!streamAbort.stop) {
          await readAlertStreamOnce(cfg);
        }
        
        // Qayta ulanishdan oldin pauza
        await new Promise((r) => setTimeout(r, 2000));
        
      } catch (e) {
        console.log("❌ AlertStream loop xato:", e.message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  })();
}

// ────────────────────────────────────────────────
// ATTENDANCE LOGLARNI QO'LDA OLISH
// ────────────────────────────────────────────────
async function hvGetAttendanceLogs(cfg, startTime, endTime) {
  const { client, base } = makeClient(cfg);
  
  const body = {
    AccessControlEvent: {
      searchID: "1",
      searchResultPosition: 0,
      maxResults: 100,
      startTime: startTime || new Date(Date.now() - 24*60*60*1000).toISOString(),
      endTime: endTime || new Date().toISOString()
    }
  };
  
  const res = await client.fetch(`${base}/ISAPI/AccessControl/AccessEvent?format=json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  
  const text = await res.text();
  if (!res.ok) throw new Error(`Get attendance logs failed: ${text}`);
  
  return JSON.parse(text);
}

// ────────────────────────────────────────────────
// EXPORTS
// ────────────────────────────────────────────────
module.exports = {
  attachWSS,
  startAlertStreamLoop,
  restartAlertStream,

  hvSystemStatus,
  hvGetSnapshotJpeg,
  hvGetDeviceInfo,

  hvCreateUser,
  hvAddCard,
  hvUploadFace,
  hvUploadFaceBase64,
  
  diagnoseFaceUpload,

  hvGetFaceLibInfo,
  hvGetFaceRecords,

  hvGetUser,
  hvGetAllUsers,
  hvDeleteUser,
  
  hvGetAttendanceLogs,
  readAlertStreamOnce
};