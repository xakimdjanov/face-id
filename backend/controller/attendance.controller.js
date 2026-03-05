const { AttendanceLog } = require("../models");

exports.list = async (req, res) => {
  try {
    const { name = "main", limit = 100 } = req.query;

    const rows = await AttendanceLog.findAll({
      where: { deviceName: name },
      order: [["dateTime", "DESC"]],
      limit: Number(limit),
    });

    res.json({ success: true, rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
