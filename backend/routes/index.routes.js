const express = require("express");
const router = express.Router();

const device = require("../controller/device.controller");
const attendance = require("../controller/attendance.controller");
const enroll = require("../controller/enroll.controller");

// device
router.post("/device/config", device.setConfig);
router.get("/device/ping", device.ping);
router.get("/device/status", device.status);
router.get("/device/info", device.info); 
router.get("/device/test", device.testDevice);

// attendance
router.get("/attendance", attendance.list);

module.exports = router;
