function exportGDocsToPDF() {
    const rootFolder = DriveApp.getFolderById("Your-Input-Folder-ID"); // Replace with your folder's ID
    const exportFolder = DriveApp.getFolderById("Your-Output-Folder-ID"); // Replace with your folder's ID

    Logger.log(`Exporting all .gdoc files from ${rootFolder.getName()} to ${exportFolder.getName()}`);
    processFolder("", rootFolder, exportFolder);

    Logger.log(`All .gdoc files have been exported to: ${exportFolder.getName()}`);
}

/**
 * Recursively processes a Google Drive folder and its subfolders, converting all Google Docs to PDFs.
 * The converted PDFs maintain the same folder structure as the source in the export location.
 * 
 * @param {string} parentPath - The parent path, for logging only
 * @param {GoogleAppsScript.Drive.Folder} folder - The source folder containing Google Docs to be converted
 * @param {GoogleAppsScript.Drive.Folder} exportFolder - The destination folder where PDFs will be saved
 * 
 * @example
 * const sourceFolder = DriveApp.getFolderById('source_folder_id');
 * const exportFolder = DriveApp.getFolderById('export_folder_id');
 * processFolder(sourceFolder, exportFolder);
 * 
 * @throws {Error} If either folder or exportFolder is invalid or inaccessible
 * @returns {void}
 */
function processFolder(parentPath, folder, exportFolder) {
    // Define supported Google Workspace file types and their MIME types
    const SUPPORTED_TYPES = [
        MimeType.GOOGLE_DOCS,
        MimeType.GOOGLE_SHEETS,
        MimeType.GOOGLE_SLIDES
    ];

    // Process each supported file type
    for (const mimeType of SUPPORTED_TYPES) {
        const files = folder.getFilesByType(mimeType);
        while (files.hasNext()) {
            const file = files.next();
            const fileId = file.getId();
            const fileName = file.getName();

            // Check if the PDF already exists
            const pdfFilePath = `${parentPath}/${exportFolder.getName()}/${fileName}.pdf`;
            if (pdfExists(exportFolder, fileName + ".pdf")) {
                Logger.log(`Skipped: ${pdfFilePath} already exists.`);
                continue;
            }

            // Export the file using UrlFetchApp
            const pdfBlob = exportFileAsPDF(fileId, fileName);
            if (pdfBlob) {
                exportFolder.createFile(pdfBlob);
                Logger.log(`Exported: ${pdfFilePath}`);
            } else {
                Logger.log(`Failed to export: ${pdfFilePath}`);
            }
        }
    }

    // Process subfolders recursively
    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
        const subfolder = subfolders.next();
        const subfolderName = subfolder.getName();

        // Check if export subfolder already exists
        let newExportSubfolder;
        const existingFolders = exportFolder.getFoldersByName(subfolderName);
        if (existingFolders.hasNext()) {
            newExportSubfolder = existingFolders.next();
        } else {
            newExportSubfolder = exportFolder.createFolder(subfolderName);
        }

        processFolder(`${parentPath}/${exportFolder.getName()}`, subfolder, newExportSubfolder);
    }
}

// Function to check if a PDF file already exists in the output folder
function pdfExists(folder, pdfFileName) {
    const files = folder.getFilesByName(pdfFileName);
    return files.hasNext(); // Returns true if the file exists
}

// Function to export a Google Doc file as a PDF
function exportFileAsPDF(fileId, fileName) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
    const token = ScriptApp.getOAuthToken();

    try {
        const response = UrlFetchApp.fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            muteHttpExceptions: true  // Allow us to handle the error
        });

        if (response.getResponseCode() === 403) { // Error 403: File too large to export
            Logger.log(`Error 403: File too large to export - ${fileName}`);
            return null;
        }

        const pdfBlob = response.getBlob();
        pdfBlob.setName(fileName + ".pdf");
        return pdfBlob;
    } catch (e) {
        Logger.log(`Export error for ${fileName}: ${e.toString()}`);
        return null;
    }
}
