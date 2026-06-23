const assert = require("node:assert/strict");

const {
  filterEndpoints,
  isAvailableUrl,
  normalizeStatus,
  validateUpdateRequest,
} = require("../assets/directory-utils.js");

assert.equal(normalizeStatus("Not yet started"), "Not Yet Started");
assert.equal(normalizeStatus(" active "), "Active");
assert.equal(normalizeStatus(""), "Unknown");

assert.equal(isAvailableUrl("N/A"), false);
assert.equal(isAvailableUrl("Not Yet Available"), false);
assert.equal(isAvailableUrl("https://example.test/fhir"), true);

const rows = [
  {
    state: "Alabama",
    apiType: "Patient Access",
    status: "Active",
    vendor: "Vendor A",
    productionUrl: "https://one.test",
  },
  {
    state: "Alaska",
    apiType: "Prior Authorization",
    status: "Not Yet Started",
    vendor: "",
    productionUrl: "",
  },
];

assert.deepEqual(
  filterEndpoints(rows, { query: "alab", apiType: "All", status: "All" }).map((row) => row.state),
  ["Alabama"]
);

assert.deepEqual(
  filterEndpoints(rows, { query: "", apiType: "Prior Authorization", status: "All" }).map((row) => row.state),
  ["Alaska"]
);

assert.deepEqual(
  filterEndpoints(rows, { query: "", apiType: "All", status: "Active" }).map((row) => row.state),
  ["Alabama"]
);

const invalid = validateUpdateRequest({
  state: "",
  updateType: "",
  submitterEmail: "bad",
  summary: "",
});

assert.equal(invalid.valid, false);
assert.ok(invalid.errors.state);
assert.ok(invalid.errors.updateType);
assert.ok(invalid.errors.submitterEmail);
assert.ok(invalid.errors.summary);

const valid = validateUpdateRequest({
  state: "Alabama",
  updateType: "Patient Access endpoint",
  submitterEmail: "person@example.com",
  summary: "Update the Patient Access endpoint status.",
});

assert.equal(valid.valid, true);
assert.deepEqual(valid.errors, {});

console.log("directory-utils tests passed");
