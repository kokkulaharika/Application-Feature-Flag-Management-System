import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api";

import AddTargetingRuleModel from "../components/AddTargetingRuleModel";
import EditTargetingRuleModel from "../components/EditTargetingRuleModel";
import TargetingRuleDetailsModal from "../components/TargetingRuleDetailsModal";

import "./Targeting.css";

function Targeting() {
  // =====================================================
  // STATE
  // =====================================================

  const [rules, setRules] = useState([]);
  const [flags, setFlags] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add rule modal
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);

  // View rule modal
  const [selectedRule, setSelectedRule] = useState(null);

  // Edit rule modal
  const [editingRule, setEditingRule] = useState(null);

  // Delete loading
  const [deletingRuleId, setDeletingRuleId] = useState(null);

  // =====================================================
  // OPERATOR DISPLAY
  // =====================================================

  const getOperatorSymbol = (operator) => {
    const operators = {
      equals: "=",
      not_equals: "!=",
      contains: "contains",
      starts_with: "starts with",
      ends_with: "ends with",
      in: "in",
      not_in: "not in",
      greater_than: ">",
      less_than: "<",
    };

    return operators[operator] || operator;
  };

  // =====================================================
  // LOAD TARGETING DATA
  // =====================================================

  const loadTargetingData = async () => {
    try {
      setError("");

      const [rulesResponse, flagsResponse] = await Promise.all([
        api.get("/targeting-rules"),
        api.get("/flags"),
      ]);

      const fetchedRules = Array.isArray(rulesResponse.data)
        ? rulesResponse.data
        : [];

      const fetchedFlags = Array.isArray(flagsResponse.data)
        ? flagsResponse.data
        : [];

      console.log("TARGETING RULES FROM API:", fetchedRules);
      console.log("FLAGS FROM API:", fetchedFlags);

      setRules(fetchedRules);
      setFlags(fetchedFlags);

      return fetchedRules;
    } catch (error) {
      console.error(
        "Failed to load targeting data:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.detail ||
          "Failed to load targeting rules."
      );

      return [];
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD DATA WHEN PAGE OPENS
  // =====================================================

  useEffect(() => {
    loadTargetingData();
  }, []);

  // =====================================================
  // GET FEATURE FLAG NAME
  // =====================================================

  const getFlagName = (flagId) => {
    const flag = flags.find(
      (item) =>
        Number(item.flag_id) === Number(flagId)
    );

    return flag ? flag.key : "Unknown Flag";
  };

  // =====================================================
  // DELETE TARGETING RULE
  // =====================================================

  const handleDelete = async (ruleId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this targeting rule?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingRuleId(ruleId);
      setError("");

      await api.delete(
        `/targeting-rules/${ruleId}`
      );

      // Immediately remove from UI
      setRules((previousRules) =>
        previousRules.filter(
          (rule) =>
            Number(rule.rule_id) !== Number(ruleId)
        )
      );

      // Close view modal if deleted rule was open
      if (
        selectedRule &&
        Number(selectedRule.rule_id) === Number(ruleId)
      ) {
        setSelectedRule(null);
      }

      console.log(
        "TARGETING RULE DELETED:",
        ruleId
      );
    } catch (error) {
      console.error(
        "Failed to delete targeting rule:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.detail ||
          "Failed to delete targeting rule."
      );
    } finally {
      setDeletingRuleId(null);
    }
  };

  // =====================================================
  // RULE UPDATED
  // =====================================================

  const handleRuleUpdated = async (updatedRule) => {
    console.log(
      "RULE UPDATED FROM MODAL:",
      updatedRule
    );

    // -----------------------------------------------------
    // STEP 1: Update UI immediately
    // -----------------------------------------------------

    setRules((previousRules) =>
      previousRules.map((rule) =>
        Number(rule.rule_id) ===
        Number(updatedRule.rule_id)
          ? {
              ...rule,
              ...updatedRule,
            }
          : rule
      )
    );

    // -----------------------------------------------------
    // STEP 2: Update selected rule if it is open
    // -----------------------------------------------------

    setSelectedRule((previousRule) => {
      if (
        previousRule &&
        Number(previousRule.rule_id) ===
          Number(updatedRule.rule_id)
      ) {
        return {
          ...previousRule,
          ...updatedRule,
        };
      }

      return previousRule;
    });

    // -----------------------------------------------------
    // STEP 3: Close edit modal
    // -----------------------------------------------------

    setEditingRule(null);

    // -----------------------------------------------------
    // STEP 4: Reload from backend
    // -----------------------------------------------------

    // This guarantees that the frontend
    // contains exactly what PostgreSQL has.
    await loadTargetingData();

    console.log(
      "TARGETING RULE LIST REFRESHED AFTER UPDATE"
    );
  };

  // =====================================================
  // RULE CREATED
  // =====================================================

  const handleRuleCreated = async () => {
    setShowAddRuleModal(false);

    await loadTargetingData();
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const handleEdit = (rule) => {
    console.log(
      "EDITING TARGETING RULE:",
      rule
    );

    setEditingRule({
      ...rule,
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="targeting-message">
        <div className="loader"></div>

        <p>
          Loading targeting rules...
        </p>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error && rules.length === 0) {
    return (
      <div className="targeting-message error-message">
        <p>{error}</p>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="targeting-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="targeting-header">

        <div>
          <h1>
            Targeting Rules
          </h1>

          <p>
            Control feature flag behavior for
            specific users and conditions.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="back-dashboard-button"
        >
          ← Dashboard
        </Link>

      </header>


      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (
        <div className="toggle-error-message">
          {error}
        </div>
      )}


      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="targeting-summary">

        <div className="targeting-summary-card">

          <div>
            <span>
              Total Rules
            </span>

            <strong>
              {rules.length}
            </strong>
          </div>

          <div className="targeting-summary-icon">
            T
          </div>

        </div>


        <div className="targeting-summary-card">

          <div>
            <span>
              Feature Flags
            </span>

            <strong>
              {flags.length}
            </strong>
          </div>

          <div className="targeting-summary-icon">
            F
          </div>

        </div>

      </section>


      {/* =================================================
          MAIN SECTION
      ================================================= */}

      <section className="targeting-section">

        <div className="section-header">

          <div>
            <h2>
              All Targeting Rules
            </h2>

            <p>
              Configure conditions that control
              feature flag targeting.
            </p>
          </div>


          <button
            type="button"
            className="add-rule-button"
            onClick={() =>
              setShowAddRuleModal(true)
            }
          >
            + Add Rule
          </button>

        </div>


        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {rules.length === 0 ? (

          <div className="targeting-empty-state">

            <div className="empty-targeting-icon">
              T
            </div>

            <h3>
              No targeting rules
            </h3>

            <p>
              Create your first targeting rule
              to control feature availability.
            </p>

            <button
              type="button"
              className="empty-add-rule-button"
              onClick={() =>
                setShowAddRuleModal(true)
              }
            >
              + Add Rule
            </button>

          </div>

        ) : (

          /* =================================================
             RULE GRID
          ================================================= */

          <div className="targeting-grid">

            {rules.map((rule, index) => {

              const ruleKey =
                rule.rule_id ??
                `${rule.flag_id}-${rule.attribute}-${rule.operator}-${rule.value}-${index}`;

              return (

                <div
                  className="targeting-card"
                  key={ruleKey}
                >

                  {/* =================================================
                      CARD HEADER
                  ================================================= */}

                  <div className="targeting-card-header">

                    <div className="targeting-icon">
                      T
                    </div>

                    <div>

                      <h3>
                        {getFlagName(
                          rule.flag_id
                        )}
                      </h3>

                      <span>
                        {rule.rule_id
                          ? `Rule #${rule.rule_id}`
                          : "New Rule"}
                      </span>

                    </div>

                  </div>


                  {/* =================================================
                      CONDITION
                  ================================================= */}

                  <div className="rule-condition">

                    <span className="condition-label">
                      Condition
                    </span>

                    <div className="condition-box">

                      <span className="attribute">
                        {rule.attribute}
                      </span>

                      <span className="operator">
                        {getOperatorSymbol(
                          rule.operator
                        )}
                      </span>

                      <span className="condition-value">
                        {rule.attribute ===
                        "rollout_percentage"
                          ? `${rule.value}%`
                          : rule.value}
                      </span>

                    </div>

                  </div>


                  {/* =================================================
                      DETAILS
                  ================================================= */}

                  <div className="rule-details">

                    <div className="rule-detail">

                      <span>
                        Flag ID
                      </span>

                      <strong>
                        #{rule.flag_id}
                      </strong>

                    </div>


                    <div className="rule-detail">

                      <span>
                        Status
                      </span>

                      <strong className="rule-active">

                        <span className="status-dot"></span>

                        Active

                      </strong>

                    </div>

                  </div>


                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <div className="targeting-card-footer">

                    {/* VIEW */}

                    <button
                      type="button"
                      className="view-rule-button"
                      onClick={() =>
                        setSelectedRule(rule)
                      }
                    >
                      View
                    </button>


                    {/* EDIT */}

                    <button
                      type="button"
                      className="edit-rule-button"
                      onClick={() =>
                        handleEdit(rule)
                      }
                    >
                      Edit
                    </button>


                    {/* DELETE */}

                    <button
                      type="button"
                      className="delete-rule-button"
                      onClick={() =>
                        handleDelete(
                          rule.rule_id
                        )
                      }
                      disabled={
                        deletingRuleId ===
                        rule.rule_id
                      }
                    >
                      {deletingRuleId ===
                      rule.rule_id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </section>


      {/* =================================================
          ADD RULE MODAL
      ================================================= */}

      {showAddRuleModal && (

        <AddTargetingRuleModel
          flags={flags}

          onClose={() =>
            setShowAddRuleModal(false)
          }

          onRuleCreated={
            handleRuleCreated
          }
        />

      )}


      {/* =================================================
          VIEW RULE MODAL
      ================================================= */}

      {selectedRule && (

        <TargetingRuleDetailsModal

          rule={selectedRule}

          flagName={getFlagName(
            selectedRule.flag_id
          )}

          onClose={() =>
            setSelectedRule(null)
          }

        />

      )}


      {/* =================================================
          EDIT RULE MODAL
      ================================================= */}

      {editingRule && (

        <EditTargetingRuleModel

          rule={editingRule}

          flags={flags}

          onClose={() =>
            setEditingRule(null)
          }

          onRuleUpdated={
            handleRuleUpdated
          }

        />

      )}

    </div>
  );
}

export default Targeting;