import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import api from "../api";

import "./evaluationAnalytics.css";

function EvaluationAnalytics() {
  const [analytics, setAnalytics] = useState([]);
  const [flags, setFlags] = useState([]);
  const [selectedFlag, setSelectedFlag] = useState("all");

  // =====================================================
  // EVALUATE FLAG STATE
  // =====================================================

  const [evaluateFlagKey, setEvaluateFlagKey] = useState("");
  const [evaluateEnvironment, setEvaluateEnvironment] =
    useState("");
  const [evaluateUserId, setEvaluateUserId] = useState("");

  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD ANALYTICS DATA
  // =====================================================

  useEffect(() => {
  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const [analyticsResponse, flagsResponse] =
        await Promise.all([
          api.get("/evaluation-analytics"),
          api.get("/flags"),
        ]);

      setAnalytics(analyticsResponse.data);
      setFlags(flagsResponse.data);

      // Select first flag automatically
      if (flagsResponse.data.length > 0) {
        setEvaluateFlagKey((current) =>
          current || flagsResponse.data[0].key
        );
      }
    } catch (error) {
      console.error(
        "Evaluation analytics loading failed:",
        error
      );

      setError(
        "Failed to load evaluation analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  loadAnalytics();
}, []);

  // =====================================================
  // REMOVE DUPLICATE FLAGS
  // =====================================================

  const uniqueFlags = flags.filter(
    (flag, index, self) =>
      index ===
      self.findIndex(
        (item) => item.key === flag.key
      )
  );

  // =====================================================
  // FILTER ANALYTICS
  // =====================================================

  const filteredAnalytics =
    selectedFlag === "all"
      ? analytics
      : analytics.filter(
          (item) =>
            String(item.flag_id) ===
            String(selectedFlag)
        );

  // =====================================================
  // TOTAL EVALUATIONS
  // =====================================================

  const totalEvaluations =
    filteredAnalytics.reduce(
      (total, item) =>
        total + Number(item.evaluation_count || 0),
      0
    );

  // =====================================================
  // FLAGS WITH EVALUATIONS
  // =====================================================

  const flagsWithEvaluations =
    new Set(
      filteredAnalytics.map(
        (item) => item.flag_id
      )
    ).size;

  // =====================================================
  // CHART DATA
  // =====================================================

  const chartData = [...filteredAnalytics]
    .sort(
      (a, b) =>
        a.evaluation_hour -
        b.evaluation_hour
    )
    .map((item) => ({
      hour: `${String(
        item.evaluation_hour
      ).padStart(2, "0")}:00`,

      evaluations:
        Number(item.evaluation_count || 0),

      flagId: item.flag_id,

      date: item.evaluation_date,
    }));

  // =====================================================
  // EVALUATE FEATURE FLAG
  // =====================================================

  const handleEvaluateFlag = async () => {
    setEvaluationResult(null);
    setEvaluationError("");

    if (!evaluateFlagKey) {
      setEvaluationError(
        "Please select a feature flag."
      );
      return;
    }

    if (!evaluateEnvironment) {
      setEvaluationError(
        "Please enter an environment name."
      );
      return;
    }

    try {
      setEvaluating(true);

      const requestData = {
        flag_key: evaluateFlagKey,
        environment_name: evaluateEnvironment,
      };

      // User context is optional
      if (evaluateUserId.trim()) {
        requestData.user_context = {
          user_id: evaluateUserId.trim(),
        };
      }

      const response = await api.post(
        "/evaluate",
        requestData
      );

      setEvaluationResult(response.data);

      // Refresh analytics after evaluation
      const analyticsResponse =
        await api.get("/evaluation-analytics");

      setAnalytics(analyticsResponse.data);
    } catch (error) {
      console.error(
        "Feature flag evaluation failed:",
        error
      );

      setEvaluationError(
        error.response?.data?.detail ||
          "Failed to evaluate feature flag."
      );
    } finally {
      setEvaluating(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="analytics-message">
        <div className="analytics-loader"></div>

        <p>
          Loading evaluation analytics...
        </p>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="analytics-message analytics-error">
        <p>{error}</p>

        <Link to="/dashboard">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="evaluation-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="evaluation-header">

        <div>
          <h1>
            Evaluation Analytics
          </h1>

          <p>
            Monitor how frequently your feature
            flags are being evaluated over time.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="back-dashboard-button"
        >
          ← Back to Dashboard
        </Link>

      </header>


      {/* =================================================
          EVALUATE FEATURE FLAG
      ================================================= */}

      <section className="evaluate-section">

        <div className="evaluate-header">

          <div className="evaluate-icon">
            <i className="fas fa-flask"></i>
          </div>

          <div>
            <h2>
              Evaluate Feature Flag
            </h2>

            <p>
              Test how an existing feature flag
              behaves for a specific environment
              and user.
            </p>
          </div>

        </div>


        <div className="evaluate-form">

          {/* FEATURE FLAG */}

          <div className="evaluate-field">

            <label htmlFor="evaluateFlag">
              Feature Flag
            </label>

            <select
              id="evaluateFlag"
              value={evaluateFlagKey}
              onChange={(event) =>
                setEvaluateFlagKey(
                  event.target.value
                )
              }
            >
              <option value="">
                Select a feature flag
              </option>

              {uniqueFlags.map((flag) => (
                <option
                  key={flag.flag_id}
                  value={flag.key}
                >
                  {flag.key}
                </option>
              ))}
            </select>

          </div>


          {/* ENVIRONMENT */}

          <div className="evaluate-field">

            <label htmlFor="evaluateEnvironment">
              Environment
            </label>

            <input
              id="evaluateEnvironment"
              type="text"
              placeholder="e.g. Production"
              value={evaluateEnvironment}
              onChange={(event) =>
                setEvaluateEnvironment(
                  event.target.value
                )
              }
            />

          </div>


          {/* USER ID */}

          <div className="evaluate-field">

            <label htmlFor="evaluateUserId">
              User ID
              <span>Optional</span>
            </label>

            <input
              id="evaluateUserId"
              type="text"
              placeholder="e.g. user123"
              value={evaluateUserId}
              onChange={(event) =>
                setEvaluateUserId(
                  event.target.value
                )
              }
            />

          </div>

        </div>


        {/* BUTTON */}

        <button
          type="button"
          className="evaluate-button"
          onClick={handleEvaluateFlag}
          disabled={evaluating}
        >
          {evaluating ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Evaluating...
            </>
          ) : (
            <>
              <i className="fas fa-play"></i>
              Evaluate Flag
            </>
          )}
        </button>


        {/* ERROR */}

        {evaluationError && (
          <div className="evaluation-result evaluation-result-error">

            <i className="fas fa-exclamation-circle"></i>

            <div>
              <strong>
                Evaluation Failed
              </strong>

              <p>
                {evaluationError}
              </p>
            </div>

          </div>
        )}


        {/* RESULT */}

        {evaluationResult && (
          <div
            className={`evaluation-result ${
              evaluationResult.enabled
                ? "evaluation-result-success"
                : "evaluation-result-disabled"
            }`}
          >

            <div className="result-icon">

              <i
                className={
                  evaluationResult.enabled
                    ? "fas fa-check-circle"
                    : "fas fa-times-circle"
                }
              ></i>

            </div>

            <div className="result-content">

              <div className="result-title">
                {evaluationResult.enabled
                  ? "Feature Flag Enabled"
                  : "Feature Flag Disabled"}
              </div>

              <p className="result-message">
                {evaluationResult.message ||
                  "Default flag state"}
              </p>

              <div className="result-details">

                <span>
                  <strong>Flag:</strong>{" "}
                  {evaluationResult.flag ||
                    evaluateFlagKey}
                </span>

                <span>
                  <strong>Environment:</strong>{" "}
                  {evaluationResult.environment ||
                    evaluateEnvironment}
                </span>

              </div>

            </div>

          </div>
        )}

      </section>


      {/* =================================================
          WHY THIS ANALYTICS
      ================================================= */}

      <section className="analytics-info">

        <div className="analytics-info-icon">
          <i className="fas fa-chart-line"></i>
        </div>

        <div>

          <h2>
            Why Evaluation Analytics?
          </h2>

          <p>
            Evaluation analytics shows how often
            each feature flag is requested by your
            application. This helps teams understand
            which flags are actively used, identify
            unused flags, and make better decisions
            about feature cleanup and monitoring.
          </p>

        </div>

      </section>


      {/* =================================================
          METRICS
      ================================================= */}

      <section className="analytics-metrics">

        <div className="metric-card">

          <span className="metric-label">
            Total Evaluations
          </span>

          <strong className="metric-value">
            {totalEvaluations}
          </strong>

          <span className="metric-description">
            Recorded evaluations
          </span>

        </div>


        <div className="metric-card">

          <span className="metric-label">
            Analytics Records
          </span>

          <strong className="metric-value">
            {filteredAnalytics.length}
          </strong>

          <span className="metric-description">
            Hourly records
          </span>

        </div>


        <div className="metric-card">

          <span className="metric-label">
            Flags Evaluated
          </span>

          <strong className="metric-value">
            {flagsWithEvaluations}
          </strong>

          <span className="metric-description">
            Flags with recorded activity
          </span>

        </div>

      </section>


      {/* =================================================
          EVALUATION CHART SECTION
      ================================================= */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <h2>
              Evaluation Count
            </h2>

            <p>
              Hourly evaluation activity for
              your feature flags.
            </p>

          </div>


          {/* FEATURE FLAG FILTER */}

          <div className="flag-filter">

            <label htmlFor="flagFilter">
              Feature Flag
            </label>

            <select
              id="flagFilter"
              value={selectedFlag}
              onChange={(event) =>
                setSelectedFlag(
                  event.target.value
                )
              }
            >

              <option value="all">
                All Flags
              </option>

              {uniqueFlags.map((flag) => (

                <option
                  key={flag.flag_id}
                  value={flag.flag_id}
                >
                  {flag.key}
                </option>

              ))}

            </select>

          </div>

        </div>


        {/* RECHART */}

        <div className="evaluation-chart">

          {chartData.length === 0 ? (

            <div className="no-analytics">

              <div>
                <i className="fas fa-chart-bar"></i>
              </div>

              <h3>
                No evaluation data available
              </h3>

              <p>
                Evaluate a feature flag to start
                collecting analytics data.
              </p>

            </div>

          ) : (

            <ResponsiveContainer
              width="100%"
              height={400}
            >

              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 10,
                  bottom: 20,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="hour"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  formatter={(value) => [
                    value,
                    "Evaluations",
                  ]}
                  labelFormatter={(label) =>
                    `Hour: ${label}`
                  }
                />

                <Bar
                  dataKey="evaluations"
                  name="Evaluations"
                  fill="#4f46e5"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                  barSize={50}
                />

              </BarChart>

            </ResponsiveContainer>

          )}

        </div>

      </section>


      {/* =================================================
          DATA EXPLANATION
      ================================================= */}

      <section className="analytics-explanation">

        <h2>
          How to read this chart
        </h2>

        <div className="explanation-grid">

          <div>

            <strong>
              High evaluation count
            </strong>

            <p>
              Indicates that the feature flag is
              actively being evaluated by your
              application.
            </p>

          </div>


          <div>

            <strong>
              Low evaluation count
            </strong>

            <p>
              May indicate that a feature is used
              less frequently or has limited traffic.
            </p>

          </div>


          <div>

            <strong>
              Unused flags
            </strong>

            <p>
              Flags with little or no evaluation
              activity can be candidates for cleanup.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

export default EvaluationAnalytics;