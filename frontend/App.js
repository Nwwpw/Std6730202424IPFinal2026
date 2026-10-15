// Student ID: 6730202424
// Subject: Internet Programming Final Exam (2026)
// Topic: HR Manager & Salary Analytics System Frontend

import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StyleSheet, Platform, SafeAreaView,
} from "react-native";

const API_URL = "http://localhost:5000/api"; 

// ---------- Helpers ----------
const notify = (title, msg) => 
  Platform.OS === "web" ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

const confirmDelete = (onYes) => { 
  if (Platform.OS === "web") {
    if (window.confirm("Are you sure?")) onYes();
    return;
  }
  Alert.alert("Are you sure?", "This employee will be permanently deleted.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onYes },
  ]);
};

const formatSalary = (n) => Number(n).toLocaleString("en-US");

// ---------- Login Screen ----------
function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) { 
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
      if (res.status === 200) onLoginSuccess(); 
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
  const [clusters, setClusters] = useState(null); 
  const [analyzing, setAnalyzing] = useState(false);

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

  useEffect(() => { fetchEmployees(); }, []); 

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
    try {
      const res = await fetch(`${API_URL}/employees/${emp.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, status: updated.status } : e)));
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

  const tierColors = ["#7c3aed", "#2563eb", "#059669"]; 

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
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
          <TextInput style={styles.input} placeholder="Salary" keyboardType="numeric" value={salary} onChangeText={setSalary} />
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
        <Text style={styles.sectionTitle}>Employees ({employees.length})</Text>
        {loadingList ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          employees.map((item) => (
            <View key={item.id} style={styles.employeeCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.empName}>{item.name}</Text>
                <Text style={styles.empDetails}>{item.position} | ฿{formatSalary(item.salary)}</Text>
                <Text style={[styles.statusBadge, item.status === "Active" ? styles.statusActive : styles.statusLeave]}>
                  {item.status}
                </Text>
              </View>
              <View style={styles.actionColumn}>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => handleToggle(item)}>
                  <Text style={styles.btnTextSmall}>Toggle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.btnTextSmall}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Main App Wrapper ----------
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return isLoggedIn ? (
    <Dashboard onLogout={() => setIsLoggedIn(false)} />
  ) : (
    <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  scroll: { padding: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  header: { fontSize: 28, fontWeight: "bold", color: "#1F2937" },
  logout: { fontSize: 16, color: "#EF4444", fontWeight: "600" },
  card: { backgroundColor: "#FFF", padding: 16, borderRadius: 12, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#374151", marginBottom: 12 },
