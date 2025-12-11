import React, { useState, useEffect } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  Database,
  Brain,
  TrendingUp,
  Clock,
  Smartphone,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as d3 from "d3";


// 🔗 رابط الـ API حق Flask
const API_URL = "http://127.0.0.1:5000/evaluate";

// 🧩 تسميات عربية للعمليات
const ACTION_LABELS_AR = {
  login: "تسجيل الدخول",
  home: "الصفحة الرئيسية",
  view_personal_data: "عرض البيانات الشخصية",
  renew_private_license: "تجديد رخصة القيادة الخاصة",
  renew_public_license: "تجديد رخصة القيادة العامة",
  issue_passport: "إصدار جواز السفر السعودي",
  renew_passport: "تجديد جواز السفر السعودي",
  issue_work_permit: "إصدار تصريح العمل",
  renew_work_permit: "تجديد تصريح العمل",
  submit_tax_declaration: "تقديم الإقرار الضريبي",
  view_tax_obligations: "الاستعلام عن الالتزامات الضريبية",
  register_property: "تسجيل العقار",
  update_property_data: "تحديث بيانات العقار والملكية",
  upload_doc: "رفع مستند",
  payment: "الدفع",
  logout: "تسجيل الخروج",
};

const TAB_LABELS_AR = {
  "dashboard": "لوحة التحكم",
  "analytics": "التحليلات",
  "ml-models": "نماذج الذكاء الاصطناعي",
  "database": "قاعدة البيانات",
  "graph": "خريطة الارتباطات (Graph Network)"
};

// Expanded Mock Database with 100+ users
const generateUserDatabase = () => {
  const users = [];
  const devices = [
    "iPhone_14",
    "Samsung_S23",
    "Pixel_7",
    "iPad_Pro",
    "Desktop_Chrome",
    "Desktop_Safari",
  ];
  const cities = ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Khobar"];
  const services = [
    "renew_id",
    "vehicle_registration",
    "passport_renewal",
    "business_license",
    "family_visit",
    "document_verification",
  ];
  const deviceIds = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"];
  const ipAddresses = [
    "IP_100",
    "IP_101",
    "IP_102",
    "IP_103",
    "IP_104",
    "IP_105",
    "IP_106",
    "IP_107",
    "IP_108",
    "IP_109",
  ];
  const docHashes = ["DOC_A", "DOC_B", "DOC_C", "DOC_D", "DOC_E", "DOC_F"];

  for (let i = 1; i <= 100; i++) {
    users.push({
      id: `U${i}`,
      name: `User ${i}`,
      baseRisk: Math.floor(Math.random() * 100),
      device: devices[Math.floor(Math.random() * devices.length)],
      deviceId: deviceIds[Math.floor(Math.random() * deviceIds.length)],
      ipAddress: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
      docHash:
        Math.random() > 0.7
          ? docHashes[Math.floor(Math.random() * docHashes.length)]
          : null,
      city: cities[Math.floor(Math.random() * cities.length)],
      lastService: services[Math.floor(Math.random() * services.length)],
      transactionCount: Math.floor(Math.random() * 50),
      accountAge: Math.floor(Math.random() * 1000),
    });
  }
  return users;
};

// Generate transaction history
const generateTransactionHistory = () => {
  const history = [];
  const actions = [
    "login",
    "home",
    "view_personal_data",
    "renew_private_license",
    "renew_public_license",
    "issue_passport",
    "renew_passport",
    "issue_work_permit",
    "renew_work_permit",
    "submit_tax_declaration",
    "view_tax_obligations",
    "register_property",
    "update_property_data",
    "upload_doc",
    "payment",
    "logout",
  ];

  const decisions = ["ALLOW", "ALERT", "CHALLENGE", "BLOCK_REVIEW"];

  for (let i = 0; i < 50; i++) {
    const risk = Math.floor(Math.random() * 100);
    history.push({
      timestamp: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      userId: `U${Math.floor(Math.random() * 100) + 1}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      risk: risk,
      decision: decisions[Math.floor(risk / 25)],
    });
  }
  return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const renderGraph = (data) => {
  const container = document.getElementById("fraud-graph");
  if (!container) return;

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 400;

  // امسحي أي رسم قديم
  d3.select("#fraud-graph").selectAll("*").remove();

  // أنشئي الـ SVG
  const svg = d3
    .select("#fraud-graph")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`);

  // مجموعة رئيسية نطبق عليها الـ zoom / pan
  const g = svg.append("g");

  const nodes = data.nodes || [];
  let links = data.links || [];

  // لو ما فيه بيانات، لا تسوين شيء
  if (nodes.length === 0) {
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("fill", "#666")
      .text("لا توجد بيانات للعرض. قم بتسجيل حالة احتيال مؤكدة أولاً.");
    return;
  }

  // ✅ Validate links and convert string IDs to objects
  const validNodeIds = new Set(nodes.map((n) => n.id));
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  
  links = links
    .filter((l) => {
      const sourceId = typeof l.source === "string" ? l.source : l.source.id;
      const targetId = typeof l.target === "string" ? l.target : l.target.id;
      return validNodeIds.has(sourceId) && validNodeIds.has(targetId);
    })
    .map((l) => ({
      source: typeof l.source === "string" ? nodeMap.get(l.source) : l.source,
      target: typeof l.target === "string" ? nodeMap.get(l.target) : l.target,
      type: l.type || "asset-asset",
      strength: l.strength || 1,
    }));

  // 🔍 zoom + pan
  const zoom = d3
    .zoom()
    .scaleExtent([0.2, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "8px 12px")
    .style("background", "rgba(0, 0, 0, 0.85)")
    .style("color", "white")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 1000);

  // ✨ force simulation
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance((d) => {
          // مسافة أكبر للروابط بين assets
          return d.type === "asset-asset" ? 150 : 100;
        })
    )
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius((d) => (d.size || 15) + 5));

  // الروابط
  const link = g
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", (d) => {
      // ألوان مختلفة حسب نوع الرابط
      if (d.type === "asset-asset") return "#94a3b8"; // رمادي فاتح للروابط بين assets
      return "#cbd5e1"; // رمادي أفتح للروابط الأخرى
    })
    .attr("stroke-width", (d) => d.strength * 2)
    .attr("stroke-opacity", 0.6);

  // العقد
  const node = g
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", (d) => d.size || 12)
    .attr("fill", (d) => {
      if (d.type === "ip") return "#ef4444"; // أحمر = IP
      if (d.type === "device") return "#3b82f6"; // أزرق = جهاز
      if (d.type === "doc") return "#f59e0b"; // برتقالي = مستند
      if (d.type === "sequence") return "#10b981"; // أخضر = sequence
      return "#6b7280"; // رمادي = آخر
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      const fraudCount = d.fraud_count || 0;
      tooltip
        .html(
          `<strong>${d.label}</strong><br/>` +
            `النوع: ${d.type === "ip" ? "عنوان IP" : d.type === "device" ? "جهاز" : d.type === "doc" ? "وثيقة" : "تسلسل"}<br/>` +
            `عدد حالات الاحتيال: ${fraudCount}`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 10 + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(200).style("opacity", 0);
    })
    .call(
      d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

  // اللّيبلز
  const labels = g
    .append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .text((d) => {
      // اختصر النص للعقد الكثيرة
      const label = d.label || d.id;
      return label.length > 15 ? label.substring(0, 12) + "..." : label;
    })
    .attr("font-size", "11px")
    .attr("font-weight", "500")
    .attr("dy", (d) => (d.size || 12) + 18)
    .attr("text-anchor", "middle")
    .attr("fill", "#1f2937")
    .style("pointer-events", "none");

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
  });
};

const App = () => {
  const [users] = useState(generateUserDatabase());
  const [transactionHistory, setTransactionHistory] = useState(
    generateTransactionHistory()
  );
  const getDecisionLabel = (decision) => {
    switch (decision) {
      case "ALLOW":
        return "سماح";
      case "ALERT":
        return "تنبيه";
      case "CHALLENGE":
        return "تحقق إضافي";
      case "BLOCK_REVIEW":
        return "حظر وتحويل للمراجعة";
      case "REVIEW_REQUIRED":  // Keep for backward compatibility
        return "حظر وتحويل للمراجعة";
      case "BLOCK":  // Keep for backward compatibility
        return "حظر وتحويل للمراجعة";
      default:
        return decision;
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [riskBreakdown, setRiskBreakdown] = useState(null);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [autoSimulate, setAutoSimulate] = useState(false);
  const [mlStats] = useState({
    isolationForest: { 
      accuracy: null, 
      samples: 3200,
      note: "نموذج غير إشرافي (Unsupervised) - لا يُقاس بالدقة التقليدية"
    },
    neuralNetwork: { 
      accuracy: 96.25, 
      samples: 3200,
      precision: 0.970,
      recall: 0.985,
      f1Score: 0.977
    },
    randomForest: { 
      accuracy: 98.88, 
      samples: 3200,
      precision: 0.997,
      recall: 0.989,
      f1Score: 0.993
    },
  });
  const [showManualForm, setShowManualForm] = useState(false);
  
  const [graphData, setGraphData] = useState(null);
  const fetchGraphData = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/graph-data");
      const data = await res.json();
      setGraphData(data);
      // Small delay to ensure DOM is ready
      setTimeout(() => renderGraph(data), 100);
    } catch (err) {
      console.error("Failed to fetch graph data", err);
    }
  };

  // Auto-fetch graph data when graph tab is selected
  useEffect(() => {
    if (selectedTab === "graph") {
      fetchGraphData();
    }
  }, [selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps


  const [manualInput, setManualInput] = useState({
    userId: "U1",
    deviceKnown: true,
    locationChange: 100,
    hourOfDay: 14,
    opsLast24h: 1,
    isSensitiveService: false,
    sessionSequenceText: "login,home,renew_id,upload_doc,payment",

    ipAddress: "IP_100",
    deviceId: "D1",
    docHash: "DOC_A"
  });

  // 🔹 نولّد معاملة وهمية لكن منطقية (المودل الحقيقي في الـ backend)
  const generateTransaction = () => {
    const user = users[Math.floor(Math.random() * users.length)];
    const sequences = [
      // طبيعي: دخول + صفحة رئيسية + تجديد + رفع مستند + دفع
      ["login", "home", "renew_id", "upload_doc", "payment"],
      // طبيعي برضو: دخول + خدمة مركبات + دفع + خروج
      ["login", "home", "vehicle_registration", "payment", "logout"],
      // سيناريو مباشر لكنه مو مرّة مشبوه، فقط "حساس": تجديد هوية مباشرة بعد الدخول
      ["login", "renew_id", "payment"], // Direct but plausible
      // مشبوه: تكرار تسجيل الدخول كثير + خدمة حساسة
      ["login", "login", "login", "renew_id"], // Very suspicious (brute / bot-like)
      // مشبوه أكثر: جلسة فيها حوسة وخدمات كثيرة / حساسة
      ["login", "home", "renew_id", "vehicle_registration", "upload_doc", "payment", "payment"],
      // ↑ كثير خطوات + أكثر من خدمة + تكرار دفع
    ];


    return {
      userId: user.id,
      userName: user.name,
      deviceKnown: Math.random() > 0.3,
      locationChange: Math.floor(Math.random() * 1000),
      hourOfDay: Math.floor(Math.random() * 24),
      opsLast24h: Math.floor(Math.random() * 10),
      isSensitiveService: Math.random() > 0.5,
      sessionSequence: sequences[Math.floor(Math.random() * sequences.length)],
      deviceType: user.device,
      city: user.city,
    };
  };

  // 🧠 الربط الفعلي بالـ Flask + ML Models
  const processTransaction = async (transaction) => {
    setIsProcessing(true);
    setCurrentTransaction(transaction);

    try {
      // 1) تجهيز الـ payload اللي ينتظره app.py
      const payload = {
        user_id: transaction.userId,
        device_is_known: transaction.deviceKnown,
        location_change_km: transaction.locationChange,
        hour_of_day: transaction.hourOfDay,
        ops_last_24h: transaction.opsLast24h,
        is_sensitive_service: transaction.isSensitiveService,
        session_sequence: transaction.sessionSequence,
        ip_address: transaction.ipAddress || null,
        device_id: transaction.deviceId || null,
        doc_hash: transaction.docHash || null,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Backend error");
      }

      const data = await res.json();

      // 2) توزيع الأسباب حسب الطبقات
      const behaviorKeys = [
        "new_device",
        "big_location_jump",
        "unusual_time",
        "sensitive_service",
        "high_frequency_ops",
      ];
      const seqKeys = [
        "sequence_drift",
        "repeated_actions",
        "sensitive_too_early",
        "multiple_sensitive_services",
        "long_session_many_ops",
        "rare_navigation_pattern",
        "too_many_otp_challenges",
      ];
      
      const graphPrefixes = [
        "shared_device_with_high_risk",
        "shared_ip_with_high_risk",
        "shared_doc_with_high_risk",
      ];
      const aiPrefixes = ["ml_", "ai_"];

      const behaviorReasons = [];
      const aiReasons = [];
      const sequenceReasons = [];
      const networkReasons = [];

      if (Array.isArray(data.reasons) && Array.isArray(data.reason_details)) {
        data.reasons.forEach((code, idx) => {
          const text = data.reason_details[idx] || code;

          if (behaviorKeys.includes(code)) {
            behaviorReasons.push(text);
          } else if (seqKeys.includes(code)) {
            sequenceReasons.push(text);
          } else if (graphPrefixes.some((p) => code.startsWith(p))) {
            networkReasons.push(text);
          } else if (aiPrefixes.some((p) => code.startsWith(p))) {
            aiReasons.push(text);
          } else {
            aiReasons.push(text);
          }
        });
      }

      // 3) تجهيز البيانات للعرض في الواجهة
      const breakdown = {
        behaviorRisk: data.behavior_risk,
        behaviorReasons,
        aiRisk: data.ai_risk,
        aiReasons:
          aiReasons.length > 0
            ? aiReasons
            : data.ai_risk > 0
            ? ["نماذج الذكاء الاصطناعي أعطت إشارة مخاطرة لهذه المعاملة."]
            : ["نماذج الذكاء الاصطناعي لم ترصد أي نمط خطير في هذه المعاملة."],
        sequenceRisk: data.sequence_risk,
        sequenceReasons,
        networkRisk: data.graph_risk,
        networkReasons,
        totalRisk: data.total_risk,
        decision: data.decision,
        timestamp: new Date().toISOString(),
      };
      

      setRiskBreakdown(breakdown);

      // 4) تحديث سجل العمليات
      setTransactionHistory((prev) => [
        {
          timestamp: new Date().toISOString(),
          userId: transaction.userId,
          action:
            transaction.sessionSequence[
              transaction.sessionSequence.length - 1
            ],
          risk: data.total_risk,
          decision: data.decision,
        },
        ...prev.slice(0, 49),
      ]);
    } catch (err) {
      console.error("Error calling backend:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = () => {
    const seq = manualInput.sessionSequenceText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const user = users.find((u) => u.id === manualInput.userId) || users[0];

    const tx = {
      userId: manualInput.userId,
      userName: user.name,
      deviceKnown: manualInput.deviceKnown,
      locationChange: Number(manualInput.locationChange),
      hourOfDay: Number(manualInput.hourOfDay),
      opsLast24h: Number(manualInput.opsLast24h),
      isSensitiveService: manualInput.isSensitiveService,
      sessionSequence: seq,
      deviceType: user.device,
      city: user.city,
      ipAddress: manualInput.ipAddress,
      deviceId: manualInput.deviceId,
      docHash: manualInput.docHash,
    };

    processTransaction(tx);
  };

  const handleConfirmFraud = async () => {
    if (!currentTransaction) return;

    try {
      await fetch("http://127.0.0.1:5000/confirm-fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip_address: currentTransaction.ipAddress || null,
          device_id: currentTransaction.deviceId || null,
          doc_hash: currentTransaction.docHash || null,
          session_sequence: currentTransaction.sessionSequence || [],
        }),
      });

      // بعد التأكيد نحدث الـ graph عشان يشوفون الأثر مباشرة
      await fetchGraphData();

      alert("تم تسجيل الحالة كاحتيال مؤكد في خريطة الارتباطات.");
    } catch (err) {
      console.error("Failed to confirm fraud", err);
      alert("تعذر تسجيل الحالة، تأكد من تشغيل الـ backend.");
    }
  };


  // Risk distribution data
  const riskDistribution = [
    {
      range: "0-25",
      count: transactionHistory.filter((t) => t.risk <= 25).length,
      color: "#10b981",
    },
    {
      range: "26-50",
      count: transactionHistory.filter((t) => t.risk > 25 && t.risk <= 50)
        .length,
      color: "#f59e0b",
    },
    {
      range: "51-75",
      count: transactionHistory.filter((t) => t.risk > 50 && t.risk <= 75)
        .length,
      color: "#ef4444",
    },
    {
      range: "76-100",
      count: transactionHistory.filter((t) => t.risk > 75).length,
      color: "#991b1b",
    },
  ];

  const decisionStats = [
    {
      name: "ALLOW",
      value: transactionHistory.filter((t) => t.decision === "ALLOW").length,
      color: "#10b981",
    },
    {
      name: "ALERT",
      value: transactionHistory.filter((t) => t.decision === "ALERT").length,
      color: "#f59e0b",
    },
    {
      name: "CHALLENGE",
      value: transactionHistory.filter((t) => t.decision === "CHALLENGE")
        .length,
      color: "#f97316",
    },
    {
      name: "BLOCK_REVIEW",
      value: transactionHistory.filter((t) => t.decision === "BLOCK_REVIEW" || t.decision === "REVIEW_REQUIRED" || t.decision === "BLOCK").length,
      color: "#ef4444",
    },
  ];

  return (
    <div
    dir="rtl"
    className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 text-right">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="w-16 h-16 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                رقيب أبشر - Absher Raqeeb AI
                </h1>

                <p className="text-gray-600">
                <br />
                رقيب أبشر هو منظومة أمنية ذكية فوق خدمات أبشر، تراقب أنماط الاستخدام والارتباطات التقنية، وتستخدم الذكاء الاصطناعي لتقييم مخاطر كل معاملة وكشف المحاولات المشبوهة بشكل استباقي مع توضيح أسباب القرار.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 bg-white p-2 rounded-lg shadow">
          {["dashboard", "analytics", "ml-models", "database", "graph"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                selectedTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {TAB_LABELS_AR[tab]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {selectedTab === "dashboard" && (
          <div className="space-y-6">
           {/* Manual Test Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">
                    تقييم المخاطرة اليدوي
                  </h2>
                  <p className="text-sm text-gray-600">
                    إدخال سيناريو يدوي (مستخدم، جهاز، وقت، عدد العمليات، تسلسل الجلسة) لاختبار نموذج المخاطرة.
                  </p>
                </div>
                <button
                  onClick={() => setShowManualForm((prev) => !prev)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center gap-2"
                >
                  {showManualForm ? " -" : " +"}
                </button>
              </div>

              {showManualForm && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* IP Address */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        عنوان الـ IP (اختياري)
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={manualInput.ipAddress}
                        onChange={(e) =>
                          setManualInput((prev) => ({
                            ...prev,
                            ipAddress: e.target.value,
                          }))
                        }
                        placeholder="مثال: IP_100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        نستخدم قيم مثل <span className="font-mono">IP_100</span> في الـ POC.
                      </p>
                    </div>

                    {/* Device ID */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        معرّف الجهاز (Device ID)
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={manualInput.deviceId}
                        onChange={(e) =>
                          setManualInput((prev) => ({
                            ...prev,
                            deviceId: e.target.value,
                          }))
                        }
                        placeholder="مثال: D1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        نستخدم معرفات بسيطة مثل{" "}
                        <span className="font-mono">D1, D2, D3</span> لتوضيح الفكرة.
                      </p>
                    </div>

                    {/* Doc Hash */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        بصمة الوثيقة (Document Hash)
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={manualInput.docHash}
                        onChange={(e) =>
                          setManualInput((prev) => ({
                            ...prev,
                            docHash: e.target.value,
                          }))
                        }
                        placeholder="مثال: DOC_A"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        تُستخدم لتمييز المستندات التي تم إعادة استخدامها في أكثر من معاملة.
                      </p>
                    </div>

                    {/* User */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        المستخدم (User ID)
                      </label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={manualInput.userId}
                        onChange={(e) =>
                          setManualInput((prev) => ({
                            ...prev,
                            userId: e.target.value,
                          }))
                        }
                      >
                        {users.slice(0, 10).map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.id} - {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Device known */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        هل الجهاز معروف لهذا المستخدم؟
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          id="manual-device-known"
                          type="checkbox"
                          checked={manualInput.deviceKnown}
                          onChange={(e) =>
                            setManualInput((prev) => ({
                              ...prev,
                              deviceKnown: e.target.checked,
                            }))
                          }
                        />
                        <label
                          htmlFor="manual-device-known"
                          className="text-sm text-gray-700"
                        >
                          نعم (إلغاء التحديد يعني جهاز جديد)
                        </label>
                      </div>
                    </div>

                    {/* Sensitive service */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        هل الخدمة حساسة؟
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          id="manual-sensitive"
                          type="checkbox"
                          checked={manualInput.isSensitiveService}
                          onChange={(e) =>
                            setManualInput((prev) => ({
                              ...prev,
                              isSensitiveService: e.target.checked,
                            }))
                          }
                        />
                        <label
                          htmlFor="manual-sensitive"
                          className="text-xs text-gray-700 leading-5"
                        >
                          مثل:
                          {" "}
                          تجديد الهوية الوطنية، تسجيل/تجديد رخصة المركبة،
                          إصدار/تجديد الجواز، إصدار/تجديد تصريح العمل،
                          تقديم الإقرارات الضريبية، الاستعلام عن الالتزامات،
                          تسجيل العقار أو تحديث بيانات الملكية.
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Location change */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        التغيّر في الموقع (كم تقريبًا)
                      </label>
                      <input
                        type="number"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={manualInput.locationChange}
                        onChange={(e) =>
                          setManualInput((prev) => ({
                            ...prev,
                            locationChange: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Hour of day */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        وقت التنفيذ (ساعة من 0 إلى 23)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={manualInput.hourOfDay}
                        onChange={(e) =>
                          setManualInput((prev) => ({
                            ...prev,
                            hourOfDay: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Ops last 24h */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        عدد العمليات خلال آخر 24 ساعة
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={manualInput.opsLast24h}
                        onChange={(e) =>
                          setManualInput((prev) => ({
                            ...prev,
                            opsLast24h: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Session sequence */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 mb-1">
                      تسلسل خطوات الجلسة (مفصولة بفاصلة ,)
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={manualInput.sessionSequenceText}
                      onChange={(e) =>
                        setManualInput((prev) => ({
                          ...prev,
                          sessionSequenceText: e.target.value,
                        }))
                      }
                      placeholder="login,verify_otp,home,renew_id,upload_doc"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      مثال:{" "}
                      <span className="font-mono">
                        login,login,renew_work_permit,payment
                      </span>{" "}
                      تمثّل جلسة فيها تكرار تسجيل دخول + خدمة حساسة مباشرة بعد الدخول.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleManualSubmit}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                    >
                      تقييم 
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Current Transaction Processing */}
            {isProcessing && currentTransaction && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-6 h-6 text-yellow-500 animate-pulse" />
                  <h2 className="text-xl font-bold text-gray-800">
                  جاري تقييم المعاملة...
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">User:</span>
                    <p className="font-semibold">{currentTransaction.userName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Device:</span>
                    <p className="font-semibold">
                      {currentTransaction.deviceType}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-semibold">{currentTransaction.city}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <p className="font-semibold">
                      {currentTransaction.hourOfDay}:00
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-gray-600">Session Sequence:</span>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {currentTransaction.sessionSequence.map((action, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {ACTION_LABELS_AR[action] || action}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Risk Analysis Result */}
            {riskBreakdown && !isProcessing && (
  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-800">
        تم تحليل المخاطر
      </h2>
      <div
        className={`px-6 py-3 rounded-lg text-xl font-bold flex items-center ${
          riskBreakdown.decision === "ALLOW"
            ? "bg-green-100 text-green-700"
            : riskBreakdown.decision === "ALERT"
            ? "bg-yellow-100 text-yellow-700"
            : riskBreakdown.decision === "CHALLENGE"
            ? "bg-orange-100 text-orange-700"
            : (riskBreakdown.decision === "BLOCK_REVIEW" || riskBreakdown.decision === "REVIEW_REQUIRED" || riskBreakdown.decision === "BLOCK")
            ? "bg-red-100 text-red-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {riskBreakdown.decision === "ALLOW" && (
          <CheckCircle className="w-7 h-7 inline ml-2" />
        )}
        {["ALERT", "CHALLENGE"].includes(riskBreakdown.decision) && (
          <AlertTriangle className="w-7 h-7 inline ml-2" />
        )}
        {(riskBreakdown.decision === "BLOCK_REVIEW" || riskBreakdown.decision === "REVIEW_REQUIRED" || riskBreakdown.decision === "BLOCK") && (
          <XCircle className="w-7 h-7 inline ml-2" />
        )}
        {getDecisionLabel(riskBreakdown.decision)}
      </div>
    </div>

    {/* Total Risk Score */}
    <div className="mb-6 text-center">
      <div className="text-6xl font-bold text-gray-800 mb-2">
        {riskBreakdown.totalRisk}
      </div>
      <div className="text-gray-600 text-lg">
        إجمالي درجة المخاطرة / 100
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
        <div
          className={`h-4 rounded-full transition-all duration-1000 ${
            riskBreakdown.totalRisk <= 30
              ? "bg-green-500"
              : riskBreakdown.totalRisk <= 60
              ? "bg-yellow-500"
              : riskBreakdown.totalRisk <= 80
              ? "bg-orange-500"
              : "bg-red-500"
          }`}
          style={{ width: `${riskBreakdown.totalRisk}%` }}
        />
      </div>
    </div>

    {/* Risk Breakdown */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Behavior */}
      <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-blue-800">
            مخاطر السلوك والاستخدام
          </h3>
        </div>
        <div className="text-3xl font-bold text-blue-600">
          {riskBreakdown.behaviorRisk}
        </div>
        <ul className="mt-2 text-xs text-gray-700 space-y-1">
          {riskBreakdown.behaviorReasons.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
      </div>

      {/* AI Models */}
      <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-purple-800">نماذج الذكاء الاصطناعي</h3>
        </div>
        <div className="text-3xl font-bold text-purple-600">
          {riskBreakdown.aiRisk}
        </div>
        <ul className="mt-2 text-xs text-gray-700 space-y-1">
          {riskBreakdown.aiReasons.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
      </div>

      {/* Sequence */}
      <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-orange-600" />
          <h3 className="font-bold text-orange-800">
            تحليل تسلسل الجلسة
          </h3>
        </div>
        <div className="text-3xl font-bold text-orange-600">
          {riskBreakdown.sequenceRisk}
        </div>
        <ul className="mt-2 text-xs text-gray-700 space-y-1">
          {riskBreakdown.sequenceReasons.length > 0 ? (
            riskBreakdown.sequenceReasons.map((r, i) => (
              <li key={i}>• {r}</li>
            ))
          ) : (
            <li>• نمط استخدام طبيعي</li>
          )}
        </ul>
      </div>

      {/* Network Graph */}
      <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-green-600" />
          <h3 className="font-bold text-green-800">
            خريطة الارتباطات
          </h3>
        </div>
        <div className="text-3xl font-bold text-green-600">
          {riskBreakdown.networkRisk}
        </div>
        <ul className="mt-2 text-xs text-gray-700 space-y-1">
          {riskBreakdown.networkReasons.length > 0 ? (
            riskBreakdown.networkReasons.map((r, i) => (
              <li key={i}>• {r}</li>
            ))
          ) : (
            <li>• لا توجد ارتباطات مشبوهة</li>
          )}
        </ul>
      </div>
    </div>

    {/* Confirm Fraud Button on BLOCK_REVIEW */}
    {(riskBreakdown.decision === "BLOCK_REVIEW" || riskBreakdown.decision === "REVIEW_REQUIRED" || riskBreakdown.decision === "BLOCK") && (
      <div className="mt-4 flex justify-end">
        <button
          className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          onClick={handleConfirmFraud}
        >
          تسجيل الحالة كاحتيال مؤكد في خريطة الارتباطات
        </button>
      </div>
    )}
  </div>
)}


            {/* Real-time Transaction Feed */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Live Transaction Feed
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactionHistory.slice(0, 10).map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {new Date(t.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {t.userId}
                      </span>
                      <span className="text-sm text-gray-600">
                        {ACTION_LABELS_AR[t.action] || t.action}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-700">
                        {t.risk}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          t.decision === "ALLOW"
                            ? "bg-green-100 text-green-700"
                            : t.decision === "ALERT"
                            ? "bg-yellow-100 text-yellow-700"
                            : t.decision === "CHALLENGE"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {getDecisionLabel(t.decision)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {selectedTab === "graph" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                خريطة الارتباطات
              </h2>

              <p className="text-gray-600 text-sm mb-4">
                هذه الصفحة تعرض خريطة الاتصال بين العناصر المشبوهة
                مثل عناوين IP ومعرفات الأجهزة والوثائق المستخدمة في عمليات احتيال مؤكدة سابقة.
              </p>

              {/* Form: Add new IP / Device to test the graph */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-sm mb-1 block">عنوان IP</label>
                  <input
                    type="text"
                    value={manualInput.ip || ""}
                    onChange={(e) =>
                      setManualInput((prev) => ({ ...prev, ip: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="مثال: 45.55.100.1"
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">معرّف الجهاز Device ID</label>
                  <input
                    type="text"
                    value={manualInput.deviceId || ""}
                    onChange={(e) =>
                      setManualInput((prev) => ({
                        ...prev,
                        deviceId: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="مثال: DEV_X1"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => fetchGraphData()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-full"
                  >
                    تحديث خريطة الارتباطات
                  </button>
                </div>
              </div>

              {/* Graph Container */}
              <div className="bg-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-700">
                    عرض الخريطة
                  </h3>
                  {graphData && graphData.stats && (
                    <div className="flex gap-4 text-sm">
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
                        IPs: {graphData.stats.total_ips}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                        Devices: {graphData.stats.total_devices}
                      </span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                        Docs: {graphData.stats.total_docs}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                        Cases: {graphData.stats.total_fraud_cases}
                      </span>
                    </div>
                  )}
                </div>

                <div id="fraud-graph" className="w-full h-96 bg-white rounded-lg shadow-inner flex items-center justify-center">
                  {graphData && graphData.nodes && graphData.nodes.length === 0 && (
                    <div className="text-center text-gray-500 p-8">
                      <p className="text-lg mb-2">لا توجد بيانات للعرض</p>
                      <p className="text-sm">
                        قم بتسجيل حالة احتيال مؤكدة من لوحة التحكم أولاً لعرض خريطة الارتباطات
                      </p>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">مفتاح الرسم:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                      <span>عنوان IP (كلما زاد الحجم = أكثر احتيالات)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                      <span>جهاز (Device ID)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
                      <span>وثيقة (Document Hash)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                      <span>تسلسل (Sequence Pattern)</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <strong>الروابط:</strong> الخطوط الرمادية تربط بين العناصر التي ظهرت معاً في نفس حالة الاحتيال.
                      <br />
                      <strong>التفاعل:</strong> مرر الماوس على العقدة لرؤية التفاصيل، اسحب العقدة لتحريكها، استخدم عجلة الماوس للتكبير/التصغير.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "analytics" && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-gray-600 text-sm mb-2">
                  Total Transactions
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {transactionHistory.length}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-gray-600 text-sm mb-2">حظر وتحويل للمراجعة</div>
                <div className="text-3xl font-bold text-red-600">
                  {
                    transactionHistory.filter((t) => t.decision === "REVIEW_REQUIRED" || t.decision === "BLOCK")
                      .length
                  }
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-gray-600 text-sm mb-2">
                  Avg Risk Score
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {Math.round(
                    transactionHistory.reduce(
                      (sum, t) => sum + t.risk,
                      0
                    ) / transactionHistory.length
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-gray-600 text-sm mb-2">Active Users</div>
                <div className="text-3xl font-bold text-green-600">
                  {users.length}
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Risk Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Decision Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={decisionStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {decisionStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Risk Trend Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={transactionHistory.slice(0, 30).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(val) =>
                      new Date(val).toLocaleTimeString()
                    }
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedTab === "ml-models" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Brain className="w-8 h-8 text-purple-600" />
                Machine Learning Models Performance
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-300">
                  <h3 className="text-xl font-bold text-blue-800 mb-3">
                  Isolation Forest (كشف الشذوذ)
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">نوع النموذج:</span>
                      <span className="font-bold text-blue-600">
                        غير إشرافي (Unsupervised)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">عينات التدريب:</span>
                      <span className="font-bold text-blue-600">
                        {mlStats.isolationForest.samples.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">عينات الاختبار:</span>
                      <span className="font-bold text-blue-600">
                        800
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      يستخدم لعزل الحالات الغريبة عن "العالم الطبيعي" بدون الحاجة إلى Labels،
                      ويضيف سبب مثل <span className="font-mono">ml_unsupervised_anomaly_detected</span> عندما يكتشف نمط شاذ.
                      <br />
                      <span className="font-semibold">Contamination Rate:</span> 15% (نسبة الشذوذ المتوقعة)
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-300">
                  <h3 className="text-xl font-bold text-purple-800 mb-3">
                  Neural Network (شبكة عصبية)
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">الدقة (Accuracy):</span>
                      <span className="font-bold text-purple-600">
                        {mlStats.neuralNetwork.accuracy}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">الدقة (Precision):</span>
                      <span className="font-bold text-purple-600">
                        {(mlStats.neuralNetwork.precision * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">الاستدعاء (Recall):</span>
                      <span className="font-bold text-purple-600">
                        {(mlStats.neuralNetwork.recall * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">عينات التدريب:</span>
                      <span className="font-bold text-purple-600">
                        {mlStats.neuralNetwork.samples.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">عينات الاختبار:</span>
                      <span className="font-bold text-purple-600">
                        800
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      شبكة عصبية بثلاث طبقات مخفية (32, 16, 8 neurons)، تتعلم الأنماط المعقدة بين الخصائص
                      خصوصًا تأثير تسلسل الجلسة وطولها وعدد الخدمات الحساسة.
                      <br />
                      <span className="font-semibold">Architecture:</span> MLPClassifier (ReLU activation, Adam optimizer)
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-300">
                  <h3 className="text-xl font-bold text-green-800 mb-3">
                  Random Forest (نموذج إشرافي)
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">الدقة (Accuracy):</span>
                      <span className="font-bold text-green-600">
                        {mlStats.randomForest.accuracy}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">الدقة (Precision):</span>
                      <span className="font-bold text-green-600">
                        {(mlStats.randomForest.precision * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">الاستدعاء (Recall):</span>
                      <span className="font-bold text-green-600">
                        {(mlStats.randomForest.recall * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">عينات التدريب:</span>
                      <span className="font-bold text-green-600">
                        {mlStats.randomForest.samples.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">عينات الاختبار:</span>
                      <span className="font-bold text-green-600">
                        800
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      غابة من 150 شجرة قرار (Decision Trees) بعمق أقصى 8، تتعلّم متى تكون المعاملة طبيعية أو محفوفة بالمخاطر
                      بناءً على ٨ خصائص (الجهاز، الموقع، الوقت، عدد العمليات، حساسية الخدمة، طول الجلسة،
                      عدد الخدمات الحساسة وتكرار العمليات).
                      <br />
                      <span className="font-semibold">Configuration:</span> 150 estimators, max_depth=8, class_weight="balanced"
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Model Architecture & Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    خصائص الإدخال (8 أبعاد)
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• هل الجهاز معروف للمستخدم (device_is_known)</li>
                    <li>• التغيّر في الموقع بالكيلومتر (location_change_km)</li>
                    <li>• وقت تنفيذ العملية (hour_of_day)</li>
                    <li>• عدد العمليات خلال آخر 24 ساعة (ops_last_24h)</li>
                    <li>• هل الخدمة حساسة (is_sensitive_service)</li>
                    <li>• طول الجلسة (عدد الخطوات) (session_length)</li>
                    <li>• عدد الخدمات الحساسة داخل الجلسة (sensitive_count)</li>
                    <li>• هل يوجد تكرار غير طبيعي لخطوات مثل login / payment (repeated_flag)</li>
                  </ul>

                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Training Dataset
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• بيانات مصطنعة (Synthetic) بحجم <strong>4,000 معاملة</strong></li>
                      <li>• تقسيم تدريب/اختبار: <strong>3,200 تدريب (80%)</strong>، <strong>800 اختبار (20%)</strong></li>
                      <li>• توزيع البيانات: <strong>3,302 عينة خطرة</strong>، <strong>698 عينة طبيعية</strong></li>
                      <li>• نموذج RandomForest: <strong>98.88% دقة</strong>، <strong>99.7% precision</strong>، <strong>98.9% recall</strong></li>
                      <li>• نموذج Neural Network: <strong>96.25% دقة</strong>، <strong>97.0% precision</strong>، <strong>98.5% recall</strong></li>
                      <li>• Isolation Forest: <strong>Contamination rate 15%</strong> (نسبة الشذوذ المتوقعة)</li>
                      <li>• الهدف من البيانات المصطنعة هو إثبات الفكرة (PoC) وليس إنتاج موديل نهائي.</li>
                    </ul>
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-800">
                        <strong>Tech stack:</strong> Python (Flask, scikit-learn,
                        numpy) + React + Recharts + Lucide Icons
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "database" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Database className="w-8 h-8 text-blue-600" />
                User Database ({users.length} users)
              </h2>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        User ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Base Risk
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Device
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        City
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Transactions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.slice(0, 20).map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-800">
                          {user.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {user.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              user.baseRisk < 30
                                ? "bg-green-100 text-green-700"
                                : user.baseRisk < 60
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {user.baseRisk}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {user.device}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {user.city}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {user.transactionCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-600 text-center">
                Showing 20 of {users.length} users
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Database Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {users.length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Total Users
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {users.filter((u) => u.baseRisk < 30).length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Low Risk</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {
                      users.filter(
                        (u) => u.baseRisk >= 30 && u.baseRisk < 60
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Medium Risk</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {users.filter((u) => u.baseRisk >= 60).length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">High Risk</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {/* <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Multi-Layer AI Security Framework
              </h3>
              <p className="text-blue-100 text-sm">
                Powered by Behavioral Analytics, Graph Intelligence, Sequence
                Modeling & ML Anomaly Detection
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {transactionHistory.length}
              </div>
              <div className="text-blue-100 text-sm">
                Transactions Analyzed
              </div>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default App;
