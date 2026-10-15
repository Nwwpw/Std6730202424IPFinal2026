// Student ID: 6730202424
// Subject: Internet Programming Final Exam (2026)
// Topic: HR Manager & Salary Analytics System Backend
 
// backend/server.js
const express = require("express"); // 1
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // 2 เปิด CORS
app.use(express.json()); // 3 อ่าน JSON body

// ---------- ข้อมูลเริ่มต้น (In-memory) ----------
let employees = [
  { id: 1, name: "Somchai Jaidee", position: "Developer", status: "Active", salary: 45000 },
  { id: 2, name: "Suda Rakdee", position: "Designer", status: "Active", salary: 38000 },
  { id: 3, name: "Anan Meesuk", position: "Intern", status: "On Leave", salary: 15000 },
  { id: 4, name: "Malee Sriwan", position: "Project Manager", status: "Active", salary: 85000 },
  { id: 5, name: "Preecha Thongdee", position: "QA Tester", status: "Active", salary: 28000 },
  { id: 6, name: "Naree Wongsa", position: "Data Analyst", status: "On Leave", salary: 52000 },
  { id: 7, name: "Kittisak Boonmee", position: "Support", status: "Active", salary: 18000 },
  { id: 8, name: "Orawan Chaiyo", position: "CTO", status: "Active", salary: 120000 },
];
let nextId = employees.length + 1; // 4 ตัวนับ id ถัดไป
const VALID_STATUS = ["Active", "On Leave"];

// ---------- 1D K-Means (k=3) ----------
function kMeans1D(values, k = 3, maxIter = 100) {
  const sorted = [...values].sort((a, b) => a - b);
  const kk = Math.min(k, sorted.length); // 5 กันกรณีพนักงาน < 3 คน
  let centroids = Array.from({ length: kk }, (_, i) =>
    sorted[Math.round((i * (sorted.length - 1)) / (kk > 1 ? kk - 1 : 1))] // 6 centroid เริ่มต้นกระจายตามลำดับ
  );
  let assign = new Array(values.length).fill(-1);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    values.forEach((v, i) => {
      let best = 0;
      for (let c = 1; c < kk; c++) {
        if (Math.abs(v - centroids[c]) < Math.abs(v - centroids[best])) best = c; // 7 หา centroid ใกล้สุด
      }
      if (assign[i] !== best) { assign[i] = best; changed = true; }
    });
    centroids = centroids.map((old, c) => {
      const members = values.filter((_, i) => assign[i] === c);
      return members.length ? members.reduce((s, x) => s + x, 0) / members.length : old; // 8 คำนวณค่าเฉลี่ยใหม่
    });
    if (!changed) break; // 9 หยุดเมื่อไม่เปลี่ยนกลุ่มแล้ว
  }

  return centroids.map((centroid, c) => ({
    centroid: Math.round(centroid * 100) / 100,
    count: assign.filter((a) => a === c).length,
  }));
}

// ---------- Endpoints ----------
app.post("/api/login", (req, res) => { // 10
  const { username, password } = req.body || {};
  if (username === "admin" && password === "password123") {
    return res.json({ success: true, message: "Login successful", token: "mock-token-admin" });
  }
  res.status(401).json({ success: false, message: "Invalid username or password" });
});

app.get("/api/employees/salary-clusters", (req, res) => { // 11
  if (employees.length === 0) return res.json({ success: true, clusters: [] });
  const result = kMeans1D(employees.map((e) => e.salary), 3)
    .sort((a, b) => b.centroid - a.centroid) // 12 Tier 1 = เงินเดือนสูงสุด
    .map((c, i) => ({ group: `Tier ${i + 1}`, centroid: c.centroid, count: c.count }));
  res.json({ success: true, clusters: result });
});

app.get("/api/employees", (req, res) => { // 13
  res.json(employees);
});

app.post("/api/employees", (req, res) => { // 14
  const { name, position, status = "Active", salary } = req.body || {};
  const salaryNum = Number(salary);
  if (!name || !position || salary === undefined || salary === "" || Number.isNaN(salaryNum)) {
    return res.status(400).json({ success: false, message: "name, position, salary (number) are required" });
  }
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ success: false, message: 'status must be "Active" or "On Leave"' });
  }
  const emp = { id: nextId++, name, position, status, salary: salaryNum };
  employees.push(emp);
  res.status(201).json(emp);
});

app.put("/api/employees/:id/status", (req, res) => { // 15
  const emp = employees.find((e) => e.id === Number(req.params.id));
  if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });
  const { status } = req.body || {};
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ success: false, message: 'status must be "Active" or "On Leave"' });
  }
  emp.status = status;
  res.json(emp);
});

app.delete("/api/employees/:id", (req, res) => { // 16
  const idx = employees.findIndex((e) => e.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: "Employee not found" });
  const [removed] = employees.splice(idx, 1);
  res.json({ success: true, message: "Employee deleted", employee: removed });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));