# gdoc2pdf

Convert Google Drive `.gdoc` files to PDF.

## Google Apps Script

This Google Apps Script automates the process of exporting all `.gdoc` files from a specified Google Drive folder (and its subfolders) to PDF format. The exported PDFs are saved in a new folder.

### Features

- Exports all Google Docs (`.gdoc`) files in a specified folder to PDF format.
- Maintains folder structure for subfolders during export.
- Automatically creates a new folder to store the exported PDFs.

---

### Prerequisites

1. A Google account with access to Google Drive.
2. Google Docs files (`.gdoc`) stored in a Google Drive folder.
3. Basic familiarity with Google Apps Script.

---

### Steps to Set Up and Run

#### 1. Open Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/).
2. Click on **New Project** to create a new script.

#### 2. Copy the Script

1. Copy the script `gdoc2pdf.js` into the code editor.
1. Replace the input folder ID and output folder ID with your own folder IDs.

#### 3. Enable Required Services

1.	Enable the Advanced Drive Service:

    * In the Apps Script editor, go to Extensions > Apps Script APIs.
    * Enable the **Google Drive API**.

1.	Enable Google Drive API in GCP:

    * Go to Project Settings (gear icon in the left sidebar).
    * Click **Google Cloud Platform (GCP) Project** to open the linked project in GCP.
    * In the GCP Console, go to **APIs & Services > Library**.
    * Search for **Google Drive API** and enable it.

#### 4. Authorize the Script

1. Click the Run button ▶️ in the Apps Script editor.
1. Authorize the script to access your Google Drive when prompted.

#### 5. Run the Script

1. Save the script and run the exportGDocsToPDF() function.
1. Open the Logs (View > Logs) to monitor the progress of the export process.
