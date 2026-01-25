import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Bell, X, User, Loader, RefreshCw, ChevronLeft, ChevronRight, Phone, Mail, Lock } from 'lucide-react';

const EmployeeScheduler = () => {
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekDates, setWeekDates] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState(null);
  const [payDay, setPayDay] = useState(null);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Add these state variables
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

// Add this login handler
  const handleLogin = (e) => {
    e.preventDefault();
    const correctUsername = 'SweetDotsMusicCity';
    const correctPassword = '112921';

    if (username === correctUsername && password === correctPassword) {
      setIsAuthenticated(true);
      setLoginError('');
      calculatePayPeriod();
      loadScheduleFromSheets();
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const calculatePayPeriod = () => {
    const referencePeriodEnd = new Date(2026, 0, 18);
    referencePeriodEnd.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysSinceReference = Math.floor((today - referencePeriodEnd) / (1000 * 60 * 60 * 24));
    const periodsPassed = Math.floor(daysSinceReference / 14);

    let nextPeriodEnd = new Date(referencePeriodEnd);

    if (daysSinceReference >= 0) {
      nextPeriodEnd.setDate(referencePeriodEnd.getDate() + (periodsPassed + 1) * 14);
    }

    const payDay = new Date(nextPeriodEnd);
    payDay.setDate(nextPeriodEnd.getDate() + 3);

    setPayPeriodEnd(nextPeriodEnd);
    setPayDay(payDay);
  };

  const parseTimeSlot = (timeSlot) => {
    const [start, end] = timeSlot.split('-');
    return { start, end };
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const consolidateShifts = (rawSchedule) => {
    const consolidated = {};

    Object.keys(rawSchedule).forEach(employeeName => {
      consolidated[employeeName] = {};

      Object.keys(rawSchedule[employeeName]).forEach(day => {
        const slots = rawSchedule[employeeName][day];
        if (!slots || slots.length === 0) return;

        slots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

        const merged = [];
        let current = { ...slots[0] };

        for (let i = 1; i < slots.length; i++) {
          const slot = slots[i];
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

  const getAvailableSheets = async () => {
    const API_KEY = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY;
    const SHEET_ID = process.env.REACT_APP_SHEET_ID;

    if (!API_KEY || !SHEET_ID) return [];

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const sheets = data.sheets || [];

      // Filter sheets that start with "THIS WEEK", "NEXT WEEK", "NEXT 2 WEEKS", etc.
      const scheduleSheets = sheets
          .map(sheet => sheet.properties.title)
          .filter(title =>
              title.toUpperCase().includes('THIS WEEK') ||
              title.toUpperCase().includes('NEXT') ||
              title.toUpperCase().includes('WEEK')
          )
          .sort((a, b) => {
            const aUpper = a.toUpperCase();
            const bUpper = b.toUpperCase();

            // Sort: THIS WEEK first, then NEXT WEEK, then NEXT 2 WEEKS, NEXT 3 WEEKS, etc.
            if (aUpper.includes('THIS WEEK')) return -1;
            if (bUpper.includes('THIS WEEK')) return 1;

            // Extract numbers from "NEXT X WEEKS" or just "NEXT WEEK"
            const aMatch = aUpper.match(/NEXT\s+(\d+)\s+WEEK/);
            const bMatch = bUpper.match(/NEXT\s+(\d+)\s+WEEK/);

            const aNum = aMatch ? parseInt(aMatch[1]) : (aUpper.includes('NEXT WEEK') ? 1 : 999);
            const bNum = bMatch ? parseInt(bMatch[1]) : (bUpper.includes('NEXT WEEK') ? 1 : 999);

            return aNum - bNum;
          });

      return scheduleSheets;
    } catch (err) {
      console.error('Error fetching sheets:', err);
      return [];
    }
  };

  const loadContactsFromSheet = async () => {
    const API_KEY = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY;
    const SHEET_ID = process.env.REACT_APP_SHEET_ID;
    const CONTACTS_TAB = 'Contacts/Availability'; // Name of your contacts tab

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(CONTACTS_TAB)}!A1:D100?key=${API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn('Contacts tab not found');
        return {};
      }

      const data = await response.json();
      const rows = data.values;

      if (!rows || rows.length < 2) return {};

      const contacts = {};
      // Row 0 is header: Name | Phone | Email | Availability
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const name = row[0]?.trim();
        const phone = row[1]?.trim() || '555-0100';
        const email = row[2]?.trim() || `${name.toLowerCase().replace(' ', '.')}@email.com`;
        const availability = row[3]?.trim() || 'Not specified';

        if (name) {
          contacts[name] = { phone, email, availability };
        }
      }

      return contacts;
    } catch (err) {
      console.error('Error loading contacts:', err);
      return {};
    }
  };

  const loadScheduleFromSheets = async (sheetName = null) => {
    const API_KEY = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY;
    const SHEET_ID = process.env.REACT_APP_SHEET_ID;
    const contacts = await loadContactsFromSheet();

    if (!API_KEY || !SHEET_ID) {
      setError('Missing API key or Sheet ID. Please check your .env file.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get available weeks if not already loaded
      if (availableWeeks.length === 0) {
        const weeks = await getAvailableSheets();
        setAvailableWeeks(weeks);
        if (!sheetName && weeks.length > 0) {
          sheetName = weeks[0]; // Default to first week
        }
      }

      const SHEET_NAME = sheetName || availableWeeks[currentWeekIndex] || 'THIS WEEK 1/19-1/25';
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

      // Row 0: Week info
      const weekInfo = rows[0]?.[0] || '';
      setWeekDates(weekInfo);

      const headerRow = rows[1];
      const dayNamesFromSheet = headerRow.slice(1);

      const dayMapping = {};
      dayNamesFromSheet.forEach((dayName, index) => {
        const dayMatch = dayName.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
        if (dayMatch) {
          dayMapping[index] = dayMatch[1];
        }
      });

      const rawSchedule = {};
      const employeeSet = new Set();
      const closedDays = new Set();

      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const timeSlot = row[0];
        if (!timeSlot || !timeSlot.includes('-')) continue;

        const { start, end } = parseTimeSlot(timeSlot);

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const cellValue = row[dayIndex + 1];
          const dayName = dayMapping[dayIndex];

          if (!cellValue || cellValue.trim() === '' || !dayName) continue;

          // Check if day is closed
          if (cellValue.toUpperCase().includes('CLOSED')) {
            closedDays.add(dayName);
            continue;
          }

          const employeeNames = cellValue.split('/').map(name => name.trim());

          employeeNames.forEach(employeeName => {
            if (!employeeName) return;

            employeeSet.add(employeeName);

            if (!rawSchedule[employeeName]) {
              rawSchedule[employeeName] = {};
            }

            if (!rawSchedule[employeeName][dayName]) {
              rawSchedule[employeeName][dayName] = [];
            }

            rawSchedule[employeeName][dayName].push({ start, end });
          });
        }
      }

      const consolidatedSchedule = consolidateShifts(rawSchedule);

      const employeeList = Array.from(employeeSet)
          .sort()
          .map((firstName, index) => {
            // Find the contact whose full name starts with this first name
            const contactEntry = Object.entries(contacts).find(
                ([fullName, info]) =>
                    fullName.toLowerCase().startsWith(firstName.toLowerCase())
            );

            const [fullName, contactInfo] = contactEntry || [firstName, {}];

            return {
              id: index + 1,
              firstName,           // keep this for schedule lookup
              fullName,            // use this for profile display
              phone: contactInfo?.phone || '555-0100',
              email:
                  contactInfo?.email ||
                  `${firstName.toLowerCase().replace(' ', '.')}@email.com`,
              availability: contactInfo?.availability || 'Not specified',
              photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  fullName
              )}&background=f97316&color=fff&size=128`,
            };
          });


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
    calculatePayPeriod();
    loadScheduleFromSheets();
  }, []);

  const handleWeekChange = (direction) => {
    const newIndex = currentWeekIndex + direction;
    if (newIndex >= 0 && newIndex < availableWeeks.length) {
      setCurrentWeekIndex(newIndex);
      loadScheduleFromSheets(availableWeeks[newIndex]);
    }
  };

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

  const getDaysUntilPayday = () => {
    if (!payDay) return 0;
    const today = new Date();
    const diffTime = payDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const EmployeeProfile = ({ employee }) => {
    const [hourlyRate, setHourlyRate] = useState('');
    const [tipsPerHour, setTipsPerHour] = useState('');

    const weeklyHours = getEmployeeWeeklyHours(employee.firstName);
    const employeeShifts = schedule[employee.firstName] || {};

    const estimatedPay = hourlyRate ? weeklyHours * parseFloat(hourlyRate) : 0;
    const estimatedTips = tipsPerHour ? weeklyHours * parseFloat(tipsPerHour) : 0;
    const totalEarnings = estimatedPay + estimatedTips;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-orange-500 p-6 text-white rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div
                      className="text-6xl bg-white bg-opacity-20 rounded-full w-20 h-20 flex items-center justify-center">
                    <img
                        src={employee.photo}
                        alt={employee.fullName}
                        className="w-10 h-10 rounded-full"
                    />

                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{employee.fullName}</h2>
                    <p className="text-orange-100 mt-1">{weeklyHours.toFixed(1)} hours this week</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEmployee(null)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-[#2c1612] mb-3 flex items-center gap-2">
                  <User size={18} className="text-orange-500" />
                  Contact Information
                </h3>
                <div className="bg-orange-50 rounded-xl p-4 space-y-2 border border-orange-100">
                  <div className="flex items-center gap-2 text-[#2c1612]">
                    <Phone size={16} className="text-orange-600" />
                    <span>{employee.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#2c1612]">
                    <Mail size={16} className="text-orange-600" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#2c1612]">
                    <Calendar size={16} className="text-orange-600" />
                    <span><strong>Availability:</strong> {employee.availability}</span>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold text-[#2c1612] mb-3 flex items-center gap-2">
                  <Calendar size={18} className="text-orange-500" />
                  This Week's Shifts
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {days.map(day => {
                    const shifts = employeeShifts[day];
                    return shifts && shifts.length > 0 ? (
                        <div key={day} className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                          <div className="font-medium text-[#2c1612] mb-1">{day}</div>
                          {shifts.map((shift, idx) => (
                              <div key={idx} className="text-orange-600 flex items-center gap-1 ml-4">
                                <Clock size={16} />
                                {formatShift(shift)}
                              </div>
                          ))}
                        </div>
                    ) : null;
                  })}
                  {Object.keys(employeeShifts).length === 0 && (
                      <p className="text-[#2c1612]/80 text-center py-4">No shifts scheduled this week</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-[#2c1612] mb-3 flex items-center gap-2">
                  <DollarSign size={18} className="text-orange-500" />
                  Pay Calculator
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2c1612] mb-1">Hourly Rate ($)</label>
                    <input
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="10.00"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2c1612] mb-1">Estimated Tips Per Hour ($)</label>
                    <input
                        type="number"
                        value={tipsPerHour}
                        onChange={(e) => setTipsPerHour(e.target.value)}
                        placeholder="2.00"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>

                  {(hourlyRate || tipsPerHour) && (
                      <div className="bg-orange-50 p-4 rounded-xl space-y-2 border border-orange-100">
                        <div className="flex justify-between text-[#2c1612]">
                          <span>Base Pay:</span>
                          <span className="font-semibold">${estimatedPay.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[#2c1612]">
                          <span>Estimated Tips:</span>
                          <span className="font-semibold">${estimatedTips.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-orange-600 border-t border-orange-200 pt-2">
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="animate-spin text-orange-500 mx-auto mb-4" size={48} />
            <p className="text-[#2c1612]/70 text-lg">Loading schedule...</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#2c1612] mb-2">Error Loading Schedule</h2>
            <p className="text-[#2c1612]/70 mb-4">{error}</p>
            <button
                onClick={() => loadScheduleFromSheets()}
                className="bg-orange-500 text-white px-6 py-2 rounded-xl hover:bg-orange-600 flex items-center gap-2 mx-auto transition"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <div className="bg-orange-500 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4">
                <img
                    src="/sweetdotsfavicon-removebg-preview.png"
                    alt="Sweet Dots Logo"
                    className="w-30 h-30 object-cover"
                />
              </div>


              <h1 className="text-3xl font-bold text-[#2c1612] mb-2">Sweet Dots Schedule</h1>
              <p className="text-[#2c1612]/70">Employee access only</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2c1612] mb-1">Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    placeholder="Enter username"
                    required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c1612] mb-1">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    placeholder="Enter password"
                    required
                />
              </div>

              {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {loginError}
                  </div>
              )}

              <button
                  type="submit"
                  className="w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition font-semibold"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
    );
  }


  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#2c1612]">Sweet Dots Schedule</h1>
                <p className="text-[#2c1612]/80 text-sm mt-1">Weekly employee schedule</p>
              </div>
              <div className="flex gap-3">
                <button
                    onClick={() => loadScheduleFromSheets(availableWeeks[currentWeekIndex])}
                    className="flex items-center gap-2 bg-gray-100 text-[#2c1612] px-4 py-2 rounded-xl hover:bg-gray-200 transition"
                >
                  <RefreshCw size={18}/>
                  <span className="text-sm font-medium">Refresh</span>
                </button>
                <div
                    className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl border border-orange-100">
                  <Bell size={18}/>
                  <span className="text-sm font-medium">Updated {lastUpdated?.toLocaleDateString()}</span>
                </div>
                <div
                    className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl border border-purple-100">
                  <a href="https://docs.google.com/forms/d/e/1FAIpQLSdPtBVD3frylj98omBXRuDOFCstH_XfnhrzyT_AjGnDpo0arQ/viewform?usp=sharing&ouid=11590243698813203477" target="_blank"
                     className="font-medium text-sm">Update Availability</a>
                  <span>|</span>
                  <a href="https://docs.google.com/forms/d/e/1FAIpQLSdDUj3SzmvxOpO_JqJA4fQJo2TOT4Vt926O_WecVfKN4X745g/viewform?usp=sharing&ouid=115902436988132034775" target="_blank" className="font-medium text-sm">Request
                    Time Off</a>
                </div>
              </div>
            </div>

            <div className="bg-orange-500 text-white p-3 rounded-xl mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={20}/>
                <span className="font-medium">Sun - Thur 11am-9pm / Fri & Sat 11am-10pm</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-50 text-orange-700 p-4 rounded-xl border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20}/>
                  <span className="font-semibold text-sm">Pay Period Ends</span>
                </div>
                <p className="text-2xl font-bold">{payPeriodEnd?.toLocaleDateString()}</p>
              </div>

              <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={20}/>
                  <span className="font-semibold text-sm">Pay Day</span>
                </div>
                <p className="text-2xl font-bold">{payDay?.toLocaleDateString()}</p>
              </div>

              <div className="bg-blue-50 text-blue-700 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={20}/>
                  <span className="font-semibold text-sm">Days Until Payday</span>
                </div>
                <p className="text-2xl font-bold">{getDaysUntilPayday()} days</p>
              </div>
            </div>

            {/* Week Selector */}
            <div className="flex items-center justify-between mt-4 bg-gray-50 p-3 rounded-xl">
              <button
                  onClick={() => handleWeekChange(-1)}
                  disabled={currentWeekIndex === 0}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                      currentWeekIndex === 0
                          ? 'text-[#2c1612]/35 cursor-not-allowed'
                          : 'text-[#2c1612] hover:bg-gray-200'
                  }`}
              >
                <ChevronLeft size={18}/>
                <span className="font-medium text-sm">Previous</span>
              </button>

              <div className="text-center">
                <div className="text-xs text-[#2c1612]/80 font-medium">
                  {availableWeeks[currentWeekIndex] || 'Current Week'}
                </div>
                <div className="text-sm font-bold text-[#2c1612]">{weekDates}</div>
              </div>

              <button
                  onClick={() => handleWeekChange(1)}
                  disabled={currentWeekIndex === availableWeeks.length - 1}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                      currentWeekIndex === availableWeeks.length - 1
                          ? 'text-[#2c1612]/35 cursor-not-allowed'
                          : 'text-[#2c1612] hover:bg-gray-200'
                  }`}
              >
                <span className="font-medium text-sm">Next</span>
                <ChevronRight size={18}/>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                <tr className="bg-orange-500 text-white">
                  <th className="px-4 py-3 text-left font-semibold text-sm">Employee</th>
                  {days.map(day => (
                      <th key={day}
                          className="px-3 py-3 text-center font-semibold text-sm min-w-[120px]">{day.substring(0, 3)}</th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold text-sm">Hours</th>
                </tr>
                </thead>
                <tbody>
                {employees.map((employee, idx) => (
                    <tr
                        key={employee.id}
                        className={`border-b border-gray-100 hover:bg-orange-50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        onClick={() => setSelectedEmployee(employee)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img
                              src={employee.photo}
                              alt={employee.firstName}
                              className="w-10 h-10 rounded-full"
                          />

                          <span className="font-medium text-[#2c1612] text-sm">{employee.firstName}</span>
                        </div>
                      </td>
                      {days.map(day => {
                        const shifts = schedule[employee.firstName]?.[day]; // <-- use firstName here
                        return (
                            <td key={day} className="px-3 py-3 text-center">
                              {shifts && shifts.length > 0 ? (
                                  <div className="space-y-1">
                                    {shifts.map((shift, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-medium border border-orange-200"
                                        >
                                          {formatShift(shift)}
                                        </div>
                                    ))}
                                  </div>
                              ) : (
                                  <span className="text-[#2c1612]/35 text-xs">OFF</span>
                              )}
                            </td>
                        );
                      })}

                      <td className="px-4 py-3 text-center">
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-lg font-bold text-xs">
                        {getEmployeeWeeklyHours(employee.firstName).toFixed(1)}h
                      </span>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
          <footer className="text-[#2c1612] text-center py-4 mt-6">
            <h2 className="text-sm font-medium">© Cherish Farmer 2026</h2>
          </footer>

        </div>

        {selectedEmployee && <EmployeeProfile employee={selectedEmployee}/>}
      </div>
  );
};

export default EmployeeScheduler;