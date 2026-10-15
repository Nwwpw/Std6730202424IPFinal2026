// Student ID: 6730202424
// Subject: Internet Programming Final Exam (2026)
// Topic: HR Manager & Salary Analytics System Frontend

// frontend/App.js
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StyleSheet, Platform, SafeAreaView,
} from "react-native";

const API_URL = "http://localhost:5000/api"; // 1 แก้ IP/พอร์ตตรงนี้ที่เดียว

// ---------- Helpers ----------
const notify = (title, msg) => // 2 Alert ที่ใช้ได้ทั้งมือถือและเว็บ
  Platform.OS === "web" ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

const confirmDelete = (onYes) => { // 3 Dialog ยืนยันก่อนลบ
  if (Platform.OS === "web") {
    if (window.confirm("Are you sure?")) onYes();
    return;
  }
  Alert.alert("Are you sure?", "This employee will be permanently deleted.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onYes },
  ]);
};

const formatSalary = (n) => Number(n).toLocaleString("en-US"); // 4

// ---------- Login Screen ----------
function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) { // 5 ตรวจช่องว่าง
      notify("Warning", "Please enter both username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (res.status === 200) onLoginSuccess(); // 6 สำเร็จเมื่อสเตตัส 200
      else notify("Login Failed", "Invalid username or password.");
    } catch (e) {
      notify("Error", "Cannot connect to server. Check API_URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginWrap}>
      <View style={styles.loginCard}>
        <Text style={styles.title}>Employee Manager</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
        <TextInput style={styles.input} placeholder="Username" autoCapitalize="none"
          value={username} onChangeText={setUsername} />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry
          value={password} onChangeText={setPassword} />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---------- Dashboard Screen ----------
function Dashboard({ onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [clusters, setClusters] = useState(null); // 7 null = ยังไม่เคยวิเคราะห์
  const [analyzing, setAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // 19 คำค้นหาที่ผู้ใช้พิมพ์

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`);
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : data.data || []); // 8 รองรับทั้ง array และ {data}
    } catch (e) {
      notify("Error", "Failed to load employees.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []); // 9 โหลดครั้งแรกเมื่อเข้า Dashboard

  const handleAdd = async () => {
    if (!name.trim() || !position.trim() || !salary.trim()) { // 10 ห้ามส่งถ้ามีช่องว่าง
      notify("Warning", "Please fill in Name, Position and Salary.");
      return;
    }
    if (Number.isNaN(Number(salary))) {
      notify("Warning", "Salary must be a number.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), position: position.trim(), salary: Number(salary) }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setEmployees((prev) => [...prev, created]); // 11 อัปเดต UI ทันที
      setName(""); setPosition(""); setSalary(""); // 12 เคลียร์ช่องกรอก
      setClusters(null);
    } catch (e) {
      notify("Error", "Failed to add employee.");
    }
  };

  const handleToggle = async (emp) => {
    const newStatus = emp.status === "Active" ? "On Leave" : "Active"; // 13 สลับสถานะ
    try {
      const res = await fetch(`${API_URL}/employees/${emp.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, status: newStatus } : e)));
      setClusters(null);
    } catch (e) {
      notify("Error", "Failed to update status.");
    }
  };

  const handleDelete = (emp) => {
    confirmDelete(async () => { // 14 ลบจริงเมื่อกดยืนยันเท่านั้น
      try {
        const res = await fetch(`${API_URL}/employees/${emp.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
        setClusters(null);
      } catch (e) {
        notify("Error", "Failed to delete employee.");
      }
    });
  };

  const handleAnalyze = async () => {
    setAnalyzing(true); // 15 แสดง ActivityIndicator
    try {
      const res = await fetch(`${API_URL}/employees/salary-clusters`);
      const data = await res.json();
      if (!data.success) throw new Error();
      setClusters(data.clusters);
    } catch (e) {
      notify("Error", "Failed to analyze salary structure.");
    } finally {
      setAnalyzing(false);
    }
  };

  const tierColors = ["#7c3aed", "#2563eb", "#059669"]; // 16 สีประจำ Tier 1-3

  const q = searchQuery.trim().toLowerCase(); // 20 ตัดช่องว่าง + ไม่สนตัวพิมพ์เล็ก/ใหญ่
  const filteredEmployees = q
    ? employees.filter((e) =>
        String(e.name || "").toLowerCase().includes(q) ||
        String(e.position || "").toLowerCase().includes(q)) // 21 กรองเฉพาะ name หรือ position
    : employees;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.header}>Dashboard</Text>
          <TouchableOpacity onPress={onLogout}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* ฟอร์มเพิ่มพนักงาน */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add Employee</Text>
          <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Position" value={position} onChangeText={setPosition} />
          <TextInput style={styles.input} placeholder="Salary" keyboardType="numeric"
            value={salary} onChangeText={setSalary} />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleAdd}>
            <Text style={styles.btnText}>Add Employee</Text>
          </TouchableOpacity>
        </View>

        {/* ปุ่มวิเคราะห์เงินเดือน */}
        <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze} disabled={analyzing}>
          <Text style={styles.btnText}>Analyze Salary Structure</Text>
        </TouchableOpacity>
        {analyzing && <ActivityIndicator size="large" color="#7c3aed" style={{ marginVertical: 12 }} />}

        {clusters && !analyzing && (
          <View style={styles.clusterRow}>
            {clusters.map((c, i) => (
              <View key={c.group} style={[styles.clusterCard, { borderTopColor: tierColors[i % 3] }]}>
                <Text style={[styles.clusterTitle, { color: tierColors[i % 3] }]}>{c.group}</Text>
                <Text style={styles.clusterValue}>{c.count}</Text>
                <Text style={styles.clusterLabel}>employees</Text>
                <Text style={styles.clusterValue2}>฿{formatSalary(c.centroid)}</Text>
                <Text style={styles.clusterLabel}>avg salary</Text>
              </View>
            ))}
          </View>
        )}

        {/* รายการพนักงาน */}
        <Text style={styles.sectionTitle}>
          Employees ({q ? `${filteredEmployees.length}/${employees.length}` : employees.length}) {/* 22 แสดงจำนวนที่ค้นเจอ */}
        </Text>

        {/* ช่องค้นหา */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or position..."
          value={searchQuery}
          onChangeText={setSearchQuery} // 23 อัปเดตทุกครั้งที่พิมพ์ = Real-time
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {loadingList ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : filteredEmployees.length === 0 ? (
          <Text style={styles.emptyText}>
            {q ? "No employees match your search." : "No employees yet."}
          </Text> // 24 ข้อความเมื่อไม่พบข้อมูล
        ) : (
          filteredEmployees.map((emp) => ( // 25 แสดงเฉพาะรายการที่ผ่านการกรอง
            <View key={emp.id} style={styles.card}>
              <View style={styles.empTop}>
                <Text style={styles.empName}>{emp.name}</Text>
                <View style={[styles.badge, emp.status === "Active" ? styles.badgeActive : styles.badgeLeave]}>
                  <Text style={styles.badgeText}>{emp.status}</Text>
                </View>
              </View>
              <Text style={styles.empInfo}>Position: {emp.position}</Text>
              <Text style={styles.empInfo}>Salary: ฿{formatSalary(emp.salary)}</Text>
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => handleToggle(emp)}>
                  <Text style={styles.btnText}>Toggle Status</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(emp)}>
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Root ----------
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 17 สถานะล็อกอิน
  return isLoggedIn
    ? <Dashboard onLogout={() => setIsLoggedIn(false)} /> // 18 Conditional Rendering สลับหน้า
    : <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  scroll: { padding: 16, paddingBottom: 40 },
  loginWrap: { flex: 1, backgroundColor: "#eef2ff", justifyContent: "center", padding: 20 },
  loginCard: { backgroundColor: "#fff", borderRadius: 16, padding: 24, elevation: 4,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8 },
  title: { fontSize: 26, fontWeight: "700", color: "#1e293b", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  header: { fontSize: 26, fontWeight: "700", color: "#1e293b" },
  logout: { color: "#dc2626", fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1e293b", marginVertical: 8 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10,
    marginBottom: 10, backgroundColor: "#f9fafb" },
  searchInput: { borderWidth: 1, borderColor: "#c7d2fe", borderRadius: 10, padding: 12,
    marginBottom: 12, backgroundColor: "#fff" },
  emptyText: { textAlign: "center", color: "#6b7280", marginVertical: 20, fontSize: 15 },
  primaryBtn: { backgroundColor: "#2563eb", padding: 12, borderRadius: 8, alignItems: "center" },
  analyzeBtn: { backgroundColor: "#7c3aed", padding: 14, borderRadius: 10, alignItems: "center", marginVertical: 8 },
  btnText: { color: "#fff", fontWeight: "600" },
  empTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  empName: { fontSize: 17, fontWeight: "700", color: "#111827" },
  empInfo: { fontSize: 14, color: "#4b5563", marginBottom: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeActive: { backgroundColor: "#16a34a" },
  badgeLeave: { backgroundColor: "#f59e0b" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  btnRow: { flexDirection: "row", marginTop: 10 },
  toggleBtn: { flex: 1, backgroundColor: "#0ea5e9", padding: 10, borderRadius: 8, alignItems: "center", marginRight: 6 },
  deleteBtn: { flex: 1, backgroundColor: "#dc2626", padding: 10, borderRadius: 8, alignItems: "center", marginLeft: 6 },
  clusterRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  clusterCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, marginHorizontal: 4,
    borderTopWidth: 4, alignItems: "center", elevation: 2 },
  clusterTitle: { fontWeight: "700", fontSize: 15, marginBottom: 6 },
  clusterValue: { fontSize: 22, fontWeight: "700", color: "#111827" },
  clusterValue2: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 6 },
  clusterLabel: { fontSize: 11, color: "#6b7280" },
});