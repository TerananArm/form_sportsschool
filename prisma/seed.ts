import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nextjs_login'
  });

  console.log('Connected to MySQL database.');

  const run = async (sql: string, params?: any[]) => {
    try {
      await connection.execute(sql, params);
    } catch (error) {
      console.error('Error executing query:', sql, error);
    }
  };

  function createTables() {
    console.log('Creating tables if not exist...');

    run(`CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(255) UNIQUE,
      name VARCHAR(255),
      image VARCHAR(255),
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT 'admin'
    )`);

    run(`CREATE TABLE IF NOT EXISTS departments (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255)
    )`);

    run(`CREATE TABLE IF NOT EXISTS teachers (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      department_id VARCHAR(255),
      room VARCHAR(255),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(department_id) REFERENCES departments(id)
    )`);

    run(`CREATE TABLE IF NOT EXISTS subjects (
      id VARCHAR(255) PRIMARY KEY,
      code VARCHAR(255) UNIQUE,
      name VARCHAR(255),
      credit INT,
      theory_hours INT DEFAULT 0,
      practice_hours INT DEFAULT 0,
      department_id VARCHAR(255),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(department_id) REFERENCES departments(id)
    )`);

    run(`CREATE TABLE IF NOT EXISTS rooms (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) UNIQUE,
      type VARCHAR(50),
      capacity INT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    run(`CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(255) PRIMARY KEY,
      subjectId VARCHAR(255),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(subjectId) REFERENCES subjects(id)
    )`);

    run(`CREATE TABLE IF NOT EXISTS class_levels (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      department_id VARCHAR(255),
      FOREIGN KEY(department_id) REFERENCES departments(id)
    )`);

    run(`CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      department_id VARCHAR(255),
      level VARCHAR(255),
      FOREIGN KEY(department_id) REFERENCES departments(id)
    )`);

    run(`CREATE TABLE IF NOT EXISTS class_subjects (
      id VARCHAR(255) PRIMARY KEY,
      class_level_id VARCHAR(255),
      subject_id VARCHAR(255),
      FOREIGN KEY(class_level_id) REFERENCES class_levels(id),
      FOREIGN KEY(subject_id) REFERENCES subjects(id)
    )`);

    run(`CREATE TABLE IF NOT EXISTS schedule (
      id VARCHAR(255) PRIMARY KEY,
      courseId VARCHAR(255),
      teacher_id VARCHAR(255),
      roomId VARCHAR(255),
      subject_id VARCHAR(255),
      class_level_id VARCHAR(255),
      day_of_week INT,
      start_period INT,
      end_period INT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(courseId) REFERENCES courses(id),
      FOREIGN KEY(teacher_id) REFERENCES teachers(id),
      FOREIGN KEY(roomId) REFERENCES rooms(id),
      FOREIGN KEY(class_level_id) REFERENCES class_levels(id)
    )`);
  }

  createTables();
  console.log('Seeding database...');

  // Create Departments
  await run(`INSERT IGNORE INTO departments (id, name) VALUES (?, ?)`, ['dept1', 'Information Technology']);
  await run(`INSERT IGNORE INTO departments (id, name) VALUES (?, ?)`, ['dept2', 'Accounting']);

  // Create User
  await run(`INSERT IGNORE INTO users (id, username, name, image, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
    [1, 'admin', 'Admin User', 'https://github.com/shadcn.png', 'password123', 'admin']);

  // Create Teachers
  await run(`INSERT IGNORE INTO teachers (id, name, email, department_id, room, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    ['teacher1', 'John Doe', 'john@example.com', 'dept1', 'Room 101']);

  // Create Subjects
  await run(`INSERT IGNORE INTO subjects (id, code, name, credit, theory_hours, practice_hours, department_id, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    ['subject1', 'CS101', 'Intro to CS', 3, 2, 2, 'dept1']);

  // Create Rooms
  await run(`INSERT IGNORE INTO rooms (id, name, type, capacity, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())`,
    ['room1', 'Room 101', 'lecture', 30]);

  // Create Class Levels
  await run(`INSERT IGNORE INTO class_levels (id, name, department_id) VALUES (?, ?, ?)`, ['level1', 'VC 1/1', 'dept1']);

  // Create Students
  await run(`INSERT IGNORE INTO students (id, name, department_id, level) VALUES (?, ?, ?, ?)`, ['student1', 'Student One', 'dept1', 'VC 1/1']);

  // Create Course
  await run(`INSERT IGNORE INTO courses (id, subjectId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())`,
    ['course1', 'subject1']);

  // Create Schedule
  await run(`INSERT IGNORE INTO schedule (id, courseId, teacher_id, roomId, subject_id, class_level_id, day_of_week, start_period, end_period, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    ['schedule1', 'course1', 'teacher1', 'room1', 'subject1', 'level1', 1, 1, 2]);

  console.log('Seeding finished.');
  await connection.end();
}

main().catch(console.error);
