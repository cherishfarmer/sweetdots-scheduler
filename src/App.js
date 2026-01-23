import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Bell, X, User, Phone, Mail, Loader, RefreshCw } from 'lucide-react';

const EmployeeScheduler = () => {
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekDates, setWeekDates] = useState([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Parse time slot to get start and end times
  const parseTimeSlot = (timeSlot) => {
    const [start, end] = timeSlot.split('-');
    return { start, end };
  };

  // Convert time string to minutes for comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Consolidate consecutive time slots for same employee
  const consolidateShifts = (rawSchedule) => {
    const consolidated = {};

    Object.keys(rawSchedule).forEach(employeeName => {
      consolidated[employeeName] = {};

      Object.keys(rawSchedule[employeeName]).forEach(day => {
        const slots = rawSchedule[employeeName][day];
        if (!slots || slots.length === 0) return;

        // Sort slots by start time
        slots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

        const merged = [];
        let current = { ...slots[0] };

        for (let i = 1; i < slots.length; i++) {
          const slot = slots[i];
          // If current end time matches next start time, merge them
          if (current.end === slot.start) {
            current.end = slot.end;
          } else {
            merged.push({ ...current });
            current = { ...slot };
          }
        }
        merged.push(current);

        consolidated[employeeName][day] = merged;
      });
    });

    return consolidated;
  };

  // Load data from Google Sheets
  const loadScheduleFromSheets = async () => {
    const API_KEY = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY;
    const SHEET_ID = process.env.REACT_APP_SHEET_ID;
    const SHEET_NAME = process.env.REACT_APP_SHEET_NAME || 'Spring 2026 Fixed Schedule';

    if (!API_KEY || !SHEET_ID) {
      setError('Missing API key or Sheet ID. Please check your .env file.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A1:H100?key=${API_KEY}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values;

      if (!rows || rows.length < 3) {
        throw new Error('Sheet is empty or improperly formatted');
      }

      // Row 0: Week info (ignored for now)
      // Row 1: "Day" header and day names
      const headerRow = rows[1];
      const dayNames = headerRow.slice(2); // Skip "Day" and "Time" columns

      // Extract dates from header if available
      setWeekDates(dayNames);

      // Parse schedule data starting from row 2
      const rawSchedule = {};
      const employeeSet = new Set();

      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const timeSlot = row[0]; // e.g., "09:00-09:30"
        if (!timeSlot || !timeSlot.includes('-')) continue;

        const { start, end } = parseTimeSlot(timeSlot);

        // Process each day column (starting from column 2)
        for (let dayIndex = 0; dayIndex < dayNames.length; dayIndex++) {
          const cellValue = row[dayIndex + 2]; // +2 to skip "Day" and "Time" columns
          if (!cellValue || cellValue.trim() === '') continue;

          // Handle multiple employees in same cell (e.g., "Sophia/Jacob")
          const employeeNames = cellValue.split('/').map(name => name.trim());

          employeeNames.forEach(employeeName => {
            if (!employeeName) return;

            employeeSet.add(employeeName);

            if (!rawSchedule[employeeName]) {
              rawSchedule[employeeName] = {};
            }

            const dayName = days[dayIndex];
            if (!rawSchedule[employeeName][dayName]) {
              rawSchedule[employeeName][dayName] = [];
            }

            rawSchedule[employeeName][dayName].push({ start, end });
          });
        }
      }

      // Consolidate consecutive time slots
      const consolidatedSchedule = consolidateShifts(rawSchedule);

      // Create employee list (you can add contact info later)
      const employeeList = Array.from(employeeSet).sort().map((name, index) => ({
        id: index + 1,
        name: name,
        phone: '555-0100', // Placeholder
        email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
        photo: '👤'
      }));

      setEmployees(employeeList);
      setSchedule(consolidatedSchedule);
      setLastUpdated(new Date());
      setLoading(false);

    } catch (err) {
      console.error('Error loading schedule:', err);
      setError(`Failed to load schedule: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleFromSheets();
  }, []);

  const calculateHours = (shifts) => {
    if (!shifts || shifts.length === 0) return 0;

    let totalMinutes = 0;
    shifts.forEach(shift => {
      const startMinutes = timeToMinutes(shift.start);
      const endMinutes = timeToMinutes(shift.end);
      totalMinutes += (endMinutes - startMinutes);
    });

    return totalMinutes / 60;
  };

  const getEmployeeWeeklyHours = (employeeName) => {
    const employeeSchedule = schedule[employeeName] || {};
    let totalHours = 0;

    Object.values(employeeSchedule).forEach(shifts => {
      totalHours += calculateHours(shifts);
    });

    return totalHours;
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatShift = (shift) => {
    return `${formatTime(shift.start)} - ${formatTime(shift.end)}`;
  };

  const EmployeeProfile = ({ employee }) => {
    const [hourlyRate, setHourlyRate] = useState('');
    const [tipsPerHour, setTipsPerHour] = useState('');

    const weeklyHours = getEmployeeWeeklyHours(employee.name);
    const employeeShifts = schedule[employee.name] || {};

    const estimatedPay = hourlyRate ? weeklyHours * parseFloat(hourlyRate) : 0;
    const estimatedTips = tipsPerHour ? weeklyHours * parseFloat(tipsPerHour) : 0;
    const totalEarnings = estimatedPay + estimatedTips;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 text-white rounded-t-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="text-6xl bg-white bg-opacity-20 rounded-full w-20 h-20 flex items-center justify-center">
                    {employee.photo}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{employee.name}</h2>
                    <p className="text-orange-100 mt-1">{weeklyHours.toFixed(1)} hours this week</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEmployee(null)} className="text-white hover:bg-white hover:bg-opacity-20 rounded p-2">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar size={18} className="text-orange-600" />
                  This Week's Shifts
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {days.map(day => {
                    const shifts = employeeShifts[day];
                    return shifts && shifts.length > 0 ? (
                        <div key={day} className="bg-orange-50 p-3 rounded-lg">
                          <div className="font-medium text-gray-800 mb-1">{day}</div>
                          {shifts.map((shift, idx) => (
                              <div key={idx} className="text-orange-700 flex items-center gap-1 ml-4">
                                <Clock size={16} />
                                {formatShift(shift)}
                              </div>
                          ))}
                        </div>
                    ) : null;
                  })}
                  {Object.keys(employeeShifts).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No shifts scheduled this week</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <DollarSign size={18} className="text-orange-600" />
                  Pay Calculator
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                    <input
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="15.00"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Tips Per Hour ($)</label>
                    <input
                        type="number"
                        value={tipsPerHour}
                        onChange={(e) => setTipsPerHour(e.target.value)}
                        placeholder="10.00"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {(hourlyRate || tipsPerHour) && (
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-gray-700">
                          <span>Base Pay:</span>
                          <span className="font-semibold">${estimatedPay.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Estimated Tips:</span>
                          <span className="font-semibold">${estimatedTips.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-orange-700 border-t border-orange-200 pt-2">
                          <span>Total Estimated:</span>
                          <span>${totalEarnings.toFixed(2)}</span>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="animate-spin text-orange-600 mx-auto mb-4" size={48} />
            <p className="text-gray-600 text-lg">Loading schedule from Google Sheets...</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Schedule</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
                onClick={loadScheduleFromSheets}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800">Employee Schedule</h1>
              <div className="flex gap-4">
                <button
                    onClick={loadScheduleFromSheets}
                    className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200"
                >
                  <RefreshCw size={18} />
                  <span className="text-sm">Refresh</span>
                </button>
                <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg">
                  <Bell size={18} />
                  <span className="text-sm">Last updated: {lastUpdated?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar size={20} />
                <span className="font-semibold text-lg">Sun - Thur 7am-9pm / Fri & Sat 7am-10pm</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                <tr className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
                  <th className="px-6 py-4 text-left font-semibold">Employee</th>
                  {days.map(day => (
                      <th key={day} className="px-6 py-4 text-center font-semibold min-w-[160px]">{day}</th>
                  ))}
                  <th className="px-6 py-4 text-center font-semibold">Total Hours</th>
                </tr>
                </thead>
                <tbody>
                {employees.map((employee, idx) => (
                    <tr
                        key={employee.id}
                        className={`border-b hover:bg-orange-50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-orange-25'}`}
                        onClick={() => setSelectedEmployee(employee)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{employee.photo}</span>
                          <span className="font-medium text-gray-800">{employee.name}</span>
                        </div>
                      </td>
                      {days.map(day => {
                        const shifts = schedule[employee.name]?.[day];
                        return (
                            <td key={day} className="px-6 py-4 text-center">
                              {shifts && shifts.length > 0 ? (
                                  <div className="space-y-1">
                                    {shifts.map((shift, idx) => (
                                        <div key={idx} className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg text-sm font-medium">
                                          {formatShift(shift)}
                                        </div>
                                    ))}
                                  </div>
                              ) : (
                                  <span className="text-gray-400">OFF</span>
                              )}
                            </td>
                        );
                      })}
                      <td className="px-6 py-4 text-center">
                      <span className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-lg font-bold">
                        {getEmployeeWeeklyHours(employee.name).toFixed(1)}h
                      </span>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-orange-100 border-l-4 border-orange-600 p-4 rounded">
            <p className="text-orange-800">
              <strong>Tip:</strong> Click on any employee row to view their detailed schedule and calculate their estimated pay for the week!
            </p>
          </div>
        </div>

        {selectedEmployee && <EmployeeProfile employee={selectedEmployee} />}
      </div>
  );
};

export default EmployeeScheduler;