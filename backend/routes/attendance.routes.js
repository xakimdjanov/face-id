// routes/attendance.routes.js
const express = require("express");
const router = express.Router();
const attendance = require("../controller/attendance.controller");

// GET /api/attendance - barcha loglar (filter bilan)
router.get("/", attendance.list);

// GET /api/attendance/daily - kunlik hisobot
router.get("/daily", attendance.dailyReport);

// GET /api/attendance/stats - statistika
router.get("/stats", attendance.stats);

// GET /api/attendance/user/:employeeNo - xodimning loglari
router.get("/user/:employeeNo", attendance.getUserLogs);

// POST /api/attendance - yangi log qo'shish (Hikvision dan)
router.post("/", attendance.create);

module.exports = router;