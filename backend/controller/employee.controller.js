// controllers/employee.controller.js
const { Employee } = require("../models");
const WorkTimeService = require("../services/workTime.service");
const { Op } = require("sequelize");

// Barcha xodimlarni olish (ish vaqti bilan birga - faqat admin API)
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      order: [["createdAt", "DESC"]]
    });
    
    res.json({
      success: true,
      employees
    });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xodimlarni ish vaqti statistikasi bilan olish
exports.getEmployeesWithWorkTime = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      order: [["createdAt", "DESC"]]
    });
    
    const employeesWithStatus = employees.map(emp => {
      const workStatus = WorkTimeService.checkCurrentWorkTime(emp);
      return {
        ...emp.toJSON(),
        workStatus
      };
    });
    
    const statistics = WorkTimeService.getWorkTimeStatistics(employees);
    
    res.json({
      success: true,
      employees: employeesWithStatus,
      statistics
    });
  } catch (error) {
    console.error("Get employees with work time error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xodimni ID bo'yicha olish
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    
    if (!employee) {
      return res.status(404).json({ success: false, message: "Xodim topilmadi" });
    }
    
    const workStatus = WorkTimeService.checkCurrentWorkTime(employee);
    
    res.json({
      success: true,
      employee: {
        ...employee.toJSON(),
        workStatus
      }
    });
  } catch (error) {
    console.error("Get employee by id error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xodimlarni filterlash
exports.filterEmployees = async (req, res) => {
  try {
    const { department, status, workStart, workEnd } = req.query;
    
    let where = {};
    
    if (department) {
      where.department = { [Op.like]: `%${department}%` };
    }
    
    if (workStart) {
      where.workStartTime = workStart;
    }
    
    if (workEnd) {
      where.workEndTime = workEnd;
    }
    
    const employees = await Employee.findAll({ where });
    
    // Status bo'yicha filter (now-working, not-working, etc.)
    let filtered = employees;
    if (status === 'now-working') {
      filtered = employees.filter(emp => {
        const check = WorkTimeService.checkCurrentWorkTime(emp);
        return check && check.isWorkTime;
      });
    } else if (status === 'not-working') {
      filtered = employees.filter(emp => {
        const check = WorkTimeService.checkCurrentWorkTime(emp);
        return check && !check.isWorkTime && check.isWorkDay;
      });
    } else if (status === 'day-off') {
      filtered = employees.filter(emp => {
        const check = WorkTimeService.checkCurrentWorkTime(emp);
        return check && !check.isWorkDay;
      });
    }
    
    res.json({
      success: true,
      count: filtered.length,
      employees: filtered
    });
  } catch (error) {
    console.error("Filter employees error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xodimning ish vaqtini yangilash (admin)
exports.updateWorkTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { workStartTime, workEndTime, workDays, timezone } = req.body;
    
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Xodim topilmadi" });
    }
    
    const updates = {};
    if (workStartTime) updates.workStartTime = workStartTime;
    if (workEndTime) updates.workEndTime = workEndTime;
    if (workDays) updates.workDays = workDays;
    if (timezone) updates.timezone = timezone;
    
    await employee.update(updates);
    
    res.json({
      success: true,
      message: "Ish vaqti yangilandi",
      employee
    });
  } catch (error) {
    console.error("Update work time error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hozir ishlayotgan xodimlar
exports.getNowWorking = async (req, res) => {
  try {
    const employees = await Employee.findAll();
    
    const nowWorking = employees.filter(emp => {
      const check = WorkTimeService.checkCurrentWorkTime(emp);
      return check && check.isWorkTime;
    }).map(emp => ({
      id: emp.id,
      employeeNo: emp.employeeNo,
      name: emp.name,
      department: emp.department,
      workStartTime: emp.workStartTime,
      workEndTime: emp.workEndTime
    }));
    
    res.json({
      success: true,
      count: nowWorking.length,
      employees: nowWorking,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Get now working error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Statistika
exports.getStatistics = async (req, res) => {
  try {
    const employees = await Employee.findAll();
    const statistics = WorkTimeService.getWorkTimeStatistics(employees);
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error("Get statistics error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};