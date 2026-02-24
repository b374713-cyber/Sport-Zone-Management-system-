const { getDatabase } = require('./database');

const createTables = async () => {
  try {
    const pool = await getDatabase();
    
    console.log('🔄 Creating ALL Sport Zone database tables (12 tables)...');

    // 1. Users table - UPDATED with salary for employees
    await pool.request().query(`
      CREATE TABLE Users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) UNIQUE NOT NULL,
        phone NVARCHAR(20),
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) DEFAULT 'Customer',
        salary DECIMAL(10,2) NULL,
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 1. Users table created');

    // 2. Employees table
    await pool.request().query(`
      CREATE TABLE Employees (
        emp_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT FOREIGN KEY REFERENCES Users(user_id),
        job_title NVARCHAR(100) NOT NULL,
        salary DECIMAL(10,2),
        hire_date DATE,
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 2. Employees table created');

    // 3. Sports table
    await pool.request().query(`
      CREATE TABLE Sports (
        sport_id INT IDENTITY(1,1) PRIMARY KEY,
        sport_name NVARCHAR(100) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 3. Sports table created');

    // 4. Stadiums table
    await pool.request().query(`
      CREATE TABLE Stadiums (
        stadium_id INT IDENTITY(1,1) PRIMARY KEY,
        sport_id INT FOREIGN KEY REFERENCES Sports(sport_id),
        stadium_name NVARCHAR(100) NOT NULL,
        location NVARCHAR(255) NOT NULL,
        price_per_hour DECIMAL(10,2) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 4. Stadiums table created');

    // 5. ClothingStore table
    await pool.request().query(`
      CREATE TABLE ClothingStores (
        store_id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        location NVARCHAR(255) NOT NULL,
        open_hours NVARCHAR(100),
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 5. ClothingStores table created');

    // 6. Products table
    await pool.request().query(`
      CREATE TABLE Products (
        product_id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        category NVARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock_qty INT NOT NULL DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 6. Products table created');

    // 7. StoreProducts table (junction table)
    await pool.request().query(`
      CREATE TABLE StoreProducts (
        store_id INT,
        product_id INT,
        PRIMARY KEY (store_id, product_id),
        FOREIGN KEY (store_id) REFERENCES ClothingStores(store_id),
        FOREIGN KEY (product_id) REFERENCES Products(product_id),
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 7. StoreProducts table created');

    // 8. Payments table
    await pool.request().query(`
      CREATE TABLE Payments (
        payment_id INT IDENTITY(1,1) PRIMARY KEY,
        customer_id INT FOREIGN KEY REFERENCES Users(user_id),
        amount DECIMAL(10,2) NOT NULL,
        service_type NVARCHAR(100) NOT NULL,
        reference_id NVARCHAR(100),
        payment_type NVARCHAR(50) NOT NULL,
        payment_date DATE DEFAULT GETDATE(),
        status NVARCHAR(50) DEFAULT 'Completed',
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 8. Payments table created');

    // 9. GamingReservations table
    await pool.request().query(`
      CREATE TABLE GamingReservations (
        game_res_id INT IDENTITY(1,1) PRIMARY KEY,
        customer_id INT FOREIGN KEY REFERENCES Users(user_id),
        device_type NVARCHAR(50) NOT NULL,
        start_time DATETIME2 NOT NULL,
        duration_hours INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status NVARCHAR(50) DEFAULT 'Confirmed',
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 9. GamingReservations table created');

    // 10. GymSubscriptions table
    await pool.request().query(`
      CREATE TABLE GymSubscriptions (
        sub_id INT IDENTITY(1,1) PRIMARY KEY,
        customer_id INT FOREIGN KEY REFERENCES Users(user_id),
        coach_id INT FOREIGN KEY REFERENCES Employees(emp_id),
        plan_type NVARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status NVARCHAR(50) DEFAULT 'Active',
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 10. GymSubscriptions table created');

    // 11. CoachSessions table
    await pool.request().query(`
      CREATE TABLE CoachSessions (
        session_id INT IDENTITY(1,1) PRIMARY KEY,
        coach_id INT FOREIGN KEY REFERENCES Employees(emp_id),
        customer_id INT FOREIGN KEY REFERENCES Users(user_id),
        session_date DATE NOT NULL,
        price_per_hour DECIMAL(10,2) NOT NULL,
        notes TEXT,
        status NVARCHAR(50) DEFAULT 'Scheduled',
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 11. CoachSessions table created');

    // 12. MatchReservations table
    await pool.request().query(`
      CREATE TABLE MatchReservations (
        reservation_id INT IDENTITY(1,1) PRIMARY KEY,
        customer_id INT FOREIGN KEY REFERENCES Users(user_id),
        stadium_id INT FOREIGN KEY REFERENCES Stadiums(stadium_id),
        reservation_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status NVARCHAR(50) DEFAULT 'Pending',
        total_price DECIMAL(10,2) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ 12. MatchReservations table created');

    console.log('🎉 ALL 12 TABLES CREATED SUCCESSFULLY!');
    console.log('📊 Your Sport Zone database is ready!');

  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  }
};

// Run the setup
createTables();