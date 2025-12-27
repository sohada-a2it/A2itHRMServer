
const express = require('express')
const router = express.Router()
const adminController = require("../controller/adminController")  
const userController = require("../controller/userController")
const authController = require("../controller/authController")
const payrollController = require('../controller/payrollController'); 
const attendanceController = require("../controller/attendanceController")  
const auditController = require('../controller/auditController');
const sessionController = require('../controller/sessionLogController'); 
const holidayController = require('../controller/holidayController');  
const leaveController = require('../controller/leaveController'); 
const salaryRuleController = require('../controller/salaryRuleController'); 
const OfficeSchedule = require('../controller/officeScheduleController');  
const { protect, adminOnly } = require("../middleware/AuthVerifyMiddleWare"); 

// =================== Login Routes ====================
router.post("/admin/login", adminController.adminLogin);  
router.post("/users/userLogin", userController.userLogin);  

// =================== Admin Control Routes ====================
router.post("/admin/create-user", protect, adminOnly, adminController.createUser); 
router.get("/admin/getAll-user", protect, adminOnly, adminController.getAllUsers); 
router.put("/admin/update-user/:id", protect, adminOnly, adminController.adminUpdateUser); 
router.delete("/admin/user-delete/:id", protect, adminOnly, adminController.deleteUser); 
router.post('/admin/request-otp', protect, adminOnly, authController.AdminRequestOtp);
router.post('/admin/reset-password', protect, adminOnly, authController.AdminResetPassword );  

// =================== Employee Routes ====================  
router.get("/users/getProfile", protect,userController.getProfile); 
router.post("/users/updateProfile", protect,userController.updateProfile);     

// ====================Attendace Routes ====================  
router.post('/attendance/clock-in', protect, attendanceController.clockIn);
router.post('/attendance/clock-out', protect, attendanceController.clockOut); 
router.put('/admin/attendance/admin-correct', protect, adminOnly, attendanceController.adminCorrectAttendance);
router.get('/admin/attendance/summary', protect, adminOnly, attendanceController.attendanceSummary);
 
// ====================Payroll Routes(Admin Only) ==================== 
router.post('/admin/payroll', protect,adminOnly,payrollController.createPayroll); 
router.get('/admin/getAllpayroll',protect,adminOnly,payrollController.getAllPayrolls); 
router.get('/admin/payroll/:id',protect,adminOnly,payrollController.getPayrollById); 
router.put('/admin/updatePayroll/:id',protect,adminOnly,payrollController.updatePayroll); 
router.delete('/admin/deletepayroll/:id',protect,adminOnly,payrollController.deletePayroll);  

// ====================AuditLog Admin Routes ==================== 
router.get('/admin/getAllAudits', protect, adminOnly, auditController.getAllAuditLogs); 
router.get('/admin/getAllAudits/:userId', protect, adminOnly, auditController.getAuditLogsByUserId); 
router.delete('/admin/AuditDelete/:id', protect, adminOnly, auditController.deleteAuditLog); 
router.get('/admin/auditSearch', protect, adminOnly, auditController.searchAuditLogs); 
router.get('/admin/stats', protect, adminOnly, auditController.getAuditStats);  
router.get('/user/my-logs', protect, auditController.getMyAuditLogs);  

// ==================== SessionLog Routes==================== 
router.get('/my-sessions', protect, sessionController.getMySessions); 
router.get('/my-current-session', protect, sessionController.getMyCurrentSession);  
router.get('/mySessionState', protect, sessionController.getMyCurrentSession); 

// ==================== ADMIN ROUTES ==================== 
router.get('/admin/allSession', protect, adminOnly, sessionController.getAllSessions); 
router.get('/admin/Session/:id', protect, adminOnly, sessionController.getSessionById); 
router.get('/admin/statistics', protect, adminOnly, sessionController.getSessionAttendanceStats);  
router.delete('/admin/session/:id', protect, adminOnly, sessionController.deleteSessionById); 

// =====================Holiday Routes===================== 
router.get('/getAllHoliday', protect, holidayController.getHolidays); 
router.post('/addHoliday', protect, adminOnly, holidayController.addHoliday); 
router.put('/editHoliday/:id', protect, adminOnly, holidayController.updateHoliday); 
router.delete('/deleteHoliday/:id', protect, adminOnly, holidayController.deleteHoliday);  

// =================== Leave Routes ====================
router.post('/request', protect, leaveController.requestLeave); 
router.put('/approve/:id', protect, adminOnly,leaveController.approveLeave);  

// =================== SalaryRule Routes ====================
router.post('/createSalary', protect, adminOnly, salaryRuleController.createSalaryRule);
router.get('/getSalary', protect, salaryRuleController.getAllSalaryRules);
router.put('/updateSalary/:id', protect, adminOnly, salaryRuleController.updateSalaryRule);
router.delete('/deleteSalary/:id', protect, adminOnly, salaryRuleController.deleteSalaryRule);

// =================== WeaklyOff Routes ====================
router.get("/getWeekly-off", protect, OfficeSchedule.getWeeklyOff);
router.put("/updateWeekly-off",protect, adminOnly, OfficeSchedule.updateWeeklyOff); 
router.put("/override", protect, adminOnly, OfficeSchedule.createOrUpdateOverride);

module.exports = router;  