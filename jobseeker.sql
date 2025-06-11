
CREATE DATABASE IF NOT EXISTS jobseeker;
USE jobseeker;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  dob DATE,
  college VARCHAR(100),
  year VARCHAR(50),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  experience TEXT,
  resume VARCHAR(255)
);
