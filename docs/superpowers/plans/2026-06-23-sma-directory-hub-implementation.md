# SMA Directory Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved CMS Design System-inspired Directory Hub in the `smahoney10/SMA-Endpoint-Directory-staging` fork, using the new XLSX workbook as the canonical source and removing the legacy CSV.

**Architecture:** Keep the repository GitHub Pages-friendly with static HTML, CSS, and JavaScript. Preserve `SMAEndpointDirectory.xlsx` as the maintained source file, generate `assets/directory-data.js` from the workbook for browser performance, and make the UI derive provider-directory and endpoint records from that generated artifact.

**Tech Stack:** Static GitHub Pages, semantic HTML, CSS using CMS Design System-compatible tokens and patterns, vanilla JavaScript, Python/OpenPyXL for XLSX-to-JS data generation, Node's built-in test runner/assertions for utility tests.

---

## File Structure

- Replace: `SMAEndpointDirectory.xlsx` with `C:\Users\smahoney\Downloads\SMAEndpointDirectory.xlsx`.
- Delete: `SMAEndpointDirectory.csv`.
- Create: `index.html` for the Directory Hub app shell.
- Create: `styles.css` for CMS DS-inspired layout, responsive behavior, focus states, forms, and tables.
- Create: `assets/directory-utils.js` for normalization, filtering, status handling, and update-request validation.
- Generate: `assets/directory-data.js` from the workbook.
- Create: `app.js` for page state, rendering, search/filter behavior, detail panels, and form interactions.
- Create: `scripts/build-directory-data.py` to regenerate `assets/directory-data.js` from `SMAEndpointDirectory.xlsx`.
- Create: `tests/directory-utils.test.js` for utility behavior.
- Modify: `README.md` to document the new static site and XLSX source-of-truth.
- Modify: `state-medicaid-provider-directories.md` to point users to the new hub rather than maintaining a separate table.

## Task 1: Workbook Source Replacement

**Files:**
- Replace: `SMAEndpointDirectory.xlsx`
- Delete: `SMAEndpointDirectory.csv`

- [ ] **Step 1: Copy the new workbook into the repo**

Run:

```powershell
Copy-Item -LiteralPath 'C:\Users\smahoney\Downloads\SMAEndpointDirectory.xlsx' -Destination '.\SMAEndpointDirectory.xlsx' -Force
```

Expected: `SMAEndpointDirectory.xlsx` in the repo has the new 50-column `SMA Endpoint Directory ` sheet.

- [ ] **Step 2: Remove the CSV**

Run:

```powershell
git rm -- SMAEndpointDirectory.csv
```

Expected: Git records `SMAEndpointDirectory.csv` as deleted.

- [ ] **Step 3: Verify workbook shape**

Run:

```powershell
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -c "import openpyxl; wb=openpyxl.load_workbook('SMAEndpointDirectory.xlsx', read_only=True, data_only=True); ws=wb['SMA Endpoint Directory ']; print(ws.max_row, ws.max_column)"
```

Expected: `58 50`.

## Task 2: Test Directory Utilities First

**Files:**
- Create: `tests/directory-utils.test.js`
- Create later: `assets/directory-utils.js`

- [ ] **Step 1: Write failing tests**

Create `tests/directory-utils.test.js` with tests that require `../assets/directory-utils.js` and assert:

```js
const assert = require('node:assert/strict');
const {
  normalizeStatus,
  isAvailableUrl,
  filterEndpoints,
  validateUpdateRequest,
} = require('../assets/directory-utils.js');

assert.equal(normalizeStatus('Not yet started'), 'Not Yet Started');
assert.equal(isAvailableUrl('N/A'), false);
assert.equal(isAvailableUrl('https://example.test/fhir'), true);

const rows = [
  { state: 'Alabama', apiType: 'Patient Access', status: 'Active', vendor: 'Vendor A', productionUrl: 'https://one.test' },
  { state: 'Alaska', apiType: 'Prior Authorization', status: 'Not Yet Started', vendor: '', productionUrl: '' },
];

assert.deepEqual(filterEndpoints(rows, { query: 'alab', apiType: 'All', status: 'All' }).map((row) => row.state), ['Alabama']);
assert.deepEqual(filterEndpoints(rows, { query: '', apiType: 'Prior Authorization', status: 'All' }).map((row) => row.state), ['Alaska']);
assert.deepEqual(filterEndpoints(rows, { query: '', apiType: 'All', status: 'Active' }).map((row) => row.state), ['Alabama']);

const invalid = validateUpdateRequest({ state: '', updateType: '', submitterEmail: 'bad', summary: '' });
assert.equal(invalid.valid, false);
assert.ok(invalid.errors.state);
assert.ok(invalid.errors.submitterEmail);

const valid = validateUpdateRequest({
  state: 'Alabama',
  updateType: 'Patient Access endpoint',
  submitterEmail: 'person@example.com',
  summary: 'Update the Patient Access endpoint status.',
});
assert.equal(valid.valid, true);
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```powershell
node tests/directory-utils.test.js
```

Expected: FAIL because `assets/directory-utils.js` does not exist.

## Task 3: Implement Directory Utilities

**Files:**
- Create: `assets/directory-utils.js`
- Test: `tests/directory-utils.test.js`

- [ ] **Step 1: Implement utilities**

Create functions for `normalizeStatus`, `isAvailableUrl`, `filterEndpoints`, and `validateUpdateRequest`. Export them through `module.exports` for tests and attach them to `window.DirectoryUtils` for the browser.

- [ ] **Step 2: Run tests to verify GREEN**

Run:

```powershell
node tests/directory-utils.test.js
```

Expected: PASS.

## Task 4: Generate Static Data From XLSX

**Files:**
- Create: `scripts/build-directory-data.py`
- Generate: `assets/directory-data.js`

- [ ] **Step 1: Write generator**

Build records from sheet `SMA Endpoint Directory `, row 2 headers, and rows 3 onward. Emit:

```js
window.SMA_DIRECTORY_DATA = {
  generatedAt: "...",
  workbook: "SMAEndpointDirectory.xlsx",
  states: [],
  endpoints: [],
  summary: {}
};
```

- [ ] **Step 2: Run generator**

Run:

```powershell
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" scripts/build-directory-data.py
```

Expected: `assets/directory-data.js` is generated with state and endpoint arrays.

## Task 5: Build Static Directory Hub UI

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`
- Use: `assets/directory-data.js`
- Use: `assets/directory-utils.js`

- [ ] **Step 1: Build semantic page shell**

Include skip link, header/nav, main regions for overview, endpoint search, provider directories, submit updates, and resources.

- [ ] **Step 2: Build endpoint search**

Render filters for query, state, API type, and status. Render a semantic table and accessible record detail panel.

- [ ] **Step 3: Build provider directory search**

Render provider directory availability from `Provider Directory Website URL`, with unavailable rows kept visible.

- [ ] **Step 4: Build update request prototype**

Use a non-submitting form with validation, error summary, inline errors, review state, and confirmation state.

## Task 6: Documentation And Legacy Page Cleanup

**Files:**
- Modify: `README.md`
- Modify: `state-medicaid-provider-directories.md`

- [ ] **Step 1: Update README**

Document the hub, canonical XLSX source, generated JS data artifact, and regeneration command.

- [ ] **Step 2: Update provider-directory Markdown**

Replace the maintained table with a short pointer to `index.html#provider-directories` and note that data now comes from `SMAEndpointDirectory.xlsx`.

## Task 7: Verification

**Files:**
- All implementation files

- [ ] **Step 1: Run utility tests**

Run:

```powershell
node tests/directory-utils.test.js
```

Expected: PASS.

- [ ] **Step 2: Run static syntax checks**

Run:

```powershell
node --check app.js
node --check assets/directory-utils.js
node --check assets/directory-data.js
```

Expected: all exit 0.

- [ ] **Step 3: Run local static server and inspect**

Run:

```powershell
python -m http.server 8080
```

Open `http://localhost:8080/` and verify:

- Search filters update the endpoint table.
- Provider directory search works.
- Detail panel opens and closes by keyboard and pointer.
- Update form shows validation errors and confirmation.
- No visible horizontal overflow at mobile width.

- [ ] **Step 4: Accessibility smoke check**

Manual checks:

- Tab from the skip link through navigation, filters, tables, details, and form controls.
- Confirm visible focus for all interactive controls.
- Confirm one H1, ordered headings, landmarks, form labels, error summary, and scoped table headers.

## Task 8: Commit

**Files:**
- All staged implementation files

- [ ] **Step 1: Review diff**

Run:

```powershell
git status --short
git diff --stat
```

- [ ] **Step 2: Commit**

Run:

```powershell
git add .
git commit -m "Build XLSX-backed SMA directory hub"
```

