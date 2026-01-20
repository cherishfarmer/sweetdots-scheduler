import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Bell, X, User, Phone, Mail, Loader } from 'lucide-react';

// Firebase imports - make sure to create firebase.js in your src folder
// import { db } from './firebase';
// import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const EmployeeScheduler = () => {
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [payPeriodEnd, setPayPeriodEnd] = useState(null);
  const [payDay, setPayDay] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Initialize Firebase data (run this once to populate your database)
  const initializeFirebaseData = async () => {
    // Uncomment when you have Firebase set up
    /*
    try {
      // Initialize employees
      const employeesData = [
        { id: 1, name: 'Sarah Johnson', phone: '555-0101', email: 'sarah@email.com', photo: '👩' },
        { id: 2, name: 'Mike Chen', phone: '555-0102', email: 'mike@email.com', photo: '👨' },
        { id: 3, name: 'Emily Rodriguez', phone: '555-0103', email: 'emily@email.com', photo: '👩' },
        { id: 4, name: 'James Wilson', phone: '555-0104', email: 'james@email.com', photo: '👨' },
        { id: 5, name: 'Lisa Park', phone: '555-0105', email: 'lisa@email.com', photo: '👩' },
        { id: 6, name: 'David Brown', phone: '555-0106', email: 'david@email.com', photo: '👨' },
        { id: 7, name: 'Maria Garcia', phone: '555-0107', email: 'maria@email.com', photo: '👩' },
        { id: 8, name: 'Tom Anderson', phone: '555-0108', email: 'tom@email.com', photo: '👨' },
      ];

      for (const emp of employeesData) {
        await setDoc(doc(db, 'employees', emp.id.toString()), emp);
      }

      // Initialize schedule
      const scheduleData = {
        weekOf: '2024-01-15',
        shifts: {
          1: { Mon: '9:00 AM - 5:00 PM', Wed: '9:00 AM - 5:00 PM', Fri: '9:00 AM - 5:00 PM' },
          2: { Tue: '10:00 AM - 6:00 PM', Thu: '10:00 AM - 6:00 PM', Sat: '10:00 AM - 4:00 PM' },
          3: { Mon: '2:00 PM - 10:00 PM', Wed: '2:00 PM - 10:00 PM', Fri: '2:00 PM - 10:00 PM' },
          4: { Tue: '9:00 AM - 5:00 PM', Thu: '9:00 AM - 5:00 PM', Sun: '12:00 PM - 8:00 PM' },
          5: { Mon: '10:00 AM - 6:00 PM', Thu: '10:00 AM - 6:00 PM', Sat: '9:00 AM - 5:00 PM' },
          6: { Wed: '9:00 AM - 5:00 PM', Fri: '2:00 PM - 10:00 PM', Sun: '10:00 AM - 6:00 PM' },
          7: { Tue: '2:00 PM - 10:00 PM', Sat: '10:00 AM - 6:00 PM' },
          8: { Mon: '9:00 AM - 5:00 PM', Thu: '2:00 PM - 10:00 PM', Fri: '9:00 AM - 5:00 PM' },
        },
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'schedules', 'current'), scheduleData);

      // Initialize settings
      await setDoc(doc(db, 'settings', 'payroll'), {
        payPeriodEnd: new Date('2024-01-21'),
        payDay: new Date('2024-01-24')
      });

      console.log('Firebase initialized successfully!');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
    */
  };

  // Load data from Firebase
  const loadDataFromFirebase = async () => {
    // Uncomment when you have Firebase set up
    /*
    try {
      setLoading(true);

      // Load employees
      const employeesSnapshot = await getDocs(collection(db, 'employees'));
      const employeesData = [];
      employeesSnapshot.forEach((doc) => {
        employeesData.push(doc.data());
      });
      setEmployees(employeesData.sort((a, b) => a.id - b.id));

      // Load schedule
      const scheduleDoc = await getDocs(collection(db, 'schedules'));
      scheduleDoc.forEach((doc) => {
        if (doc.id === 'current') {
          const data = doc.data();
          setSchedule(data.shifts || {});
          setLastUpdated(data.updatedAt?.toDate() || new Date());
        }
      });

      // Load payroll settings
      const settingsDoc = await getDocs(collection(db, 'settings'));
      settingsDoc.forEach((doc) => {
        if (doc.id === 'payroll') {
          const data = doc.data();
          setPayPeriodEnd(data.payPeriodEnd?.toDate() || new Date());
          setPayDay(data.payDay?.toDate() || new Date());
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
      // Fall back to demo data if Firebase fails
      loadDemoData();
    }
    */

    // Using demo data for now (remove this when Firebase is ready)
    loadDemoData();
  };

  // Demo data fallback
  const loadDemoData = () => {
    setEmployees([
      { id: 1, name: 'Sarah Johnson', phone: '555-0101', email: 'sarah@email.com', photo: '👩' },
      { id: 2, name: 'Mike Chen', phone: '555-0102', email: 'mike@email.com', photo: '👨' },
      { id: 3, name: 'Emily Rodriguez', phone: '555-0103', email: 'emily@email.com', photo: '👩' },
      { id: 4, name: 'James Wilson', phone: '555-0104', email: 'james@email.com', photo: '👨' },
      { id: 5, name: 'Lisa Park', phone: '555-0105', email: 'lisa@email.com', photo: '👩' },
      { id: 6, name: 'David Brown', phone: '555-0106', email: 'david@email.com', photo: '👨' },
      { id: 7, name: 'Maria Garcia', phone: '555-0107', email: 'maria@email.com', photo: '👩' },
      { id: 8, name: 'Tom Anderson', phone: '555-0108', email: 'tom@email.com', photo: '👨' },
    ]);

    setSchedule({
      1: { Mon: '9:00 AM - 5:00 PM', Wed: '9:00 AM - 5:00 PM', Fri: '9:00 AM - 5:00 PM' },
      2: { Tue: '10:00 AM - 6:00 PM', Thu: '10:00 AM - 6:00 PM', Sat: '10:00 AM - 4:00 PM' },
      3: { Mon: '2:00 PM - 10:00 PM', Wed: '2:00 PM - 10:00 PM', Fri: '2:00 PM - 10:00 PM' },
      4: { Tue: '9:00 AM - 5:00 PM', Thu: '9:00 AM - 5:00 PM', Sun: '12:00 PM - 8:00 PM' },
      5: { Mon: '10:00 AM - 6:00 PM', Thu: '10:00 AM - 6:00 PM', Sat: '9:00 AM - 5:00 PM' },
      6: { Wed: '9:00 AM - 5:00 PM', Fri: '2:00 PM - 10:00 PM', Sun: '10:00 AM - 6:00 PM' },
      7: { Tue: '2:00 PM - 10:00 PM', Sat: '10:00 AM - 6:00 PM' },
      8: { Mon: '9:00 AM - 5:00 PM', Thu: '2:00 PM - 10:00 PM', Fri: '9:00 AM - 5:00 PM' },
    });

    setLastUpdated(new Date('2024-01-14T15:30:00'));
    setPayPeriodEnd(new Date('2024-01-21'));
    setPayDay(new Date('2024-01-24'));
    setLoading(false);
  };

  useEffect(() => {
    loadDataFromFirebase();
  }, []);

  const calculateHours = (timeString) => {
    if (!timeString) return 0;
    const [start, end] = timeString.split(' - ');
    const startTime = new Date(`2000/01/01 ${start}`);
    const endTime = new Date(`2000/01/01 ${end}`);
    return (endTime - startTime) / (1000 * 60 * 60);
  };

  const getEmployeeWeeklyHours = (employeeId) => {
    const shifts = schedule[employeeId] || {};
    return Object.values(shifts).reduce((total, shift) => total + calculateHours(shift), 0);
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

    const weeklyHours = getEmployeeWeeklyHours(employee.id);
    const employeeShifts = schedule[employee.id] || {};

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
                    <p className="text-orange-100 mt-1">{weeklyHours} hours this week</p>
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
                  <User size={18} className="text-orange-600" />
                  Contact Information
                </h3>
                <div className="bg-orange-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone size={16} className="text-orange-600" />
                    {employee.phone}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail size={16} className="text-orange-600" />
                    {employee.email}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar size={18} className="text-orange-600" />
                  This Week's Shifts
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {days.map(day => (
                      employeeShifts[day] && (
                          <div key={day} className="flex justify-between items-center bg-orange-50 p-3 rounded-lg">
                            <span className="font-medium text-gray-800">{day}</span>
                            <span className="text-orange-700 flex items-center gap-1">
                        <Clock size={16} />
                              {employeeShifts[day]}
                      </span>
                          </div>
                      )
                  ))}
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
            <p className="text-gray-600 text-lg">Loading schedule...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800">Employee Schedule</h1>
              <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg">
                <Bell size={18} />
                <span className="text-sm">Last updated: {lastUpdated?.toLocaleString()}</span>
              </div>
            </div>

            {/* Pay Period Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20} />
                  <span className="font-semibold">Pay Period Ends</span>
                </div>
                <p className="text-2xl font-bold">{payPeriodEnd?.toLocaleDateString()}</p>
              </div>

              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={20} />
                  <span className="font-semibold">Pay Day</span>
                </div>
                <p className="text-2xl font-bold">{payDay?.toLocaleDateString()}</p>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={20} />
                  <span className="font-semibold">Days Until Payday</span>
                </div>
                <p className="text-2xl font-bold">{getDaysUntilPayday()} days</p>
              </div>
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                <tr className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
                  <th className="px-6 py-4 text-left font-semibold">Employee</th>
                  {days.map(day => (
                      <th key={day} className="px-6 py-4 text-center font-semibold min-w-[140px]">{day}</th>
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
                      {days.map(day => (
                          <td key={day} className="px-6 py-4 text-center">
                            {schedule[employee.id]?.[day] ? (
                                <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg text-sm font-medium">
                                  {schedule[employee.id][day]}
                                </div>
                            ) : (
                                <span className="text-gray-400">—</span>
                            )}
                          </td>
                      ))}
                      <td className="px-6 py-4 text-center">
                      <span className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-lg font-bold">
                        {getEmployeeWeeklyHours(employee.id)}h
                      </span>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-orange-100 border-l-4 border-orange-600 p-4 rounded">
            <p className="text-orange-800">
              <strong>Firebase Setup:</strong> Currently using demo data. Uncomment Firebase code in the component and create your firebase.js file to connect to your database.
            </p>
          </div>
        </div>

        {/* Employee Profile Modal */}
        {selectedEmployee && <EmployeeProfile employee={selectedEmployee} />}
      </div>
  );
};

export default EmployeeScheduler;