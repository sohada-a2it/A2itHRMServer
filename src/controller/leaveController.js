const Leave = require('../models/LeaveModel');
const Payroll = require('../models/PayrollModel');
const Attendance = require('../models/AttendanceModel');
const Holiday = require('../models/HolidayModel');
const OfficeSchedule = require('../models/OfficeScheduleModel');
const SalaryRule = require('../models/SalaryRuleModel');
const User = require('../models/UsersModel');

// ---------------- Employee leave request ----------------
exports.requestLeave = async (req, res) => {
  try {
    const { leaveType, payStatus, startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ status: 'fail', message: 'Start and End Date are required' });
    }

    // Duplicate check
    const existingLeave = await Leave.findOne({
      employee: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });

    if (existingLeave) {
      return res.status(400).json({ status: 'fail', message: 'Leave already requested for these dates' });
    }

    // Leave create
    const leave = await Leave.create({
      employee: req.user._id,
      leaveType: leaveType || 'Sick',
      payStatus: payStatus || 'Paid',   // user choose Paid/Unpaid/HalfPaid
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      createdBy: req.user._id
    });

    // Populate employee name
    const leaveWithEmployee = await Leave.findById(leave._id)
      .populate({ path: 'employee', select: 'name' });

    res.status(201).json({ status: 'success', leave: leaveWithEmployee });

  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ---------------- Admin approve leave ----------------
exports.approveLeave = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'fail', message: 'Only admin can approve leaves' });
    }

    const leave = await Leave.findById(req.params.id).populate('employee');
    if (!leave) {
      return res.status(404).json({ status: 'fail', message: 'Leave not found' });
    }

    // Admin override payStatus
    if (req.body.payStatus) {
      leave.payStatus = req.body.payStatus; // Paid / Unpaid / HalfPaid
    }

    leave.status = 'Approved';
    await leave.save();

    const start = leave.startDate;
    const end = leave.endDate;

    // ======== Update attendance for leave days =========
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = new Date(d);
      day.setHours(0,0,0,0);

      let attendance = await Attendance.findOne({ employee: leave.employee._id, date: day });
      if (!attendance) attendance = new Attendance({ employee: leave.employee._id, date: day });

      attendance.status = 'Leave';
      await attendance.save();
    }

    // ======== Payroll adjustment for Unpaid / HalfPaid leave =========
    if (leave.payStatus === 'Unpaid' || leave.payStatus === 'HalfPaid') {
      const payroll = await Payroll.findOne({
        employee: leave.employee._id,
        periodStart: { $lte: start },
        periodEnd: { $gte: end },
      });

      if (payroll) {
        const dailyRate = payroll.basicPay / 30;
        let deduction = dailyRate * leave.totalDays;
        if (leave.payStatus === 'HalfPaid') deduction /= 2;

        payroll.deductions = (payroll.deductions || 0) + deduction;
        payroll.netPayable = payroll.basicPay + (payroll.overtimePay || 0) - payroll.deductions;
        await payroll.save();
      }
    }

    // ======== Auto attendance for Govt Holidays & Weekly Off =========
    const schedule = await OfficeSchedule.findOne({ isActive: true });
    const defaultWeeklyOff = schedule?.weeklyOffDays || ['Friday', 'Saturday'];

    const holidays = await Holiday.find({ date: { $gte: start, $lte: end }, isActive: true });
    const overrides = await OfficeScheduleOverride.find({ 
      startDate: { $lte: end },
      endDate: { $gte: start },
      isActive: true
    });

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = new Date(d);
      day.setHours(0,0,0,0);

      // Skip if leave attendance already set
      const existingAttendance = await Attendance.findOne({ employee: leave.employee._id, date: day });
      if (existingAttendance && existingAttendance.status === 'Leave') continue;

      // Check Govt Holiday
      const holiday = holidays.find(h => h.date.getTime() === day.getTime());
      if (holiday) {
        let attendance = existingAttendance || new Attendance({ employee: leave.employee._id, date: day });
        attendance.status = holiday.type === 'GOVT' ? 'Govt Holiday' : 'Off Day';
        await attendance.save();
        continue;
      }

      // Determine effective weekly off (check override first)
      let effectiveWeeklyOff = defaultWeeklyOff;
      const overrideForDay = overrides.find(o => o.startDate.getTime() <= day.getTime() && o.endDate.getTime() >= day.getTime());
      if (overrideForDay) effectiveWeeklyOff = overrideForDay.weeklyOffDays;

      // Check Weekly Off
      const dayName = day.toLocaleString('en-US', { weekday: 'long' });
      if (effectiveWeeklyOff.includes(dayName)) {
        let attendance = existingAttendance || new Attendance({ employee: leave.employee._id, date: day });
        attendance.status = 'Weekly Off';
        await attendance.save();
      }
    }

    res.status(200).json({ status: 'success', leave });

  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};
