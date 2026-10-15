// Student ID: 6730202424
// Name: วิภาวิน ตั้งวัฒนกิตติกุล
// Subject: Internet Programming Final Exam (2026)
// Topic: HR Manager & Salary Analytics System

// backend/server.js
require("dotenv").config(); // 1 โหลดค่าจาก .env
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 5000; // 2 ตรงกับ API_URL ฝั่ง Frontend
app.use(cors());
app.use(express.json());

// ---------- ตั้งค่า DB ----------
const DB_CONFIG = {
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  connectTimeout: 5000, // 3 ต่อไม่ติดภายใน 5 วินาทีให้ล้มเลิก
};
const S = "_WipawinTung_6730202424"; // 4 ต่อท้ายชื่อตาราง/คอลัมน์
const T = `employees${S}`;
const C = { id: `id${S}`, name: `name${S}`, position: `position${S}`, status: `status${S}`, salary: `salary${S}` };
const q = (x) => "`" + x + "`";
const SELECT = Object.keys(C).map((k) => `${q(C[k])} AS ${k}`).join(", "); // 5 alias กลับเป็น id,name,... ให้ JSON ตรง schema
const toEmp = (r) => ({ id: String(r.id), name: r.name, position: r.position, status: r.status, salary: Number(r.salary) });
const pool = mysql.createPool(DB_CONFIG);

// ---------- ข้อมูลสำรองใน Memory ----------
let useDb = false; // 6 true เมื่อต่อ DB สำเร็จ
let memNextId = 7;
let mem = [ // 7 ข้อมูลเริ่มต้น 6 คน (id เป็น string ตามโจทย์)
  { id: "1", name: "John Doe", position: "Software Engineer", status: "Active", salary: 45000 },
  { id: "2", name: "Suda Rakdee", position: "Designer", status: "Active", salary: 38000 },
  { id: "3", name: "Anan Meesuk", position: "Intern", status: "On Leave", salary: 15000 },
  { id: "4", name: "Malee Sriwan", position: "Project Manager", status: "Active", salary: 85000 },
  { id: "5", name: "Preecha Thongdee", position: "QA Tester", status: "Active", salary: 28000 },
  { id: "6", name: "Kittisak Boonmee", position: "Support", status: "Active", salary: 18000 },
];

// ---------- ชั้นข้อมูล: เลือก DB หรือ Memory ----------
const store = { // 8 Endpoint เรียกผ่านตรงนี้ทั้งหมด
  async list() {
    if (!useDb) return mem.map((e) => ({ ...e }));
    const [rows] = await pool.query(`SELECT ${SELECT} FROM ${q(T)} ORDER BY ${q(C.id)}`);
    return rows.map(toEmp);
  },
  async add(name, position, salary) {
    if (!useDb) {
      const e = { id: String(memNextId++), name, position, status: "Active", salary };
      mem.push(e);
      return { ...e };
    }
    const [r] = await pool.query(
      `INSERT INTO ${q(T)} (${q(C.name)}, ${q(C.position)}, ${q(C.status)}, ${q(C.salary)}) VALUES (?, ?, 'Active', ?)`,
      [name, position, salary]);
    return { id: String(r.insertId), name, position, status: "Active", salary };
  },
  async update(id, name, position, salary) { // 9 แก้ชื่อ/ตำแหน่ง/เงินเดือน คืน null ถ้าไม่พบ
    if (!useDb) {
      const e = mem.find((x) => x.id === String(id));
      if (!e) return null;
      e.name = name; e.position = position; e.salary = salary; // 10 แก้ใน Memory
      return { ...e };
    }
    const [r] = await pool.query(
      `UPDATE ${q(T)} SET ${q(C.name)} = ?, ${q(C.position)} = ?, ${q(C.salary)} = ? WHERE ${q(C.id)} = ?`,
      [name, position, salary, Number(id)]); // 11 แก้ใน DB
    if (r.affectedRows === 0) return null;
    const [rows] = await pool.query(`SELECT ${SELECT} FROM ${q(T)} WHERE ${q(C.id)} = ?`, [Number(id)]);
    return toEmp(rows[0]);
  },
  async toggle(id) { // 12 สลับสถานะ คืน null ถ้าไม่พบ
    if (!useDb) {
      const e = mem.find((x) => x.id === String(id));
      if (!e) return null;
      e.status = e.status === "Active" ? "On Leave" : "Active";
      return { ...e };
    }
    const [rows] = await pool.query(`SELECT ${SELECT} FROM ${q(T)} WHERE ${q(C.id)} = ?`, [Number(id)]);
    if (rows.length === 0) return null;
    const newStatus = rows[0].status === "Active" ? "On Leave" : "Active";
    await pool.query(`UPDATE ${q(T)} SET ${q(C.status)} = ? WHERE ${q(C.id)} = ?`, [newStatus, Number(id)]);
    return { ...toEmp(rows[0]), status: newStatus };
  },
  async remove(id) { // 13 คืน true ถ้าลบสำเร็จ
    if (!useDb) {
      const i = mem.findIndex((x) => x.id === String(id));
      if (i === -1) return false;
      mem.splice(i, 1);
      return true;
    }
    const [r] = await pool.query(`DELETE FROM ${q(T)} WHERE ${q(C.id)} = ?`, [Number(id)]);
    return r.affectedRows > 0;
  },
};

// สร้างตาราง + ข้อมูลเริ่มต้นใน DB (ถ้าต่อได้)
async function initDb() { // 14
  await pool.query(`CREATE TABLE IF NOT EXISTS ${q(T)} (
    ${q(C.id)} INT AUTO_INCREMENT PRIMARY KEY,
    ${q(C.name)} VARCHAR(100) NOT NULL,
    ${q(C.position)} VARCHAR(100) NOT NULL,
    ${q(C.status)} VARCHAR(20) NOT NULL DEFAULT 'Active',
    ${q(C.salary)} DOUBLE NOT NULL)`);
  const [[{ n }]] = await pool.query(`SELECT COUNT(*) AS n FROM ${q(T)}`);
  if (n === 0) {
    const seed = mem.map((e) => [e.name, e.position, e.status, e.salary]);
    await pool.query(`INSERT INTO ${q(T)} (${q(C.name)}, ${q(C.position)}, ${q(C.status)}, ${q(C.salary)}) VALUES ?`, [seed]);
  }
}

// ---------- 1D K-Means (k=3) ----------
function kMeans1D(values, k = 3, maxIter = 100) {
  const sorted = [...values].sort((a, b) => a - b);
  const kk = Math.min(k, sorted.length);
  let centroids = Array.from({ length: kk }, (_, i) =>
    sorted[Math.round((i * (sorted.length - 1)) / (kk > 1 ? kk - 1 : 1))]); // 15 centroid เริ่มต้นกระจายตามลำดับ
  let assign = new Array(values.length).fill(-1);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    values.forEach((v, i) => {
      let best = 0;
      for (let c = 1; c < kk; c++) if (Math.abs(v - centroids[c]) < Math.abs(v - centroids[best])) best = c;
      if (assign[i] !== best) { assign[i] = best; changed = true; }
    });
    centroids = centroids.map((old, c) => {
      const m = values.filter((_, i) => assign[i] === c);
      return m.length ? m.reduce((s, x) => s + x, 0) / m.length : old;
    });
    if (!changed) break;
  }
  return centroids.map((centroid, c) => ({
    centroid: Math.round(centroid * 100) / 100,
    count: assign.filter((a) => a === c).length,
  }));
}

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => { // 16 กัน Server crash
  console.error(e);
  res.status(500).json({ success: false, message: "Server error" });
});

// ตรวจข้อมูลพนักงาน (ใช้ร่วมกันทั้ง POST และ PUT) คืน null ถ้าไม่ผ่าน
function validateEmp(body) { // 17
  const { name, position, salary } = body || {};
  const salaryNum = Number(salary);
  if (!String(name || "").trim() || !String(position || "").trim() ||
      salary === undefined || salary === null || String(salary).trim() === "" ||
      Number.isNaN(salaryNum) || salaryNum < 0) return null;
  return { name: String(name).trim(), position: String(position).trim(), salary: salaryNum };
}

// ---------- Endpoints ----------
app.post("/api/login", (req, res) => { // 18
  const { username, password } = req.body || {};
  if (username === "admin" && password === "password123")
    return res.status(200).json({ success: true, token: "mock-jwt-token" });
  res.status(401).json({ success: false, message: "Invalid username or password" });
});

app.get("/api/employees/salary-clusters", wrap(async (req, res) => { // 19
  const list = await store.list();
  if (list.length === 0) return res.status(200).json({ success: true, clusters: [] });
  const result = kMeans1D(list.map((e) => e.salary), 3)
    .sort((a, b) => a.centroid - b.centroid) // 20 Tier 1 = ต่ำสุด
    .map((c, i) => ({ group: `Tier ${i + 1}`, centroid: c.centroid, count: c.count }));
  res.status(200).json({ success: true, clusters: result });
}));

app.get("/api/employees", wrap(async (req, res) => { // 21
  res.json(await store.list());
}));

app.post("/api/employees", wrap(async (req, res) => { // 22
  const v = validateEmp(req.body);
  if (!v) return res.status(400).json({ success: false, message: "name, position, salary are required" });
  res.status(201).json(await store.add(v.name, v.position, v.salary));
}));

app.put("/api/employees/:id/status", wrap(async (req, res) => { // 23
  const emp = await store.toggle(req.params.id);
  if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });
  res.json(emp);
}));

app.put("/api/employees/:id", wrap(async (req, res) => { // 24 แก้ไขข้อมูลพนักงาน
  const v = validateEmp(req.body);
  if (!v) return res.status(400).json({ success: false, message: "name, position, salary are required" });
  const emp = await store.update(req.params.id, v.name, v.position, v.salary);
  if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });
  res.json(emp);
}));

app.delete("/api/employees/:id", wrap(async (req, res) => { // 25
  const ok = await store.remove(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: "Employee not found" });
  res.json({ success: true, message: "Employee deleted" });
}));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)); // 26 เปิดเซิร์ฟเวอร์ก่อนเสมอ
initDb()
  .then(() => { useDb = true; console.log("DB ready (using database)"); }) // 27 ต่อ DB ได้ → ใช้ DB
  .catch((e) => console.log("DB unavailable (" + (e.code || e.message) + ") -> using in-memory data")); // 28 ต่อไม่ได้ → ใช้ Memory