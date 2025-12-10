const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nextjs_login'
    });

    try {
        // Simulate the API query
        const query = `
            SELECT cl.id, cl.name as level, d.name as department_name
            FROM class_levels cl 
            LEFT JOIN departments d ON cl.department_id = d.id 
            ORDER BY cl.name ASC
        `;

        const [rows] = await connection.execute(query);
        console.log('Query successful. Rows returned:', rows.length);
        if (rows.length > 0) {
            console.log('Sample row:', rows[0]);
        }

    } catch (error) {
        console.error('Query failed:', error);
    } finally {
        await connection.end();
    }
}

main();
