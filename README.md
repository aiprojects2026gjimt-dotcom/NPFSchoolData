# GJIMT Smart Student Data Center V3 — Template-Aware Checkbox Review

## What's new
- Uses the supplied **one-page blank GJIMT form** as the coordinate reference (`assets/blank-template.png`).
- Adds an image-based tick-mark analysis assistant on the **Verify Forms** page.
- Works entirely in the browser for checkbox analysis; no paid API is required.
- Uses the existing Google Drive OCR backend for handwritten text and existing Google Sheets database.
- Preserves school dropdown, school creation, student profile cards, filters, logos and CSV export.

## Installation
1. Unzip the package. Open its folder in VS Code, right-click `index.html`, and choose **Open with Live Server**.
2. In Google Apps Script, replace your `Code.gs` with the included version. **Do not run `setup()` if your existing `SHEET_ID` and `FOLDER_ID` properties are already configured.** Your existing properties and Sheet remain intact.
3. Confirm the Advanced **Drive API v3** service is enabled.
4. Save and use **Deploy → Manage Deployments → Edit → New version → Deploy**.
5. In the dashboard, enter your existing deployed `/exec` URL and the current staff PIN under Connection, then test.
6. Upload one JPG/PNG completed form with the school selected.
7. Open **Verify Forms**. On the left, choose **Select 4 Corners** and click the physical paper's **top-left, top-right, bottom-right, bottom-left** corners in that order. The orange outline should trace the paper.
8. Click **Analyze Tick Marks**. Review the suggested options and manually tick/untick anything inaccurate. Then click **Apply Reviewed Selections to Student Details**.
9. Check OCR text fields and corrected selections against the original. Click **Verify & Save** only after staff review.

## Notes and limitations
- **Not a trained AI handwriting/checkbox model.** This is an experimental template-aligned image-difference detector. Results vary with camera angle, lighting, shadows, folds, printed-page scaling, pen position and tick marks drawn outside boxes.
- Suggested options may be wrong. If uncertain, correct them before saving. In particular, a mark through the option *text* rather than its box may not be detected.
- The image is kept in the browser tab for checkbox analysis. It is not separately uploaded for tick detection. The existing upload workflow sends the form to Google Drive for OCR.
- Tick analysis requires the uploaded image to remain in the current browser session. PDF uploads are still accepted for OCR but checkbox analysis currently supports JPG/PNG only.
- If you change the form design or spacing, the checkbox map must be regenerated from the new blank form.
- **Privacy/security:** The existing PIN-only Apps Script web app is a prototype and is **not suitable for public use with actual student personal data**. Use sample records until proper authentication and authorization are in place. Rotate any previously exposed PIN.

## Files
- `index.html`, `style.css`, `app.js`: GitHub Pages frontend
- `checkbox.js`: local checkbox analysis and interactive verification
- `checkbox-map.json`: mapped checkbox coordinates from blank PDF
- `assets/blank-template.png`: reference form rendering
- `assets/gjimt-naac.png`, `assets/25-years.png`: institutional branding
- `Code.gs`: Google Apps Script backend for Sheets, Drive and OCR
- `blank-GJIMT-form.pdf`: the original reference form

## Deployment to GitHub
Upload `index.html`, `style.css`, `app.js`, `checkbox.js`, `checkbox-map.json`, and `assets/` to your GitHub repository. Do not upload `Code.gs` if you do not want to expose backend implementation details. **Never publish your staff PIN** in GitHub source code. Apps Script remains the backend.


## V4 — Graphical Analytics Dashboard
The Overview page now includes 5 raised KPI cards (student records, schools with records, Class 11th, Class 12th, SkillX interested), a class donut chart, school-wise and career-interest bar charts, a date trend, a school summary and recent student cards. School and date filters update all charts.
No external chart libraries are needed. Charts are rendered from verified records fetched from the existing Apps Script backend. No change to Code.gs or the Google Sheet is required for these visual updates.
For an existing working V3 installation, replace only index.html, style.css and app.js (keep assets and other V3 files). Do not overwrite the existing Google Apps Script deployment. Re-enter connection details if using a different browser origin.


## V4.1 direct-open fix
The blank template is now embedded in `reference-data.js`, preventing the canvas reference from being blocked when the HTML is opened using `file://`. The original image is still included. This fixes the null `width` error during tick analysis when opening the page directly. Keep `reference-data.js` alongside `index.html` and `checkbox.js`. The Google Sheets API may still behave differently between file://, Live Server and GitHub Pages because browser storage is origin-specific; configure the connection for each origin. For production use, prefer HTTPS hosting with proper authentication.
