const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

const router = express.Router();

// User registration (with role)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role = 'Customer' } = req.body;
    const pool = await getDatabase();
    
    // Validate role
    const validRoles = ['Customer', 'Employee', 'Admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: Customer, Employee, or Admin' });
    }

    // Check if user exists
    const userCheck = await pool.request()
      .input('email', email)
      .query('SELECT user_id FROM Users WHERE email = @email');
    
    if (userCheck.recordset.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.request()
      .input('name', name)
      .input('email', email)
      .input('password', hashedPassword)
      .input('phone', phone)
      .input('role', role)
      .query(`
        INSERT INTO Users (name, email, password, phone, role) 
        OUTPUT INSERTED.user_id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.phone
        VALUES (@name, @email, @password, @phone, @role)
      `);

    const user = result.recordset[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email, 
        role: user.role,
        name: user.name
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login (email + password)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = await getDatabase();

    // Find user by email
    const result = await pool.request()
      .input('email', email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.recordset[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token with user info
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email, 
        role: user.role,
        name: user.name
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Prepare response based on role
    let userData = {
      id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at
    };

    // If employee, get employee details
    if (user.role === 'Employee') {
      const empResult = await pool.request()
        .input('userId', user.user_id)
        .query('SELECT emp_id, job_title, hire_date FROM Employees WHERE user_id = @userId');
      
      if (empResult.recordset.length > 0) {
        userData.employeeInfo = empResult.recordset[0];
      }
    }

    res.json({
      message: 'Login successful',
      user: userData,
      token
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (Admin only - we'll add middleware later)
router.get('/users', async (req, res) => {
  try {
    const pool = await getDatabase();

    const result = await pool.request()
      .query(`
        SELECT user_id, name, email, phone, role, created_at 
        FROM Users 
        ORDER BY created_at DESC
      `);

    res.json({ users: result.recordset });

  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await getDatabase();

    const result = await pool.request()
      .input('userId', userId)
      .query('SELECT user_id, name, email, phone, role, created_at FROM Users WHERE user_id = @userId');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.recordset[0];

    // Add employee info if applicable
    if (user.role === 'Employee') {
      const empResult = await pool.request()
        .input('userId', userId)
        .query('SELECT emp_id, job_title, salary, hire_date FROM Employees WHERE user_id = @userId');
      
      if (empResult.recordset.length > 0) {
        user.employeeInfo = empResult.recordset[0];
      }
    }

    res.json({ user });

  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;