// routes/enroll.routes.js (o'zgarishsiz qoladi)
const express = require("express");
const router = express.Router();
const enrollController = require("../controller/enroll.controller");

router.post("/start", enrollController.start);
router.get("/preview.jpg", enrollController.preview);
router.post("/capture-face", enrollController.captureFace);
router.post("/upload-webm", enrollController.uploadFaceFile);
router.post("/confirm", enrollController.confirm);
router.post("/cancel", enrollController.cancel);
router.get("/state", enrollController.getState);

module.exports = router;