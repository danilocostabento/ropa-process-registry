/**
 * Searches domain users using Google People API.
 * Requires People API enabled in Apps Script services.
 * @param {string} query Search term (name or email).
 * @returns {Array<{name: string, email: string}>}
 */
function searchUsers(query) {
  if (!query || typeof query !== 'string' || query.length < 3) {
    return [];
  }

  try {
    const response = People.People.searchDirectoryPeople({
      query,
      readMask: 'names,emailAddresses',
      pageSize: 10
    });

    if (!response.people) return [];

    return response.people
      .map(person => ({
        name: person.names?.[0]?.displayName || 'Unknown',
        email: person.emailAddresses?.[0]?.value || null
      }))
      .filter(user => user.email);

  } catch (error) {
    Logger.log(`People API error: ${error.message}`);
    return [];
  }
}

/**
 * Retrieves example data based on selected area.
 * Expected sheet structure:
 * Column A: Area name
 * Column B–I: Example fields
 * @param {string} area
 * @returns {Object}
 */
function getExamplesByArea(area) {
  try {
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('Config');

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
    const normalizedArea = area.trim().toUpperCase();

    for (const row of data) {
      if (row[0]?.toString().trim().toUpperCase() === normalizedArea) {
        return {
          activity: row[1],
          purpose: row[2],
          dataTypes: row[3],
          internalAreas: row[4],
          externalParties: row[5],
          systems: row[6],
          storageLocation: row[7],
          dataSource: row[8]
        };
      }
    }

    return {};
  } catch (error) {
    Logger.log(error);
    return { error: error.message };
  }
}

/**
 * Saves form data, uploads attachments to Drive
 * and sends notification email.
 * @param {Object} formData
 * @param {Array<{fileName, mimeType, fileContent}>} files
 * @returns {string}
 */
function saveFormSubmission(formData, files) {
  let uploadedFiles = [];
  let fileErrors = [];
  let blobs = [];

  try {
    const area = formData.area;
    const sheetMap = getAreaSheetIdMap();
    const targetSheetId = sheetMap.get(area.toUpperCase());

    if (!targetSheetId) {
      throw new Error(`No spreadsheet configured for area: ${area}`);
    }

    // Decode files
    if (files?.length) {
      files.forEach(file => {
        try {
          const decoded = Utilities.base64Decode(file.fileContent);
          blobs.push(
            Utilities.newBlob(decoded, file.mimeType, file.fileName)
          );
        } catch (err) {
          fileErrors.push(`Failed to process ${file.fileName}`);
        }
      });
    }

    // Save files to Drive
    if (blobs.length) {
      const folderMap = getAreaFolderIdMap();
      const folderId = folderMap.get(area.toUpperCase());

      if (!folderId) {
        fileErrors.push('Drive folder not configured');
      } else {
        const folder = DriveApp.getFolderById(folderId);
        blobs.forEach(blob => {
          try {
            const file = folder.createFile(blob);
            uploadedFiles.push(file.getName());
          } catch (err) {
            fileErrors.push(`Failed to save ${blob.getName()}`);
          }
        });
      }
    }

    // Save data to spreadsheet
    const spreadsheet = SpreadsheetApp.openById(targetSheetId);
    const sheet = spreadsheet.getSheetByName('Records');

    sheet.appendRow([
      'Pending',
      formData.department || 'N/A',
      formData.activity,
      formData.purpose,
      formData.dataTypes,
      formData.internalSharing,
      formData.internalAreas,
      formData.externalSharing,
      formData.externalParties,
      formData.systems,
      formData.storageLocation,
      formData.dataSource,
      formData.owner,
      formData.comments,
      formData.ownerEmail
    ]);

    // Notification email
    const recipients = getNotificationEmails();
    if (recipients) {
      const subject = `New RoPA submission – ${area}`;
      let body = `
        <p>A new record was submitted for <strong>${area}</strong>.</p>
        <p><strong>Activity:</strong> ${formData.activity}</p>
        <p><strong>Owner:</strong> ${formData.owner}</p>
      `;

      const emailOptions = { to: recipients, subject, htmlBody: body };

      if (blobs.length) {
        emailOptions.attachments = blobs;
      }

      GmailApp.sendEmail(
        recipients,
        subject,
        '',
        emailOptions
      );
    }

    let message = 'Submission completed successfully.';
    if (uploadedFiles.length) {
      message += ` Files uploaded: ${uploadedFiles.join(', ')}.`;
    }
    if (fileErrors.length) {
      message += ` Warnings: ${fileErrors.join(' | ')}.`;
    }

    return message;

  } catch (error) {
    Logger.log(error);
    return `Submission failed: ${error.message}`;
  }
}
