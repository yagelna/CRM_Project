export function showToast({
    title = "Notification",
    message = "",
    type = "info", // success | danger | warning | info
    delay = 8000,
    icon = null
  }) {
    const toastContainer = document.getElementById("toast-container");
  
    const toastEl = document.createElement("div");
    toastEl.className = `toast border-0 shadow-sm mb-2`;
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");
  
    const headerBg = {
      success: "bg-success text-white",
      danger: "bg-danger text-white",
      warning: "bg-warning text-dark",
      info: "bg-info text-dark"
    }[type] || "bg-light text-dark";
  
    const progressColor = {
      success: "bg-success",
      danger: "bg-danger",
      warning: "bg-warning",
      info: "bg-info"
    }[type] || "bg-secondary";
  
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
    toastEl.innerHTML = `
      <div class="toast-header ${headerBg}">
        ${icon ? `<span class="me-2">${icon}</span>` : ""}
        <strong class="me-auto">${title}</strong>
        <small>${time}</small>
        <button type="button" class="btn-close btn-close-white ms-2" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body bg-white text-dark">
        ${message}
        <div class="progress mt-3" style="height: 3px;">
          <div class="progress-bar ${progressColor}" role="progressbar" style="width: 100%; transition: width ${delay}ms linear;"></div>
        </div>
      </div>
    `;
  
    toastContainer.appendChild(toastEl);
  
    const toast = new bootstrap.Toast(toastEl, { delay });
    toast.show();
  
    // Start progress bar animation
    setTimeout(() => {
      const progressBar = toastEl.querySelector('.progress-bar');
      if (progressBar) progressBar.style.width = '0%';
    }, 100); // slight delay so it animates
  
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }