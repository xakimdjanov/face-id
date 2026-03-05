import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  FiRefreshCw, FiClock, FiUser, FiCreditCard, 
  FiSearch, FiAlertCircle, FiActivity, FiCalendar, 
  FiCheckCircle, FiXCircle, FiLogIn, FiLogOut,
  FiUsers, FiFilter, FiDownload, FiEye, FiEyeOff, FiBarChart2,
  FiPrinter, FiChevronDown, FiChevronUp, FiInfo
} from 'react-icons/fi';
import { MdOutlineQrCodeScanner, MdOutlineDashboard } from 'react-icons/md';
import { BsPersonBadge, BsClockHistory } from 'react-icons/bs';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

const API = "http://localhost:2000";
const api = axios.create({ baseURL: API, timeout: 10000 });

// ==================== YORDAMCHI FUNKSIYALAR ====================

const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : "—";
const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "—";
const formatFullDate = (dt) => dt ? new Date(dt).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }) : "—";
const formatDateTime = (dt) => dt ? new Date(dt).toLocaleString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : "—";

const calculateDuration = (inTime, outTime) => {
  if (!inTime) return "0s 0m";
  const start = new Date(inTime).getTime();
  const end = outTime ? new Date(outTime).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return `${hours}s ${minutes}m`;
};

const calculateDurationMinutes = (inTime, outTime) => {
  if (!inTime) return 0;
  const start = new Date(inTime).getTime();
  const end = outTime ? new Date(outTime).getTime() : Date.now();
  return Math.floor((end - start) / 60000);
};

const translateVerifyMode = (mode) => {
  const modes = {
    'card': 'Karta',
    'face': 'Yuz',
    'fingerprint': 'Barmoq izi',
    'card+face': 'Karta + Yuz',
    'pin': 'PIN',
    'card+pin': 'Karta + PIN',
    'face+pin': 'Yuz + PIN',
    'qrcode': 'QR kod',
    'unknown': 'Nomaʼlum',
  };
  return modes[mode] || mode;
};

const calculateLateMinutes = (checkIn, workStart = "09:00") => {
  if (!checkIn) return 0;
  const checkInDate = new Date(checkIn);
  const [startHour, startMin] = workStart.split(':').map(Number);
  const expectedStart = new Date(checkInDate);
  expectedStart.setHours(startHour, startMin, 0);
  if (checkInDate > expectedStart) {
    return Math.floor((checkInDate - expectedStart) / 60000);
  }
  return 0;
};

const calculateEarlyLeaveMinutes = (checkOut, workEnd = "18:00") => {
  if (!checkOut) return 0;
  const checkOutDate = new Date(checkOut);
  const [endHour, endMin] = workEnd.split(':').map(Number);
  const expectedEnd = new Date(checkOutDate);
  expectedEnd.setHours(endHour, endMin, 0);
  if (checkOutDate < expectedEnd) {
    return Math.floor((expectedEnd - checkOutDate) / 60000);
  }
  return 0;
};

// ==================== PRINT KOMPONENTI ====================

const PrintAttendance = React.forwardRef(({ data, title, date, companyName = "Kompaniya nomi" }, ref) => {
  const totalPresent = data.filter(d => d.checkIn).length;
  const totalMinutes = data.reduce((sum, d) => sum + (d.totalMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div 
      ref={ref} 
      className="print-container"
      style={{
        fontFamily: "'DejaVu Sans', Arial, sans-serif",
        padding: "15mm 10mm",
        fontSize: "11pt",
        lineHeight: 1.4,
        color: "#000",
      }}
    >
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
          @top-center {
            content: element(header);
          }
          @bottom-center {
            content: element(footer);
          }
        }
        
        @media print {
          body { margin: 0; padding: 0; }
          .print-table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
          .print-table th { background-color: #f0f0f0; font-weight: bold; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .print-header { text-align: center; margin-bottom: 20px; position: running(header); }
          .print-footer { margin-top: 20px; text-align: right; font-size: 12px; position: running(footer); }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
        .page-number::after { content: counter(page); }
        .total-pages::after { content: counter(pages); }
      `}</style>

      <div className="print-header" style={{ 
        fontSize: "9pt",
        color: "#555",
        borderBottom: "1px solid #ddd",
        paddingBottom: "4px",
        marginBottom: "8px",
        display: "flex",
        justifyContent: "space-between"
      }}>
        <div>{companyName} • Davomat hisoboti</div>
        <div>Sana: {date}</div>
      </div>

      <div style={{ textAlign: "center", margin: "0 0 16px 0" }}>
        <h1 style={{ 
          fontSize: "18pt", 
          margin: "0 0 8px 0",
          color: "#1e40af",
        }}>
          {title}
        </h1>
        <div style={{ fontSize: "12pt", color: "#444", marginBottom: "4px" }}>
          {date}
        </div>
        <div style={{ fontSize: "10pt", color: "#666" }}>
          Jami xodimlar: <strong>{data.length}</strong> ta • 
          Kelgan: <strong>{totalPresent}</strong> ta • 
          Jami ish vaqti: <strong>{totalHours} soat</strong>
        </div>
      </div>

      <table className="print-table" style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>#</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Xodim</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Bo'lim</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Kirish vaqti</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Chiqish vaqti</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Ish vaqti</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Holat</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Kechikish (daqiqa)</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Erta ketish (daqiqa)</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Kirish usuli</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Chiqish usuli</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff' }}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{index + 1}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.employeeNo}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.department || '—'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.checkIn ? formatDateTime(item.checkIn) : '—'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.checkOut ? formatDateTime(item.checkOut) : '—'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.duration || '—'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {item.completed ? 'Kelgan' : (item.checkIn ? 'Binoda' : 'Kelmagan')}
                {item.isLate ? ' (Kechikkan)' : ''}
                {item.isEarlyLeave ? ' (Erta ketgan)' : ''}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.lateMinutes || '—'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.earlyLeaveMinutes || '—'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{translateVerifyMode(item.checkInMode)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.checkOutMode ? translateVerifyMode(item.checkOutMode) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-footer" style={{
        fontSize: "9pt",
        color: "#777",
        borderTop: "1px solid #ddd",
        paddingTop: "4px",
        marginTop: "8px",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <div>Hisobot yaratilgan sana: {new Date().toLocaleString('uz-UZ')} • © {companyName}</div>
        <div>Sahifa <span className="page-number" /> / <span className="total-pages" /></div>
      </div>
    </div>
  );
});

// ==================== XODIM PRINT KOMPONENTI ====================

const EmployeePrint = React.forwardRef(({ employee, logs, date, companyName = "Kompaniya nomi" }, ref) => {
  const totalMinutes = logs.reduce((sum, log) => {
    if (log.checkIn && log.checkOut) {
      return sum + calculateDurationMinutes(log.checkIn, log.checkOut);
    }
    return sum;
  }, 0);
  
  const totalHours = (totalMinutes / 60).toFixed(1);
  
  return (
    <div 
      ref={ref} 
      className="print-container"
      style={{
        fontFamily: "'DejaVu Sans', Arial, sans-serif",
        padding: "15mm 10mm",
        fontSize: "11pt",
        lineHeight: 1.4,
        color: "#000",
      }}
    >
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
          @top-center {
            content: element(header);
          }
          @bottom-center {
            content: element(footer);
          }
        }
        
        @media print {
          body { margin: 0; padding: 0; }
          .print-table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
          .print-table th { background-color: #f0f0f0; font-weight: bold; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .print-header { margin-bottom: 20px; position: running(header); }
          .print-footer { margin-top: 20px; text-align: right; font-size: 12px; position: running(footer); }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
        .page-number::after { content: counter(page); }
        .total-pages::after { content: counter(pages); }
      `}</style>

      <div className="print-header" style={{ 
        fontSize: "9pt",
        color: "#555",
        borderBottom: "1px solid #ddd",
        paddingBottom: "4px",
        marginBottom: "8px",
        display: "flex",
        justifyContent: "space-between"
      }}>
        <div>{companyName} • Xodim hisoboti</div>
        <div>Sana: {date}</div>
      </div>

      <div className="print-header">
        <h1 style={{ fontSize: '24px', margin: 0 }}>Xodim hisoboti</h1>
        <div style={{ display: 'flex', gap: '20px', marginTop: '15px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <div><strong>Xodim:</strong> {employee.name}</div>
          <div><strong>ID:</strong> {employee.employeeNo}</div>
          <div><strong>Bo'lim:</strong> {employee.department || '—'}</div>
          <div><strong>Lavozim:</strong> {employee.position || '—'}</div>
        </div>
        <h2 style={{ fontSize: '18px', marginTop: '20px' }}>{date} sanasidagi faoliyati</h2>
      </div>

      <table className="print-table" style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>#</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Kirish vaqti</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Chiqish vaqti</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Ish vaqti</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Usul</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Kechikish (daqiqa)</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f0f0f0' }}>Erta ketish (daqiqa)</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>Ma'lumot topilmadi</td>
            </tr>
          ) : (
            logs.map((log, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDateTime(log.checkIn)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.checkOut ? formatDateTime(log.checkOut) : '—'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.duration || '—'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{translateVerifyMode(log.checkInMode)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{calculateLateMinutes(log.checkIn, employee.workStart) || '—'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{calculateEarlyLeaveMinutes(log.checkOut, employee.workEnd) || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>Jami ish vaqti:</td>
            <td style={{ padding: '10px', fontWeight: 'bold' }}>{totalHours} soat ({totalMinutes} daqiqa)</td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>

      <div className="print-footer" style={{
        fontSize: "9pt",
        color: "#777",
        borderTop: "1px solid #ddd",
        paddingTop: "4px",
        marginTop: "8px",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <div>Hisobot yaratilgan sana: {new Date().toLocaleString('uz-UZ')} • © {companyName}</div>
        <div>Sahifa <span className="page-number" /> / <span className="total-pages" /></div>
      </div>
    </div>
  );
});

// ==================== ASOSIY KOMPONENT ====================

export default function AttendanceDashboard() {
  // States
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeesMap, setEmployeesMap] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // Refs for printing
  const printRef = useRef();
  const employeePrintRef = useRef();

  // Fetch functions
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get(`/api/employees`);
      if (res.data.success) {
        const empList = res.data.employees || [];
        setEmployees(empList);
        const map = {};
        const deps = new Set();
        empList.forEach(emp => {
          map[emp.employeeNo] = emp;
          if (emp.department) deps.add(emp.department);
        });
        setEmployeesMap(map);
        setDepartments(Array.from(deps));
      }
    } catch (err) {
      toast.error('Xodimlar maʼlumotini olishda xato');
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/attendance?limit=1000`);
      if (res.data.success) {
        setRows(res.data.rows || []);
        setLastUpdate(new Date());
      }
    } catch (err) {
      toast.error('Server bilan ulanishda xato');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    if (autoRefresh) {
      const interval = setInterval(fetchAttendance, 15000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchEmployees, fetchAttendance]);

  // Toggle row expansion
  const toggleRow = (employeeNo) => {
    setExpandedRows(prev => ({
      ...prev,
      [employeeNo]: !prev[employeeNo]
    }));
  };

  // Get all logs for an employee on selected date
  const getEmployeeLogs = (employeeNo) => {
    const target = new Date(selectedDate);
    target.setHours(0,0,0,0);
    
    return rows
      .filter(log => {
        const logDate = new Date(log.dateTime);
        logDate.setHours(0,0,0,0);
        return log.employeeNo === employeeNo && logDate.getTime() === target.getTime();
      })
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  };

  // Handle employee print
  const handleEmployeePrint = (employee) => {
    setSelectedEmployee(employee);
    setTimeout(() => {
      if (employeePrintRef.current) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>${employee.name} - Hisobot</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
              </style>
            </head>
            <body>
              ${employeePrintRef.current.outerHTML}
              <script>
                window.onload = function() { window.print(); setTimeout(() => window.close(), 1000); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }, 100);
  };

  // Derived data
  const analyzedData = useMemo(() => {
    const employeeDays = {};
    const sorted = [...rows].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    sorted.forEach(log => {
      const d = new Date(log.dateTime);
      const dateKey = d.toDateString();
      const key = `${log.employeeNo}_${dateKey}`;

      if (!employeeDays[key]) {
        const emp = employeesMap[log.employeeNo] || {};
        employeeDays[key] = {
          employeeNo: log.employeeNo,
          name: log.name || emp.name || 'Nomaʼlum',
          date: dateKey,
          fullDate: d,
          logs: [],
          checkIn: null,
          checkOut: null,
          checkInMode: null,
          checkOutMode: null,
          duration: null,
          totalMinutes: 0,
          completed: false,
          totalHours: 0,
          department: emp.department || '',
          position: emp.position || '',
          workStart: emp.workStartTime || "09:00",
          workEnd: emp.workEndTime || "18:00",
          allLogs: []
        };
      }
      employeeDays[key].logs.push(log);
      employeeDays[key].allLogs = employeeDays[key].logs;
    });

    Object.values(employeeDays).forEach(day => {
      const slogs = day.logs.sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime));
      if (!slogs.length) return;

      const first = slogs[0];
      const last = slogs[slogs.length - 1];

      day.checkIn = first.dateTime;
      day.checkInMode = first.verifyMode;

      if (last.attendanceStatus === 'checkOut' || last.checkOutTime) {
        day.checkOut = last.checkOutTime || last.dateTime;
        day.checkOutMode = last.verifyMode;
      }

      if (day.checkIn && day.checkOut) {
        day.duration = calculateDuration(day.checkIn, day.checkOut);
        day.totalMinutes = calculateDurationMinutes(day.checkIn, day.checkOut);
        day.completed = true;
      } else if (day.checkIn) {
        day.duration = calculateDuration(day.checkIn, null);
        day.totalMinutes = calculateDurationMinutes(day.checkIn, null);
      }

      if (day.duration) {
        const [h, m] = day.duration.replace(/[sm]/g,'').trim().split(' ').map(Number);
        day.totalHours = h + (m / 60);
      }

      day.lateMinutes = calculateLateMinutes(day.checkIn, day.workStart);
      day.earlyLeaveMinutes = calculateEarlyLeaveMinutes(day.checkOut, day.workEnd);
      day.isLate = day.lateMinutes > 0;
      day.isEarlyLeave = day.earlyLeaveMinutes > 0;
    });

    const target = new Date(selectedDate);
    target.setHours(0,0,0,0);

    return Object.values(employeeDays).filter(d => {
      const dd = new Date(d.fullDate);
      dd.setHours(0,0,0,0);
      return dd.getTime() === target.getTime();
    });
  }, [rows, selectedDate, employeesMap]);

  const filteredData = useMemo(() => {
    let result = [...analyzedData];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.name?.toLowerCase().includes(term) ||
        r.employeeNo?.includes(term) ||
        r.department?.toLowerCase().includes(term)
      );
    }

    if (filterDepartment) result = result.filter(r => r.department === filterDepartment);

    if (filterStatus !== 'all') {
      switch (filterStatus) {
        case 'present':    result = result.filter(r => r.checkIn); break;
        case 'absent':     result = result.filter(r => !r.checkIn); break;
        case 'completed':  result = result.filter(r => r.completed); break;
        case 'inbuilding': result = result.filter(r => r.checkIn && !r.checkOut); break;
        case 'late':       result = result.filter(r => r.isLate); break;
        case 'early':      result = result.filter(r => r.isEarlyLeave); break;
        default: break;
      }
    }

    return result.sort((a,b) => (b.checkIn || '9999').localeCompare(a.checkIn || '0000'));
  }, [analyzedData, searchTerm, filterDepartment, filterStatus]);

  const stats = useMemo(() => {
    const total = employees.length;
    const cameToday = analyzedData.filter(d => d.checkIn).length;
    const completed = analyzedData.filter(d => d.completed).length;
    const inBuilding = analyzedData.filter(d => d.checkIn && !d.checkOut).length;
    const absent = total - cameToday;
    const late = analyzedData.filter(d => d.isLate).length;
    const earlyLeave = analyzedData.filter(d => d.isEarlyLeave).length;

    let totalHours = 0;
    let totalMinutes = 0;
    analyzedData.forEach(d => { 
      if (d.completed) {
        totalHours += d.totalHours || 0;
        totalMinutes += d.totalMinutes || 0;
      }
    });

    const attendanceRate = total > 0 ? Math.round((cameToday / total) * 100) : 0;

    return {
      total, cameToday, completed, inBuilding, absent, late, earlyLeave,
      avgHours: completed ? (totalHours / completed).toFixed(1) : "0.0",
      totalHours: totalHours.toFixed(1),
      totalMinutes,
      attendanceRate
    };
  }, [analyzedData, employees]);

  // Export to Print
  const handlePrint = useCallback(() => {
    if (!filteredData.length) {
      toast.error("Chop etish uchun maʼlumot yoʻq");
      return;
    }

    setTimeout(() => {
      if (printRef.current) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>Davomat hisoboti - ${formatFullDate(selectedDate)}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
              </style>
            </head>
            <body>
              ${printRef.current.outerHTML}
              <script>
                window.onload = function() { window.print(); setTimeout(() => window.close(), 1000); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }, 100);
  }, [filteredData, selectedDate]);

  // Export to Excel (simulated)
  const exportToExcel = useCallback(() => {
    if (!filteredData.length) {
      toast.error("Eksport qilish uchun maʼlumot yoʻq");
      return;
    }

    const dataToExport = filteredData.map(item => ({
      'Xodim': item.name,
      'ID': item.employeeNo,
      "Bo'lim": item.department || '—',
      'Lavozim': item.position || '—',
      'Kirish vaqti': item.checkIn ? formatDateTime(item.checkIn) : '—',
      'Chiqish vaqti': item.checkOut ? formatDateTime(item.checkOut) : '—',
      'Ish vaqti': item.duration || '—',
      'Ish vaqti (daqiqa)': item.totalMinutes || 0,
      'Holat': item.completed ? 'Kelgan' : (item.checkIn ? 'Binoda' : 'Kelmagan'),
      'Kechikish': item.isLate ? `${item.lateMinutes} daqiqa` : '—',
      'Erta ketish': item.isEarlyLeave ? `${item.earlyLeaveMinutes} daqiqa` : '—',
      'Kirish usuli': translateVerifyMode(item.checkInMode),
      'Chiqish usuli': item.checkOutMode ? translateVerifyMode(item.checkOutMode) : '—'
    }));

    // CSV yaratish
    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    
    // Yuklab olish
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `davomat-${selectedDate}.csv`;
    a.click();
    
    toast.success(`${dataToExport.length} ta qator eksport qilindi`);
  }, [filteredData, selectedDate]);

  // Kelmaganlar ro'yxati
  const absentEmployees = useMemo(() => {
    const cameTodaySet = new Set(analyzedData.map(d => d.employeeNo));
    return employees.filter(emp => !cameTodaySet.has(emp.employeeNo));
  }, [employees, analyzedData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 pb-12">
      <Toaster position="top-center" toastOptions={{ duration: 2200 }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-6">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-5 rounded-2xl shadow-xl shadow-blue-500/30">
                  <MdOutlineQrCodeScanner className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Davomat Monitoring
                  </h1>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><FiClock /> Oxirgi: {formatTime(lastUpdate)}</span>
                    <span className="flex items-center gap-1"><FiUsers /> Xodimlar: {employees.length}</span>
                    <span className="flex items-center gap-1"><FiCalendar /> Sana: {formatFullDate(selectedDate)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-5 py-3 rounded-xl font-medium flex items-center gap-2 border transition-all ${
                    showFilters ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FiFilter /> Filter
                </button>

                <button
                  onClick={handlePrint}
                  className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-medium flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md"
                >
                  <FiPrinter /> Print
                </button>

                <button
                  onClick={exportToExcel}
                  className="px-5 py-3 rounded-xl bg-green-600 text-white font-medium flex items-center gap-2 hover:bg-green-700 transition-all shadow-md"
                >
                  <FiDownload /> Export
                </button>

                <button
                  onClick={() => setAutoRefresh(p => !p)}
                  className={`px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    autoRefresh ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {autoRefresh ? <FiEye /> : <FiEyeOff />}
                  {autoRefresh ? 'LIVE' : 'PAUSE'}
                </button>

                <button
                  onClick={fetchAttendance}
                  disabled={loading}
                  className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 text-white transition-all ${
                    loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                  }`}
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Yuklanmoqda...' : 'Yangilash'}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Qidiruv</label>
                  <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Ism, ID, bo'lim..."
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Bo'lim</label>
                  <select
                    value={filterDepartment}
                    onChange={e => setFilterDepartment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option value="">Barcha bo'limlar</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option value="all">Barchasi</option>
                    <option value="present">Kelganlar</option>
                    <option value="absent">Kelmaganlar</option>
                    <option value="inbuilding">Binodagilar</option>
                    <option value="completed">Tugatganlar</option>
                    <option value="late">Kechikkanlar</option>
                    <option value="early">Erta ketganlar</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterDepartment("");
                      setFilterStatus("all");
                    }}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all w-full"
                  >
                    Filtrlarni tozalash
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 lg:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
              <StatCard label="JAMI XODIM" value={stats.total} icon={<FiUsers />} />
              <StatCard label="KELGAN" value={stats.cameToday} icon={<FiCheckCircle />} />
              <StatCard label="KELMAGAN" value={stats.absent} icon={<FiXCircle />} />
              <StatCard label="BINODA" value={stats.inBuilding} icon={<FiLogIn />} />
              <StatCard label="KECHIKKAN" value={stats.late} icon={<FiAlertCircle />} />
              <StatCard label="ERTA KETGAN" value={stats.earlyLeave} icon={<FiLogOut />} />
              <StatCard label="O'RT. SOAT" value={stats.avgHours} icon={<FiClock />} />
            </div>
            
            <div className="mt-4 flex justify-between text-white text-sm">
              <span>Jami ish vaqti: {stats.totalHours} soat ({stats.totalMinutes} daqiqa)</span>
              <span>Davomat: {stats.attendanceRate}%</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <MdOutlineDashboard className="text-blue-600" />
              Xodimlar ro'yxati ({filteredData.length})
            </h2>
            <div className="text-sm text-gray-500">
              <span className="mr-3">✅ Kelgan: {filteredData.filter(f => f.checkIn).length}</span>
              <span className="mr-3">🏢 Binoda: {filteredData.filter(f => f.checkIn && !f.checkOut).length}</span>
              <span>❌ Kelmagan: {filteredData.filter(f => !f.checkIn).length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Xodim</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Kirish</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Chiqish</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Ish vaqti</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Holat</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Harakat</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-500">
                      <FiBarChart2 className="mx-auto text-5xl text-gray-300 mb-4" />
                      Ma'lumot topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, i) => {
                    const employeeLogs = getEmployeeLogs(item.employeeNo);
                    const isExpanded = expandedRows[item.employeeNo];
                    
                    return (
                      <React.Fragment key={i}>
                        <tr className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                                item.completed ? 'bg-green-500' : item.checkIn ? 'bg-blue-500' : 'bg-gray-400'
                              }`}>
                                {item.name?.[0] || '?'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{item.name || 'Nomaʼlum'}</div>
                                <div className="text-sm text-gray-600">ID: {item.employeeNo}</div>
                                {item.department && <div className="text-xs text-gray-500">{item.department}</div>}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            {item.checkIn ? (
                              <div>
                                <div className="font-bold text-green-700">{formatTime(item.checkIn)}</div>
                                <div className="text-xs text-gray-500">{translateVerifyMode(item.checkInMode)}</div>
                                {item.isLate && (
                                  <div className="text-xs text-yellow-600 font-medium mt-1">
                                    {item.lateMinutes} min kech
                                  </div>
                                )}
                              </div>
                            ) : <span className="text-gray-400">—</span>}
                          </td>

                          <td className="px-6 py-5">
                            {item.checkOut ? (
                              <div>
                                <div className="font-bold text-yellow-700">{formatTime(item.checkOut)}</div>
                                <div className="text-xs text-gray-500">{translateVerifyMode(item.checkOutMode)}</div>
                                {item.isEarlyLeave && (
                                  <div className="text-xs text-orange-600 font-medium mt-1">
                                    {item.earlyLeaveMinutes} min erta
                                  </div>
                                )}
                              </div>
                            ) : item.checkIn ? (
                              <span className="text-blue-600 font-medium">Hozir binoda</span>
                            ) : <span className="text-gray-400">—</span>}
                          </td>

                          <td className="px-6 py-5">
                            {item.duration ? (
                              <div>
                                <div className="font-bold">{item.duration}</div>
                                <div className="text-xs text-gray-500">{item.totalHours.toFixed(1)} soat</div>
                              </div>
                            ) : <span className="text-gray-400">—</span>}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex flex-wrap gap-2">
                              {item.completed && <Badge label="Kelgan" color="green" />}
                              {item.checkIn && !item.checkOut && <Badge label="Binoda" color="blue" />}
                              {!item.checkIn && <Badge label="Kelmagan" color="red" />}
                              {item.isLate && <Badge label="Kechikkan" color="yellow" />}
                              {item.isEarlyLeave && <Badge label="Erta ketgan" color="orange" />}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEmployeePrint({
                                  ...item,
                                  name: item.name,
                                  employeeNo: item.employeeNo,
                                  department: item.department,
                                  position: item.position,
                                  workStart: item.workStart,
                                  workEnd: item.workEnd
                                })}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Xodim hisobotini chop etish"
                              >
                                <FiPrinter />
                              </button>
                              <button
                                onClick={() => toggleRow(item.employeeNo)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Batafsil"
                              >
                                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded row with all logs */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="bg-white rounded-xl p-4 border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <BsClockHistory className="text-blue-500" />
                                  {item.name} ning {formatFullDate(selectedDate)} sanasidagi barcha harakatlari
                                </h3>
                                
                                {employeeLogs.length === 0 ? (
                                  <p className="text-gray-500 text-center py-4">Ma'lumot topilmadi</p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm divide-y divide-gray-100">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="px-4 py-2 text-left">#</th>
                                          <th className="px-4 py-2 text-left">Vaqt</th>
                                          <th className="px-4 py-2 text-left">Tur</th>
                                          <th className="px-4 py-2 text-left">Usul</th>
                                          <th className="px-4 py-2 text-left">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {employeeLogs.map((log, idx) => (
                                          <tr key={idx} className="border-t border-gray-100">
                                            <td className="px-4 py-2">{idx + 1}</td>
                                            <td className="px-4 py-2">{formatDateTime(log.dateTime)}</td>
                                            <td className="px-4 py-2">
                                              {log.attendanceStatus === 'checkIn' ? 'Kirish' : 
                                               log.attendanceStatus === 'checkOut' ? 'Chiqish' : 'Nomaʼlum'}
                                            </td>
                                            <td className="px-4 py-2">{translateVerifyMode(log.verifyMode)}</td>
                                            <td className="px-4 py-2">
                                              {log.label && <Badge label={log.label} color="indigo" size="sm" />}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kelmaganlar ro'yxati */}
        {absentEmployees.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl border border-red-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <FiXCircle className="text-red-500" />
                Ishga kelmagan xodimlar ({absentEmployees.length})
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {absentEmployees.map((emp, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-bold">
                      {emp.name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{emp.name}</div>
                      <div className="text-xs text-gray-500">ID: {emp.employeeNo}</div>
                      {emp.department && <div className="text-xs text-gray-400">{emp.department}</div>}
                    </div>
                    <button
                      onClick={() => handleEmployeePrint(emp)}
                      className="ml-auto p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Xodim hisobotini chop etish"
                    >
                      <FiPrinter />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden print components */}
      <div style={{ display: 'none' }}>
        <PrintAttendance
          ref={printRef}
          data={filteredData}
          title="Davomat hisoboti"
          date={formatFullDate(selectedDate)}
        />
        {selectedEmployee && (
          <EmployeePrint
            ref={employeePrintRef}
            employee={selectedEmployee}
            logs={getEmployeeLogs(selectedEmployee.employeeNo)}
            date={formatFullDate(selectedDate)}
          />
        )}
      </div>
    </div>
  );
}

// ==================== YORDAMCHI KOMPONENTLAR ====================

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white/20 rounded-2xl p-5 text-white hover:bg-white/30 transition-all">
      <div className="flex justify-between items-start">
        <div className="text-2xl">{icon}</div>
        <div className="text-right">
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-xs opacity-90 mt-1">{label}</div>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, color, size = "md" }) {
  const colors = {
    green: "bg-green-100 text-green-700 border-green-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    red: "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1.5 text-sm font-medium"
  };

  return (
    <span className={`rounded-full border ${sizes[size]} ${colors[color]}`}>
      {label}
    </span>
  );
}