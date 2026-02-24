// // Back_end/controllers/customerController.js

// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const path = require("path");
// const { getDatabase, sql } = require("../config/database");

// // helper: calculate age from birth_date
// function calcAge(birth_date) {
//   const today = new Date();
//   const birth = new Date(birth_date);
//   let age = today.getFullYear() - birth.getFullYear();
//   const m = today.getMonth() - birth.getMonth();
//   if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
//   return age;
// }

// // ✅ REGISTER CUSTOMER (with birth_date + age >= 15)
// exports.registerCustomer = async (req, res) => {
//   try {
//     const { name, email, phone, password, birth_date } = req.body;

//     if (!name || !email || !password || !birth_date) {
//       return res.status(400).json({
//         message: "Name, email, password, and birth date are required"
//       });
//     }

//     // Age validation
//     const age = calcAge(birth_date);
//     if (isNaN(age)) {
//       return res.status(400).json({
//         message: "Birth date format must be valid (YYYY-MM-DD)"
//       });
//     }
//     if (age < 15) {
//       return res.status(400).json({
//         message: "You must be at least 15 years old to register"
//       });
//     }

//     const pool = await getDatabase();

//     // 1) Check if email already exists
//     const existing = await pool.request()
//       .input("email", sql.NVarChar, email)
//       .query("SELECT customer_id FROM Customers WHERE email = @email");

//     if (existing.recordset.length > 0) {
//       return res.status(409).json({ message: "Email already registered" });
//     }

//     // 2) Hash password
//     const passwordHash = await bcrypt.hash(password, 10);

//     // 3) Insert customer
//     await pool.request()
//       .input("name", sql.NVarChar, name)
//       .input("email", sql.NVarChar, email)
//       .input("phone", sql.NVarChar, phone || null)
//       .input("password", sql.NVarChar, passwordHash)
//       .input("birth_date", sql.Date, birth_date)
//       .query(`
//         INSERT INTO Customers (name, email, phone, password, birth_date)
//         VALUES (@name, @email, @phone, @password, @birth_date)
//       `);

//     return res.status(201).json({ message: "Customer registered successfully" });

//   } catch (err) {
//     console.error("registerCustomer error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// // ✅ LOGIN CUSTOMER (unchanged but still correct)
// exports.loginCustomer = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ message: "Email and password required" });
//     }

//     const pool = await getDatabase();

//     // 1) Get customer by email
//     const result = await pool.request()
//       .input("email", sql.NVarChar, email)
//       .query("SELECT * FROM Customers WHERE email = @email");

//     if (result.recordset.length === 0) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     const customer = result.recordset[0];

//     // 2) Compare password
//     const match = await bcrypt.compare(password, customer.password);
//     if (!match) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     // 3) Create token
//     const token = jwt.sign(
//       { customer_id: customer.customer_id, email: customer.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return res.json({
//       message: "Login success",
//       token,
//       customer: {
//         customer_id: customer.customer_id,
//         name: customer.name,
//         email: customer.email,
//         phone: customer.phone,
//         birth_date: customer.birth_date,
//         photo_url: customer.photo_url,
//         gender: customer.gender,
//         address: customer.address,
//       }
//     });

//   } catch (err) {
//     console.error("loginCustomer error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// // ✅ GET CUSTOMER PROFILE
// exports.getCustomerProfile = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const pool = await getDatabase();

//     const result = await pool.request()
//       .input("id", sql.Int, id)
//       .query(`
//         SELECT customer_id, name, email, phone,
//                birth_date, photo_url, gender, address, created_at
//         FROM Customers
//         WHERE customer_id = @id
//       `);

//     if (result.recordset.length === 0) {
//       return res.status(404).json({ message: "Customer not found" });
//     }

//     return res.json(result.recordset[0]);
//   } catch (err) {
//     console.error("getCustomerProfile error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// // ✅ UPDATE CUSTOMER PROFILE (no photo here)
// exports.updateCustomerProfile = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, phone, birth_date, gender, address } = req.body;

//     if (birth_date) {
//       const age = calcAge(birth_date);
//       if (age < 15) {
//         return res.status(400).json({ message: "Age must be 15 or older" });
//       }
//     }

//     const pool = await getDatabase();

//     await pool.request()
//       .input("id", sql.Int, id)
//       .input("name", sql.NVarChar, name || null)
//       .input("phone", sql.NVarChar, phone || null)
//       .input("birth_date", sql.Date, birth_date || null)
//       .input("gender", sql.NVarChar, gender || null)
//       .input("address", sql.NVarChar, address || null)
//       .query(`
//         UPDATE Customers
//         SET
//           name = COALESCE(@name, name),
//           phone = COALESCE(@phone, phone),
//           birth_date = COALESCE(@birth_date, birth_date),
//           gender = COALESCE(@gender, gender),
//           address = COALESCE(@address, address)
//         WHERE customer_id = @id
//       `);

//     return res.json({ message: "Profile updated successfully" });

//   } catch (err) {
//     console.error("updateCustomerProfile error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ✅ CHANGE PASSWORD
// exports.changePassword = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { current_password, new_password } = req.body;

//     if (!current_password || !new_password) {
//       return res
//         .status(400)
//         .json({ message: "Current and new password are required" });
//     }

//     // verify JWT and ensure customer_id matches :id
//     const auth = req.headers.authorization || "";
//     const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
//     if (!token) return res.status(401).json({ message: "Missing token" });

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch {
//       return res.status(401).json({ message: "Invalid token" });
//     }

//     if (String(decoded.customer_id) !== String(id)) {
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     const pool = await getDatabase();

//     // get current hashed password
//     const result = await pool.request()
//       .input("id", sql.Int, id)
//       .query("SELECT password FROM Customers WHERE customer_id = @id");

//     if (result.recordset.length === 0) {
//       return res.status(404).json({ message: "Customer not found" });
//     }

//     const hash = result.recordset[0].password;

//     // compare current password
//     const ok = await bcrypt.compare(current_password, hash);
//     if (!ok) {
//       return res
//         .status(401)
//         .json({ message: "Current password is incorrect" });
//     }

//     // hash new password + update
//     const newHash = await bcrypt.hash(new_password, 10);

//     await pool.request()
//       .input("id", sql.Int, id)
//       .input("password", sql.NVarChar, newHash)
//       .query("UPDATE Customers SET password = @password WHERE customer_id = @id");

//     return res.json({ message: "Password updated successfully" });
//   } catch (err) {
//     console.error("changePassword error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ✅ UPLOAD CUSTOMER PHOTO
// exports.uploadCustomerPhoto = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!req.file) {
//       return res.status(400).json({ message: "No image uploaded" });
//     }

//     // store relative url in DB
//     const photoUrl = `/uploads/customers/${req.file.filename}`;

//     const pool = await getDatabase();

//     await pool.request()
//       .input("id", sql.Int, id)
//       .input("photo_url", sql.NVarChar, photoUrl)
//       .query(`
//         UPDATE Customers
//         SET photo_url = @photo_url
//         WHERE customer_id = @id
//       `);

//     return res.json({
//       message: "Photo updated successfully",
//       photo_url: photoUrl
//     });

//   } catch (err) {
//     console.error("uploadCustomerPhoto error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };
// Back_end/controllers/customerController.js

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const { getDatabase, sql } = require("../config/database");
const { sendMail } = require("../routes/mailer");

// helper: calculate age from birth_date
function calcAge(birth_date) {
  const today = new Date();
  const birth = new Date(birth_date);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ✅ FIXED: SEND VERIFICATION CODE
exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address"
      });
    }
    
    const pool = await getDatabase();
    
    // Check if email already exists (registered)
    const existing = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT customer_id FROM Customers WHERE email = @email");
    
    if (existing.recordset.length > 0) {
      return res.status(409).json({ 
        message: "Email already registered. Please login instead."
      });
    }
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with expiration (10 minutes) - Use JavaScript Date
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Clear any existing codes for this email first
    await pool.request()
      .input("email", sql.NVarChar, email)
      .query("DELETE FROM VerificationCodes WHERE email = @email");
    
    // Insert new code with verified = 0 (not verified yet)
    await pool.request()
      .input("email", sql.NVarChar, email)
      .input("code", sql.NVarChar(10), verificationCode)
      .input("expires_at", sql.DateTime, expiresAt)
      .query(`
        INSERT INTO VerificationCodes (email, code, expires_at, created_at, attempts, verified)
        VALUES (@email, @code, @expires_at, GETDATE(), 0, 0)
      `);
    
    // Send email with verification code
    await sendMail(
      email,
      "Sport Zone - Email Verification Code",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin-bottom: 10px;">🎮 Sport Zone</h1>
            <p style="color: #666; font-size: 16px;">Welcome to the ultimate sports booking experience!</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
            <h2 style="color: #374151; margin-bottom: 15px;">Your Verification Code</h2>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px dashed #4F46E5; display: inline-block;">
              <div style="font-size: 40px; font-weight: bold; color: #4F46E5; letter-spacing: 10px; font-family: monospace;">
                ${verificationCode}
              </div>
            </div>
            <p style="color: #6B7280; margin-top: 20px; font-size: 14px;">
              Enter this 6-digit code in the app to verify your email address.
            </p>
          </div>
          
          <div style="color: #6B7280; font-size: 14px; line-height: 1.6;">
            <p><strong>Important:</strong></p>
            <ul style="padding-left: 20px;">
              <li>This code will expire in <strong>10 minutes</strong></li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this code, please ignore this email</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9CA3AF; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Sport Zone. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      `
    );
    
    console.log(`✅ Verification code sent to ${email}: ${verificationCode} (Expires: ${expiresAt.toISOString()})`);
    
    return res.status(200).json({ 
      success: true, 
      message: "Verification code sent to your email",
      expires_in: 600 // 10 minutes in seconds
    });
    
  } catch (err) {
    console.error("sendVerificationCode error:", err);
    
    // Handle specific email sending errors
    if (err.message.includes("Invalid login") || err.message.includes("authentication failed")) {
      return res.status(500).json({ 
        message: "Email service configuration error. Please try again later."
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to send verification code. Please try again."
    });
  }
};
// ✅ FIXED: VERIFY CODE BEFORE REGISTRATION
exports.verifyCode = async (req, res) => {
  try {
    const { email, verification_code } = req.body;
    
    if (!email || !verification_code) {
      return res.status(400).json({
        message: "Email and verification code are required"
      });
    }
    
    if (verification_code.length !== 6 || !/^\d+$/.test(verification_code)) {
      return res.status(400).json({
        message: "Verification code must be 6 digits"
      });
    }
    
    const pool = await getDatabase();
    
    // Check if code is valid and not expired
    const result = await pool.request()
      .input("email", sql.NVarChar, email)
      .input("code", sql.NVarChar(10), verification_code)
      .query(`
        SELECT id, email, expires_at, verified, attempts
        FROM VerificationCodes 
        WHERE email = @email 
          AND code = @code
      `);
    
    if (result.recordset.length === 0) {
      // Code doesn't exist
      return res.status(400).json({ 
        message: "Invalid verification code" 
      });
    }
    
    const codeData = result.recordset[0];
    
    // Check if expired - compare with current server time
    const now = new Date();
    const expiresAt = new Date(codeData.expires_at);
    
    if (expiresAt < now) {
      return res.status(400).json({ 
        message: "Verification code has expired. Please request a new code." 
      });
    }
    
    // Check if already verified
    if (codeData.verified === true || codeData.verified === 1) {
      return res.status(400).json({ 
        message: "This code has already been used" 
      });
    }
    
    // Check attempts (optional security measure)
    if (codeData.attempts >= 5) {
      return res.status(400).json({ 
        message: "Too many attempts. Please request a new code." 
      });
    }
    
    // Mark code as verified
    await pool.request()
      .input("id", sql.Int, codeData.id)
      .query(`
        UPDATE VerificationCodes 
        SET verified = 1,
            attempts = attempts + 1
        WHERE id = @id
      `);
    
    return res.status(200).json({ 
      success: true, 
      message: "Code verified successfully",
      email: email
    });
    
  } catch (err) {
    console.error("verifyCode error:", err);
    return res.status(500).json({ 
      message: "Failed to verify code. Please try again."
    });
  }
};
// ✅ MODIFIED: REGISTER CUSTOMER (now requires verification code)
exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password, birth_date, verification_code } = req.body;

    if (!name || !email || !password || !birth_date || !verification_code) {
      return res.status(400).json({
        message: "All fields including verification code are required"
      });
    }

    // Age validation
    const age = calcAge(birth_date);
    if (isNaN(age)) {
      return res.status(400).json({
        message: "Birth date format must be valid (YYYY-MM-DD)"
      });
    }
    if (age < 15) {
      return res.status(400).json({
        message: "You must be at least 15 years old to register"
      });
    }

    const pool = await getDatabase();

    // 1) Check if email already exists
    const existing = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT customer_id FROM Customers WHERE email = @email");

    if (existing.recordset.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // 2) Verify the code one more time before registration
    const codeCheck = await pool.request()
      .input("email", sql.NVarChar, email)
      .input("code", sql.NVarChar(10), verification_code)
      .query(`
        SELECT id, expires_at, verified
        FROM VerificationCodes 
        WHERE email = @email 
          AND code = @code
      `);

    if (codeCheck.recordset.length === 0) {
      return res.status(400).json({ 
        message: "Invalid verification code" 
      });
    }

    const codeData = codeCheck.recordset[0];
    
    // Check if expired
    const now = new Date();
    const expiresAt = new Date(codeData.expires_at);
    
    if (expiresAt < now) {
      return res.status(400).json({ 
        message: "Verification code has expired" 
      });
    }
    
    // Check if verified
    if (codeData.verified !== true && codeData.verified !== 1) {
      return res.status(400).json({ 
        message: "Code not verified. Please verify your email first." 
      });
    }

    // 3) Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4) Insert customer
    await pool.request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .input("phone", sql.NVarChar, phone || null)
      .input("password", sql.NVarChar, passwordHash)
      .input("birth_date", sql.Date, birth_date)
      .query(`
        INSERT INTO Customers (name, email, phone, password, birth_date)
        VALUES (@name, @email, @phone, @password, @birth_date)
      `);

    // 5) Clean up verification code
    await pool.request()
      .input("email", sql.NVarChar, email)
      .query("DELETE FROM VerificationCodes WHERE email = @email");

    // 6) Send welcome email
    try {
      await sendMail(
        email,
        "Welcome to Sport Zone! 🎉",
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5;">🎮 Welcome to Sport Zone!</h1>
            </div>
            
            <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #0369a1; margin-bottom: 15px;">Your Account is Ready!</h2>
              <p style="color: #0c4a6e; font-size: 16px; line-height: 1.6;">
                Hello <strong>${name}</strong>,<br><br>
                Thank you for registering with Sport Zone! Your account has been successfully created.
              </p>
            </div>
            
            <div style="color: #374151; font-size: 14px; line-height: 1.6;">
              <p><strong>What you can do now:</strong></p>
              <ul style="padding-left: 20px;">
                <li>🎯 Book sports courts and gaming sessions</li>
                <li>📱 Download our mobile app for easier access</li>
                <li>⭐ Earn points and get rewards</li>
                <li>📅 Manage your bookings and history</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px; text-align: center;">
              <a href="#" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Start Booking Now
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9CA3AF; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Sport Zone. All rights reserved.</p>
            </div>
          </div>
        `
      );
    } catch (emailErr) {
      console.error("Welcome email error:", emailErr);
      // Don't fail registration if welcome email fails
    }

    return res.status(201).json({ 
      success: true,
      message: "Customer registered successfully",
      email: email,
      name: name
    });

  } catch (err) {
    console.error("registerCustomer error:", err);
    return res.status(500).json({ 
      success: false,
      message: "Server error: " + err.message 
    });
  }
};
// ✅ LOGIN CUSTOMER (unchanged but still correct)
exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const pool = await getDatabase();

    // 1) Get customer by email
    const result = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT * FROM Customers WHERE email = @email");

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const customer = result.recordset[0];

    // 2) Compare password
    const match = await bcrypt.compare(password, customer.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3) Create token
    const token = jwt.sign(
      { customer_id: customer.customer_id, email: customer.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login success",
      token,
      customer: {
        customer_id: customer.customer_id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        birth_date: customer.birth_date,
        photo_url: customer.photo_url,
        gender: customer.gender,
        address: customer.address,
      }
    });

  } catch (err) {
    console.error("loginCustomer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// ✅ GET CUSTOMER PROFILE
exports.getCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getDatabase();

    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT customer_id, name, email, phone,
               birth_date, photo_url, gender, address, created_at
        FROM Customers
        WHERE customer_id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.json(result.recordset[0]);
  } catch (err) {
    console.error("getCustomerProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// ✅ UPDATE CUSTOMER PROFILE (no photo here)
exports.updateCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, birth_date, gender, address } = req.body;

    if (birth_date) {
      const age = calcAge(birth_date);
      if (age < 15) {
        return res.status(400).json({ message: "Age must be 15 or older" });
      }
    }

    const pool = await getDatabase();

    await pool.request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, name || null)
      .input("phone", sql.NVarChar, phone || null)
      .input("birth_date", sql.Date, birth_date || null)
      .input("gender", sql.NVarChar, gender || null)
      .input("address", sql.NVarChar, address || null)
      .query(`
        UPDATE Customers
        SET
          name = COALESCE(@name, name),
          phone = COALESCE(@phone, phone),
          birth_date = COALESCE(@birth_date, birth_date),
          gender = COALESCE(@gender, gender),
          address = COALESCE(@address, address)
        WHERE customer_id = @id
      `);

    return res.json({ message: "Profile updated successfully" });

  } catch (err) {
    console.error("updateCustomerProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    // verify JWT and ensure customer_id matches :id
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (String(decoded.customer_id) !== String(id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const pool = await getDatabase();

    // get current hashed password
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT password FROM Customers WHERE customer_id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const hash = result.recordset[0].password;

    // compare current password
    const ok = await bcrypt.compare(current_password, hash);
    if (!ok) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect" });
    }

    // hash new password + update
    const newHash = await bcrypt.hash(new_password, 10);

    await pool.request()
      .input("id", sql.Int, id)
      .input("password", sql.NVarChar, newHash)
      .query("UPDATE Customers SET password = @password WHERE customer_id = @id");

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ UPLOAD CUSTOMER PHOTO
exports.uploadCustomerPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // store relative url in DB
    const photoUrl = `/uploads/customers/${req.file.filename}`;

    const pool = await getDatabase();

    await pool.request()
      .input("id", sql.Int, id)
      .input("photo_url", sql.NVarChar, photoUrl)
      .query(`
        UPDATE Customers
        SET photo_url = @photo_url
        WHERE customer_id = @id
      `);

    return res.json({
      message: "Photo updated successfully",
      photo_url: photoUrl
    });

  } catch (err) {
    console.error("uploadCustomerPhoto error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};