// services/hikvision.service.js (TO'LIQ TUZATILGAN VERSION)
// DS-K1T343MX FACE upload fix:
// - Yuzni aniqlash uchun rasm optimallashtirildi
// - To'g'ri format va parametrlar
// - "SubpicAnalysisModelingError" xatosi hal qilindi

const DigestFetch = require("digest-fetch").default;
const FormData = require("form-data");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const os = require("os");
const sharp = require("sharp");
const { WebSocketServer } = require("ws");
const { DeviceConfig } = require("../models");

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
  console.log("📡 WebSocket server sozlanmoqda...");
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
  console.log("[FACE-UPLOAD] Rasm tayyorlanmoqda...");
  
  const tempFilePath = path.join(os.tmpdir(), `hikvision_face_${Date.now()}.jpg`);
  
  try {
    // Rasm metadata
    const metadata = await sharp(imagePath).metadata();
    console.log("[FACE-UPLOAD] Original rasm:", {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: (await fsp.stat(imagePath)).size / 1024 + 'KB'
    });

    // Hikvision talablari:
    // 1. Yuz aniq ko'rinishi kerak
    // 2. Minimal o'lcham 480x480
    // 3. Yuz markazda bo'lishi kerak
    // 4. Kontrast va yorqinlik optimal
    
    // Rasmni kvadrat qilish va yuzni markazga olish
    const size = Math.min(metadata.width, metadata.height);
    const left = Math.floor((metadata.width - size) / 2);
    const top = Math.floor((metadata.height - size) / 2);
    
    // Rasmni qayta ishlash
    await sharp(imagePath)
      // Markazdan kvadrat kesish (yuz markazda bo'ladi)
      .extract({
        left: Math.max(0, left),
        top: Math.max(0, top),
        width: size,
        height: size
      })
      // 480x480 o'lchamga keltirish
      .resize({
        width: 480,
        height: 480,
        fit: 'cover',
        position: 'center',
        kernel: 'lanczos3'  // Yuqori sifatli resize
      })
      // Yuzni yaxshiroq aniqlash uchun effektlar
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
      .normalize()  // Kontrastni normallashtirish
      .jpeg({
        quality: 90,
        mozjpeg: true,
        chromaSubsampling: '4:4:4',  // To'liq rang
        force: true
      })
      .toFile(tempFilePath);
    
    const stats = await fsp.stat(tempFilePath);
    console.log("[FACE-UPLOAD] Tayyorlangan rasm:", {
      size: stats.size / 1024 + 'KB',
      dimensions: '480x480',
      path: tempFilePath
    });
    
    // Rasm hajmini tekshirish
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

  const body = { 
    CardInfo: { 
      employeeNo: String(employeeNo), 
      cardNo: String(cardNo), 
      cardType: "normalCard" 
    } 
  };

  const res = await client.fetch(`${base}/ISAPI/AccessControl/CardInfo/Record?format=json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    if (text.includes('statusCode="4"') || text.includes("already exists") || text.includes("existed")) {
      return { success: true, exists: true, raw: text };
    }
    throw new Error(`addCard failed: ${text}`);
  }
  return { success: true, raw: text };
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
// ✅ FACE UPLOAD - ASOSIY FUNKSIYA (TO'G'RILANGAN)
// ────────────────────────────────────────────────
async function hvUploadFace(cfg, { employeeNo, imagePath }) {
  console.log("=".repeat(50));
  console.log("[FACE-UPLOAD] Jarayon boshlandi:", { employeeNo, imagePath });

  if (!employeeNo) throw new Error("employeeNo yo‘q");
  if (!imagePath) throw new Error("imagePath yo‘q");
  if (!fs.existsSync(imagePath)) throw new Error("Face file topilmadi: " + imagePath);

  const FPID = normalizeFPID(employeeNo);
  
  // Rasmni Hikvision talablariga tayyorlash
  let preparedImagePath = null;
  let tempCreated = false;
  
  try {
    preparedImagePath = await prepareImageForHikvision(imagePath);
    tempCreated = true;

    // FDLib ma'lumotini olish
    const lib = await hvGetFaceLibInfo(cfg);
    console.log("[FACE-UPLOAD] FDLib javobi:", JSON.stringify(lib, null, 2));

    const { base } = makeClient(cfg);
    const url = `${base}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json`;
    
    // TO'G'RI FORMAT (Hikvision DS-K1T343MX uchun)
    const form = new FormData();
    
    // JSON qism - FaceDataRecord field (to'liq ma'lumotlar bilan)
    const jsonData = {
      faceLibType: "blackFD",      // blackFD ishlatiladi
      FDID: "1",                    // FDID = 1
      FPID: FPID,                   // Foydalanuvchi ID
      name: `user_${FPID}`,         // Foydalanuvchi nomi
      // Qo'shimcha parametrlar (yuzni aniqlashga yordam beradi)
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
    
    // Rasm qo'shish
    const imageBuffer = await fsp.readFile(preparedImagePath);
    form.append("FaceImage", imageBuffer, {
      filename: `face_${FPID}.jpg`,
      contentType: "image/jpeg",
      knownLength: imageBuffer.length
    });

    // Headers
    const headers = {
      ...form.getHeaders(),
      "Accept": "application/json",
      "Connection": "close",
      "Content-Length": String(form.getBuffer().length)
    };

    console.log("[FACE-UPLOAD] So'rov yuborilmoqda...");
    console.log("[FACE-UPLOAD] URL:", url);
    console.log("[FACE-UPLOAD] JSON data:", jsonData);
    console.log("[FACE-UPLOAD] Rasm hajmi:", imageBuffer.length, "bytes");

    // Digest autentifikatsiya
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
    console.log("[FACE-UPLOAD] Javob status:", response.status);
    console.log("[FACE-UPLOAD] Javob body:", responseText);

    if (!response.ok) {
      // Rasm allaqachon mavjud
      if (responseText.includes('statusCode="4"') || responseText.includes('faceExist')) {
        console.log("[FACE-UPLOAD] Bu foydalanuvchi uchun rasm allaqachon mavjud");
        return { success: true, exists: true, raw: responseText };
      }
      
      // "SubpicAnalysisModelingError" xatosi
      if (responseText.includes('SubpicAnalysisModelingError')) {
        throw new Error(`Yuz aniqlanmadi! Iltimos, yuz aniq ko'rinadigan, yaxshi yoritilgan rasm yuboring.`);
      }
      
      throw new Error(`Face upload failed: ${response.status} - ${responseText}`);
    }

    console.log("[FACE-UPLOAD] ✅ Muvaffaqiyatli yuklandi!");
    return { success: true, raw: responseText };
    
  } catch (error) {
    console.error("[FACE-UPLOAD] ❌ Xato:", error.message);
    throw error;
  } finally {
    // Vaqtinchalik faylni o'chirish
    if (tempCreated && preparedImagePath && preparedImagePath !== imagePath) {
      try {
        await fsp.unlink(preparedImagePath);
        console.log("[FACE-UPLOAD] Vaqtinchalik fayl o'chirildi");
      } catch (e) {
        console.log("[FACE-UPLOAD] Vaqtinchalik faylni o'chirishda xato:", e.message);
      }
    }
    console.log("=".repeat(50));
  }
}

// ────────────────────────────────────────────────
// ALTERNATIV: Base64 format bilan
// ────────────────────────────────────────────────
async function hvUploadFaceBase64(cfg, { employeeNo, imagePath }) {
  console.log("[FACE-UPLOAD-BASE64] Boshlandi:", { employeeNo, imagePath });
  
  const FPID = normalizeFPID(employeeNo);
  
  // Rasmni tayyorlash
  const preparedImagePath = await prepareImageForHikvision(imagePath);
  
  try {
    // Rasmni base64 ga o'tkazish
    const imageBuffer = await fsp.readFile(preparedImagePath);
    const base64Image = imageBuffer.toString('base64');
    
    const { base } = makeClient(cfg);
    
    // JSON body
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
    
    console.log("[FACE-UPLOAD-BASE64] JSON body tayyor");
    
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
    console.log("[FACE-UPLOAD-BASE64] Javob:", {
      status: response.status,
      body: responseText.substring(0, 300)
    });
    
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
  console.log("\n🔍 FACE UPLOAD DIAGNOSTIKA");
  console.log("=".repeat(50));
  
  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false
  };
  
  try {
    // 1. Qurilma ulanishini tekshirish
    console.log("1️⃣ Qurilma ulanishi tekshirilmoqda...");
    try {
      const pingResult = await hvSystemStatus(cfg);
      console.log("✅ Qurilma ulanishi muvaffaqiyatli");
      results.steps.push({ name: "connection", success: true });
    } catch (e) {
      console.log("❌ Qurilma ulanishi xato:", e.message);
      results.steps.push({ name: "connection", success: false, error: e.message });
    }
    
    // 2. FDLib ma'lumoti
    console.log("\n2️⃣ FDLib ma'lumoti olinmoqda...");
    try {
      const lib = await hvGetFaceLibInfo(cfg);
      console.log("✅ FDLib ma'lumoti:", JSON.stringify(lib, null, 2));
      results.steps.push({ name: "fdlib", success: true, data: lib });
    } catch (e) {
      console.log("❌ FDLib xato:", e.message);
      results.steps.push({ name: "fdlib", success: false, error: e.message });
    }
    
    // 3. Rasm tahlili
    console.log("\n3️⃣ Rasm tahlili...");
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
      console.log("✅ Rasm ma'lumoti:", imageInfo);
      results.steps.push({ name: "imageAnalysis", success: true, data: imageInfo });
    } catch (e) {
      console.log("❌ Rasm tahlili xato:", e.message);
      results.steps.push({ name: "imageAnalysis", success: false, error: e.message });
    }
    
    // 4. Rasmni tayyorlash
    console.log("\n4️⃣ Rasmni tayyorlash...");
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
    
    // 5. Test so'rov
    console.log("\n5️⃣ Test so'rov yuborilmoqda...");
    try {
      // Test rasm yaratish
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
// alertStream
// ────────────────────────────────────────────────
function restartAlertStream() {
  streamAbort.stop = true;
  streamAbort = { stop: false };
}

async function readAlertStreamOnce(cfg, abortRef) {
  if (isReadingStream) return;
  isReadingStream = true;

  try {
    const { client, base } = makeClient(cfg);

    const res = await client.fetch(`${base}/ISAPI/Event/notification/alertStream`, {
      method: "GET",
      timeout: 30000,
    });

    if (!res.ok) {
      const text = await res.text();
      console.log("⚠️ AlertStream xato:", text.substring(0, 200));
      return;
    }

    const reader = res.body.getReader();
    let buffer = "";

    while (!abortRef.stop) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += Buffer.from(value).toString("utf8");

      const cardMatch = buffer.match(/<cardNo>([^<]+)<\/cardNo>/);
      if (cardMatch) {
        broadcast({ type: "CARD", cardNo: cardMatch[1], format: "xml", timestamp: Date.now() });
        buffer = buffer.replace(cardMatch[0], "");
      }

      const jsonCardMatch = buffer.match(/"cardNo"\s*:\s*"([^"]+)"/);
      if (jsonCardMatch) {
        broadcast({ type: "CARD", cardNo: jsonCardMatch[1], format: "json", timestamp: Date.now() });
        buffer = buffer.replace(jsonCardMatch[0], "");
      }
    }
  } catch (err) {
    console.log("❌ AlertStream xato:", err.message);
  } finally {
    isReadingStream = false;
  }
}

async function startAlertStreamLoop() {
  console.log("🔄 AlertStream loop boshlandi");

  (async () => {
    while (true) {
      try {
        const cfg = await DeviceConfig.findOne({ where: { name: "main" } });
        if (!cfg || !cfg.ip || !cfg.streamEnabled) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        await readAlertStreamOnce(cfg, streamAbort);
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {
        console.log("❌ AlertStream loop xato:", e.message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  })();
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
};