import { useEffect, useState } from "react";
import api from "../api";
import "./EditTargetingRuleModel.css";

function EditTargetingRuleModel({
  rule,
  flags,
  onClose,
  onRuleUpdated,
}) {

  // =====================================================
  // FORM DATA
  // =====================================================

  const [formData, setFormData] = useState({
    flag_id: rule.flag_id ?? "",
    attribute: rule.attribute ?? "",
    operator: rule.operator ?? "",
    value: rule.value ?? "",
  });


  // =====================================================
  // STATE
  // =====================================================

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  // =====================================================
  // UPDATE FORM WHEN RULE CHANGES
  // =====================================================

  useEffect(() => {

    setFormData({
      flag_id: rule.flag_id ?? "",
      attribute: rule.attribute ?? "",
      operator: rule.operator ?? "",
      value: rule.value ?? "",
    });

  }, [rule]);


  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (event) => {

    event.preventDefault();


    if (!rule?.rule_id) {

      setError(
        "Targeting rule ID is missing."
      );

      return;

    }


    try {

      setSaving(true);
      setError("");


      // =================================================
      // DATA SENT TO BACKEND
      // =================================================

      const updatedRule = {

        flag_id: Number(
          formData.flag_id
        ),

        attribute:
          formData.attribute.trim(),

        operator:
          formData.operator,

        value:
          String(formData.value).trim(),

      };


      console.log(
        "UPDATING TARGETING RULE:",
        rule.rule_id,
        updatedRule
      );


      // =================================================
      // UPDATE API
      // =================================================

      const response = await api.put(
        `/targeting-rules/${rule.rule_id}`,
        updatedRule
      );


      console.log(
        "TARGETING RULE UPDATED FROM API:",
        response.data
      );


      // =================================================
      // UPDATE PARENT IMMEDIATELY
      // =================================================

      if (onRuleUpdated) {

        onRuleUpdated(
          response.data
        );

      }


      // IMPORTANT:
      // Do NOT call onClose() here.
      // Parent handles closing after state update.

    } catch (error) {

      console.error(
        "Failed to update targeting rule:",
        error.response?.data ||
        error
      );


      setError(
        error.response?.data?.detail ||
        "Failed to update targeting rule."
      );

    } finally {

      setSaving(false);

    }

  };


  // =====================================================
  // MODAL
  // =====================================================

  return (

    <div className="edit-targeting-modal-overlay">

      <div className="edit-targeting-modal">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="edit-targeting-modal-header">

          <div>

            <span className="edit-targeting-modal-label">
              TARGETING RULE
            </span>

            <h2>
              Edit Targeting Rule
            </h2>

            <p>
              Update the conditions for this
              feature flag.
            </p>

          </div>


          <button
            type="button"
            className="edit-targeting-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="edit-targeting-form"
        >


          {/* =================================================
              FEATURE FLAG
          ================================================= */}

          <div className="edit-targeting-form-group">

            <label htmlFor="flag_id">
              Feature Flag
            </label>


            <select
              id="flag_id"
              name="flag_id"
              value={formData.flag_id}
              onChange={handleChange}
              required
            >

              <option value="">
                Select a feature flag
              </option>


              {flags.map((flag) => (

                <option
                  key={flag.flag_id}
                  value={flag.flag_id}
                >
                  {flag.key}
                </option>

              ))}

            </select>

          </div>


          {/* =================================================
              ATTRIBUTE
          ================================================= */}

          <div className="edit-targeting-form-group">

            <label htmlFor="attribute">
              Attribute
            </label>


            <input
              id="attribute"
              type="text"
              name="attribute"
              value={formData.attribute}
              onChange={handleChange}
              placeholder="Example: country"
              required
            />

          </div>


          {/* =================================================
              OPERATOR
          ================================================= */}

          <div className="edit-targeting-form-group">

            <label htmlFor="operator">
              Operator
            </label>


            <select
              id="operator"
              name="operator"
              value={formData.operator}
              onChange={handleChange}
              required
            >

              <option value="">
                Select an operator
              </option>

              <option value="equals">
                Equals
              </option>

              <option value="not_equals">
                Not Equals
              </option>

              <option value="contains">
                Contains
              </option>

              <option value="starts_with">
                Starts With
              </option>

              <option value="ends_with">
                Ends With
              </option>

              <option value="in">
                In
              </option>

              <option value="not_in">
                Not In
              </option>

              <option value="greater_than">
                Greater Than
              </option>

              <option value="less_than">
                Less Than
              </option>

            </select>

          </div>


          {/* =================================================
              VALUE
          ================================================= */}

          {formData.attribute === "rollout_percentage" ? (

            <div className="edit-targeting-form-group">

              <div className="rollout-slider-header">

                <label htmlFor="value">
                  Rollout Percentage
                </label>

                <span className="rollout-percentage-value">
                  {formData.value || 0}%
                </span>

              </div>


              <input
                id="value"
                type="range"
                name="value"
                min="0"
                max="100"
                step="1"
                value={
                  Number(formData.value) || 0
                }
                onChange={handleChange}
                className="rollout-percentage-slider"
              />


              <div className="rollout-slider-labels">

                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>

              </div>

            </div>

          ) : (

            <div className="edit-targeting-form-group">

              <label htmlFor="value">
                Value
              </label>


              <input
                id="value"
                type="text"
                name="value"
                value={formData.value}
                onChange={handleChange}
                placeholder="Example: India"
                required
              />

            </div>

          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="edit-targeting-form-error">
              {error}
            </div>

          )}


          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="edit-targeting-modal-actions">


            <button
              type="button"
              className="cancel-targeting-edit-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="save-targeting-edit-button"
              disabled={saving}
            >

              {saving
                ? "Saving..."
                : "Save Changes"}

            </button>


          </div>


        </form>

      </div>

    </div>

  );

}

export default EditTargetingRuleModel;