    // import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

    // const API = "http://localhost:2000";
    // const WS_URL = "ws://localhost:2000/ws/enroll";

    // function formatTime(dt) {
    // if (!dt) return "-";
    // try {
    //     const d = new Date(dt);
    //     return d.toLocaleString('uz-UZ', {
    //     year: 'numeric',
    //     month: '2-digit',
    //     day: '2-digit',
    //     hour: '2-digit',
    //     minute: '2-digit',
    //     second: '2-digit'
    //     });
    // } catch {
    //     return String(dt);
    // }
    // }

    // export default function Davomat() {
    // const [rows, setRows] = useState([]);
    // const [loading, setLoading] = useState(false);
    // const [err, setErr] = useState("");

    // // ENROLL modal
    // const [open, setOpen] = useState(false);
    // const [stepMsg, setStepMsg] = useState("");
    // const [enroll, setEnroll] = useState({
    //     name: "",
    //     employeeNo: "",
    //     cardNo: "",
    //     phone: "",
    //     department: "",
    // });
    // const [faceCaptured, setFaceCaptured] = useState(false);
    // const [enrollStarted, setEnrollStarted] = useState(false);
    // const [deviceStatus, setDeviceStatus] = useState("offline");
    // const [wsStatus, setWsStatus] = useState("disconnected");
    // const wsRef = useRef(null);
    // const reconnectTimerRef = useRef(null);
    // const reconnectAttempts = useRef(0);

    // // preview refresh key
    // const [previewTick, setPreviewTick] = useState(0);
    // const previewTimerRef = useRef(null);

    // const canConfirm = useMemo(() => {
    //     return (
    //     enroll.name.trim().length > 0 &&
    //     enroll.employeeNo.trim().length > 0 &&
    //     (enroll.cardNo.trim().length > 0 || faceCaptured)
    //     );
    // }, [enroll, faceCaptured]);

    // // WebSocket ulanish funksiyasi
    // const connectWebSocket = useCallback(() => {
    //     if (wsRef.current?.readyState === WebSocket.OPEN) {
    //     setWsStatus("connected");
    //     return;
    //     }

    //     if (wsRef.current) {
    //     try { wsRef.current.close(); } catch {}
    //     wsRef.current = null;
    //     }

    //     try {
    //     console.log("📡 WebSocket ga ulanmoqda:", WS_URL);
    //     setWsStatus("connecting");

    //     const ws = new WebSocket(WS_URL);
    //     wsRef.current = ws;

    //     const connectionTimeout = setTimeout(() => {
    //         if (ws.readyState !== WebSocket.OPEN) {
    //         console.log("⏱️ WebSocket ulanish vaqti tugadi");
    //         ws.close();
    //         setWsStatus("timeout");

    //         reconnectAttempts.current += 1;
    //         const delay = Math.min(1000 * reconnectAttempts.current, 10000);
    //         reconnectTimerRef.current = setTimeout(() => {
    //             connectWebSocket();
    //         }, delay);
    //         }
    //     }, 5000);

    //     ws.onopen = () => {
    //         clearTimeout(connectionTimeout);
    //         console.log("✅ WebSocket ulandi");
    //         setWsStatus("connected");
    //         reconnectAttempts.current = 0;

    //         ws.pingInterval = setInterval(() => {
    //         if (ws.readyState === WebSocket.OPEN) {
    //             ws.send(JSON.stringify({ type: "PING" }));
    //         }
    //         }, 30000);
    //     };

    //     ws.onclose = (event) => {
    //         clearTimeout(connectionTimeout);
    //         setWsStatus("disconnected");

    //         if (ws.pingInterval) clearInterval(ws.pingInterval);

    //         reconnectAttempts.current += 1;
    //         const delay = Math.min(1000 * reconnectAttempts.current, 10000);
    //         reconnectTimerRef.current = setTimeout(connectWebSocket, delay);
    //     };

    //     ws.onerror = (err) => {
    //         console.error("⚠️ WebSocket xato:", err);
    //         setWsStatus("error");
    //     };

    //     ws.onmessage = (evt) => {
    //         try {
    //         const msg = JSON.parse(evt.data);
    //         if (msg.type === "CARD" && msg.cardNo) {
    //             console.log("💳 Karta o'qildi:", msg.cardNo);
    //             setEnroll((p) => ({ ...p, cardNo: String(msg.cardNo) }));
    //             if (open) {
    //             setStepMsg("✅ Karta o‘qildi! Endi Capture face va Confirm bosing.");
    //             }
    //         }
    //         } catch (err) {
    //         console.error("WS message parse xatosi:", err);
    //         }
    //     };
    //     } catch (err) {
    //     console.error("WebSocket yaratish xatosi:", err);
    //     setWsStatus("error");
    //     }
    // }, [open]);

    // useEffect(() => {
    //     connectWebSocket();
    //     return () => {
    //     if (wsRef.current) {
    //         wsRef.current.close();
    //     }
    //     if (reconnectTimerRef.current) {
    //         clearTimeout(reconnectTimerRef.current);
    //     }
    //     if (wsRef.current?.pingInterval) {
    //         clearInterval(wsRef.current.pingInterval);
    //     }
    //     };
    // }, [connectWebSocket]);

    // useEffect(() => {
    //     if (open) {
    //     previewTimerRef.current = setInterval(() => {
    //         setPreviewTick((x) => x + 1);
    //     }, 700);
    //     }
    //     return () => {
    //     if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    //     };
    // }, [open]);

    // async function fetchAttendance() {
    //     setLoading(true);
    //     setErr("");
    //     try {
    //     const res = await fetch(`${API}/api/attendance?name=main&limit=100`);
    //     const data = await res.json();
    //     if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    //     setRows(data.rows || []);
    //     } catch (e) {
    //     setErr(e.message || "Ma'lumotlarni yuklashda xatolik");
    //     } finally {
    //     setLoading(false);
    //     }
    // }

    // async function pingDevice() {
    //     try {
    //     const res = await fetch(`${API}/api/device/ping`);
    //     const data = await res.json();
    //     setDeviceStatus(data.success ? "online" : "offline");
    //     } catch {
    //     setDeviceStatus("offline");
    //     }
    // }

    // useEffect(() => {
    //     fetchAttendance();
    //     pingDevice();
    //     const t = setInterval(() => {
    //     fetchAttendance();
    //     pingDevice();
    //     }, 10000);
    //     return () => clearInterval(t);
    // }, []);

    // function resetEnroll() {
    //     setEnroll({ name: "", employeeNo: "", cardNo: "", phone: "", department: "" });
    //     setFaceCaptured(false);
    //     setEnrollStarted(false);
    //     setStepMsg("");
    //     setErr("");
    // }

    // async function startEnroll() {
    //     setErr("");
    //     if (!enroll.name.trim() || !enroll.employeeNo.trim()) {
    //     setStepMsg("❌ Ism va EmployeeNo majburiy.");
    //     return;
    //     }

    //     try {
    //     const res = await fetch(`${API}/api/enroll/start`, {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({
    //         name: enroll.name.trim(),
    //         employeeNo: enroll.employeeNo.trim(),
    //         phone: enroll.phone?.trim() || undefined,
    //         department: enroll.department?.trim() || undefined,
    //         }),
    //     });

    //     const data = await res.json();
    //     if (!res.ok || !data.success) throw new Error(data.message || "Start xatosi");

    //     setEnrollStarted(true);
    //     setStepMsg("✅ Enroll boshlandi. Xodim qurilmaga qarasin yoki kartani tekkizsin.");
    //     } catch (e) {
    //     setErr(e.message);
    //     }
    // }

    // async function captureFace() {
    // setErr("");
    // if (!enrollStarted) {
    //     setErr("❌ Avval 'Start Enroll' tugmasini bosing!");
    //     return;
    // }

    // try {
    //     const url = `${API}/api/enroll/capture-face?employeeNo=${encodeURIComponent(enroll.employeeNo)}`;
        
    //     const res = await fetch(url, { method: "POST" });

    //     if (!res.ok) {
    //     const text = await res.text();
    //     throw new Error(`HTTP xato ${res.status}: ${text}`);
    //     }

    //     const contentType = res.headers.get("content-type") || "";
        
    //     if (contentType.includes("application/json")) {
    //     const data = await res.json();
    //     if (data.success) {
    //         // Backend allaqachon rasmni saqlab bo‘lgan → faceCaptured = true
    //         setFaceCaptured(true);
    //         setStepMsg("✅ Yuz rasmi qurilmadan olindi va serverda saqlandi");
    //         // Endi Confirm tugmasi faol bo‘ladi (chunki faceCaptured true)
    //         return;
    //     } else {
    //         throw new Error(data.message || "Backend xatosi");
    //     }
    //     }

    //     // Agar tasodifan rasm qaytsa (eski versiya uchun)
    //     const blob = await res.blob();
    //     if (blob.size < 2000) throw new Error("Juda kichik fayl");

    //     // Agar rasm kelsa → eski logikani davom ettirish mumkin
    //     // lekin hozirgi backend JSON qaytarayotgani uchun bu blok ishlamaydi

    // } catch (err) {
    //     console.error("captureFace xatosi:", err);
    //     setErr(err.message || "Yuzni olishda xatolik");
    // }
    // }

    // async function convertImageToWebM(imageBlob) {
    //     return new Promise((resolve, reject) => {
    //     const img = new Image();
    //     img.src = URL.createObjectURL(imageBlob);

    //     img.onload = () => {
    //         const canvas = document.createElement("canvas");
    //         canvas.width = img.width;
    //         canvas.height = img.height;
    //         const ctx = canvas.getContext("2d");
    //         ctx.drawImage(img, 0, 0);

    //         if (!canvas.captureStream && !canvas.mozCaptureStream) {
    //         reject(new Error("Bu brauzer captureStream ni qo‘llab-quvvatlamaydi"));
    //         return;
    //         }

    //         const stream = canvas.captureStream ? canvas.captureStream(1) : canvas.mozCaptureStream(1);

    //         const recorder = new MediaRecorder(stream, {
    //         mimeType: "video/webm;codecs=vp8,opus",
    //         });

    //         const chunks = [];

    //         recorder.ondataavailable = (e) => {
    //         if (e.data.size > 0) chunks.push(e.data);
    //         };

    //         recorder.onstop = () => {
    //         const blob = new Blob(chunks, { type: "video/webm" });
    //         resolve(blob);
    //         };

    //         recorder.onerror = (e) => reject(new Error("MediaRecorder xatosi: " + e.error));

    //         recorder.start(1000);
    //         setTimeout(() => recorder.stop(), 1500);
    //     };

    //     img.onerror = () => reject(new Error("Rasm yuklanmadi"));
    //     });
    // }

    // async function confirmAdd() {
    // try {
    //     const res = await fetch(`${API}/api/enroll/confirm`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //         employeeNo: enroll.employeeNo.trim(),
    //         name: enroll.name.trim(),
    //         cardNo: enroll.cardNo.trim() || undefined,
    //         phone: enroll.phone.trim() || undefined,
    //         department: enroll.department.trim() || undefined,
    //     }),
    //     });

    //     const data = await res.json();

    //     if (!res.ok || !data.success) {
    //     console.error("Confirm javobi:", data);
    //     setErr(data.message || `Server xatosi: ${res.status}`);
    //     return;
    //     }

    //     setStepMsg("✅ Xodim muvaffaqiyatli qo‘shildi!");
    //     resetEnroll();
    //     fetchAttendance(); // jadvalni yangilash

    // } catch (err) {
    //     console.error("confirmAdd xatosi:", err);
    //     setErr("Confirm jarayonida xatolik");
    // }
    // }

    // return (
    //     <div style={{ padding: "24px", fontFamily: "system-ui, sans-serif", maxWidth: 1400, margin: "0 auto" }}>
    //     {/* Header */}
    //     <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap" }}>
    //         <div>
    //         <h1 style={{ margin: 0, fontSize: "1.8rem" }}>📋 Davomat tizimi</h1>
    //         <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 14 }}>
    //             <span style={{
    //             padding: "4px 12px",
    //             background: deviceStatus === "online" ? "#e6f7e6" : "#ffebeb",
    //             borderRadius: 20,
    //             color: deviceStatus === "online" ? "#2e7d32" : "#c62828"
    //             }}>
    //             📡 Device: <b>{deviceStatus}</b>
    //             </span>
    //             <span style={{
    //             padding: "4px 12px",
    //             background: wsStatus === "connected" ? "#e6f7e6" : wsStatus === "connecting" ? "#fff3e0" : "#ffebeb",
    //             borderRadius: 20,
    //             color: wsStatus === "connected" ? "#2e7d32" : wsStatus === "connecting" ? "#ef6c00" : "#c62828"
    //             }}>
    //             🔌 WS: <b>{wsStatus === "connected" ? "Ulangan" : wsStatus === "connecting" ? "Ulanmoqda..." : wsStatus === "timeout" ? "Vaqt tugadi" : "Uzilgan"}</b>
    //             </span>
    //         </div>
    //         </div>

    //         <div style={{ display: "flex", gap: 12 }}>
    //         <button
    //             onClick={fetchAttendance}
    //             disabled={loading}
    //             style={{
    //             padding: "12px 20px",
    //             background: "#f0f0f0",
    //             border: "1px solid #ddd",
    //             borderRadius: 8,
    //             cursor: loading ? "wait" : "pointer"
    //             }}
    //         >
    //             {loading ? "⏳ Yuklanmoqda..." : "🔄 Yangilash"}
    //         </button>

    //         <button
    //             onClick={() => { resetEnroll(); setOpen(true); }}
    //             style={{
    //             padding: "12px 20px",
    //             background: "#2196f3",
    //             border: "none",
    //             borderRadius: 8,
    //             color: "white",
    //             cursor: "pointer"
    //             }}
    //         >
    //             + Yangi xodim qo'shish
    //         </button>
    //         </div>
    //     </div>

    //     {err && (
    //         <div style={{
    //         marginBottom: 20,
    //         padding: 16,
    //         background: "#ffebee",
    //         border: "1px solid #ffcdd2",
    //         borderRadius: 8,
    //         color: "#b71c1c"
    //         }}>
    //         ❌ {err}
    //         </div>
    //     )}

    //     {/* Jadval */}
    //     <div style={{ background: "white", borderRadius: 12, border: "1px solid #e0e0e0", overflow: "hidden" }}>
    //         <table style={{ width: "100%", borderCollapse: "collapse" }}>
    //         <thead>
    //             <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #e0e0e0" }}>
    //             <th style={{ padding: "16px", textAlign: "left" }}>Xodim</th>
    //             <th style={{ padding: "16px", textAlign: "left" }}>EmployeeNo</th>
    //             <th style={{ padding: "16px", textAlign: "left" }}>Karta raqami</th>
    //             <th style={{ padding: "16px", textAlign: "left" }}>Kirish vaqti</th>
    //             <th style={{ padding: "16px", textAlign: "left" }}>Eshik</th>
    //             </tr>
    //         </thead>
    //         <tbody>
    //             {rows.length > 0 ? (
    //             rows.map((r, i) => (
    //                 <tr key={i} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "white" : "#fafafa" }}>
    //                 <td style={{ padding: "14px 16px" }}>{r.name || "-"}</td>
    //                 <td style={{ padding: "14px 16px" }}>{r.employeeNo || "-"}</td>
    //                 <td style={{ padding: "14px 16px" }}>{r.cardNo || "-"}</td>
    //                 <td style={{ padding: "14px 16px" }}>{formatTime(r.dateTime)}</td>
    //                 <td style={{ padding: "14px 16px" }}>{r.doorNo || "Asosiy"}</td>
    //                 </tr>
    //             ))
    //             ) : (
    //             <tr>
    //                 <td colSpan={5} style={{ padding: "48px 16px", textAlign: "center", color: "#666" }}>
    //                 📭 Hozircha davomat ma'lumoti yo'q
    //                 </td>
    //             </tr>
    //             )}
    //         </tbody>
    //         </table>
    //     </div>

    //     {/* ======================== MODAL ======================== */}
    //     {open && (
    //         <div
    //         onClick={() => {
    //             if (window.confirm("Enroll bekor qilinsinmi?")) {
    //             setOpen(false);
    //             resetEnroll();
    //             }
    //         }}
    //         style={{
    //             position: "fixed",
    //             inset: 0,
    //             background: "rgba(0,0,0,0.5)",
    //             display: "flex",
    //             alignItems: "center",
    //             justifyContent: "center",
    //             padding: 20,
    //             zIndex: 1000
    //         }}
    //         >
    //         <div
    //             onClick={(e) => e.stopPropagation()}
    //             style={{
    //             width: "min(1100px, 100%)",
    //             maxHeight: "90vh",
    //             overflow: "auto",
    //             background: "white",
    //             borderRadius: 16,
    //             padding: 24,
    //             boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
    //             }}
    //         >
    //             {/* Modal header */}
    //             <div style={{
    //             display: "flex",
    //             justifyContent: "space-between",
    //             alignItems: "center",
    //             marginBottom: 20
    //             }}>
    //             <div>
    //                 <h2 style={{ margin: 0, fontSize: "1.5rem" }}>👤 Yangi xodim qo'shish</h2>
    //                 <p style={{ margin: "8px 0 0", color: "#666", fontSize: 14 }}>
    //                 {stepMsg || "Ma'lumotlarni to'ldiring"}
    //                 </p>
    //             </div>
    //             <button
    //                 onClick={() => {
    //                 setOpen(false);
    //                 resetEnroll();
    //                 }}
    //                 style={{
    //                 width: 40,
    //                 height: 40,
    //                 borderRadius: 20,
    //                 border: "1px solid #ddd",
    //                 background: "white",
    //                 cursor: "pointer",
    //                 fontSize: 18
    //                 }}
    //             >
    //                 ✕
    //             </button>
    //             </div>

    //             {/* Modal content - grid */}
    //             <div style={{
    //             display: "grid",
    //             gridTemplateColumns: "minmax(300px, 1fr) minmax(300px, 1fr)",
    //             gap: 24
    //             }}>
    //             {/* Chap taraf - Forma */}
    //             <div>
    //                 <div style={{ background: "#f9f9f9", borderRadius: 12, padding: 20 }}>
    //                 <div style={{ marginBottom: 16 }}>
    //                     <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
    //                     Ism *
    //                     </label>
    //                     <input
    //                     value={enroll.name}
    //                     onChange={(e) => setEnroll(p => ({ ...p, name: e.target.value }))}
    //                     placeholder="Masalan: Ali Valiyev"
    //                     style={{
    //                         width: "100%",
    //                         padding: "12px",
    //                         border: "1px solid #ddd",
    //                         borderRadius: 8,
    //                         fontSize: 14
    //                     }}
    //                     disabled={enrollStarted}
    //                     />
    //                 </div>

    //                 <div style={{ marginBottom: 16 }}>
    //                     <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
    //                     Employee No *
    //                     </label>
    //                     <input
    //                     value={enroll.employeeNo}
    //                     onChange={(e) => setEnroll(p => ({ ...p, employeeNo: e.target.value }))}
    //                     placeholder="Masalan: 1001"
    //                     style={{
    //                         width: "100%",
    //                         padding: "12px",
    //                         border: "1px solid #ddd",
    //                         borderRadius: 8,
    //                         fontSize: 14
    //                     }}
    //                     disabled={enrollStarted}
    //                     />
    //                 </div>

    //                 <div style={{ marginBottom: 16 }}>
    //                     <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
    //                     Karta raqami
    //                     <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>
    //                         (avtomatik tushadi)
    //                     </span>
    //                     </label>
    //                     <input
    //                     value={enroll.cardNo}
    //                     onChange={(e) => setEnroll(p => ({ ...p, cardNo: e.target.value }))}
    //                     placeholder="Kartani tekkizganda tushadi"
    //                     style={{
    //                         width: "100%",
    //                         padding: "12px",
    //                         border: "1px solid #ddd",
    //                         borderRadius: 8,
    //                         fontSize: 14,
    //                         background: enroll.cardNo ? "#e8f5e8" : "white"
    //                     }}
    //                     />
    //                     {wsStatus === "connected" && (
    //                     <small style={{ color: "#4caf50", display: "block", marginTop: 4 }}>
    //                         🟢 Karta tekkizishingiz mumkin
    //                     </small>
    //                     )}
    //                 </div>

    //                 <div style={{ marginBottom: 16 }}>
    //                     <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
    //                     Telefon
    //                     </label>
    //                     <input
    //                     value={enroll.phone}
    //                     onChange={(e) => setEnroll(p => ({ ...p, phone: e.target.value }))}
    //                     placeholder="+998 90 123 45 67"
    //                     style={{
    //                         width: "100%",
    //                         padding: "12px",
    //                         border: "1px solid #ddd",
    //                         borderRadius: 8,
    //                         fontSize: 14
    //                     }}
    //                     />
    //                 </div>

    //                 <div style={{ marginBottom: 20 }}>
    //                     <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
    //                     Bo'lim
    //                     </label>
    //                     <input
    //                     value={enroll.department}
    //                     onChange={(e) => setEnroll(p => ({ ...p, department: e.target.value }))}
    //                     placeholder="Masalan: IT, HR, Marketing"
    //                     style={{
    //                         width: "100%",
    //                         padding: "12px",
    //                         border: "1px solid #ddd",
    //                         borderRadius: 8,
    //                         fontSize: 14
    //                     }}
    //                     />
    //                 </div>

    //                 <div style={{
    //                     display: "flex",
    //                     gap: 12,
    //                     flexWrap: "wrap",
    //                     borderTop: "1px solid #eee",
    //                     paddingTop: 20
    //                 }}>
    //                     <button
    //                     onClick={startEnroll}
    //                     disabled={enrollStarted}
    //                     style={{
    //                         padding: "12px 20px",
    //                         background: enrollStarted ? "#ccc" : "#4caf50",
    //                         border: "none",
    //                         borderRadius: 8,
    //                         color: "white",
    //                         cursor: enrollStarted ? "not-allowed" : "pointer",
    //                         fontSize: 14,
    //                         fontWeight: 500
    //                     }}
    //                     >
    //                     🚀 {enrollStarted ? "Enroll boshlangan" : "Start Enroll"}
    //                     </button>

    //                     <button
    //                     onClick={captureFace}
    //                     disabled={!enrollStarted}
    //                     style={{
    //                         padding: "12px 20px",
    //                         background: !enrollStarted ? "#ccc" : "#ff9800",
    //                         border: "none",
    //                         borderRadius: 8,
    //                         color: "white",
    //                         cursor: !enrollStarted ? "not-allowed" : "pointer",
    //                         fontSize: 14,
    //                         fontWeight: 500
    //                     }}
    //                     >
    //                     📸 {faceCaptured ? "Face Captured ✓" : "Capture Face"}
    //                     </button>

    //                     <button
    //                     onClick={confirmAdd}
    //                     disabled={!canConfirm}
    //                     style={{
    //                         padding: "12px 20px",
    //                         background: !canConfirm ? "#ccc" : "#2196f3",
    //                         border: "none",
    //                         borderRadius: 8,
    //                         color: "white",
    //                         cursor: canConfirm ? "pointer" : "not-allowed",
    //                         fontSize: 14,
    //                         fontWeight: 500,
    //                         opacity: canConfirm ? 1 : 0.5
    //                     }}
    //                     >
    //                     ✅ Confirm + Add
    //                     </button>
    //                 </div>

    //                 <div style={{
    //                     marginTop: 16,
    //                     padding: 12,
    //                     background: "#f5f5f5",
    //                     borderRadius: 8,
    //                     fontSize: 13
    //                 }}>
    //                     <div style={{ display: "flex", gap: 16, justifyContent: "space-between" }}>
    //                     <span>👤 Face: {faceCaptured ? "✅ Captured" : "⏳"}</span>
    //                     <span>💳 Karta: {enroll.cardNo ? "✅ Bor" : "⏳"}</span>
    //                     <span>🚀 Start: {enrollStarted ? "✅" : "⏳"}</span>
    //                     </div>
    //                 </div>
    //                 </div>
    //             </div>

    //             {/* O'ng taraf - Device Preview */}
    //             <div>
    //                 <div style={{ background: "#f9f9f9", borderRadius: 12, padding: 20 }}>
    //                 <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
    //                     📹 Device Preview
    //                 </div>

    //                 <div style={{
    //                     width: "100%",
    //                     aspectRatio: "16/9",
    //                     background: "#1a1a1a",
    //                     borderRadius: 8,
    //                     overflow: "hidden",
    //                     border: "2px solid #333"
    //                 }}>
    //                     <img
    //                     alt="Device preview"
    //                     src={`${API}/api/enroll/preview.jpg?t=${previewTick}`}
    //                     style={{
    //                         width: "100%",
    //                         height: "100%",
    //                         objectFit: "cover",
    //                         display: "block"
    //                     }}
    //                     onError={(e) => {
    //                         e.target.style.opacity = "0.3";
    //                         e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23666' text-anchor='middle' dy='.3em'%3EPreview yo'q%3C/text%3E%3C/svg%3E";
    //                     }}
    //                     />
    //                 </div>

    //                 <div style={{ marginTop: 16, fontSize: 13, color: "#666" }}>
    //                     <p>✅ Xodim qurilmaga qaraganda rasm yangilanadi</p>
    //                     <p>✅ Kartani tekkizganda raqam avtomatik tushadi</p>
    //                     <div style={{
    //                     padding: "8px 12px",
    //                     background: wsStatus === "connected" ? "#e6f7e6" : "#ffebeb",
    //                     borderRadius: 20,
    //                     display: "inline-block",
    //                     marginTop: 8,
    //                     fontSize: 12
    //                     }}>
    //                     {wsStatus === "connected" ? "🟢 WebSocket ulangan" :
    //                     wsStatus === "connecting" ? "🟡 Ulanmoqda..." :
    //                     wsStatus === "error" ? "🔴 Xato" : "🔴 WebSocket uzilgan"}
    //                     </div>
    //                 </div>
    //                 </div>
    //             </div>
    //             </div>

    //             {/* Modal pastki qismi - eslatma */}
    //             <div style={{
    //             marginTop: 20,
    //             padding: 16,
    //             background: "#f0f7ff",
    //             borderRadius: 8,
    //             fontSize: 13,
    //             color: "#0066cc"
    //             }}>
    //             💡 Eslatma:
    //             <br />1. Avval "Start Enroll" tugmasini bosing
    //             <br />2. Xodim qurilmaga qarasin
    //             <br />3. Karta tekkizing (avtomatik tushadi)
    //             <br />4. "Capture Face" tugmasini bosing
    //             <br />5. "Confirm + Add" tugmasini bosing
    //             </div>
    //         </div>
    //         </div>
    //     )}
    //     </div>
    // );
    // }