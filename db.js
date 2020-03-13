const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_school_db"
);

client.connect();

const sync = async () => {
  const SQL = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  DROP TABLE IF EXISTS schools;
  DROP TABLE IF EXISTS students;

  CREATE TABLE students(
      id UUID PRIMARY KEY default uuid_generate_v4(),
      name VARCHAR(100) NOT NULL,
      status BOOLEAN
      );

  CREATE TABLE schools(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    students_id UUID REFERENCES students(id),
    name VARCHAR(100)
  );

  INSERT INTO students (name, status) VALUES ('lucy', true);
  INSERT INTO students (name, status) VALUES ('moe', true);
  INSERT INTO students (name, status) VALUES ('larry', null);
  INSERT INTO students (name, status) VALUES ('curly', null);


  INSERT INTO schools (id, students_id, name)
  VALUES
  (uuid_generate_v4(), (SELECT id FROM students where students.name = 'lucy'), 
  'UNC-Chapel Hill'),
  (uuid_generate_v4(), (SELECT id FROM students where students.name = 'moe'), 
  'Wake Forest')

  `;

  await client.query(SQL);
};

const readStudents = async () => {
  return (await client.query("SELECT * FROM students")).rows;
};
const readSchools = async () => {
  return (await client.query("SELECT * FROM schools")).rows;
};
const createStudent = async ({ name }) => {
  return (
    await client.query("INSERT INTO students(name) VALUES ($1) returning *", [
      name
    ])
  ).rows[0];
};
const enrollStudent = async ({ student }) => {
  return (
    await client.query(
      "INSERT INTO schools(student_id) VALUES ($1) returning *",
      [student]
    )
  ).rows[0];
};
const createSchool = async ({ schoolName }) => {
  return (
    await client.query("INSERT INTO schools(name) VALUES ($1) returning *", [
      schoolName
    ])
  ).rows[0];
};
const readSchoolsbyStudent = async students_id => {
  const SQL = "SELECT * FROM schools WHERE students_id=$1";
  const result = await client.query(SQL, [students_id]);
  return result.rows;
};

module.exports = {
  sync,
  readStudents,
  readSchools,
  readSchoolsbyStudent,
  createStudent,
  createSchool,
  enrollStudent
};
