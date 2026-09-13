
import { useState } from "react";
import api from "../api";

import "./EditEnvironmentModel.css";

function EditEnvironmentModel({
  environment,
  onClose,
  onEnvironmentUpdated,
}) {
  // =====================================================
  // FORM STATE
  // =====================================================

  const [formData, setFormData] = useState({
    name: environment.name || "",
    description: environment.description || "",
  });

  // Saving state
  const [saving, setSaving] = useState(false);

  // Error message
  const [error, setError] = useState("");


  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // =====================================================
  // UPDATE ENVIRONMENT
  // =====================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      setSaving(true);
      setError("");

      // PUT /environments/{environment_id}
      const response = await api.put(
        `/environments/${environment.environment_id}`,
        formData
      );

      // Send updated environment back to parent
      onEnvironmentUpdated(response.data);

    } catch (error) {

      console.error(
        "Failed to update environment:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.detail ||
          "Failed to update environment."
      );

    } finally {

      setSaving(false);

    }
  };


  // =====================================================
  // MODAL UI
  // =====================================================

  return (
    <div className="edit-modal-overlay">

      <div className="edit-modal">


        {/* =================================================
            MODAL HEADER
        ================================================= */}

        <div className="edit-modal-header">

          <div>

            <h2>
              Edit Environment
            </h2>

            <p>
              Update the environment details.
            </p>

          </div>


          <button
            type="button"
            className="edit-modal-close"
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


          {/* Environment Name */}

          <div className="edit-form-group">

            <label htmlFor="environment-name">
              Environment Name
            </label>

            <input
              id="environment-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter environment name"
              required
            />

          </div>


          {/* Description */}

          <div className="edit-form-group">

            <label htmlFor="environment-description">
              Description
            </label>

            <textarea
              id="environment-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter environment description"
              rows="4"
            />

          </div>


          {/* API ERROR */}

          {error && (

            <div className="edit-form-error">
              {error}
            </div>

          )}


          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="edit-modal-actions">

            <button
              type="button"
              className="cancel-edit-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-edit-button"
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

export default EditEnvironmentModel;
