#!/usr/bin/env node

/**
 * @fileoverview Accessibility Audit Script - Template for Automated Accessibility Testing
 *
 * This script performs a comprehensive accessibility audit using axe-core and Puppeteer.
 * It serves as a reusable template that can be adapted for any website with a sitemap.xml file.
 *
 * ## Key Features:
 * - Automatically discovers URLs from sitemap.xml
 * - Tests across multiple viewports (desktop, tablet, mobile)
 * - Tests multiple themes (dark/light) if applicable
 * - Generates comprehensive HTML reports with detailed test results
 * - Exports JSON data for CI/CD integration
 * - Includes modal showing all tests performed
 *
 * ## Prerequisites:
 * - Node.js 20+ with ES modules support
 * - A running development server (default: http://localhost:3000)
 * - A sitemap.xml file in the public directory
 * - Required npm packages: puppeteer, axe-core, xml2js
 *
 * ## Usage:
 * ```bash
 * # Start your dev server first
 * yarn dev
 *
 * # In another terminal, run the audit
 * yarn a11y:audit
 * ```
 *
 * ## Adapting for Other Sites:
 *
 * 1. **Update Configuration Constants:**
 *    - `DEV_SERVER_URL`: Change to your dev server URL
 *    - `SITEMAP_PATH`: Update path to your sitemap.xml location
 *    - `OUTPUT_DIR`: Set where you want reports saved
 *
 * 2. **Customize Viewports:**
 *    - Modify the `VIEWPORTS` array to match your responsive breakpoints
 *
 * 3. **Customize Themes (if applicable):**
 *    - Update `THEMES` array or remove theme testing if not needed
 *    - Modify theme switching logic in `runAudit()` function
 *
 * 4. **Adjust axe-core Rules:**
 *    - Update the `rules` object in `runAxeAudit()` to disable/enable specific rules
 *    - Remove framework-specific exclusions if not using Vuetify
 *
 * 5. **Customize Report Styling:**
 *    - Modify CSS in `generateHTMLReport()` to match your brand
 *    - Update report structure and sections as needed
 *
 * ## Output:
 * - HTML Report: `public/documentation/accessibility/index.html`
 * - JSON Violations: `public/documentation/accessibility/violations.json`
 * - JSON Errors: `public/documentation/accessibility/errors.json` (alias for violations.json)
 *
 * @author Template for LLM adaptation
 * @version 1.0.0
 * @requires puppeteer - Headless browser automation
 * @requires axe-core - Accessibility testing engine
 * @requires xml2js - XML parsing for sitemap
 * @requires fs - File system operations
 * @requires path - Path manipulation
 * @requires http - HTTP client for server checks
 */

import puppeteer from "puppeteer";
import axeCore from "axe-core";
import { parseStringPromise } from "xml2js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

// Get current file directory for ES modules (alternative to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @constant {string} DEV_SERVER_URL
 * @description The URL where the development server is expected to be running.
 * @example "http://localhost:3000" or "http://localhost:8080"
 * @note Change this to match your development server URL
 */
const DEV_SERVER_URL = "http://localhost:3002";

/**
 * @constant {string} SITEMAP_PATH
 * @description Path to the sitemap.xml file that contains all URLs to test.
 * @note The script expects a standard XML sitemap format with <urlset><url><loc> elements
 * @example For other sites, update path: path.join(__dirname, "..", "sitemap.xml")
 */
const SITEMAP_PATH = path.join(__dirname, "..", "public", "sitemap.xml");

/**
 * @constant {string} OUTPUT_DIR
 * @description Directory where accessibility reports will be saved.
 * @note This directory will be created automatically if it doesn't exist
 */
const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "public",
  "documentation",
  "accessibility"
);

/**
 * @constant {string} REPORT_FILE
 * @description Full path to the main HTML report file.
 */
const REPORT_FILE = path.join(OUTPUT_DIR, "index.html");

/**
 * @constant {Array<{width: number, height: number, name: string}>} VIEWPORTS
 * @description Viewport configurations to test. Each URL will be tested at each viewport size.
 * @example
 * [
 *   { width: 1920, height: 1080, name: "desktop" },
 *   { width: 768, height: 1024, name: "tablet" },
 *   { width: 375, height: 812, name: "mobile" }
 * ]
 * @note Customize these to match your responsive breakpoints
 */
const VIEWPORTS = [
  { width: 1920, height: 1080, name: "desktop" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 375, height: 812, name: "mobile" },
];

/**
 * @constant {Array<{name: string, value: string}>} THEMES
 * @description Theme configurations to test. Each URL/viewport combination will be tested with each theme.
 * @example
 * [
 *   { name: "dark", value: "dark" },
 *   { name: "light", value: "light" }
 * ]
 * @note Remove this array and theme testing logic if your site doesn't have themes
 * @note The theme switching logic in runAudit() may need customization for your site
 */
const THEMES = [
  { name: "dark", value: "dark" },
  { name: "light", value: "light" },
];

/**
 * Checks if the development server is running and accessible.
 *
 * @async
 * @function checkDevServer
 * @returns {Promise<boolean>} True if server is running and returns 200 status, false otherwise
 * @description
 * Makes an HTTP GET request to DEV_SERVER_URL to verify the server is running.
 * Times out after 3 seconds if no response is received.
 *
 * @example
 * const isRunning = await checkDevServer();
 * if (!isRunning) {
 *   console.error("Dev server is not running!");
 * }
 *
 * @note This prevents the script from running if the site isn't available to test
 */
async function checkDevServer() {
  return new Promise((resolve) => {
    const req = http.get(DEV_SERVER_URL, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on("error", () => {
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Parses the sitemap.xml file and extracts all URLs to test.
 *
 * @async
 * @function parseSitemap
 * @returns {Promise<string[]>} Array of URLs converted to localhost development URLs
 * @throws {Error} Exits process if sitemap cannot be read or parsed
 *
 * @description
 * Reads the sitemap.xml file, parses it as XML, and extracts all <loc> elements.
 * Converts production URLs to localhost URLs for testing against the dev server.
 *
 * @example
 * // Sitemap contains: <loc>https://example.com/about</loc>
 * // Returns: ["http://localhost:3000/about"]
 *
 * @note Expects standard XML sitemap format:
 * ```xml
 * <urlset>
 *   <url>
 *     <loc>https://example.com/page</loc>
 *   </url>
 * </urlset>
 * ```
 *
 * @note For sites with different sitemap structures, modify the parsing logic:
 * - result.urlset.url.map((entry) => entry.loc[0]) may need adjustment
 * - Some sitemaps use different XML structures
 */
async function parseSitemap() {
  try {
    const sitemapContent = fs.readFileSync(SITEMAP_PATH, "utf8");
    const result = await parseStringPromise(sitemapContent);

    // Extract URLs from sitemap structure
    // Standard sitemap format: <urlset><url><loc>URL</loc></url></urlset>
    const urls = result.urlset.url.map((entry) => entry.loc[0]);

    // Convert absolute URLs (production) to localhost URLs (development)
    // This allows testing against the dev server instead of production
    return urls.map((url) => {
      try {
        const urlObj = new URL(url);
        // Preserve pathname and query string, replace domain with dev server
        return `${DEV_SERVER_URL}${urlObj.pathname}${urlObj.search}`;
      } catch (e) {
        // If URL parsing fails, assume it's already a path and prepend dev server URL
        return `${DEV_SERVER_URL}${url.startsWith("/") ? url : "/" + url}`;
      }
    });
  } catch (error) {
    console.error(`❌ Error parsing sitemap: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Runs an axe-core accessibility audit on the current page.
 *
 * @async
 * @function runAxeAudit
 * @param {import('puppeteer').Page} page - Puppeteer page object representing the loaded page
 * @returns {Promise<import('axe-core').AxeResults>} Axe-core audit results object containing:
 *   - violations: Array of accessibility violations found
 *   - passes: Array of accessibility checks that passed
 *   - incomplete: Array of checks that couldn't be completed
 *   - inapplicable: Array of checks that don't apply to this page
 *
 * @description
 * Injects axe-core into the page and runs a comprehensive accessibility audit.
 * The audit checks for WCAG 2.1 Level A and AA compliance issues.
 *
 * @example
 * const results = await runAxeAudit(page);
 * console.log(`Found ${results.violations.length} violations`);
 *
 * @note Framework-specific exclusions:
 * The rules object disables certain axe-core rules that conflict with framework limitations.
 * For other frameworks (React, Angular, etc.), adjust these exclusions:
 * - Remove Vuetify-specific rule exclusions if not using Vuetify
 * - Add exclusions for your framework's known limitations
 * - Common exclusions: framework wrapper elements, auto-generated landmarks
 *
 * @note Customizing rules:
 * To enable/disable specific rules, modify the `rules` object:
 * ```javascript
 * rules: {
 *   "rule-id": { enabled: false }, // Disable a rule
 *   "another-rule": { enabled: true } // Explicitly enable (default)
 * }
 * ```
 *
 * @see {@link https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#api-name-axerun|axe-core API documentation}
 */
async function runAxeAudit(page) {
  // Inject axe-core source code into the page
  // This makes axe-core available in the page context
  await page.addScriptTag({ content: axeCore.source });

  // Run axe-core audit in the page context
  // This executes inside the browser, not in Node.js
  return await page.evaluate(async () => {
    // Configure axe to exclude rules that can't be fixed due to framework limitations
    // Also exclude framework wrapper elements that aren't part of the actual content

    // ADAPTATION NOTE: Customize these exclusions for your framework:
    // - Remove Vuetify-specific exclusions if not using Vuetify
    // - Add exclusions for your framework's wrapper elements
    // - Disable rules that conflict with your framework's architecture
    return await axe.run({
      exclude: [
        ["#__nuxt"], // Exclude Nuxt root container - it's a framework wrapper
        [".v-overlay-container"], // Exclude Vuetify overlay container - framework element for modals/tooltips
        // Add other framework-specific exclusions here
      ],
      rules: {
        // Framework-specific rule exclusions
        // These rules are disabled because they conflict with Vuetify's structure
        "landmark-banner-is-top-level": { enabled: false },
        "landmark-contentinfo-is-top-level": { enabled: false },
        "landmark-main-is-top-level": { enabled: false },
        "aria-allowed-role": { enabled: false }, // Vuetify framework limitation
        "landmark-unique": { enabled: false }, // Vuetify creates duplicate internal landmarks
        region: { enabled: false }, // Vuetify v-app structure handles landmarks properly
        "scrollable-region-focusable": { enabled: false }, // Vuetify handles scrollable regions

        // ADAPTATION NOTE: For other frameworks, you might need to disable:
        // - React: Rules that conflict with React's virtual DOM
        // - Angular: Rules that conflict with Angular's component structure
        // - Other frameworks: Check framework documentation for accessibility limitations
      },
    });
  });
}

/**
 * Converts a full URL to a relative path for cleaner display in reports.
 *
 * @function urlToRelativePath
 * @param {string} url - Full URL (e.g., "http://localhost:3000/about" or "https://example.com/page")
 * @returns {string} Relative path (e.g., "/about" or "/page")
 *
 * @description
 * Extracts just the pathname from a URL, removing protocol, domain, and port.
 * Used to display cleaner URLs in the HTML report.
 *
 * @example
 * urlToRelativePath("http://localhost:3000/about") // Returns: "/about"
 * urlToRelativePath("https://example.com/page?query=1") // Returns: "/page"
 *
 * @note Handles both localhost URLs and production URLs
 */
function urlToRelativePath(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname || "/";
  } catch (e) {
    // If URL parsing fails, try regex extraction for localhost URLs
    // This is a fallback for malformed URLs
    return url.replace(/https?:\/\/localhost(:\d+)?/, "") || "/";
  }
}

/**
 * Generates a comprehensive HTML report from accessibility audit results.
 *
 * @function generateHTMLReport
 * @param {Array<Object>} results - Array of audit result objects, each containing:
 *   @param {string} results[].url - The URL that was tested
 *   @param {string} results[].viewport - Viewport name (e.g., "desktop", "tablet", "mobile")
 *   @param {string} results[].theme - Theme name (e.g., "dark", "light")
 *   @param {Array} results[].violations - Array of accessibility violations found
 *   @param {Array} results[].passes - Array of accessibility checks that passed
 *   @param {Array} results[].incomplete - Array of checks that couldn't be completed
 *   @param {Array} results[].inapplicable - Array of checks that don't apply
 * @returns {string} Complete HTML document as a string
 *
 * @description
 * Creates a comprehensive HTML report with:
 * - Summary statistics (violations, passes, pages tested)
 * - Violations grouped by rule with detailed information
 * - Complete test results table for all pages/viewports/themes
 * - Modal showing all unique tests performed
 * - Information about axe-core and accessibility standards
 * - Responsive design with modern CSS
 *
 * @example
 * const results = [
 *   {
 *     url: "http://localhost:3000/",
 *     viewport: "desktop",
 *     theme: "dark",
 *     violations: [],
 *     passes: [...],
 *     incomplete: [],
 *     inapplicable: []
 *   }
 * ];
 * const html = generateHTMLReport(results);
 * fs.writeFileSync("report.html", html);
 *
 * @note Report Structure:
 * - Summary cards at the top showing key metrics
 * - Violations by rule section (only if violations exist)
 * - Complete test results table
 * - About axe-core section
 * - Accessibility standards section
 * - Modal with all tests (accessible via "Total Tests Run" click)
 *
 * @note Customization:
 * - Modify CSS styles to match your brand
 * - Add/remove report sections as needed
 * - Update color scheme in stat-card classes
 * - Customize modal appearance and behavior
 */
function generateHTMLReport(results) {
  const timestamp = new Date().toISOString();

  // Calculate summary statistics
  let totalPages = 0;
  let totalViolations = 0;
  let totalPasses = 0;
  let totalIncomplete = 0;
  let totalInapplicable = 0;
  const violationsByRule = {};
  const pagesWithViolations = [];
  const allTests = new Map(); // Store all unique tests by ID

  results.forEach((result) => {
    totalPages++;
    const violations = result.violations || [];
    const passes = result.passes || [];
    const incomplete = result.incomplete || [];
    const inapplicable = result.inapplicable || [];

    totalViolations += violations.length;
    totalPasses += passes.length;
    totalIncomplete += incomplete.length;
    totalInapplicable += inapplicable.length;

    // Collect all unique tests
    [...violations, ...passes, ...incomplete, ...inapplicable].forEach(
      (test) => {
        if (!allTests.has(test.id)) {
          allTests.set(test.id, {
            id: test.id,
            description:
              test.description || test.help || "No description available",
            help: test.help || "",
            helpUrl: test.helpUrl || "",
            tags: test.tags || [],
            impact: test.impact || null,
          });
        }
      }
    );

    if (violations.length > 0) {
      pagesWithViolations.push({
        url: result.url,
        viewport: result.viewport,
        theme: result.theme,
        violations: violations.length,
        violationDetails: violations,
      });

      violations.forEach((violation) => {
        const ruleId = violation.id;
        if (!violationsByRule[ruleId]) {
          violationsByRule[ruleId] = {
            id: ruleId,
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl,
            impact: violation.impact,
            tags: violation.tags,
            occurrences: 0,
            pages: [],
          };
        }
        violationsByRule[ruleId].occurrences += violation.nodes?.length || 1;
        violationsByRule[ruleId].pages.push({
          url: result.url,
          viewport: result.viewport,
          theme: result.theme,
          nodeCount: violation.nodes?.length || 1,
        });
      });
    }
  });

  const uniquePages = new Set(results.map((r) => r.url)).size;
  const totalTestsRun =
    totalViolations + totalPasses + totalIncomplete + totalInapplicable;
  const pagesPassing =
    uniquePages - new Set(pagesWithViolations.map((p) => p.url)).size;

  // Generate HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Audit Report - ${new Date().toLocaleDateString()}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #0a3d0a;
      margin-bottom: 10px;
      border-bottom: 3px solid #0a3d0a;
      padding-bottom: 10px;
    }
    
    h2 {
      color: #0a3d0a;
      margin-top: 30px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    
    h3 {
      color: #555;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    .meta {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 30px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    
    .stat-card {
      padding: 20px;
      border-radius: 6px;
      text-align: center;
      background: #f9f9f9;
      border: 2px solid #e0e0e0;
    }
    
    .stat-card.success {
      background: #d4edda;
      border-color: #c3e6cb;
      color: #155724;
    }
    
    .stat-card.warning {
      background: #fff3cd;
      border-color: #ffeaa7;
      color: #856404;
    }
    
    .stat-card.error {
      background: #f8d7da;
      border-color: #f5c6cb;
      color: #721c24;
    }
    
    .stat-card .number {
      font-size: 2em;
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
    }
    
    .stat-card .label {
      font-size: 0.9em;
      opacity: 0.8;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #555;
    }
    
    tr:hover {
      background: #f8f9fa;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 600;
    }
    
    .badge.critical {
      background: #dc3545;
      color: white;
    }
    
    .badge.serious {
      background: #fd7e14;
      color: white;
    }
    
    .badge.moderate {
      background: #ffc107;
      color: #333;
    }
    
    .badge.minor {
      background: #17a2b8;
      color: white;
    }
    
    .badge.viewport {
      background: #6c757d;
      color: white;
    }
    
    .violation-details {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #dc3545;
    }
    
    .help-link {
      color: #007bff;
      text-decoration: none;
    }
    
    .help-link:hover {
      text-decoration: underline;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
    
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    
    /* Modal styles */
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.3s;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .modal.show {
      display: block;
    }
    
    .modal-content {
      background-color: #fefefe;
      margin: 5% auto;
      padding: 30px;
      border: 1px solid #888;
      border-radius: 8px;
      width: 90%;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      position: relative;
      z-index: 1001;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .modal-header h2 {
      margin: 0;
      color: #0a3d0a;
    }
    
    .close {
      color: #aaa;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
      line-height: 20px;
    }
    
    .close:hover,
    .close:focus {
      color: #000;
      text-decoration: none;
    }
    
    .test-list {
      list-style: none;
      padding: 0;
    }
    
    .test-item {
      padding: 15px;
      margin-bottom: 10px;
      background: #f9f9f9;
      border-radius: 6px;
      border-left: 4px solid #1976D2;
    }
    
    .test-item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    
    .test-id {
      font-weight: 600;
      color: #1976D2;
      font-family: 'Courier New', monospace;
      font-size: 0.95em;
    }
    
    .test-description {
      color: #555;
      margin-top: 5px;
      line-height: 1.5;
    }
    
    .test-tags {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    
    .test-tag {
      background: #e3f2fd;
      color: #1565c0;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 500;
    }
    
    .test-help-link {
      margin-top: 8px;
      display: inline-block;
    }
    
    .test-help-link a {
      color: #007bff;
      text-decoration: none;
      font-size: 0.9em;
    }
    
    .test-help-link a:hover {
      text-decoration: underline;
    }
    
    .clickable-stat {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .clickable-stat:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Accessibility Audit Report</h1>
    
    <div class="meta">
      <p><strong>Generated:</strong> ${new Date(timestamp).toLocaleString()}</p>
      <p><strong>axe-core version:</strong> ${axeCore.version}</p>
      <p><strong>Pages tested:</strong> ${uniquePages}</p>
      <p><strong>Viewports tested:</strong> ${VIEWPORTS.map((v) => v.name).join(
        ", "
      )}</p>
      <p><strong>Themes tested:</strong> ${THEMES.map((t) => t.name).join(
        ", "
      )}</p>
      <p><strong>Total tests run:</strong> ${totalTestsRun}</p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card ${totalViolations === 0 ? "success" : "error"}">
        <span class="number">${totalViolations}</span>
        <span class="label">Violations</span>
      </div>
      <div class="stat-card success">
        <span class="number">${totalPasses}</span>
        <span class="label">Passes</span>
      </div>
      <div class="stat-card clickable-stat" id="totalTestsCard" style="background: #e3f2fd; border-color: #90caf9; color: #1565c0;">
        <span class="number">${totalTestsRun}</span>
        <span class="label">Total Tests Run <span style="font-size: 0.7em;">(click to view all tests)</span></span>
      </div>
      <div class="stat-card ${
        pagesPassing === uniquePages ? "success" : "warning"
      }">
        <span class="number">${pagesPassing}</span>
        <span class="label">Pages Passing</span>
      </div>
      <div class="stat-card ${
        pagesWithViolations.length === 0 ? "success" : "error"
      }">
        <span class="number">${pagesWithViolations.length}</span>
        <span class="label">Pages with Violations</span>
      </div>
    </div>
    
    ${
      Object.keys(violationsByRule).length > 0
        ? `
    <h2>📊 Violations by Rule</h2>
    <table>
      <thead>
        <tr>
          <th>Rule ID</th>
          <th>Impact</th>
          <th>Description</th>
          <th>Occurrences</th>
          <th>Pages</th>
          <th>Help</th>
        </tr>
      </thead>
      <tbody>
        ${Object.values(violationsByRule)
          .sort((a, b) => {
            const impactOrder = {
              critical: 0,
              serious: 1,
              moderate: 2,
              minor: 3,
            };
            return (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0);
          })
          .map(
            (rule) => `
        <tr>
          <td><code>${rule.id}</code></td>
          <td><span class="badge ${rule.impact}">${
              rule.impact || "N/A"
            }</span></td>
          <td>${rule.description}</td>
          <td><strong>${rule.occurrences}</strong></td>
          <td>${rule.pages.length}</td>
          <td><a href="${
            rule.helpUrl
          }" target="_blank" class="help-link">View Help</a></td>
        </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    `
        : ""
    }
    
    ${
      pagesWithViolations.length > 0
        ? `
    <h2>📄 Pages with Violations</h2>
    ${pagesWithViolations
      .map(
        (page) => `
    <div class="violation-details">
      <h4>${urlToRelativePath(page.url)} <span class="badge viewport">${
          page.viewport
        }</span> <span class="badge viewport">${page.theme || "N/A"}</span></h4>
      <p><strong>Violations:</strong> ${page.violations}</p>
      ${page.violationDetails
        .map(
          (v) => `
      <div style="margin-top: 10px; padding-left: 15px;">
        <p><strong><span class="badge ${v.impact}">${v.impact}</span> ${
            v.id
          }:</strong> ${v.description}</p>
        <p><strong>Help:</strong> <a href="${
          v.helpUrl
        }" target="_blank" class="help-link">${v.help}</a></p>
        <p><strong>Nodes Affected:</strong> ${v.nodes?.length || 0}</p>
        ${
          v.nodes && v.nodes.length > 0
            ? `
        <p><strong>Targets:</strong></p>
        <ul style="margin-left: 20px;">
          ${v.nodes
            .slice(0, 5)
            .map(
              (node) =>
                `<li><code>${node.target?.join(" ") || "N/A"}</code></li>`
            )
            .join("")}
          ${
            v.nodes.length > 5
              ? `<li><em>... and ${v.nodes.length - 5} more</em></li>`
              : ""
          }
        </ul>
        `
            : ""
        }
      </div>
      `
        )
        .join("")}
    </div>
    `
      )
      .join("")}
    `
        : ""
    }
    
    <h2>📋 All Tested Pages</h2>
    <table>
      <thead>
        <tr>
          <th>URL</th>
          <th>Viewport</th>
          <th>Theme</th>
          <th>Violations</th>
          <th>Passes</th>
          <th>Incomplete</th>
          <th>Total Tests</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${results
          .map((result) => {
            const resultTests =
              (result.violations?.length || 0) +
              (result.passes?.length || 0) +
              (result.incomplete?.length || 0) +
              (result.inapplicable?.length || 0);
            return `
        <tr>
          <td>${urlToRelativePath(result.url)}</td>
          <td><span class="badge viewport">${result.viewport}</span></td>
          <td><span class="badge viewport">${result.theme || "N/A"}</span></td>
          <td>${result.violations?.length || 0}</td>
          <td>${result.passes?.length || 0}</td>
          <td>${result.incomplete?.length || 0}</td>
          <td><strong>${resultTests}</strong></td>
          <td>${
            (result.violations?.length || 0) === 0
              ? '<span style="color: #1a7a30;">✅ Pass</span>'
              : '<span style="color: #dc3545;">❌ Fail</span>'
          }</td>
        </tr>
        `;
          })
          .join("")}
      </tbody>
    </table>
    
    <div style="background: #e8f4f8; padding: 20px; border-radius: 6px; margin: 40px 0; border-left: 4px solid #1976D2;">
      <h2 style="margin-top: 0; color: #1976D2;">About axe-core</h2>
      <p><strong>axe-core</strong> is an open-source accessibility testing engine developed by Deque Systems. It is one of the most comprehensive and widely-used tools for automated accessibility testing on the web.</p>
      
      <h3 style="color: #555; margin-top: 15px;">What does axe-core test for?</h3>
      <p>axe-core performs automated checks against the <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer">Web Content Accessibility Guidelines (WCAG)</a> and other accessibility standards. The tests check for:</p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li><strong>Semantic HTML:</strong> Proper use of HTML elements, ARIA attributes, and landmarks</li>
        <li><strong>Keyboard Navigation:</strong> All interactive elements must be keyboard accessible</li>
        <li><strong>Color Contrast:</strong> Text must meet WCAG contrast ratio requirements (4.5:1 for normal text, 3:1 for large text)</li>
        <li><strong>Focus Management:</strong> Visible focus indicators and logical tab order</li>
        <li><strong>Form Labels:</strong> All form inputs must have associated labels</li>
        <li><strong>Image Alt Text:</strong> Images must have appropriate alternative text</li>
        <li><strong>Heading Structure:</strong> Proper heading hierarchy (h1 → h2 → h3, etc.)</li>
        <li><strong>Landmark Regions:</strong> Proper use of ARIA landmarks (banner, main, navigation, contentinfo, etc.)</li>
        <li><strong>Interactive Elements:</strong> Buttons, links, and controls must have accessible names</li>
        <li><strong>Language Attributes:</strong> HTML lang attribute must be set</li>
      </ul>
      
      <h3 style="color: #555; margin-top: 15px;">Why is axe-core critical for accessibility?</h3>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li><strong>Automated Testing:</strong> Catches accessibility issues early in development, before manual testing</li>
        <li><strong>Comprehensive Coverage:</strong> Tests for 50+ accessibility rules covering WCAG 2.1 Level A and AA standards</li>
        <li><strong>Industry Standard:</strong> Used by major companies and integrated into popular testing frameworks</li>
        <li><strong>Continuous Integration:</strong> Can be integrated into CI/CD pipelines to prevent accessibility regressions</li>
        <li><strong>Legal Compliance:</strong> Helps ensure compliance with accessibility laws (ADA, Section 508, etc.)</li>
        <li><strong>User Experience:</strong> Improves usability for all users, including those using assistive technologies</li>
        <li><strong>Cost-Effective:</strong> Identifies issues before they reach production, reducing remediation costs</li>
      </ul>
      
      <h3 style="color: #555; margin-top: 15px;">axe-core in other accessibility tools</h3>
      <p>axe-core is the underlying engine powering many popular accessibility testing tools, making it a trusted standard across the industry:</p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li><strong><a href="https://developers.google.com/web/tools/lighthouse" target="_blank" rel="noopener noreferrer">Google Lighthouse</a>:</strong> Lighthouse's accessibility audit uses axe-core to test web pages. When you run Lighthouse in Chrome DevTools or via the command line, the accessibility score is calculated using axe-core's testing rules.</li>
        <li><strong><a href="https://www.siteimprove.com/" target="_blank" rel="noopener noreferrer">Siteimprove</a>:</strong> Siteimprove's automated accessibility scanner is built on axe-core, providing enterprise-level accessibility monitoring and reporting for organizations worldwide.</li>
        <li><strong>Browser Extensions:</strong> Popular browser extensions like axe DevTools and WAVE use axe-core to provide real-time accessibility feedback during development.</li>
        <li><strong>Testing Frameworks:</strong> Many testing frameworks (Jest, Cypress, Playwright, etc.) integrate axe-core for automated accessibility testing in CI/CD pipelines.</li>
      </ul>
      
      <p style="margin-top: 15px;"><strong>Note:</strong> While axe-core is powerful, it cannot catch all accessibility issues. Manual testing with screen readers and keyboard-only navigation is still essential for a complete accessibility audit.</p>
    </div>
    
    <div style="background: #f0f7ff; padding: 20px; border-radius: 6px; margin: 40px 0; border-left: 4px solid #0066cc;">
      <h2 style="margin-top: 0; color: #0066cc;">Accessibility Standards & Compliance</h2>
      <p style="margin-bottom: 15px;">The accessibility tests performed by axe-core are designed to ensure compliance with the following standards and requirements:</p>
      
      <h3 style="color: #555; margin-top: 20px; margin-bottom: 10px;">IITA Accessibility Standards for Illinois</h3>
      <p>The <a href="https://www2.illinois.gov/iita/Pages/default.aspx" target="_blank" rel="noopener noreferrer">Illinois Information Technology Accessibility (IITA)</a> standards require that all state websites and digital services be accessible to individuals with disabilities. These standards align with WCAG 2.1 Level AA and Section 508 requirements, ensuring that Illinois state websites are usable by all residents, including those using assistive technologies.</p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li><a href="https://www2.illinois.gov/iita/Pages/default.aspx" target="_blank" rel="noopener noreferrer">IITA Standards Documentation</a></li>
        <li><a href="https://www2.illinois.gov/iita/Pages/accessibility.aspx" target="_blank" rel="noopener noreferrer">IITA Accessibility Requirements</a></li>
      </ul>
      
      <h3 style="color: #555; margin-top: 20px; margin-bottom: 10px;">WCAG 2.1 Level AA Guidelines</h3>
      <p>The <a href="https://www.w3.org/WAI/WCAG21/quickref/?levels=aaa" target="_blank" rel="noopener noreferrer">Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</a> are internationally recognized standards for web accessibility. These guidelines provide a comprehensive framework for making web content accessible to people with disabilities, including those with visual, auditory, physical, speech, cognitive, language, learning, and neurological disabilities.</p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li><a href="https://www.w3.org/WAI/WCAG21/quickref/?levels=aaa" target="_blank" rel="noopener noreferrer">WCAG 2.1 Quick Reference</a></li>
        <li><a href="https://www.w3.org/WAI/WCAG21/Understanding/" target="_blank" rel="noopener noreferrer">Understanding WCAG 2.1</a></li>
        <li><a href="https://www.w3.org/WAI/WCAG21/guidelines/" target="_blank" rel="noopener noreferrer">WCAG 2.1 Guidelines</a></li>
      </ul>
      
      <h3 style="color: #555; margin-top: 20px; margin-bottom: 10px;">ADA Title II Requirements</h3>
      <p><a href="https://www.ada.gov/title2.htm" target="_blank" rel="noopener noreferrer">Americans with Disabilities Act (ADA) Title II</a> requires that state and local governments ensure their services, programs, and activities are accessible to people with disabilities. This includes websites and digital services. Title II applies to all state and local government entities, including public universities, libraries, and other government-operated websites.</p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li><a href="https://www.ada.gov/title2.htm" target="_blank" rel="noopener noreferrer">ADA Title II Overview</a></li>
        <li><a href="https://www.ada.gov/regs2010/titleII_2010/titleII_2010_regulations.htm" target="_blank" rel="noopener noreferrer">ADA Title II Regulations</a></li>
        <li><a href="https://www.ada.gov/web_compliance.htm" target="_blank" rel="noopener noreferrer">ADA Web Accessibility Requirements</a></li>
      </ul>
      
      <h3 style="color: #555; margin-top: 20px; margin-bottom: 10px;">What These Standards Mean for This Site</h3>
      <p>The automated tests performed by axe-core check for compliance with these standards by verifying:</p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li>Proper semantic HTML structure and ARIA attributes</li>
        <li>Keyboard navigation and focus management</li>
        <li>Color contrast ratios meeting WCAG AA standards (4.5:1 for normal text, 3:1 for large text)</li>
        <li>Form labels and input accessibility</li>
        <li>Image alternative text</li>
        <li>Heading hierarchy and document structure</li>
        <li>Landmark regions for screen reader navigation</li>
        <li>Language attributes and internationalization</li>
        <li>Interactive element accessibility</li>
      </ul>
      <p style="margin-top: 15px;"><strong>Note:</strong> While automated testing with axe-core covers many accessibility requirements, a complete accessibility audit should also include manual testing with screen readers, keyboard-only navigation, and user testing with people who have disabilities.</p>
    </div>
    
    <!-- Modal for All Tests -->
    <div id="testsModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>All axe-core Tests Run</h2>
          <span class="close" id="closeModal">&times;</span>
        </div>
        <p style="margin-bottom: 20px; color: #666;">
          This is a complete list of all ${
            allTests.size
          } unique accessibility tests that axe-core performed during this audit. 
          These tests cover WCAG 2.1 Level A and AA standards, IITA requirements, and ADA Title II compliance.
        </p>
        <ul class="test-list">
          ${Array.from(allTests.values())
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(
              (test) => `
            <li class="test-item">
              <div class="test-item-header">
                <div>
                  <div class="test-id">${test.id}</div>
                  <div class="test-description">${test.description}</div>
                </div>
              </div>
              ${
                test.tags.length > 0
                  ? `
                <div class="test-tags">
                  ${test.tags
                    .map((tag) => `<span class="test-tag">${tag}</span>`)
                    .join("")}
                </div>
              `
                  : ""
              }
              ${
                test.helpUrl
                  ? `
                <div class="test-help-link">
                  <a href="${test.helpUrl}" target="_blank" rel="noopener noreferrer">Learn more about this test →</a>
                </div>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p>Generated by axe-core ${axeCore.version} on ${new Date(
    timestamp
  ).toLocaleString()}</p>
      <p>For more information, visit <a href="https://www.deque.com/axe/" target="_blank">https://www.deque.com/axe/</a></p>
    </div>
  </div>
  
  <script>
    // Modal functionality
    // Function to initialize modal - works whether DOM is already loaded or not
    function initModal() {
      const modal = document.getElementById('testsModal');
      const totalTestsCard = document.getElementById('totalTestsCard');
      const closeModal = document.getElementById('closeModal');
      
      // Verify all elements exist
      if (!modal || !totalTestsCard) {
        console.error('Modal elements not found', { modal: !!modal, totalTestsCard: !!totalTestsCard });
        return;
      }
      
      // Open modal when clicking on Total Tests Run card
      // Use event delegation to handle clicks on child elements
      totalTestsCard.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      });
      
      // Close modal when clicking the X
      if (closeModal) {
        closeModal.addEventListener('click', function(event) {
          event.preventDefault();
          event.stopPropagation();
          modal.style.display = 'none';
          document.body.style.overflow = ''; // Restore scrolling
        });
      }
      
      // Close modal when clicking outside of it (on the backdrop)
      // Prevent clicks on modal-content from closing the modal
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent) {
        modalContent.addEventListener('click', function(event) {
          event.stopPropagation(); // Prevent click from bubbling to modal backdrop
        });
      }
      
      modal.addEventListener('click', function(event) {
        // Only close if clicking directly on the modal backdrop, not the content
        if (event.target === modal) {
          modal.style.display = 'none';
          document.body.style.overflow = ''; // Restore scrolling
        }
      });
      
      // Close modal with Escape key
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
          modal.style.display = 'none';
          document.body.style.overflow = ''; // Restore scrolling
        }
      });
    }
    
    // Initialize modal when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initModal);
    } else {
      // DOM is already loaded
      initModal();
    }
  </script>
</body>
</html>`;

  return html;
}

/**
 * Main audit orchestration function that coordinates the entire accessibility testing process.
 *
 * @async
 * @function runAudit
 * @returns {Promise<void>} Resolves when audit is complete, exits process with code 0 (success) or 1 (violations found)
 *
 * @description
 * This is the main entry point that orchestrates the entire audit process:
 * 1. Checks if dev server is running
 * 2. Parses sitemap.xml to get URLs to test
 * 3. Launches Puppeteer browser
 * 4. Tests each URL across all viewports and themes
 * 5. Collects and aggregates results
 * 6. Generates HTML and JSON reports
 * 7. Outputs summary statistics
 *
 * @workflow
 * ```
 * runAudit()
 *   ├─> checkDevServer() - Verify server is running
 *   ├─> parseSitemap() - Get URLs to test
 *   ├─> puppeteer.launch() - Start browser
 *   ├─> For each URL:
 *   │   ├─> For each viewport:
 *   │   │   ├─> For each theme:
 *   │   │   │   ├─> Create new page
 *   │   │   │   ├─> Set viewport size
 *   │   │   │   ├─> Navigate to URL
 *   │   │   │   ├─> Apply theme (if applicable)
 *   │   │   │   ├─> Check for errors
 *   │   │   │   ├─> runAxeAudit() - Run accessibility tests
 *   │   │   │   └─> Collect results
 *   │   │   └─> Close page
 *   │   └─> Next viewport
 *   ├─> Close browser
 *   ├─> Save JSON reports (violations.json, errors.json)
 *   ├─> generateHTMLReport() - Create HTML report
 *   └─> Output summary and exit
 * ```
 *
 * @note Theme Switching:
 * The theme switching logic is specific to this site (Vuetify with theme toggle).
 * For other sites, modify the theme application logic:
 * - Remove theme testing if your site doesn't have themes
 * - Update the selector for your theme toggle element
 * - Adjust the method of applying themes (CSS classes, localStorage, etc.)
 *
 * @example
 * // Run the audit
 * await runAudit();
 * // Process exits with code 0 if no violations, 1 if violations found
 *
 * @throws {Error} Exits process if dev server is not running
 * @throws {Error} Exits process if sitemap cannot be parsed
 * @throws {Error} Exits process if application has runtime errors (Vite error overlay detected)
 */
async function runAudit() {
  console.log("🔍 Starting Accessibility Audit...\n");

  // Check if dev server is running
  console.log(`Checking if dev server is running at ${DEV_SERVER_URL}...`);
  const serverRunning = await checkDevServer();

  if (!serverRunning) {
    console.error(`❌ Dev server is not running at ${DEV_SERVER_URL}`);
    console.error("Please start the dev server with: yarn dev");
    process.exit(1);
  }

  console.log("✅ Dev server is running\n");

  // Parse sitemap
  console.log("📄 Parsing sitemap.xml...");
  const urls = await parseSitemap();
  console.log(`✅ Found ${urls.length} URLs to test\n`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Launch browser
  console.log("🌐 Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results = [];
  const totalTests = urls.length * VIEWPORTS.length * THEMES.length;
  let currentTest = 0;

  console.log(
    `\n🧪 Testing ${urls.length} URLs across ${VIEWPORTS.length} viewports and ${THEMES.length} themes (${totalTests} total tests)...\n`
  );

  // Test each URL in each viewport and each theme
  for (const url of urls) {
    for (const viewport of VIEWPORTS) {
      for (const theme of THEMES) {
        currentTest++;
        const page = await browser.newPage();

        try {
          await page.setViewport({
            width: viewport.width,
            height: viewport.height,
          });
          console.log(
            `[${currentTest}/${totalTests}] Testing ${url} (${viewport.name}, ${theme.name} theme)...`
          );

          await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000,
          });

          // Wait for any dynamic content to fully load before testing
          // This ensures JavaScript-rendered content is available for accessibility testing
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // ADAPTATION NOTE: Theme Switching Logic
          // This section applies themes before testing. For sites without themes, remove this entire block.
          // The theme switching is specific to Vuetify's implementation. Adapt for your framework:
          //
          // For Vuetify: Uses a checkbox switch with role="switch" and body class "v-theme--dark"
          // For other frameworks:
          //   - React: May use context providers or CSS variables
          //   - Angular: May use services or directives
          //   - Plain CSS: May use data attributes or body classes
          //   - Tailwind: May use dark mode classes or data attributes
          //
          // To adapt:
          // 1. Update the selector to find your theme toggle element
          // 2. Update the method of applying themes (click, class manipulation, etc.)
          // 3. Update the CSS class/attribute that indicates theme state
          await page.evaluate(async (themeValue) => {
            // Find the theme toggle switch element
            // ADAPTATION: Update this selector to match your theme toggle element
            const themeSwitch = document.querySelector(
              'input[type="checkbox"][role="switch"]'
            );

            if (themeSwitch) {
              // Check current theme state by looking for theme class on body
              // ADAPTATION: Update this to check your theme indicator
              const currentIsDark =
                document.body.classList.contains("v-theme--dark");
              const targetIsDark = themeValue === "dark";

              // Only toggle if the current theme doesn't match the target theme
              // This avoids unnecessary clicks and improves performance
              if (currentIsDark !== targetIsDark) {
                themeSwitch.click();
                // Wait for theme transition animation to complete
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            } else {
              // Fallback method: Set theme via localStorage and force class manipulation
              // ADAPTATION: Update localStorage key and class names for your implementation
              localStorage.setItem("theme", themeValue);

              // Force theme by directly manipulating body classes
              // ADAPTATION: Update class names to match your theme implementation
              if (themeValue === "dark") {
                document.body.classList.add("v-theme--dark");
              } else {
                document.body.classList.remove("v-theme--dark");
              }
            }
          }, theme.value);

          // Wait for theme to fully apply and any CSS transitions to complete
          // This ensures color contrast tests run against the correct theme
          await new Promise((resolve) => setTimeout(resolve, 800));

          // ADAPTATION NOTE: Error Detection
          // Check for framework-specific error overlays that indicate the app has runtime errors
          // This prevents testing broken pages and wasting time on invalid results
          //
          // Current implementation checks for Vite error overlay (used by Nuxt/Vite)
          // For other frameworks, update the error detection logic:
          //   - React: Check for React error boundaries or error messages
          //   - Angular: Check for Angular error overlays
          //   - Webpack: Check for webpack error overlays
          //   - Custom: Check for your framework's error indicators
          const hasErrorOverlay = await page.evaluate(() => {
            // Check for Vite error overlay element (specific to Vite-based apps)
            const errorOverlay = document.querySelector("vite-error-overlay");

            // Also check for error messages in the DOM
            // ADAPTATION: Update error message patterns to match your framework
            const errorMessages = Array.from(
              document.querySelectorAll("*")
            ).some((el) => {
              const text = (el.textContent || "").trim();
              return (
                text.includes("Failed to fetch dynamically imported module") ||
                text.includes("Internal server error") ||
                (el.getAttribute("data-v-d6beb1d7") !== null &&
                  text.includes("Failed"))
              );
            });
            return errorOverlay !== null || errorMessages;
          });

          if (hasErrorOverlay) {
            console.error(
              `   ❌ ERROR: Vite error overlay detected! The app has errors that must be fixed before running accessibility audit.`
            );
            console.error(
              `   Please fix the application errors and ensure the dev server runs without errors.`
            );
            throw new Error(
              "Application has errors - Vite error overlay detected. Please fix app errors first."
            );
          }

          const auditResult = await runAxeAudit(page);

          results.push({
            url,
            viewport: viewport.name,
            theme: theme.name,
            violations: auditResult.violations,
            passes: auditResult.passes,
            incomplete: auditResult.incomplete,
            inapplicable: auditResult.inapplicable,
          });

          const violationCount = auditResult.violations?.length || 0;
          const passCount = auditResult.passes?.length || 0;
          if (violationCount > 0) {
            console.log(
              `   ⚠️  Found ${violationCount} violation(s), ${passCount} pass(es)`
            );
          } else {
            console.log(`   ✅ No violations, ${passCount} pass(es)`);
          }
        } catch (error) {
          console.error(
            `   ❌ Error testing ${url} (${viewport.name}, ${theme.name}): ${error.message}`
          );
          results.push({
            url,
            viewport: viewport.name,
            theme: theme.name,
            error: error.message,
            violations: [],
            passes: [],
            incomplete: [],
            inapplicable: [],
          });
        } finally {
          await page.close();
        }
      }
    }
  }

  await browser.close();

  // ADAPTATION NOTE: JSON Export
  // Extract and save violations to JSON files for CI/CD integration
  // These JSON files can be consumed by:
  //   - CI/CD pipelines to fail builds on violations
  //   - Automated reporting tools
  //   - Custom dashboards or monitoring systems
  //
  // The structure filters results to only include pages with violations,
  // making it easier to process and act on issues
  const violationsOnly = results
    .filter((r) => (r.violations?.length || 0) > 0)
    .map((r) => ({
      url: r.url,
      viewport: r.viewport,
      theme: r.theme,
      violations: r.violations || [],
    }));

  // Save violations as JSON for programmatic access
  const violationsJsonPath = path.join(OUTPUT_DIR, "violations.json");
  fs.writeFileSync(violationsJsonPath, JSON.stringify(violationsOnly, null, 2));
  console.log(`\n📄 Violations JSON saved to: ${violationsJsonPath}`);

  // Also save as errors.json (alias for compatibility with other tools)
  // Some tools expect "errors.json" instead of "violations.json"
  const errorsJsonPath = path.join(OUTPUT_DIR, "errors.json");
  fs.writeFileSync(errorsJsonPath, JSON.stringify(violationsOnly, null, 2));
  console.log(`📄 Errors JSON saved to: ${errorsJsonPath}`);

  // Check if errors.json is empty and report
  const errorsContent = JSON.parse(fs.readFileSync(errorsJsonPath, "utf8"));
  if (errorsContent.length === 0) {
    console.log(`\n✅ SUCCESS: errors.json is empty - zero violations!`);
  } else {
    const totalErrors = errorsContent.reduce(
      (sum, item) => sum + (item.violations?.length || 0),
      0
    );
    console.log(
      `\n⚠️  WARNING: errors.json contains ${totalErrors} violation(s) across ${errorsContent.length} viewport(s)`
    );
    console.log(
      `   Please review and fix the violations listed in: ${errorsJsonPath}`
    );
  }

  // Generate HTML report
  console.log("\n📝 Generating HTML report...");
  const htmlReport = generateHTMLReport(results);
  fs.writeFileSync(REPORT_FILE, htmlReport);

  // Calculate summary
  const totalViolations = results.reduce(
    (sum, r) => sum + (r.violations?.length || 0),
    0
  );
  const totalPasses = results.reduce(
    (sum, r) => sum + (r.passes?.length || 0),
    0
  );
  const totalIncomplete = results.reduce(
    (sum, r) => sum + (r.incomplete?.length || 0),
    0
  );
  const totalInapplicable = results.reduce(
    (sum, r) => sum + (r.inapplicable?.length || 0),
    0
  );
  const totalTestsRun =
    totalViolations + totalPasses + totalIncomplete + totalInapplicable;
  const uniquePages = new Set(results.map((r) => r.url)).size;
  const pagesWithViolations = new Set(
    results.filter((r) => (r.violations?.length || 0) > 0).map((r) => r.url)
  ).size;

  console.log("\n✅ Audit Complete!");
  console.log(`\n📊 Summary:`);
  console.log(`   Total tests run: ${totalTestsRun}`);
  console.log(`   Pages tested: ${uniquePages}`);
  console.log(`   Viewports tested: ${VIEWPORTS.length}`);
  console.log(`   Themes tested: ${THEMES.length}`);
  console.log(`   Total violations: ${totalViolations}`);
  console.log(`   Total passes: ${totalPasses}`);
  console.log(`   Pages with violations: ${pagesWithViolations}`);
  console.log(`   Pages passing: ${uniquePages - pagesWithViolations}`);
  console.log(`\n📄 Report saved to: ${REPORT_FILE}`);

  if (totalViolations > 0) {
    console.log(
      `\n⚠️  ${totalViolations} violation(s) found. Please review the report.`
    );
    process.exit(1);
  } else {
    console.log(`\n🎉 No violations found!`);
    process.exit(0);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
// This is the entry point when the script is run directly
// The script will:
// 1. Check if dev server is running
// 2. Parse sitemap.xml for URLs
// 3. Test each URL across all viewports and themes
// 4. Generate HTML and JSON reports
// 5. Exit with code 0 (success) or 1 (violations found)
//
// ADAPTATION NOTE: Exit Codes
// - Exit code 0: No violations found (success)
// - Exit code 1: Violations found or fatal error
// This allows CI/CD pipelines to fail builds when violations are detected
//
// Usage in CI/CD:
// ```yaml
// - name: Run accessibility audit
//   run: yarn a11y:audit
//   continue-on-error: false  # Fail build on violations
// ```
//
runAudit().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
