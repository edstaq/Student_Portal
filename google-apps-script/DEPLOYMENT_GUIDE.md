# EDSTAQ Google Apps Script Deployment & Architecture Guide

---

## 1. How Many Scripts & APIs Are Needed?

### 📌 Total Scripts Needed: **Only 1 Script (`UnifiedApi.gs`)**
You only need **ONE** Google Apps Script file deployed as **ONE Web App**. You will get **ONE URL** (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).

### 📌 How Many APIs are inside and what does each do?
Inside this single URL, there are **3 distinct API actions** handled automatically:

| # | Action / Method | Purpose / Description |
|---|---|---|
| **1** | `GET ?action=ping` | **Connection Test API**: Used by the Settings page (**Test & Save URL**) to verify that your Google Sheet is live, reachable, and responding. |
| **2** | `GET ?action=getStudentData&studentId=STD101` | **Master Data Fetch API**: Pulls complete student records in a single fast call — Student Profile, Teacher Allocation, Daily Classes, Teacher Feedback Logs, Study Material Links, and Reminder Settings. |
| **3** | `POST action=logActivity` | **Activity Logger API**: Saves student study actions (viewing documents, completing 1-4-7 revisions) to the `Student Activity Log` sheet. |
| **4** | `POST action=saveSettings` | **Settings Saver API**: Updates or inserts the student's reminder time and notification preferences in the `Student Settings` sheet. |

---

## 2. Google Sheet Tabs & Column Setup

Your Google Spreadsheet should have **7 tabs**. You already have the first 5. You only need to create the last 2 tabs:

### Existing Tabs (Already in your Sheet):
1. `Student Register`
2. `Teacher Student Allocation`
3. `Daily Class Master`
4. `Student Log`
5. `Uploaded Files`

---

### 🆕 2 New Tabs to Create (Exact Column Names):

#### Tab 6: `Student Activity Log`
Add a new tab with the exact name **`Student Activity Log`** and put these headers in **Row 1**:

| Col | Header Name | Description |
|---|---|---|
| A | `Timestamp` | Date & time of the activity (e.g. `2026-10-16 11:30:00`) |
| B | `Student ID` | Student ID (e.g. `STD101`) |
| C | `Session ID` | Associated class session ID (e.g. `SES-2025-001` or `N/A`) |
| D | `Action Type` | Action performed (e.g. `Document Viewed`, `Revision Completed`) |
| E | `Detail` | Document name or chapter notes |
| F | `Duration Seconds` | Time spent (e.g. `120`) |

---

#### Tab 7: `Student Settings`
Add a new tab with the exact name **`Student Settings`** and put these headers in **Row 1**:

| Col | Header Name | Description |
|---|---|---|
| A | `Student ID` | Student ID (e.g. `STD101`) |
| B | `Preferred Reminder Time` | Time in 24-hour format (e.g. `19:00`) |
| C | `Notifications Enabled` | `TRUE` or `FALSE` |
| D | `Last Updated` | Date & time when settings were last changed |

---

## 3. Dynamic Column Header Protection (No Fixed A, B, C)

> [!IMPORTANT]
> The updated [`UnifiedApi.gs`](./UnifiedApi.gs) **does NOT hardcode column letters or positions (A, B, C)**.
> - It reads the header row (Row 1) dynamically.
> - Even if you change column order (e.g., swapping column A and B) or add new custom columns, the script will automatically identify each column by its header name (case-insensitive & space-insensitive).
> - All reads and writes are done in batch memory without unnecessary loops, ensuring maximum speed.

---

## 4. Step-by-Step Deployment Instructions

1. Open your Google Spreadsheet.
2. In the top menu, click **Extensions** > **Apps Script**.
3. Clear everything in the editor.
4. Copy the entire code from [`UnifiedApi.gs`](./UnifiedApi.gs) and paste it into the editor.
5. Press `Ctrl + S` to save.
6. In the top-right corner, click **Deploy** > **New deployment**.
7. Click the **gear icon (⚙️)** next to "Select type" and select **Web app**.
8. Set the settings:
   - **Description**: `EDSTAQ API v2 (Dynamic Headers)`
   - **Execute as**: `Me (your Google account)`
   - **Who has access**: `Anyone` *(Crucial so the portal can fetch data without login restrictions)*
9. Click **Deploy**.
10. Click **Authorize access**, choose your Google account, click **Advanced** > **Go to Untitled project (unsafe)**, and click **Allow**.
11. Copy the **Web App URL** (looks like: `https://script.google.com/macros/s/AKfycb.../exec`).
12. In the EDSTAQ Student Portal web app, navigate to **Settings** > **Google Sheets JSON API Web App**, paste the URL, and click **Test & Save URL**.
