import { useState } from "react";
import api from "../api";

import "./EditFlagModel.css";

function EditFlagModel({
  flag,
  environments,
  onClose,
  onFlagUpdated,
}) {

  // =====================================================
  // FORM DATA
  // =====================================================

  const [formData, setFormData] = useState({
    key: flag.key || "",
    type: flag.type || "boolean",
    default_value:
      flag.default_value !== null &&
      flag.default_value !== undefined
        ? String(flag.default_value)
        : "",
    enabled: Boolean(flag.enabled),
    description: flag.description || "",
    owner_team: flag.owner_team || "",
  });


  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // =====================================================
  // HANDLE ENABLED
  // =====================================================

  const handleEnabledChange = (event) => {

    setFormData((previous) => ({
      ...previous,
      enabled: event.target.checked,
    }));

  };


  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      setSaving(true);
      setError("");


      // =================================================
      // DATA SENT TO BACKEND
      // =================================================

      const updatedFlag = {

        key: formData.key,

        type: formData.type,

        default_value:
          formData.default_value !== ""
            ? String(formData.default_value)
            : null,

        enabled: formData.enabled,

        description: formData.description,

        owner_team: formData.owner_team,

      };


      // =================================================
      // UPDATE API
      // =================================================

      const response = await api.put(
        `/flags/${flag.flag_id}`,
        updatedFlag
      );


      // =================================================
      // SEND UPDATED FLAG TO PARENT
      // =================================================

      onFlagUpdated(response.data);

    } catch (error) {

      console.error(
        "Failed to update feature flag:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.detail ||
          "Failed to update feature flag."
      );

    } finally {

      setSaving(false);

    }

  };


  return (

    <div className="edit-flag-modal-overlay">

      <div className="edit-flag-modal">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="edit-flag-modal-header">

          <div>

            <h2>
              Edit Feature Flag
            </h2>

            <p>
              Update the configuration of this feature flag.
            </p>

          </div>


          <button
            type="button"
            className="edit-flag-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleSubmit}>


          {/* FLAG KEY */}

          <div className="edit-flag-form-group">

            <label htmlFor="flag-key">
              Flag Key
            </label>

            <input
              id="flag-key"
              type="text"
              name="key"
              value={formData.key}
              onChange={handleChange}
              required
            />

          </div>


          {/* TYPE */}

          <div className="edit-flag-form-group">

            <label htmlFor="flag-type">
              Type
            </label>

            <select
              id="flag-type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >

              <option value="boolean">
                Boolean
              </option>

              <option value="percentage">
                Percentage
              </option>

              <option value="string">
                String
              </option>

            </select>

          </div>


          {/* DEFAULT VALUE */}

          <div className="edit-flag-form-group">

            <label htmlFor="flag-default-value">
              Default Value
            </label>

            <input
              id="flag-default-value"
              type="text"
              name="default_value"
              value={formData.default_value}
              onChange={handleChange}
              placeholder="Enter default value"
            />

          </div>


          {/* DESCRIPTION */}

          <div className="edit-flag-form-group">

            <label htmlFor="flag-description">
              Description
            </label>

            <textarea
              id="flag-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter flag description"
              rows="3"
            />

          </div>


          {/* OWNER */}

          <div className="edit-flag-form-group">

            <label htmlFor="flag-owner">
              Owner Team
            </label>

            <input
              id="flag-owner"
              type="text"
              name="owner_team"
              value={formData.owner_team}
              onChange={handleChange}
              placeholder="Enter owner team"
            />

          </div>


          {/* ENABLED */}

          <div className="edit-flag-enabled-row">

            <div>

              <strong>
                Feature Flag Status
              </strong>

              <span>
                Enable or disable this flag.
              </span>

            </div>


            <label className="edit-flag-switch">

              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={handleEnabledChange}
              />

              <span className="edit-flag-slider"></span>

            </label>

          </div>


          {/* ERROR */}

          {error && (

            <div className="edit-flag-form-error">
              {error}
            </div>

          )}


          {/* ACTIONS */}

          <div className="edit-flag-modal-actions">

            <button
              type="button"
              className="cancel-edit-flag-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="save-edit-flag-button"
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

export default EditFlagModel;