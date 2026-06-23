(function attachDirectoryUtils(root) {
  const UNAVAILABLE_VALUES = new Set([
    "",
    "n/a",
    "na",
    "none",
    "not available",
    "not yet available",
    "not applicable",
    "null",
    "undefined",
  ]);

  function clean(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function normalizeStatus(value) {
    const normalized = clean(value).toLowerCase();
    if (!normalized) {
      return "Unknown";
    }

    const statusMap = new Map([
      ["active", "Active"],
      ["offline", "Offline"],
      ["in development", "In Development"],
      ["not yet started", "Not Yet Started"],
      ["not started", "Not Yet Started"],
      ["not yet available", "Not Yet Available"],
      ["n/a", "Not Available"],
      ["na", "Not Available"],
    ]);

    if (statusMap.has(normalized)) {
      return statusMap.get(normalized);
    }

    return normalized
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function isAvailableUrl(value) {
    const text = clean(value);
    if (UNAVAILABLE_VALUES.has(text.toLowerCase())) {
      return false;
    }

    return /^https?:\/\//i.test(text);
  }

  function searchableText(row) {
    return [
      row.state,
      row.apiType,
      row.status,
      row.vendor,
      row.productionUrl,
      row.capabilityStatementUrl,
      row.registrationInfo,
      row.developerSupport,
      row.sandboxUrl,
    ]
      .map(clean)
      .join(" ")
      .toLowerCase();
  }

  function filterEndpoints(rows, filters) {
    const query = clean(filters?.query).toLowerCase();
    const apiType = clean(filters?.apiType || "All");
    const status = clean(filters?.status || "All");
    const state = clean(filters?.state || "All");

    return rows.filter((row) => {
      if (query && !searchableText(row).includes(query)) {
        return false;
      }

      if (apiType !== "All" && row.apiType !== apiType) {
        return false;
      }

      if (status !== "All" && normalizeStatus(row.status) !== normalizeStatus(status)) {
        return false;
      }

      if (state !== "All" && row.state !== state) {
        return false;
      }

      return true;
    });
  }

  function validateUpdateRequest(data) {
    const errors = {};
    const email = clean(data?.submitterEmail);
    const summary = clean(data?.summary);

    if (!clean(data?.state)) {
      errors.state = "Select a state or territory.";
    }

    if (!clean(data?.updateType)) {
      errors.updateType = "Select the type of update.";
    }

    if (!email) {
      errors.submitterEmail = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.submitterEmail = "Enter an email address in the format name@example.com.";
    }

    if (summary.length < 10) {
      errors.summary = "Describe the requested change in at least 10 characters.";
    }

    return {
      errors,
      valid: Object.keys(errors).length === 0,
    };
  }

  const api = {
    filterEndpoints,
    isAvailableUrl,
    normalizeStatus,
    validateUpdateRequest,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.DirectoryUtils = api;
})(typeof window !== "undefined" ? window : globalThis);
