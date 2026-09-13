
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

import AddEnvironmentModel from "../components/AddEnvironmentModel";
import EditEnvironmentModel from "../components/EditEnvironmentModel";
import EnvironmentDetailsModal from "../components/EnvironmentDetailsModal";

import "./Environments.css";

function Environments() {
  // =====================================================
  // STATE
  // =====================================================

  // Store all environments returned from the backend
  const [environments, setEnvironments] = useState([]);

  // Store loading state
  const [loading, setLoading] = useState(true);

  // Store API error messages
  const [error, setError] = useState("");

  // Control Add Environment modal
  const [showAddEnvironmentModal, setShowAddEnvironmentModal] =
    useState(false);

  // Store environment selected for viewing
  const [selectedEnvironment, setSelectedEnvironment] =
    useState(null);

  // Store environment selected for editing
  const [editingEnvironment, setEditingEnvironment] =
    useState(null);


  // =====================================================
  // LOAD ENVIRONMENTS
  // =====================================================

  useEffect(() => {
    const loadEnvironments = async () => {
      try {
        setLoading(true);
        setError("");

        // GET /environments
        const response = await api.get("/environments");

        setEnvironments(response.data);

      } catch (error) {
        console.error(
          "Failed to load environments:",
          error
        );

        setError("Failed to load environments.");

      } finally {
        setLoading(false);
      }
    };

    loadEnvironments();
  }, []);


  // =====================================================
  // DELETE ENVIRONMENT
  // =====================================================

  const handleDelete = async (environmentId) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this environment?"
    );

    if (!confirmed) {
      return;
    }

    try {

      // DELETE /environments/{environment_id}
      await api.delete(
        `/environments/${environmentId}`
      );

      // Remove deleted environment from UI
      setEnvironments((previousEnvironments) =>
        previousEnvironments.filter(
          (environment) =>
            environment.environment_id !== environmentId
        )
      );

    } catch (error) {

      console.error(
        "Failed to delete environment:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Failed to delete environment."
      );
    }
  };


  // =====================================================
  // ENVIRONMENT UPDATED
  // =====================================================

  const handleEnvironmentUpdated = (updatedEnvironment) => {

    setEnvironments((previousEnvironments) =>
      previousEnvironments.map(
        (environment) =>
          environment.environment_id ===
          updatedEnvironment.environment_id
            ? updatedEnvironment
            : environment
      )
    );

    // Close Edit modal
    setEditingEnvironment(null);
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="environment-message">

        <div className="loader"></div>

        <p>
          Loading environments...
        </p>

      </div>
    );
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="environment-message error-message">

        <p>
          {error}
        </p>

      </div>
    );
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="environments-page">


      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <header className="environments-header">

        <div>

          <h1>
            Environments
          </h1>

          <p>
            Manage the environments where your feature
            flags are deployed.
          </p>

        </div>


        {/* Back to dashboard */}

        <Link
          to="/dashboard"
          className="back-dashboard-button"
        >
          ← Dashboard
        </Link>

      </header>


      {/* =================================================
          ENVIRONMENT SUMMARY
      ================================================= */}

      <section className="environment-summary">

        <div className="environment-summary-card">

          <div>

            <span>
              Total Environments
            </span>

            <strong>
              {environments.length}
            </strong>

          </div>

          <div className="summary-icon">
          </div>

        </div>

      </section>


      {/* =================================================
          ENVIRONMENT LIST
      ================================================= */}

      <section className="environments-section">

        <div className="section-header">

          <div>

            <h2>
              All Environments
            </h2>

            <p>
              Configure and manage your application
              environments.
            </p>

          </div>


          {/* Add Environment */}

          <button
            className="add-environment-button"
            onClick={() =>
              setShowAddEnvironmentModal(true)
            }
          >
            + Add Environment
          </button>

        </div>


        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {environments.length === 0 ? (

          <div className="environment-empty-state">

            <div className="empty-environment-icon">
            </div>

            <h3>
              No environments found
            </h3>

            <p>
              Create your first environment to get started.
            </p>

            <button
              className="empty-add-button"
              onClick={() =>
                setShowAddEnvironmentModal(true)
              }
            >
              + Add Environment
            </button>

          </div>

        ) : (

          /* =================================================
             ENVIRONMENT CARDS
          ================================================= */

          <div className="environments-grid">

            {environments.map((environment) => (

              <div
                className="environment-card"
                key={environment.environment_id}
              >


                {/* =================================================
                    CARD HEADER
                ================================================= */}

                <div className="environment-card-header">

                  <div className="environment-icon">
                    E
                  </div>

                  <div>

                    <h3>
                      {environment.name}
                    </h3>

                    <span>
                      Environment
                    </span>

                  </div>

                </div>


                {/* =================================================
                    DESCRIPTION
                ================================================= */}

                <p className="environment-description">

                  {environment.description ||
                    "No description provided."}

                </p>


                {/* =================================================
                    ENVIRONMENT DETAILS
                ================================================= */}

                <div className="environment-details">

                  <div className="environment-detail">

                    <span>
                      Environment ID
                    </span>

                    <strong>
                      #{environment.environment_id}
                    </strong>

                  </div>


                  <div className="environment-detail">

                    <span>
                      Status
                    </span>

                    <strong className="active-status">

                      <span className="status-dot"></span>

                      Active

                    </strong>

                  </div>

                </div>


                {/* =================================================
                    CARD FOOTER
                ================================================= */}

                <div className="environment-card-footer">


                  {/* VIEW */}

                  <button
                    type="button"
                    className="view-environment-button"
                    onClick={() =>
                      setSelectedEnvironment(environment)
                    }
                  >
                    View
                  </button>


                  {/* EDIT */}

                  <button
                    type="button"
                    className="edit-environment-button"
                    onClick={() =>
                      setEditingEnvironment(environment)
                    }
                  >
                    Edit
                  </button>


                  {/* DELETE */}

                  <button
                    type="button"
                    className="delete-environment-button"
                    onClick={() =>
                      handleDelete(
                        environment.environment_id
                      )
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>


      {/* =================================================
          ADD ENVIRONMENT MODAL
      ================================================= */}

      {showAddEnvironmentModal && (

        <AddEnvironmentModel

          onClose={() =>
            setShowAddEnvironmentModal(false)
          }

          onEnvironmentCreated={(newEnvironment) => {

            setEnvironments(
              (previousEnvironments) => [
                ...previousEnvironments,
                newEnvironment,
              ]
            );

            setShowAddEnvironmentModal(false);

          }}

        />

      )}


      {/* =================================================
          EDIT ENVIRONMENT MODAL
      ================================================= */}

      {editingEnvironment && (

        <EditEnvironmentModel

          environment={editingEnvironment}

          onClose={() =>
            setEditingEnvironment(null)
          }

          onEnvironmentUpdated={
            handleEnvironmentUpdated
          }

        />

      )}


      {/* =================================================
          ENVIRONMENT DETAILS MODAL
      ================================================= */}

      {selectedEnvironment && (

        <EnvironmentDetailsModal

          environment={selectedEnvironment}

          onClose={() =>
            setSelectedEnvironment(null)
          }

        />

      )}

    </div>
  );
}

export default Environments;

