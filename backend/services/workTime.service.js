// services/workTime.service.js
class WorkTimeService {
  /**
   * Ish vaqtini avtomatik generatsiya qilish
   * @param {Object} params - Parametrlar
   * @param {string} params.department - Bo'lim nomi
   * @param {string} params.employeeNo - Xodim raqami
   * @returns {Object} - Ish vaqti ma'lumotlari
   */
  static generateWorkTime(params = {}) {
    const { department = '', employeeNo = '' } = params;
    
    // Default ish vaqti (ofis xodimlari)
    let workStart = "09:00";
    let workEnd = "18:00";
    let workDays = [1, 2, 3, 4, 5]; // Dushanba-Juma
    
    // Bo'lim nomini kichik harflarga o'tkazish
    const deptLower = department.toLowerCase();
    
    // Smenali ishchilar uchun employeeNo asosida smena tanlash
    const lastDigit = parseInt(employeeNo.slice(-1)) || 0;
    
    // BO'LIMLAR BO'YICHA ISH VAQTI SOZLAMALARI
    if (deptLower.includes('security') || deptLower.includes('xavfsizlik') || deptLower.includes('qorovul')) {
      // Xavfsizlik xodimlari - 12 soatlik smena
      if (lastDigit % 2 === 0) {
        workStart = "08:00";
        workEnd = "20:00"; // Kunduzgi smena
      } else {
        workStart = "20:00";
        workEnd = "08:00"; // Tungi smena
      }
      workDays = [1, 2, 3, 4, 5, 6, 7]; // Har kuni
    }
    else if (deptLower.includes('production') || deptLower.includes('ishlab chiqarish') || deptLower.includes('texnolog')) {
      // Ishlab chiqarish - 8 soat, 6 kun
      if (lastDigit % 3 === 0) {
        workStart = "07:00";
        workEnd = "16:00"; // Ertalabki smena
      } else if (lastDigit % 3 === 1) {
        workStart = "08:00";
        workEnd = "17:00"; // O'rta smena
      } else {
        workStart = "09:00";
        workEnd = "18:00"; // Kechki smena
      }
      workDays = [1, 2, 3, 4, 5, 6]; // Shanba ham ishlaydi
    }
    else if (deptLower.includes('hr') || deptLower.includes('kadr') || deptLower.includes('personal')) {
      // HR xodimlari - 9-18
      workStart = "09:00";
      workEnd = "18:00";
      workDays = [1, 2, 3, 4, 5];
    }
    else if (deptLower.includes('it') || deptLower.includes('tech') || deptLower.includes('dasturchi')) {
      // IT xodimlari - fleksibil vaqt
      workStart = "10:00";
      workEnd = "19:00";
      workDays = [1, 2, 3, 4, 5];
    }
    else if (deptLower.includes('admin') || deptLower.includes('ma\'muriyat') || deptLower.includes('direktor')) {
      // Administratsiya
      workStart = "09:00";
      workEnd = "18:00";
      workDays = [1, 2, 3, 4, 5];
    }
    else if (deptLower.includes('cleaning') || deptLower.includes('tozalik') || deptLower.includes('farrosh')) {
      // Tozalik xizmati - ertalab
      workStart = "07:00";
      workEnd = "16:00";
      workDays = [1, 2, 3, 4, 5, 6];
    }
    else if (deptLower.includes('sotuv') || deptLower.includes('sales') || deptLower.includes('marketing')) {
      // Savdo bo'limi
      if (lastDigit % 2 === 0) {
        workStart = "09:00";
        workEnd = "18:00";
      } else {
        workStart = "10:00";
        workEnd = "19:00";
      }
      workDays = [1, 2, 3, 4, 5, 6];
    }
    else if (deptLower.includes('ombor') || deptLower.includes('warehouse') || deptLower.includes('sklad')) {
      // Ombor xodimlari
      workStart = "08:00";
      workEnd = "17:00";
      workDays = [1, 2, 3, 4, 5, 6];
    }
    
    return {
      workStartTime: workStart,
      workEndTime: workEnd,
      workDays: workDays,
      timezone: "Asia/Tashkent"
    };
  }
  
  /**
   * Hozirgi vaqtni ish vaqtiga nisbatan tekshirish
   * @param {Object} employee - Xodim ma'lumotlari
   * @returns {Object} - Tekshiruv natijasi
   */
  static checkCurrentWorkTime(employee) {
    if (!employee) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0-Yakshanba, 1-Dushanba, ...
    
    // JS da Yakshanba=0, bizda Dushanba=1 bo'lishi uchun o'zgartirish
    const workDay = currentDay === 0 ? 7 : currentDay;
    
    const [startHour, startMin] = (employee.workStartTime || "09:00").split(':').map(Number);
    const [endHour, endMin] = (employee.workEndTime || "18:00").split(':').map(Number);
    
    const workDays = employee.workDays || [1, 2, 3, 4, 5];
    
    const currentTime = currentHour * 60 + currentMinute;
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    const isWorkDay = workDays.includes(workDay);
    let isWorkTime = false;
    
    if (isWorkDay) {
      // Tungi smena uchun maxsus tekshirish (masalan 20:00 - 08:00)
      if (endTime < startTime) {
        // Tungi smena (kechasi boshlanib, ertalab tugaydi)
        if (currentTime >= startTime || currentTime < endTime) {
          isWorkTime = true;
        }
      } else {
        // Oddiy smena
        if (currentTime >= startTime && currentTime < endTime) {
          isWorkTime = true;
        }
      }
    }
    
    // Qancha vaqt qolganini hisoblash
    let timeUntilEnd = null;
    if (isWorkTime) {
      if (endTime < startTime) {
        // Tungi smena
        if (currentTime < endTime) {
          timeUntilEnd = endTime - currentTime;
        } else {
          timeUntilEnd = (24 * 60 - currentTime) + endTime;
        }
      } else {
        timeUntilEnd = endTime - currentTime;
      }
    }
    
    return {
      isWorkDay,
      isWorkTime,
      currentDay: workDay,
      currentTime: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
      workStart: employee.workStartTime,
      workEnd: employee.workEndTime,
      workDays,
      timeUntilEnd: timeUntilEnd ? Math.floor(timeUntilEnd / 60) + ' soat ' + (timeUntilEnd % 60) + ' daqiqa' : null
    };
  }
  
  /**
   * Bir nechta xodimlar uchun ish vaqti statistikasi
   * @param {Array} employees - Xodimlar ro'yxati
   * @returns {Object} - Statistika
   */
  static getWorkTimeStatistics(employees) {
    const stats = {
      total: employees.length,
      byDepartment: {},
      nowWorking: [],
      averageStartTime: "09:00",
      averageEndTime: "18:00",
      departmentCounts: {}
    };
    
    let totalStartMinutes = 0;
    let totalEndMinutes = 0;
    let validEmployees = 0;
    let nowWorking = 0;
    
    employees.forEach(emp => {
      // Bo'lim bo'yicha guruhlash
      const dept = emp.department || "Bo'limsiz";
      stats.departmentCounts[dept] = (stats.departmentCounts[dept] || 0) + 1;
      
      // Hozir ishlayotganlar
      const check = this.checkCurrentWorkTime(emp);
      if (check && check.isWorkTime) {
        nowWorking++;
        stats.nowWorking.push({
          employeeNo: emp.employeeNo,
          name: emp.name,
          department: emp.department,
          timeRemaining: check.timeUntilEnd
        });
      }
      
      // O'rtacha vaqt uchun
      if (emp.workStartTime && emp.workEndTime) {
        const [sH, sM] = emp.workStartTime.split(':').map(Number);
        const [eH, eM] = emp.workEndTime.split(':').map(Number);
        
        totalStartMinutes += sH * 60 + sM;
        totalEndMinutes += eH * 60 + eM;
        validEmployees++;
      }
    });
    
    // O'rtacha vaqtlarni hisoblash
    if (validEmployees > 0) {
      const avgStart = Math.round(totalStartMinutes / validEmployees);
      const avgEnd = Math.round(totalEndMinutes / validEmployees);
      
      stats.averageStartTime = `${Math.floor(avgStart / 60).toString().padStart(2, '0')}:${(avgStart % 60).toString().padStart(2, '0')}`;
      stats.averageEndTime = `${Math.floor(avgEnd / 60).toString().padStart(2, '0')}:${(avgEnd % 60).toString().padStart(2, '0')}`;
    }
    
    stats.nowWorkingCount = nowWorking;
    
    return stats;
  }
  
  /**
   * Berilgan vaqtni ish vaqtiga mosligini tekshirish
   * @param {Object} employee - Xodim
   * @param {Date} dateTime - Tekshiriladigan vaqt
   * @returns {boolean} - Moslik
   */
  static isWithinWorkTime(employee, dateTime) {
    if (!employee || !dateTime) return false;
    
    const hour = dateTime.getHours();
    const minute = dateTime.getMinutes();
    const day = dateTime.getDay() === 0 ? 7 : dateTime.getDay();
    
    const workDays = employee.workDays || [1, 2, 3, 4, 5];
    if (!workDays.includes(day)) return false;
    
    const [startHour, startMin] = (employee.workStartTime || "09:00").split(':').map(Number);
    const [endHour, endMin] = (employee.workEndTime || "18:00").split(':').map(Number);
    
    const time = hour * 60 + minute;
    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;
    
    if (end < start) {
      // Tungi smena
      return time >= start || time < end;
    } else {
      return time >= start && time < end;
    }
  }
}

module.exports = WorkTimeService;