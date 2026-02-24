const express = require('express');
const { getDatabase } = require('../config/database');

const router = express.Router();
const bcrypt = require('bcrypt');
// Get all employees with user details - FIXED: Only show Employees, not Admins
router.get('/', async (req, res) => {
  try {
    const pool = await getDatabase();
    
    const result = await pool.request().query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.emp_salary as salary,
        u.created_at,
        e.emp_id,
        e.job_title,
        e.hire_date
      FROM Users u
      LEFT JOIN Employees e ON u.user_id = e.user_id
      WHERE u.role = 'Employee'  -- CHANGED: Only show Employees, not Admins
      ORDER BY u.created_at DESC
    `);

    console.log('📊 Employees found:', result.recordset.length);
    res.json({ employees: result.recordset });
  } catch (err) {
    console.error('Get employees error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update employee salary and details - ADDED ADMIN PROTECTION
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { salary, job_title, phone } = req.body;
    const pool = await getDatabase();

    console.log('🔄 Updating employee:', userId, { salary, job_title, phone });

    // First check if the user is an Admin (prevent editing admins)
    const userCheck = await pool.request()
      .input('userId', userId)
      .query('SELECT role FROM Users WHERE user_id = @userId');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userCheck.recordset[0].role === 'Admin') {
      return res.status(403).json({ error: 'Cannot edit Admin users' });
    }

    // Update user salary (using emp_salary column) and phone
    await pool.request()
      .input('userId', userId)
      .input('salary', salary)
      .input('phone', phone)
      .query(`
        UPDATE Users 
        SET emp_salary = @salary, phone = @phone 
        WHERE user_id = @userId
      `);

    // Update or insert employee job title
    const employeeCheck = await pool.request()
      .input('userId', userId)
      .query('SELECT emp_id FROM Employees WHERE user_id = @userId');

    if (employeeCheck.recordset.length > 0) {
      // Update existing employee
      await pool.request()
        .input('userId', userId)
        .input('job_title', job_title)
        .query(`
          UPDATE Employees 
          SET job_title = @job_title 
          WHERE user_id = @userId
        `);
    } else {
      // Insert new employee record
      await pool.request()
        .input('userId', userId)
        .input('job_title', job_title)
        .query(`
          INSERT INTO Employees (user_id, job_title, hire_date) 
          VALUES (@userId, @job_title, GETDATE())
        `);
    }

    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/create', async (req, res) => {
  try {
    const { name, email, phone, salary, job_title, password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const pool = await getDatabase();

    // Check if email already exists
    const existing = await pool.request()
      .input("email", email)
      .query("SELECT user_id FROM Users WHERE email = @email");

    if (existing.recordset.length > 0) {
      return res.status(400).json({ error: "Email already exists as a user" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into Users
    const insertUser = await pool.request()
      .input("name", name)
      .input("email", email)
      .input("phone", phone)
      .input("password", hashedPassword)
      .input("role", "Employee")
      .input("salary", salary)
      .query(`
        INSERT INTO Users (name, email, phone, password, role, emp_salary, created_at)
        OUTPUT INSERTED.user_id
        VALUES (@name, @email, @phone, @password, @role, @salary, GETDATE())
      `);

    const newUserId = insertUser.recordset[0].user_id;

    // Insert into Employees table
    await pool.request()
      .input("userId", newUserId)
      .input("job_title", job_title)
      .query(`
        INSERT INTO Employees (user_id, job_title, hire_date)
        VALUES (@userId, @job_title, GETDATE())
      `);

    return res.json({ message: "Employee created successfully", user_id: newUserId });

  } catch (err) {
    console.error("❌ Create employee error:", err);
    res.status(500).json({ error: "Server error creating employee" });
  }
});
// Delete employee - ADDED ADMIN PROTECTION
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await getDatabase();

    console.log('🗑️ Deleting employee:', userId);

    // First check if the user is an Admin (prevent deleting admins)
    const userCheck = await pool.request()
      .input('userId', userId)
      .query('SELECT role FROM Users WHERE user_id = @userId');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userCheck.recordset[0].role === 'Admin') {
      return res.status(403).json({ error: 'Cannot delete Admin users' });
    }

    // First delete from Employees table
    await pool.request()
      .input('userId', userId)
      .query('DELETE FROM Employees WHERE user_id = @userId');

    // Then delete from Users table
    await pool.request()
      .input('userId', userId)
      .query('DELETE FROM Users WHERE user_id = @userId');

    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard statistics - UPDATED: Count only Employees for total_employees
router.get('/statistics/summary', async (req, res) => {
  try {
    const pool = await getDatabase();
    
    // Get total store sales
    const salesResult = await pool.request().query(`
      SELECT COALESCE(SUM(amount), 0) as total_sales 
      FROM Payments 
      WHERE service_type = 'Store' AND status = 'Completed'
    `);
    // ✅ Get store products count
const storeProductsResult = await pool.request().query(`
  SELECT COUNT(*) AS store_products
  FROM dbo.Products
`);

// ✅ Get gaming devices count
const gamingDevicesResult = await pool.request().query(`
  SELECT COUNT(*) AS gaming_devices
  FROM dbo.GamingDevices
`);

// ✅ Get sports facilities count
const sportsFacilitiesResult = await pool.request().query(`
  SELECT COUNT(*) AS sports_facilities
  FROM dbo.Stadiums
`);

    // Get total gym members  ✅ FIXED
const gymResult = await pool.request().query(`
  SELECT COUNT(DISTINCT member_id) as total_members
  FROM GymSubscriptions
  WHERE status = 'Active'
    AND member_id IS NOT NULL
`);


    // Get active reservations
    const reservationsResult = await pool.request().query(`
      SELECT COUNT(*) as active_reservations 
      FROM MatchReservations 
      WHERE status = 'Confirmed'
    `);

    // Get monthly income
    const incomeResult = await pool.request().query(`
      SELECT COALESCE(SUM(amount), 0) as monthly_income 
      FROM Payments 
      WHERE status = 'Completed' 
      AND MONTH(payment_date) = MONTH(GETDATE())
      AND YEAR(payment_date) = YEAR(GETDATE())
    `);

    // Get total employees - CHANGED: Only count Employees, not Admins
    const employeesResult = await pool.request().query(`
      SELECT COUNT(*) as total_employees 
      FROM Users 
      WHERE role = 'Employee'  -- CHANGED: Only count Employees
    `);

    const statistics = {
  storeSales: salesResult.recordset[0].total_sales,
  gymMembers: gymResult.recordset[0].total_members,
  activeReservations: reservationsResult.recordset[0].active_reservations,
  monthlyIncome: incomeResult.recordset[0].monthly_income,
  totalEmployees: employeesResult.recordset[0].total_employees,

  // ✅ NEW Quick Stats keys
  storeProducts: storeProductsResult.recordset[0].store_products,
  gamingDevices: gamingDevicesResult.recordset[0].gaming_devices,
  sportsFacilities: sportsFacilitiesResult.recordset[0].sports_facilities
};

    console.log('📈 Statistics loaded:', statistics);
    res.json({ statistics });
  } catch (err) {
    console.error('Get statistics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET /api/statistics/reservations-calendar?year=2025
router.get("/statistics/reservations-calendar", async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const pool = await getDatabase();

    const result = await pool.request()
      .input("year", sql.Int, year)
      .query(`
        SELECT 
          CONVERT(VARCHAR(10), reservation_date, 23) AS day,
          COUNT(*) AS count
        FROM dbo.MatchReservations
        WHERE YEAR(reservation_date) = @year
          AND status = 'confirmed'
        GROUP BY CONVERT(VARCHAR(10), reservation_date, 23)
        ORDER BY day;
      `);

    res.json({ days: result.recordset });
  } catch (err) {
    console.error("❌ reservations-calendar error:", err);
    res.status(500).json({ error: "Failed to load reservations calendar" });
  }
});

module.exports = router;