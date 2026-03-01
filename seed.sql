-- Seed data for Attendance PWA
-- Run after schema.sql

-- Teachers
INSERT INTO teachers (name, email, role) VALUES
  ('Admin', 'admin@smktarkid.id', 'admin'),
  ('Budi Santoso', 'budi@sekolah.id', 'user'),
  ('Siti Rahayu', 'siti@sekolah.id', 'user'),
  ('Ahmad Hidayat', 'ahmad@sekolah.id', 'user')
ON CONFLICT (email) DO NOTHING;

-- Classes
INSERT INTO classes (name, teacher_id) VALUES
  ('Kelas 7A', 1),
  ('Kelas 7B', 1),
  ('Kelas 8A', 2),
  ('Kelas 8B', 3)
ON CONFLICT DO NOTHING;

-- Students for Kelas 7A (class_id = 1)
INSERT INTO students (name, class_id) VALUES
  ('Andi Pratama', 1),
  ('Dewi Lestari', 1),
  ('Eko Saputra', 1),
  ('Fitri Handayani', 1),
  ('Gilang Ramadhan', 1)
ON CONFLICT DO NOTHING;

-- Students for Kelas 7B (class_id = 2)
INSERT INTO students (name, class_id) VALUES
  ('Hana Permata', 2),
  ('Irfan Maulana', 2),
  ('Jasmine Putri', 2),
  ('Kevin Wijaya', 2),
  ('Lina Marlina', 2)
ON CONFLICT DO NOTHING;

-- Students for Kelas 8A (class_id = 3)
INSERT INTO students (name, class_id) VALUES
  ('Maya Sari', 3),
  ('Naufal Akbar', 3),
  ('Olivia Susanti', 3),
  ('Putra Aditya', 3),
  ('Qori Amalia', 3)
ON CONFLICT DO NOTHING;

-- Students for Kelas 8B (class_id = 4)
INSERT INTO students (name, class_id) VALUES
  ('Rizky Firmansyah', 4),
  ('Sinta Dewi', 4),
  ('Taufik Hidayat', 4),
  ('Umar Faruq', 4),
  ('Vina Anggraeni', 4)
ON CONFLICT DO NOTHING;

-- Sample attendance for today (Kelas 7A)
INSERT INTO attendance (student_id, class_id, teacher_id, date, status) VALUES
  (1, 1, 1, CURRENT_DATE, 'hadir'),
  (2, 1, 1, CURRENT_DATE, 'hadir'),
  (3, 1, 1, CURRENT_DATE, 'sakit'),
  (4, 1, 1, CURRENT_DATE, 'izin'),
  (5, 1, 1, CURRENT_DATE, 'hadir')
ON CONFLICT (student_id, date) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();
