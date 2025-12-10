const mysql = require('mysql2/promise');

async function checkSchema() {
    const connection = await mysql.createConnection('mysql://root:@localhost:3306/nextjs_login');
    try {
        const [rows] = await connection.execute("SHOW COLUMNS FROM users");
        console.log("Columns in 'users' table:");
        rows.forEach(row => console.log(`- ${row.Field} (${row.Type})`));
    } catch (error) {
        console.error("Error checking schema:", error);
    } finally {
        await connection.end();
    }
}

checkSchema();
