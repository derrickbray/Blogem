// server/config/database.js

const mysql = require('mysql2/promise');

console.log('Initializing database connection...');

// Database configuration for XAMPP
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',            // Empty password for XAMPP default
  database: 'bray_report',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test the connection when this file is loaded
const testConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test the pool.execute method specifically
    const [result] = await pool.execute('SELECT 1 as test');
    console.log('✅ Database connection successful, test query result:', result[0]);
    
    // Check if our database exists (MariaDB compatible)
    const [databases] = await pool.execute("SHOW DATABASES LIKE 'bray_report'");
    if (databases.length > 0) {
      console.log('✅ Database "bray_report" found');
      
      // Check tables
      const [tables] = await pool.execute('SHOW TABLES');
      console.log('📋 Available tables:', tables.map(row => Object.values(row)[0]));
    } else {
      console.log('❌ Database "bray_report" not found');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error details:', error.message);
    console.error('Config used:', { ...dbConfig, password: '***' });
    
    // Provide troubleshooting hints
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 XAMPP MySQL might not be running. Check XAMPP Control Panel.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('🔧 Check username/password. Try user: "root", password: "" or "root"');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('🔧 Database "bray_report" doesn\'t exist. Create it in phpMyAdmin first.');
    }
  }
};

// Run the test
testConnection();

// Export the pool for use in other files
module.exports = pool;