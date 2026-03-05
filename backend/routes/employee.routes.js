// routes/employee.routes.js
const express = require("express");
const router = express.Router();
const employeeController = require("../controller/employee.controller");

// Barcha xodimlar
router.get("/", employeeController.getAllEmployees);

// Statistika
router.get("/statistics", employeeController.getStatistics);

// Hozir ishlayotganlar
router.get("/now-working", employeeController.getNowWorking);

// Ish vaqti bilan birga
router.get("/with-work-time", employeeController.getEmployeesWithWorkTime);

// Filterlash
router.get("/filter", employeeController.filterEmployees);

// Bitta xodim
router.get("/:id", employeeController.getEmployeeById);

// Ish vaqtini yangilash
router.put("/:id/work-time", employeeController.updateWorkTime);

module.exports = router;