const { DeviceConfig } = require("../models");
const { restartAlertStream } = require("../services/hikvision.service");
const https = require("https");

// node-fetch ni to'g'ri import qilish
let fetch;
try {
  fetch = require("node-fetch");
} catch (e) {
  try {
    fetch = require("node-fetch").default;
  } catch (err) {
    console.error("node-fetch o'rnatilmagan");
    if (globalThis.fetch) {
      fetch = globalThis.fetch;
    }
  }
}

exports.setConfig = async (req, res) => {
  try {
    const { name = "main", ip, username = "admin", password, streamEnabled = true } = req.body;

    const [cfg] = await DeviceConfig.findOrCreate({ where: { name }, defaults: { name } });

    if (ip !== undefined) cfg.ip = ip;
    if (username !== undefined) cfg.username = username;
    if (password !== undefined) cfg.password = password;
    if (streamEnabled !== undefined) cfg.streamEnabled = !!streamEnabled;

    await cfg.save();

    if (typeof restartAlertStream === 'function') {
      restartAlertStream();
    }

    res.json({
      success: true,
      message: "Device config saqlandi",
      config: { 
        name: cfg.name, 
        ip: cfg.ip, 
        username: cfg.username, 
        streamEnabled: cfg.streamEnabled 
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.ping = async (req, res) => {
  try {
    const cfg = await DeviceConfig.findOne({ where: { name: "main" } });
    if (!cfg || !cfg.ip) {
      return res.status(400).json({
        success: false,
        message: "Device IP yo‘q. /api/device/config orqali sozlang",
      });
    }

    const httpUrl = `http://${cfg.ip}`;
    const httpsUrl = `https://${cfg.ip}`;
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });

    let response = null;

    // HTTPS orqali urinish
    try {
      response = await fetch(httpsUrl, { 
        method: "HEAD",
        agent: httpsAgent, 
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      if (response && response.ok) {
        return res.json({ success: true, message: "Device online (HTTPS)" });
      }
    } catch (err) {
      response = null;
    }

    // HTTP orqali urinish
    try {
      response = await fetch(httpUrl, { 
        method: "HEAD",
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      if (response && response.ok) {
        return res.json({ success: true, message: "Device online (HTTP)" });
      }
    } catch (err) {
    }

    return res.json({ 
      success: false, 
      message: "Device offline yoki unreachable"
    });

  } catch (e) {
    console.error("[PING] Critical error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// Device status ni batafsil tekshirish - TUZATILGAN VERSIYA
exports.status = async (req, res) => {
  try {
    const cfg = await DeviceConfig.findOne({ where: { name: "main" } });
    if (!cfg || !cfg.ip) {
      return res.status(400).json({
        success: false,
        message: "Device IP yo‘q. /api/device/config orqali sozlang",
      });
    }

    const results = {
      ip: cfg.ip,
      http: null,
      https: null,
      isapi: null,
      ping: null
    };

    // Ping test
    const { exec } = require('child_process');
    const pingResult = await new Promise((resolve) => {
      const platform = process.platform;
      const pingCmd = platform === 'win32' ? `ping -n 1 ${cfg.ip}` : `ping -c 1 ${cfg.ip}`;
      
      exec(pingCmd, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, output: stderr || error.message });
        } else {
          resolve({ success: true, output: stdout });
        }
      });
    });
    results.ping = pingResult;

    // HTTPS test
    try {
      const agent = new https.Agent({ rejectUnauthorized: false });
      const httpsRes = await fetch(`https://${cfg.ip}`, { 
        method: "HEAD", 
        agent,
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      results.https = {
        success: true,
        status: httpsRes.status,
        statusText: httpsRes.statusText
      };
    } catch (e) {
      results.https = { success: false, error: e.message };
    }

    // HTTP test
    try {
      const httpRes = await fetch(`http://${cfg.ip}`, { 
        method: "HEAD", 
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      results.http = {
        success: true,
        status: httpRes.status,
        statusText: httpRes.statusText
      };
    } catch (e) {
      results.http = { success: false, error: e.message };
    }

    // ISAPI test - Digest Auth bilan (Hikvision uchun to'g'ri usul)
    try {
      // Hikvision ISAPI Digest authentication bilan ishlaydi
      const DigestFetch = require("digest-fetch").default;
      const client = new DigestFetch(cfg.username || "admin", cfg.password || "", { algorithm: "MD5" });
      
      const isapiRes = await client.fetch(`http://${cfg.ip}/ISAPI/System/status`, {
        method: "GET",
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      let data = null;
      let statusText = '';
      
      try {
        data = await isapiRes.text();
        statusText = isapiRes.statusText;
        
        // XML dan statusni olish
        const statusMatch = data.match(/<statusString>(.*?)<\/statusString>/);
        const deviceStatus = statusMatch ? statusMatch[1] : 'Unknown';
        
        results.isapi = {
          success: isapiRes.ok,
          status: isapiRes.status,
          statusText: statusText,
          deviceStatus: deviceStatus,
          dataLength: data.length
        };
      } catch (e) {
        results.isapi = {
          success: isapiRes.ok,
          status: isapiRes.status,
          statusText: statusText,
          error: "Data o'qishda xato: " + e.message
        };
      }
      
    } catch (e) {
      
      // Basic auth bilan urinish (fallback)
      try {
        const auth = Buffer.from(`${cfg.username || 'admin'}:${cfg.password || ''}`).toString('base64');
        const isapiRes = await fetch(`http://${cfg.ip}/ISAPI/System/status`, {
          method: "GET",
          timeout: 3000,
          headers: {
            'Authorization': `Basic ${auth}`,
            'User-Agent': 'Mozilla/5.0'
          }
        });
        
        let data = null;
        try {
          data = await isapiRes.text();
          results.isapi = {
            success: isapiRes.ok,
            status: isapiRes.status,
            statusText: isapiRes.statusText,
            dataLength: data ? data.length : 0,
            note: "Basic auth ishlatildi"
          };
        } catch (err) {
          results.isapi = {
            success: false,
            error: "Basic auth xato: " + err.message
          };
        }
      } catch (err2) {
        results.isapi = { 
          success: false, 
          error: "Digest Auth: " + e.message + ", Basic Auth: " + err2.message 
        };
      }
    }

    res.json({
      success: true,
      message: "Device status tekshirildi",
      results
    });

  } catch (e) {
    console.error("Status xato:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// Device ma'lumotlarini olish
exports.info = async (req, res) => {
  try {
    const cfg = await DeviceConfig.findOne({ where: { name: "main" } });
    if (!cfg || !cfg.ip) {
      return res.status(400).json({
        success: false,
        message: "Device IP yo‘q"
      });
    }

    const DigestFetch = require("digest-fetch").default;
    const client = new DigestFetch(cfg.username || "admin", cfg.password || "", { algorithm: "MD5" });
    
    // Device info olish
    const res1 = await client.fetch(`http://${cfg.ip}/ISAPI/System/deviceInfo`, {
      method: "GET",
      timeout: 5000
    });
    
    if (!res1.ok) {
      return res.json({ 
        success: false, 
        message: "Device info olish imkonsiz",
        status: res1.status 
      });
    }
    
    const data = await res1.text();
    
    // XML dan ma'lumotlarni olish
    const model = data.match(/<model>(.*?)<\/model>/);
    const serialNumber = data.match(/<serialNumber>(.*?)<\/serialNumber>/);
    const firmwareVersion = data.match(/<firmwareVersion>(.*?)<\/firmwareVersion>/);
    const deviceName = data.match(/<deviceName>(.*?)<\/deviceName>/);
    
    res.json({
      success: true,
      deviceInfo: {
        model: model ? model[1] : 'Unknown',
        serialNumber: serialNumber ? serialNumber[1] : 'Unknown',
        firmwareVersion: firmwareVersion ? firmwareVersion[1] : 'Unknown',
        deviceName: deviceName ? deviceName[1] : 'Unknown',
        ip: cfg.ip
      }
    });
    
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Test device connection
exports.testDevice = async (req, res) => {
  try {
    const cfg = await DeviceConfig.findOne({ where: { name: "main" } });
    if (!cfg || !cfg.ip) {
      return res.status(400).json({ success: false, message: "Device sozlanmagan" });
    }

    const results = {
      ping: false,
      status: false,
      users: false,
      error: null
    };

    // 1. Ping test
    try {
      const pingRes = await fetch(`http://${cfg.ip}`, { 
        method: "HEAD",
        timeout: 3000 
      });
      results.ping = pingRes.ok;
    } catch (e) {
      results.ping = false;
    }

    // 2. Status test
    try {
      const DigestFetch = require("digest-fetch").default;
      const client = new DigestFetch(cfg.username, cfg.password);
      const statusRes = await client.fetch(`http://${cfg.ip}/ISAPI/System/status`, {
        timeout: 5000
      });
      results.status = statusRes.ok;
      if (statusRes.ok) {
        const text = await statusRes.text();
      }
    } catch (e) {
      results.status = false;
      results.error = e.message;
    }

    // 3. Users list test
    try {
      const DigestFetch = require("digest-fetch").default;
      const client = new DigestFetch(cfg.username, cfg.password);
      const usersRes = await client.fetch(`http://${cfg.ip}/ISAPI/AccessControl/UserInfo/All?format=json`, {
        timeout: 5000
      });
      results.users = usersRes.ok;
    } catch (e) {
      results.users = false;
    }

    res.json({
      success: true,
      device: {
        ip: cfg.ip,
        username: cfg.username
      },
      results
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};  