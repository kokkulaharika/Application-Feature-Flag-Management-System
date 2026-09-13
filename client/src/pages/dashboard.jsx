import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import api from "../api";
import AddFlagModel from "../components/AddFlagModel";
import "./dashboard.css";

function Dashboard() {
  const [flags, setFlags] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [targetingRules, setTargetingRules] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddFlagModel, setShowAddFlagModel] = useState(false);

  // =====================================================
  // GET LOGGED-IN USER
  // =====================================================

  let userName = "User";

  try {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const user = JSON.parse(storedUser);

      console.log("Dashboard user:", user);

      const actualUser = user?.user || user;

      userName =
        actualUser?.name ||
        actualUser?.username ||
        actualUser?.full_name ||
        actualUser?.fullName ||
        actualUser?.display_name ||
        actualUser?.displayName ||
        "User";
    }
  } catch (error) {
    console.error(
      "Error reading logged-in user:",
      error
    );
  }

  // First letter for avatar
  const userInitial =
    userName.charAt(0).toUpperCase();

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          flagsResponse,
          environmentsResponse,
          targetingResponse,
          auditResponse,
        ] = await Promise.all([
          api.get("/flags"),
          api.get("/environments"),
          api.get("/targeting-rules"),
          api.get("/audit-logs"),
        ]);

        // -------------------------------------------------
        // FLAGS
        // -------------------------------------------------

        setFlags(
          Array.isArray(flagsResponse.data)
            ? flagsResponse.data
            : []
        );

        // -------------------------------------------------
        // ENVIRONMENTS
        // -------------------------------------------------

        setEnvironments(
          Array.isArray(environmentsResponse.data)
            ? environmentsResponse.data
            : []
        );

        // -------------------------------------------------
        // TARGETING RULES
        // -------------------------------------------------

        setTargetingRules(
          Array.isArray(targetingResponse.data)
            ? targetingResponse.data
            : []
        );

        // -------------------------------------------------
        // AUDIT LOGS
        // -------------------------------------------------

        setAuditLogs(
          Array.isArray(auditResponse.data)
            ? auditResponse.data
            : []
        );
      } catch (error) {
        console.error(
          "Dashboard loading failed:",
          error
        );

        setError(
          "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // =====================================================
  // FLAG COUNTS
  // =====================================================

  const activeFlags = flags.filter(
    (flag) => flag.enabled
  ).length;

  const disabledFlags = flags.filter(
    (flag) => !flag.enabled
  ).length;

  // =====================================================
  // FEATURE FLAG CHART DATA
  // =====================================================

  const chartData = [
    {
      name: "Total Flags",
      value: flags.length,
    },
    {
      name: "Active Flags",
      value: activeFlags,
    },
    {
      name: "Disabled Flags",
      value: disabledFlags,
    },
    {
      name: "Environments",
      value: environments.length,
    },
  ];

  // =====================================================
  // GET ENVIRONMENT NAME
  // =====================================================

  const getEnvironmentName = (environmentId) => {
    const environment = environments.find(
      (env) =>
        Number(env.environment_id) ===
        Number(environmentId)
    );

    return environment
      ? environment.name
      : "Unknown";
  };

  // =====================================================
  // ENVIRONMENT CHART DATA
  // Shows number of flags in each environment
  // =====================================================

  const environmentChartData = environments.map(
    (environment) => {
      const flagCount = flags.filter(
        (flag) =>
          Number(flag.environment_id) ===
          Number(environment.environment_id)
      ).length;

      return {
        name: environment.name,
        value: flagCount,
      };
    }
  );

  // =====================================================
  // TARGETING RULE COUNT
  // =====================================================

  const totalTargetingRules =
    targetingRules.length;

  // =====================================================
  // PERCENTAGE ROLLOUT COUNT
  //
  // According to Targeting.jsx:
  // rollout percentage is represented as:
  //
  // attribute === "rollout_percentage"
  // =====================================================

  const percentageRolloutCount =
    targetingRules.filter(
      (rule) =>
        rule.attribute ===
        "rollout_percentage"
    ).length;

  // =====================================================
  // TARGETING PIE CHART DATA
  //
  // Same donut chart contains:
  // 1. Targeting Rules
  // 2. Percentage Rollouts
  // =====================================================

  const targetingPieData = [
    {
      name: "Targeting Rules",
      value: totalTargetingRules,
    },
    {
      name: "Percentage Rollouts",
      value: percentageRolloutCount,
    },
  ].filter(
    (item) => item.value > 0
  );

  // =====================================================
  // TARGETING PIE COLORS
  // =====================================================

  const targetingPieColors = [
    "#6366f1",
    "#22c55e",
  ];

  // =====================================================
  // AUDIT LOG CHART DATA
  // Shows number of audit activities by action
  // =====================================================

  const auditActionCounts = {};

  auditLogs.forEach((log) => {
    const action =
      log.action || "UNKNOWN";

    auditActionCounts[action] =
      (auditActionCounts[action] || 0) + 1;
  });

  const auditChartData = Object.entries(
    auditActionCounts
  ).map(([action, count]) => ({
    name: action,
    value: count,
  }));

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="dashboard-message">
        <div className="loader"></div>

        <p>
          Loading dashboard...
        </p>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="dashboard-message error-message">
        <p>{error}</p>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="dashboard-container">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        {/* Logo */}

        <div className="logo">

          <div className="logo-icon">
            <i className="fa-solid fa-bolt"></i>
          </div>

          <div>
            <h2>FlagFlow</h2>

            <span>
              Feature Management
            </span>
          </div>

        </div>

        {/* Navigation */}

        <nav className="sidebar-nav">

          <p className="nav-title">
            MAIN
          </p>

          <Link
            to="/dashboard"
            className="nav-item active"
          >
            <span>
              <i className="fa-solid fa-gauge"></i>
            </span>

            Dashboard
          </Link>

          <Link
            to="/flags"
            className="nav-item"
          >
            <span>
              <i className="fa-solid fa-toggle-on"></i>
            </span>

            Feature Flags
          </Link>

          <Link
            to="/environments"
            className="nav-item"
          >
            <span>
              <i className="fa-solid fa-server"></i>
            </span>

            Environments
          </Link>

          <Link
            to="/targeting"
            className="nav-item"
          >
            <span>
              <i className="fa-solid fa-sliders"></i>
            </span>

            Targeting
          </Link>

          <Link
            to="/evaluation-analytics"
            className="nav-item"
          >
            <span>
              <i className="fa-solid fa-chart-line"></i>
            </span>

            Evaluation Analytics
          </Link>

          <Link
            to="/audit-logs"
            className="nav-item"
          >
            <span>
              <i className="fa-solid fa-clock-rotate-left"></i>
            </span>

            Audit Logs
          </Link>

          <p className="nav-title settings-title">
            SYSTEM
          </p>

          <Link
            to="/settings"
            className="nav-item"
          >
            <span>
              <i className="fa-solid fa-gear"></i>
            </span>

            Settings
          </Link>

        </nav>

        {/* =================================================
            SIDEBAR USER
        ================================================= */}

        <div className="sidebar-bottom">

          <div className="user-box">

            <div className="user-avatar">
              {userInitial}
            </div>

            <strong>
              {userName}
            </strong>

          </div>

        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="main-content">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="top-header">

          <div>

            <h1>
              Dashboard
            </h1>

            <p>
              Manage your feature flags and monitor
              your environments.
            </p>

          </div>

          <div className="header-right">

            <button
              className="notification-button"
            >
              <i className="fa-solid fa-bell"></i>
            </button>

            <div className="profile">

              <div className="profile-avatar">
                {userInitial}
              </div>

              <strong>
                {userName}
              </strong>

            </div>

          </div>

        </header>

        {/* =================================================
            FEATURE FLAG OVERVIEW
        ================================================= */}

        <section className="chart-section">

          <div className="chart-header">

            <div>

              <h2>
                Feature Flag Overview
              </h2>

              <p>
                Overview of your feature flags
                and environments.
              </p>

            </div>

          </div>

          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 0,
                  bottom: 20,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 12,
                  }}
                  interval={0}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="value"
                  name="Count"
                  fill="#4f46e5"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                  barSize={55}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>

        {/* =================================================
            DASHBOARD ANALYTICS

            ROW 1:
            Environment + Targeting

            ROW 2:
            Audit Activity - Full Width
        ================================================= */}

        <section className="dashboard-analytics-grid">

          {/* =================================================
              ENVIRONMENT OVERVIEW
          ================================================= */}

          <div className="analytics-card">

            <div className="analytics-card-header">

              <div>

                <h2>
                  Environment Overview
                </h2>

                <p>
                  Feature flags configured in each
                  environment.
                </p>

              </div>

              <div className="analytics-card-icon">
                <i className="fa-solid fa-server"></i>
              </div>

            </div>

            <div className="analytics-chart">

              {environmentChartData.length === 0 ? (

                <div className="analytics-empty">

                  <i className="fa-solid fa-server"></i>

                  <span>
                    No environment data available
                  </span>

                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={environmentChartData}
                    margin={{
                      top: 15,
                      right: 10,
                      left: 0,
                      bottom: 15,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 11,
                      }}
                      interval={0}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 11,
                      }}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="value"
                      name="Flags"
                      fill="#6366f1"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                      barSize={45}
                    />

                  </BarChart>

                </ResponsiveContainer>

              )}

            </div>

            <div className="analytics-card-footer">

              <span>
                Total Environments
              </span>

              <strong>
                {environments.length}
              </strong>

            </div>

          </div>

          {/* =================================================
              TARGETING RULES
              DONUT CHART
          ================================================= */}

          <div className="analytics-card targeting-card">

            <div className="analytics-card-header">

              <div>

                <h2>
                  Targeting Rules
                </h2>

                <p>
                  Targeting rules and percentage
                  rollout configurations.
                </p>

              </div>

              <div className="analytics-card-icon">
                <i className="fa-solid fa-sliders"></i>
              </div>

            </div>

            <div className="analytics-chart targeting-pie-chart">

              {targetingPieData.length === 0 ? (

                <div className="analytics-empty">

                  <i className="fa-solid fa-sliders"></i>

                  <span>
                    No targeting or rollout data available
                  </span>

                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={targetingPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius="48%"
                      outerRadius="70%"
                      paddingAngle={4}
                      stroke="none"
                    >

                      {targetingPieData.map(
                        (entry, index) => (

                          <Cell
                            key={`targeting-cell-${index}`}
                            fill={
                              targetingPieColors[
                                index %
                                targetingPieColors.length
                              ]
                            }
                          />

                        )
                      )}

                    </Pie>

                    <Tooltip />

                  </PieChart>

                </ResponsiveContainer>

              )}

            </div>

            {/* Custom Pie Legend */}

            {targetingPieData.length > 0 && (

              <div className="targeting-pie-legend">

                {targetingPieData.map(
                  (item, index) => (

                    <div
                      className="targeting-legend-item"
                      key={item.name}
                    >

                      <span
                        className="targeting-legend-dot"
                        style={{
                          background:
                            targetingPieColors[
                              index %
                              targetingPieColors.length
                            ],
                        }}
                      ></span>

                      <span className="targeting-legend-name">
                        {item.name}
                      </span>

                      <strong>
                        {item.value}
                      </strong>

                    </div>

                  )
                )}

              </div>

            )}

            <div className="analytics-card-footer">

              <span>
                Total Targeting Rules
              </span>

              <strong>
                {totalTargetingRules}
              </strong>

            </div>

          </div>

          {/* =================================================
              AUDIT ACTIVITY
              FULL WIDTH
          ================================================= */}

          <div className="analytics-card audit-activity-card">

            <div className="analytics-card-header">

              <div>

                <h2>
                  Audit Activity
                </h2>

                <p>
                  Recent system activity grouped
                  by action.
                </p>

              </div>

              <div className="analytics-card-icon">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>

            </div>

            <div className="analytics-chart audit-chart">

              {auditChartData.length === 0 ? (

                <div className="analytics-empty">

                  <i className="fa-solid fa-clock-rotate-left"></i>

                  <span>
                    No audit activity available
                  </span>

                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={auditChartData}
                    margin={{
                      top: 15,
                      right: 20,
                      left: 0,
                      bottom: 15,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 10,
                      }}
                      interval={0}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 11,
                      }}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="value"
                      name="Activities"
                      fill="#4f46e5"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                      barSize={45}
                    />

                  </BarChart>

                </ResponsiveContainer>

              )}

            </div>

            <div className="analytics-card-footer">

              <span>
                Total Audit Records
              </span>

              <strong>
                {auditLogs.length}
              </strong>

            </div>

          </div>

        </section>

        {/* =================================================
            FEATURE FLAGS
        ================================================= */}

        <section className="flags-section">

          <div className="section-header">

            <div>

              <h2>
                Feature Flags
              </h2>

              <p>
                View and monitor all configured
                feature flags.
              </p>

            </div>

            <button
              className="add-flag-button"
              onClick={() =>
                setShowAddFlagModel(true)
              }
            >
              + Add Flag
            </button>

          </div>

          {/* Flags Grid */}

          <div className="flags-grid">

            {flags.map((flag) => (

              <div
                className="flag-card"
                key={flag.flag_id}
              >

                {/* Flag Header */}

                <div className="flag-card-header">

                  <div>

                    <h3>
                      {flag.key}
                    </h3>

                    <span className="flag-type">
                      {flag.type}
                    </span>

                  </div>

                  {/* Status */}

                  <span
                    className={
                      flag.enabled
                        ? "status-badge enabled"
                        : "status-badge disabled"
                    }
                  >

                    <span className="status-dot"></span>

                    {flag.enabled
                      ? "Enabled"
                      : "Disabled"}

                  </span>

                </div>

                {/* Description */}

                <p className="flag-description">
                  {flag.description}
                </p>

                {/* Details */}

                <div className="flag-details">

                  <div className="detail">

                    <span className="detail-label">
                      Environment
                    </span>

                    <span className="environment-badge">

                      {getEnvironmentName(
                        flag.environment_id
                      )}

                    </span>

                  </div>

                  <div className="detail">

                    <span className="detail-label">
                      Owner
                    </span>

                    <span className="owner">
                      {flag.owner_team}
                    </span>

                  </div>

                </div>

                {/* Footer */}

                <div className="flag-card-footer">

                  <span>
                    Default:{" "}
                    {String(
                      flag.default_value
                    )}
                  </span>

                </div>

              </div>

            ))}

          </div>

        </section>

      </main>

      {/* =================================================
          ADD FLAG MODAL
      ================================================= */}

      {showAddFlagModel && (

        <AddFlagModel
          environments={environments}

          onClose={() =>
            setShowAddFlagModel(false)
          }

          onFlagCreated={(newFlag) => {

            setFlags(
              (previousFlags) => [
                ...previousFlags,
                newFlag,
              ]
            );

          }}

        />

      )}

    </div>
  );
}

export default Dashboard;