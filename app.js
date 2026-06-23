(function initDirectoryHub() {
  const data = window.SMA_DIRECTORY_DATA;
  const utils = window.DirectoryUtils;

  if (!data || !utils) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<div class="error-summary" role="alert"><h2>Directory data could not load</h2><p>Refresh the page or regenerate assets/directory-data.js from the workbook.</p></div>'
    );
    return;
  }

  const endpointFilters = {
    query: "",
    state: "All",
    apiType: "All",
    status: "All",
  };

  const providerFilters = {
    query: "",
    availability: "All",
  };

  const elements = {
    summaryStateCount: document.getElementById("summary-state-count"),
    summaryEndpointCount: document.getElementById("summary-endpoint-count"),
    summaryActiveCount: document.getElementById("summary-active-count"),
    endpointForm: document.getElementById("endpoint-filters"),
    endpointQuery: document.getElementById("endpoint-query"),
    endpointState: document.getElementById("endpoint-state"),
    endpointApiType: document.getElementById("endpoint-api-type"),
    endpointStatus: document.getElementById("endpoint-status"),
    endpointResultCount: document.getElementById("endpoint-result-count"),
    endpointTableBody: document.getElementById("endpoint-table-body"),
    clearEndpointFilters: document.getElementById("clear-endpoint-filters"),
    endpointDetail: document.getElementById("endpoint-detail"),
    endpointDetailTitle: document.getElementById("endpoint-detail-title"),
    endpointDetailContent: document.getElementById("endpoint-detail-content"),
    closeEndpointDetail: document.getElementById("close-endpoint-detail"),
    providerForm: document.getElementById("provider-filters"),
    providerQuery: document.getElementById("provider-query"),
    providerAvailability: document.getElementById("provider-availability"),
    providerResultCount: document.getElementById("provider-result-count"),
    providerTableBody: document.getElementById("provider-table-body"),
    providerDataNote: document.getElementById("provider-data-note"),
    clearProviderFilters: document.getElementById("clear-provider-filters"),
    updateForm: document.getElementById("update-form"),
    updateState: document.getElementById("update-state"),
    updateType: document.getElementById("update-type"),
    submitterEmail: document.getElementById("submitter-email"),
    updateSummary: document.getElementById("update-summary"),
    updateErrorSummary: document.getElementById("update-error-summary"),
    updateErrorList: document.getElementById("update-error-list"),
    updateReview: document.getElementById("update-review"),
    updateReviewList: document.getElementById("update-review-list"),
    confirmUpdate: document.getElementById("confirm-update"),
    editUpdate: document.getElementById("edit-update"),
    updateConfirmation: document.getElementById("update-confirmation"),
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }

  function setOptions(select, values, firstLabel) {
    select.innerHTML = [
      `<option value="All">${escapeHtml(firstLabel)}</option>`,
      ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`),
    ].join("");
  }

  function statusClass(status) {
    const normalized = utils.normalizeStatus(status).toLowerCase();
    if (normalized === "active") {
      return "status-active";
    }
    if (normalized.includes("development") || normalized.includes("started") || normalized === "unknown") {
      return "status-development";
    }
    if (normalized.includes("offline") || normalized.includes("available")) {
      return "status-offline";
    }
    return "status-unknown";
  }

  function linkList(urls, fallbackText) {
    const usableUrls = Array.isArray(urls) ? urls : [];
    if (!usableUrls.length) {
      return `<span class="muted">${escapeHtml(fallbackText || "Not available")}</span>`;
    }

    return `<ul class="plain-list">${usableUrls
      .map((url) => `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`)
      .join("")}</ul>`;
  }

  function firstUrlCell(endpoint) {
    if (!endpoint.productionUrls.length) {
      return '<span class="muted">Not available</span>';
    }

    const url = endpoint.productionUrls[0];
    const extra = endpoint.productionUrls.length > 1 ? ` <span class="muted">+${endpoint.productionUrls.length - 1} more</span>` : "";
    return `<a href="${escapeHtml(url)}">Open URL</a>${extra}`;
  }

  function renderSummary() {
    elements.summaryStateCount.textContent = data.summary.stateCount;
    elements.summaryEndpointCount.textContent = data.summary.endpointCount;
    elements.summaryActiveCount.textContent = data.summary.activeEndpointCount;
  }

  function populateControls() {
    setOptions(elements.endpointState, unique(data.states.map((state) => state.state)), "All states");
    setOptions(elements.endpointApiType, data.summary.apiTypes, "All API types");
    setOptions(elements.endpointStatus, unique(data.endpoints.map((endpoint) => utils.normalizeStatus(endpoint.status))), "All statuses");
    setOptions(elements.updateState, unique(data.states.map((state) => state.state)), "Select a state or territory");
    elements.updateState.querySelector('option[value="All"]').value = "";
  }

  function renderEndpoints() {
    const filtered = utils.filterEndpoints(data.endpoints, endpointFilters);
    const rows = filtered.slice(0, 100);
    const remaining = filtered.length - rows.length;

    elements.endpointResultCount.textContent = `${filtered.length} endpoint record${filtered.length === 1 ? "" : "s"} found${remaining > 0 ? `, showing first ${rows.length}` : ""}.`;

    if (!rows.length) {
      elements.endpointTableBody.innerHTML = '<tr><td colspan="6">No endpoint records match the selected filters.</td></tr>';
      return;
    }

    elements.endpointTableBody.innerHTML = rows
      .map(
        (endpoint) => `
          <tr>
            <td>${escapeHtml(endpoint.state)}</td>
            <td>${escapeHtml(endpoint.apiType)}</td>
            <td><span class="status ${statusClass(endpoint.status)}">${escapeHtml(utils.normalizeStatus(endpoint.status))}</span></td>
            <td class="url-cell">${firstUrlCell(endpoint)}</td>
            <td>${endpoint.vendor ? escapeHtml(endpoint.vendor) : '<span class="muted">Not listed</span>'}</td>
            <td><button class="button button-secondary compact" type="button" data-endpoint-id="${escapeHtml(endpoint.id)}">Details</button></td>
          </tr>
        `
      )
      .join("");
  }

  function renderEndpointDetail(endpoint) {
    elements.endpointDetailTitle.textContent = `${endpoint.state} ${endpoint.apiType}`;
    elements.endpointDetailContent.innerHTML = `
      <dl class="detail-grid">
        <dt>Status</dt>
        <dd><span class="status ${statusClass(endpoint.status)}">${escapeHtml(utils.normalizeStatus(endpoint.status))}</span></dd>
        <dt>Production URL</dt>
        <dd>${linkList(endpoint.productionUrls, endpoint.productionUrl || "Not available")}</dd>
        <dt>FHIR capability statement</dt>
        <dd>${linkList(endpoint.capabilityStatementUrls, endpoint.capabilityStatementUrl || "Not available")}</dd>
        <dt>Sandbox or test URL</dt>
        <dd>${linkList(endpoint.sandboxUrls, endpoint.sandboxUrl || "Not available")}</dd>
        <dt>Implementation date</dt>
        <dd>${escapeHtml(endpoint.implementationDate || "Not listed")}</dd>
        <dt>Expected implementation date</dt>
        <dd>${escapeHtml(endpoint.expectedImplementationDate || "Not listed")}</dd>
        <dt>Vendor</dt>
        <dd>${escapeHtml(endpoint.vendor || "Not listed")}</dd>
        <dt>API registration info</dt>
        <dd>${escapeHtml(endpoint.registrationInfo || "Not listed")}</dd>
        <dt>Developer support</dt>
        <dd>${escapeHtml(endpoint.developerSupport || "Not listed")}</dd>
        <dt>Information as of</dt>
        <dd>${escapeHtml(endpoint.informationAsOfDate || "Not listed")}</dd>
        <dt>Workbook row</dt>
        <dd>${escapeHtml(endpoint.sourceRow)}</dd>
      </dl>
    `;
    elements.endpointDetail.hidden = false;
    elements.endpointDetail.focus();
  }

  function filterProviderDirectories() {
    const query = providerFilters.query.toLowerCase();
    return data.states.filter((state) => {
      const matchesQuery = !query || state.state.toLowerCase().includes(query);
      const matchesAvailability =
        providerFilters.availability === "All" ||
        (providerFilters.availability === "Available" && state.providerDirectoryWebsiteAvailable) ||
        (providerFilters.availability === "Unavailable" && !state.providerDirectoryWebsiteAvailable);
      return matchesQuery && matchesAvailability;
    });
  }

  function providerUrlCell(state) {
    if (!state.providerDirectoryWebsiteAvailable) {
      return '<span class="status status-unavailable">Not populated in workbook</span>';
    }
    return `<a href="${escapeHtml(state.providerDirectoryWebsiteUrl)}">Open provider directory</a>`;
  }

  function renderProviderDirectories() {
    const filtered = filterProviderDirectories();
    const populatedCount = data.states.filter((state) => state.providerDirectoryWebsiteAvailable).length;
    elements.providerDataNote.textContent =
      populatedCount === 0
        ? "The current workbook has no populated provider directory website URLs."
        : `${populatedCount} provider directory website URLs are populated.`;
    elements.providerResultCount.textContent = `${filtered.length} state or territory record${filtered.length === 1 ? "" : "s"} found.`;

    if (!filtered.length) {
      elements.providerTableBody.innerHTML = '<tr><td colspan="4">No provider directory records match the selected filters.</td></tr>';
      return;
    }

    elements.providerTableBody.innerHTML = filtered
      .map(
        (state) => `
          <tr>
            <td>${escapeHtml(state.state)}</td>
            <td>${escapeHtml(state.informationAsOfDate || "Not listed")}</td>
            <td>${providerUrlCell(state)}</td>
            <td>${
              utils.isAvailableUrl(state.priorAuthorizationDecisionTimeframesUrl)
                ? `<a href="${escapeHtml(state.priorAuthorizationDecisionTimeframesUrl)}">Open timeframes page</a>`
                : '<span class="muted">Not listed</span>'
            }</td>
          </tr>
        `
      )
      .join("");
  }

  function clearErrorState() {
    elements.updateErrorSummary.hidden = true;
    elements.updateErrorList.innerHTML = "";

    ["state", "updateType", "submitterEmail", "summary"].forEach((name) => {
      const field = elements.updateForm.elements[name];
      const fieldWrap = field.closest(".field");
      const error = document.getElementById(`${field.id}-error`);
      field.removeAttribute("aria-invalid");
      fieldWrap.classList.remove("has-error");
      error.textContent = "";
    });
  }

  function showErrors(errors) {
    clearErrorState();
    const entries = Object.entries(errors);

    entries.forEach(([name, message]) => {
      const field = elements.updateForm.elements[name];
      const fieldWrap = field.closest(".field");
      const error = document.getElementById(`${field.id}-error`);
      field.setAttribute("aria-invalid", "true");
      fieldWrap.classList.add("has-error");
      error.textContent = message;
    });

    elements.updateErrorList.innerHTML = entries
      .map(([name, message]) => {
        const field = elements.updateForm.elements[name];
        return `<li><a href="#${escapeHtml(field.id)}">${escapeHtml(message)}</a></li>`;
      })
      .join("");
    elements.updateErrorSummary.hidden = false;
    elements.updateErrorSummary.focus();
  }

  function getUpdateFormData() {
    return {
      state: elements.updateState.value,
      updateType: elements.updateType.value,
      submitterEmail: elements.submitterEmail.value,
      summary: elements.updateSummary.value,
    };
  }

  function renderUpdateReview(formData) {
    elements.updateReviewList.innerHTML = `
      <dt>State or territory</dt>
      <dd>${escapeHtml(formData.state)}</dd>
      <dt>Update type</dt>
      <dd>${escapeHtml(formData.updateType)}</dd>
      <dt>Submitter email</dt>
      <dd>${escapeHtml(formData.submitterEmail)}</dd>
      <dt>Requested change</dt>
      <dd>${escapeHtml(formData.summary)}</dd>
    `;
    elements.updateReview.hidden = false;
    elements.updateConfirmation.hidden = true;
    elements.updateReview.scrollIntoView({ block: "start" });
  }

  function bindEvents() {
    elements.endpointForm.addEventListener("submit", (event) => {
      event.preventDefault();
      endpointFilters.query = elements.endpointQuery.value;
      endpointFilters.state = elements.endpointState.value;
      endpointFilters.apiType = elements.endpointApiType.value;
      endpointFilters.status = elements.endpointStatus.value;
      renderEndpoints();
    });

    [elements.endpointQuery, elements.endpointState, elements.endpointApiType, elements.endpointStatus].forEach((control) => {
      control.addEventListener("input", () => elements.endpointForm.requestSubmit());
      control.addEventListener("change", () => elements.endpointForm.requestSubmit());
    });

    elements.clearEndpointFilters.addEventListener("click", () => {
      elements.endpointQuery.value = "";
      elements.endpointState.value = "All";
      elements.endpointApiType.value = "All";
      elements.endpointStatus.value = "All";
      endpointFilters.query = "";
      endpointFilters.state = "All";
      endpointFilters.apiType = "All";
      endpointFilters.status = "All";
      elements.endpointDetail.hidden = true;
      renderEndpoints();
    });

    elements.endpointTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-endpoint-id]");
      if (!button) {
        return;
      }
      const endpoint = data.endpoints.find((item) => item.id === button.dataset.endpointId);
      if (endpoint) {
        renderEndpointDetail(endpoint);
      }
    });

    elements.closeEndpointDetail.addEventListener("click", () => {
      elements.endpointDetail.hidden = true;
    });

    elements.providerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      providerFilters.query = elements.providerQuery.value;
      providerFilters.availability = elements.providerAvailability.value;
      renderProviderDirectories();
    });

    [elements.providerQuery, elements.providerAvailability].forEach((control) => {
      control.addEventListener("input", () => elements.providerForm.requestSubmit());
      control.addEventListener("change", () => elements.providerForm.requestSubmit());
    });

    elements.clearProviderFilters.addEventListener("click", () => {
      elements.providerQuery.value = "";
      elements.providerAvailability.value = "All";
      providerFilters.query = "";
      providerFilters.availability = "All";
      renderProviderDirectories();
    });

    elements.updateForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = getUpdateFormData();
      const validation = utils.validateUpdateRequest(formData);

      if (!validation.valid) {
        showErrors(validation.errors);
        elements.updateReview.hidden = true;
        elements.updateConfirmation.hidden = true;
        return;
      }

      clearErrorState();
      renderUpdateReview(formData);
    });

    elements.editUpdate.addEventListener("click", () => {
      elements.updateReview.hidden = true;
      elements.updateForm.scrollIntoView({ block: "start" });
      elements.updateState.focus();
    });

    elements.confirmUpdate.addEventListener("click", () => {
      elements.updateReview.hidden = true;
      elements.updateConfirmation.hidden = false;
      elements.updateConfirmation.focus();
    });
  }

  renderSummary();
  populateControls();
  bindEvents();
  renderEndpoints();
  renderProviderDirectories();
})();
