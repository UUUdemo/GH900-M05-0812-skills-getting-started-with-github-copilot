document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML
        const participantsHtml = `
          <ul class="participants-list">
            ${details.participants
              .map(
                (p) =>
                  `<li class="participant-item"><span class="participant-email">${p}</span><button class="unregister-btn" data-activity="${encodeURIComponent(
                    name
                  )}" data-email="${encodeURIComponent(p)}" aria-label="Unregister ${p}">✖</button></li>`
              )
              .join("")}
          </ul>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            <strong>Participants:</strong>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Attach event listeners for unregister buttons
      document.querySelectorAll('.unregister-btn').forEach((btn) => {
        btn.addEventListener('click', async (event) => {
          const activity = decodeURIComponent(btn.getAttribute('data-activity'));
          const email = decodeURIComponent(btn.getAttribute('data-email'));

          try {
            const res = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, {
              method: 'DELETE',
            });

            const data = await res.json();
            if (res.ok) {
              showMessage(data.message, 'success');
              // Refresh activities list to reflect changes
              fetchActivities();
            } else {
              showMessage(data.detail || 'Failed to unregister participant', 'error');
            }
          } catch (err) {
            console.error('Error unregistering participant:', err);
            showMessage('Failed to unregister participant', 'error');
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Helper to show messages
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove('hidden');
    setTimeout(() => {
      messageDiv.classList.add('hidden');
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, 'success');
        signupForm.reset();
        // Refresh activities to show updated participants without page reload
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", 'error');
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", 'error');
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
