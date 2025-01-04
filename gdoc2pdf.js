function exportGDocsToPDF() {
    const rootFolder = DriveApp.getFolderById("Your-Input-Folder-ID"); // Replace with your folder's ID
    const exportFolder = DriveApp.getFolderById("Your-Output-Folder-ID"); // Replace with your folder's ID

    processFolder(rootFolder, exportFolder);

    Logger.log(`All .gdoc files have been exported to: ${exportFolder.getName()}`);
}

function processFolder(folder, exportFolder) {
    // Export files in the current folder
    const files = folder.getFilesByType(MimeType.GOOGLE_DOCS);
    while (files.hasNext()) {
        const file = files.next();
        const fileId = file.getId();
        const fileName = file.getName();

        // Get the full path by traversing up through parent folders
        let path = exportFolder.getName();
        let parent = exportFolder.getParents();
        while (parent.hasNext()) {
            path = parent.next().getName() + '/' + path;
        }

        // Check if the PDF already exists
        if (pdfExists(exportFolder, fileName + ".pdf")) {
            Logger.log(`Skipped: ${path}/${fileName}.pdf already exists.`);
            continue;
        }

        // Export the file using UrlFetchApp
        const pdfBlob = exportFileAsPDF(fileId, fileName);
        exportFolder.createFile(pdfBlob);

        Logger.log(`Exported: ${path}/${fileName}.pdf`);
    }

    // Process subfolders recursively
    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
        const subfolder = subfolders.next();
        const newExportSubfolder = exportFolder.createFolder(subfolder.getName());
        processFolder(subfolder, newExportSubfolder);
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

    const response = UrlFetchApp.fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const pdfBlob = response.getBlob();
    pdfBlob.setName(fileName + ".pdf");
    return pdfBlob;
}
