// Student ID: 6730202424
// Name: วิภาวิน ตั้งวัฒนกิตติกุล
// Subject: Internet Programming Final Exam (2026)
// Topic: HR Manager & Salary Analytics System Frontend

// frontend/App.js
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StyleSheet, Platform, SafeAreaView,
} from "react-native";

const API_URL = "http://localhost:3041/api"; // 1 แก้ IP/พอร์ตตรงนี้ที่เดียว

// ---------- Helpers ----------
const notify = (title, msg) => // 2 Alert ใช้ได้ทั้งมือถือและเว็บ
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

// ---------- Edit Screen (หน้าแก้ไขพนักงานแยก) ----------
function EditScreen({ emp, onBack }) { // 7 รับพนักงานที่เลือก และฟังก์ชันกลับหน้า Dashboard
  const [name, setName] = useState(emp.name); // 8 เติมค่าเดิมลงฟอร์มตั้งแต่เปิดหน้า
  const [position, setPosition] = useState(emp.position);
  const [salary, setSalary] = useState(String(emp.salary));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !position.trim() || !salary.trim()) { // 9 ห้ามบันทึกถ้ามีช่องว่าง
      notify("Warning", "Please fill in Name, Position and Salary.");
      return;
    }
    if (Number.isNaN(Number(salary))) {
      notify("Warning", "Salary must be a number.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/employees/${emp.id}`, {
        method: "PUT", // 10 แก้ไขข้อมูลด้วย PUT /api/employees/:id
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), position: position.trim(), salary: Number(salary) }),
      });
      if (!res.ok) throw new Error();
      onBack(); // 11 สำเร็จแล้วกลับ Dashboard (Dashboard โหลดรายการใหม่เอง)
    } catch (e) {
      notify("Error", "Failed to update employee.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.page}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Edit Employee</Text>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Position</Text>
            <TextInput style={styles.input} value={position} onChangeText={setPosition} />
            <Text style={styles.label}>Salary</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={salary} onChangeText={setSalary} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Dashboard Screen ----------
function Dashboard({ onLogout, onEdit }) { // 12 onEdit = สั่งเปิดหน้าแก้ไข
  const [employees, setEmployees] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [clusters, setClusters] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`);
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      notify("Error", "Failed to load employees.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []); // 13 กลับจากหน้าแก้ไข Dashboard เปิดใหม่ จึงโหลดข้อมูลล่าสุดเสมอ

  const handleAdd = async () => {
    if (!name.trim() || !position.trim() || !salary.trim()) {
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
      setEmployees((prev) => [...prev, created]);
      setName(""); setPosition(""); setSalary("");
      setClusters(null);
    } catch (e) {
      notify("Error", "Failed to add employee.");
    }
  };

  const handleToggle = async (emp) => {
    const newStatus = emp.status === "Active" ? "On Leave" : "Active";
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
    confirmDelete(async () => {
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
    setAnalyzing(true);
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

  const tierColors = ["#7c3aed", "#2563eb", "#059669"]; // 14 ม่วง น้ำเงิน เขียว

  const q = searchQuery.trim().toLowerCase();
  const filteredEmployees = q
    ? employees.filter((e) =>
        String(e.name || "").toLowerCase().includes(q) ||
        String(e.position || "").toLowerCase().includes(q))
    : employees;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.page}>

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.header}>Dashboard</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Text style={styles.logoutText}>Logout</Text>
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

          {/* Salary Analytics */}
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

          {/* Employee Directory */}
          <Text style={styles.sectionTitle}>
            Employee Directory ({q ? `${filteredEmployees.length}/${employees.length}` : employees.length})
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or position..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {loadingList ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : filteredEmployees.length === 0 ? (
            <Text style={styles.emptyText}>
              {q ? "No employees match your search." : "No employees yet."}
            </Text>
          ) : (
            filteredEmployees.map((emp) => (
              <View key={emp.id} style={[styles.card, styles.empCard]}>
                <View style={styles.empLeft}>
                  <Text style={styles.empName}>{emp.name}</Text>
                  <Text style={styles.empInfo}>{emp.position}</Text>
                  <Text style={styles.empSalary}>฿{formatSalary(emp.salary)}</Text>
                  <View style={[styles.badge, emp.status === "Active" ? styles.badgeActive : styles.badgeLeave]}>
                    <Text style={[styles.badgeText, emp.status === "Active" ? styles.badgeTextActive : styles.badgeTextLeave]}>
                      {emp.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.empActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(emp)}>{/* 15 กด Edit = เปิดหน้าแก้ไข */}
                    <Text style={styles.btnTextSmall}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toggleBtn} onPress={() => handleToggle(emp)}>
                    <Text style={styles.btnTextSmall}>Toggle Status</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(emp)}>
                    <Text style={styles.btnTextSmall}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Root ----------
export default function App() {
  const [screen, setScreen] = useState("login"); // 16 login | dashboard | edit
  const [editingEmp, setEditingEmp] = useState(null); // 17 พนักงานที่กำลังแก้ไข

  if (screen === "edit" && editingEmp) // 18 สลับหน้าด้วย Conditional Rendering (ไม่ใช้ React Navigation)
    return <EditScreen emp={editingEmp} onBack={() => setScreen("dashboard")} />;
  if (screen === "dashboard")
    return <Dashboard
      onLogout={() => setScreen("login")}
      onEdit={(emp) => { setEditingEmp(emp); setScreen("edit"); }} />;
  return <LoginScreen onLoginSuccess={() => setScreen("dashboard")} />;
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  scroll: { padding: 16, paddingBottom: 40 },
  page: { width: "100%", maxWidth: 900, alignSelf: "center" },

  // Login
  loginWrap: { flex: 1, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center", padding: 20 },
  loginCard: { width: "100%", maxWidth: 400, backgroundColor: "#fff", borderRadius: 16, padding: 28,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  title: { fontSize: 26, fontWeight: "700", color: "#1e293b", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 22 },

  // Header
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  header: { fontSize: 28, fontWeight: "700", color: "#1e293b" },
  logoutBtn: { backgroundColor: "#FEE2E2", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: "#DC2626", fontWeight: "700" },
  backBtn: { backgroundColor: "#E0E7FF", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  backText: { color: "#3730A3", fontWeight: "700" },

  // Card + Form
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginVertical: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10, backgroundColor: "#F8FAFC", fontSize: 15 },
  searchInput: { borderWidth: 1, borderColor: "#C7D2FE", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 12, backgroundColor: "#fff", fontSize: 15 },
  emptyText: { textAlign: "center", color: "#6b7280", marginVertical: 20, fontSize: 15 },

  // Buttons
  primaryBtn: { backgroundColor: "#2563EB", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  analyzeBtn: { backgroundColor: "#7C3AED", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginVertical: 8 },
  cancelBtn: { paddingVertical: 10, alignItems: "center", marginTop: 6 },
  cancelText: { color: "#64748B", fontWeight: "600" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnTextSmall: { color: "#fff", fontWeight: "600", fontSize: 13 },

  // Cluster cards
  clusterRow: { flexDirection: "row", marginHorizontal: -4, marginBottom: 12 },
  clusterCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, marginHorizontal: 4,
    borderTopWidth: 4, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  clusterTitle: { fontWeight: "700", fontSize: 15, marginBottom: 6 },
  clusterValue: { fontSize: 24, fontWeight: "700", color: "#111827" },
  clusterValue2: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 8 },
  clusterLabel: { fontSize: 11, color: "#6b7280" },

  // Employee card
  empCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  empLeft: { flex: 1, paddingRight: 12 },
  empName: { fontSize: 17, fontWeight: "700", color: "#111827" },
  empInfo: { fontSize: 14, color: "#4B5563", marginTop: 2 },
  empSalary: { fontSize: 14, color: "#111827", fontWeight: "600", marginTop: 2, marginBottom: 8 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  badgeActive: { backgroundColor: "#DCFCE7" },
  badgeLeave: { backgroundColor: "#FEF3C7" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  badgeTextActive: { color: "#166534" },
  badgeTextLeave: { color: "#92400E" },
  empActions: { width: 120 },
  editBtn: { backgroundColor: "#2563EB", paddingVertical: 8, borderRadius: 8, alignItems: "center", marginBottom: 6 },
  toggleBtn: { backgroundColor: "#0EA5E9", paddingVertical: 8, borderRadius: 8, alignItems: "center", marginBottom: 6 },
  deleteBtn: { backgroundColor: "#DC2626", paddingVertical: 8, borderRadius: 8, alignItems: "center" },
});