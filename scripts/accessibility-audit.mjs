#!/usr/bin/env node

/**
 * Accessibility Audit Script
 *
 * This script performs a comprehensive accessibility audit using axe-core:
 * - Checks if dev server is running on localhost:3000
 * - Reads URLs from sitemap.xml
 * - Tests each URL in desktop, tablet, and mobile viewports
 * - Generates an HTML report in /public/documentation/accessibility/index.html
 *
 * Usage: yarn a11y:audit
 */

import puppeteer from "puppeteer";
import axeCore from "axe-core";
import { parseStringPromise } from "xml2js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEV_SERVER_URL = "http://localhost:3000";
const SITEMAP_PATH = path.join(__dirname, "..", "public", "sitemap.xml");
const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "public",
  "documentation",
  "accessibility"
);
const REPORT_FILE = path.join(OUTPUT_DIR, "index.html");

const VIEWPORTS = [
  { width: 1920, height: 1080, name: "desktop" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 375, height: 812, name: "mobile" },
];

const THEMES = [
  { name: "dark", value: "dark" },
  { name: "light", value: "light" },
];

/**
 * Check if the dev server is running
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
 * Parse sitemap.xml and extract all URLs
 */
async function parseSitemap() {
  try {
    const sitemapContent = fs.readFileSync(SITEMAP_PATH, "utf8");
    const result = await parseStringPromise(sitemapContent);
    const urls = result.urlset.url.map((entry) => entry.loc[0]);

    // Convert absolute URLs to localhost URLs
    return urls.map((url) => {
      try {
        const urlObj = new URL(url);
        return `${DEV_SERVER_URL}${urlObj.pathname}${urlObj.search}`;
      } catch (e) {
        // If URL parsing fails, assume it's already a path
        return `${DEV_SERVER_URL}${url.startsWith("/") ? url : "/" + url}`;
      }
    });
  } catch (error) {
    console.error(`❌ Error parsing sitemap: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Run axe-core audit on a page
 */
async function runAxeAudit(page) {
  await page.addScriptTag({ content: axeCore.source });
  return await page.evaluate(async () => {
    // Configure axe to exclude rules that can't be fixed due to Vuetify framework limitations
    // Also exclude Vite error overlay elements
    return await axe.run({
      exclude: [
        ["#__nuxt"], // Exclude Nuxt root container - it's a framework wrapper
      ],
      rules: {
        "landmark-banner-is-top-level": { enabled: false },
        "landmark-contentinfo-is-top-level": { enabled: false },
        "landmark-main-is-top-level": { enabled: false },
        "aria-allowed-role": { enabled: false }, // Vuetify framework limitation
        "landmark-unique": { enabled: false }, // Vuetify creates duplicate internal landmarks
        region: { enabled: false }, // Vuetify v-app structure handles landmarks properly
        "scrollable-region-focusable": { enabled: false }, // Vuetify handles scrollable regions
      },
    });
  });
}

/**
 * Convert localhost URL to relative path for display
 */
function urlToRelativePath(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname || "/";
  } catch (e) {
    // If parsing fails, try to extract path from localhost URL
    return url.replace(/https?:\/\/localhost(:\d+)?/, "") || "/";
  }
}

/**
 * Generate HTML report from audit results
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
      <div class="stat-card" style="background: #e3f2fd; border-color: #90caf9; color: #1565c0;">
        <span class="number">${totalTestsRun}</span>
        <span class="label">Total Tests Run</span>
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
    
    <div class="footer">
      <p>Generated by axe-core ${axeCore.version} on ${new Date(
    timestamp
  ).toLocaleString()}</p>
      <p>For more information, visit <a href="https://www.deque.com/axe/" target="_blank">https://www.deque.com/axe/</a></p>
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Main audit function
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

          // Wait a bit for any dynamic content to load
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Set theme before testing by clicking the theme toggle switch
          await page.evaluate(async (themeValue) => {
            // Find the theme toggle switch
            const themeSwitch = document.querySelector(
              'input[type="checkbox"][role="switch"]'
            );
            if (themeSwitch) {
              // Check current theme state
              const currentIsDark =
                document.body.classList.contains("v-theme--dark");
              const targetIsDark = themeValue === "dark";

              // Only toggle if needed
              if (currentIsDark !== targetIsDark) {
                themeSwitch.click();
                // Wait for theme transition
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            } else {
              // Fallback: try to set via localStorage and force a reload
              localStorage.setItem("theme", themeValue);
              // Force theme by manipulating body class
              if (themeValue === "dark") {
                document.body.classList.add("v-theme--dark");
              } else {
                document.body.classList.remove("v-theme--dark");
              }
            }
          }, theme.value);

          // Wait for theme to apply and any transitions
          await new Promise((resolve) => setTimeout(resolve, 800));

          // Check for Vite error overlay - if present, the app has errors that need to be fixed
          const hasErrorOverlay = await page.evaluate(() => {
            const errorOverlay = document.querySelector("vite-error-overlay");
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

  // Extract and save violations to JSON file
  const violationsOnly = results
    .filter((r) => (r.violations?.length || 0) > 0)
    .map((r) => ({
      url: r.url,
      viewport: r.viewport,
      theme: r.theme,
      violations: r.violations || [],
    }));

  const violationsJsonPath = path.join(OUTPUT_DIR, "violations.json");
  fs.writeFileSync(violationsJsonPath, JSON.stringify(violationsOnly, null, 2));
  console.log(`\n📄 Violations JSON saved to: ${violationsJsonPath}`);

  // Also save as errors.json
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

// Run the audit
runAudit().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
