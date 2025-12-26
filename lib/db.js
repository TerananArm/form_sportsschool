import mysql from 'mysql2/promise';

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sport_registration',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

if (process.env.NODE_ENV === 'production') {
  pool = mysql.createPool(poolConfig);
} else {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global.mysqlPool) {
    global.mysqlPool = mysql.createPool(poolConfig);
  }
  pool = global.mysqlPool;
}

export const db = pool;