/**
 * Google Apps Script for MCQ Test Submission
 * 
 * Instructions:
 * 1. Open Google Sheets
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Save the project
 * 5. Deploy as Web App (Execute as: Me, Who has access: Anyone)
 * 6. Copy the Web App URL and use it in mcqService.js
 */

// Configuration - Update with your Sheet ID
const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // Replace with your Google Sheet ID
const MASTER_SHEET_NAME = 'MCQ Results'; // Main master sheet tab
// Note: Each college will have its own worksheet TAB (within the same Google Sheet file), named after the college
// Example: If you have colleges "KITE", "ABC College", "XYZ University", you'll have 3 tabs in the same spreadsheet

const SHEET_HEADERS = [
  'Timestamp',
  'Roll Number',
  'Name',
  'Email',
  'College',
  'Year',
  'Department',
  'Test ID',
  'Test Name',
  'Score',
  'Total Questions',
  'Correct Answers',
  'Incorrect Answers',
  'Percentage',
  'Time Taken',
  'Time Started',
  'Time Ended',
  'Submitted At',
  'Auto Submitted',
  'Auto Submit Reason',
  'Violation Count',
  'Total No Face',
  'Total Multiple Faces',
  'Violations Details'
];
const ROLL_NUMBER_COLUMN = SHEET_HEADERS.indexOf('Roll Number') + 1;
const TEST_ID_COLUMN = SHEET_HEADERS.indexOf('Test ID') + 1;
const SUBMITTED_AT_COLUMN = SHEET_HEADERS.indexOf('Submitted At') + 1;
const AUTO_SUBMIT_REASON_COLUMN = SHEET_HEADERS.indexOf('Auto Submit Reason') + 1;

/**
 * Main doPost function to handle POST requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'submitMCQ') {
      return handleMCQSubmission(data);
    } else if (action === 'syncMCQProgress') {
      return handleMCQProgressUpdate(data);
    } else {
      return createResponse(false, 'Invalid action', null);
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createResponse(false, 'Error processing request: ' + error.toString(), null);
  }
}

/**
 * Handle MCQ test submission
 * Creates separate worksheet tabs (within the same Google Sheet) for each college
 * Each college gets its own tab named after the college
 */
function handleMCQSubmission(data) {
  try {
    // Open the spreadsheet (same Google Sheet file)
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const masterSheet = getOrCreateSheet(ss, MASTER_SHEET_NAME);
    
    // Get college name and sanitize it for worksheet tab name
    const collegeName = data.college || 'Unknown';
    const sheetName = sanitizeSheetName(collegeName);
    
    // Check if a worksheet tab with this college name already exists
    const collegeSheet = getOrCreateSheet(ss, sheetName);
    
    // Check for duplicate submission
    const rollNumber = data.rollNumber || '';
    const testID = data.testID || '';
    
    if (checkDuplicateSubmission(masterSheet, rollNumber, testID)) {
      return createResponse(false, 'Duplicate submission: Test already submitted for this roll number and test ID', null);
    }
    
    // Parse violations if it's a string
    let violationsArray = [];
    if (data.violations) {
      try {
        violationsArray = typeof data.violations === 'string' ? JSON.parse(data.violations) : data.violations;
      } catch (e) {
        violationsArray = [];
      }
    }
    
    // Prepare row data (support both totalQuestions & total, and explicit violationsDetails)
    const rowData = buildRowData({
      timestamp: new Date(),
      rollNumber,
      name: data.name || '',
      email: data.email || '',
      college: data.college || '',
      year: data.year || '',
      department: data.department || '',
      testID,
      testName: data.testName || 'Unknown Test',
      score: data.score || 0,
      totalQuestions: (typeof data.totalQuestions === 'number' ? data.totalQuestions : data.total) || 0,
      correctAnswers: data.correctAnswers || 0,
      incorrectAnswers: data.incorrectAnswers || 0,
      percentage: data.percentage || 0,
      timeTaken: data.timeTaken || '',
      timeStarted: data.timeStarted || '',
      timeEnded: data.timeEnded || '',
      submittedAt: data.submittedAt || new Date().toISOString(),
      autoSubmitted: data.autoSubmitted || false,
      autoSubmitReason: data.autoSubmitReason || '',
      // Proctoring data
      violationCount: data.violationCount || 0,
      totalNoFace: data.totalNoFace || 0,
      totalMultipleFaces: data.totalMultipleFaces || 0,
      violationsDetails: data.violationsDetails || JSON.stringify(violationsArray)
    });
    
    const masterRow = updateOrInsertRow(masterSheet, rowData, rollNumber, testID, false);
    const collegeRow = updateOrInsertRow(collegeSheet, rowData, rollNumber, testID, false);
    
    Logger.log('MCQ submission recorded successfully for: ' + rollNumber + ' - Test: ' + testID + ' - College: ' + collegeName);
    
    return createResponse(true, 'Submission recorded successfully', {
      rowNumber: masterRow,
      sheetName: sheetName,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    Logger.log('Error in handleMCQSubmission: ' + error.toString());
    return createResponse(false, 'Error recording submission: ' + error.toString(), null);
  }
}

function handleMCQProgressUpdate(data) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const masterSheet = getOrCreateSheet(ss, MASTER_SHEET_NAME);
    const collegeSheet = getOrCreateSheet(ss, sanitizeSheetName(data.college || 'Unknown'));

    const rollNumber = data.rollNumber || '';
    const testID = data.testID || '';

    if (!rollNumber || !testID) {
      return createResponse(false, 'Missing rollNumber or testID for progress update', null);
    }

    const rowData = buildRowData({
      timestamp: data.timestamp || new Date(),
      rollNumber,
      name: data.name || '',
      email: data.email || '',
      college: data.college || '',
      year: data.year || '',
      department: data.department || '',
      testID,
      testName: data.testName || 'Unknown Test',
      score: data.score || 0,
      totalQuestions: (typeof data.totalQuestions === 'number' ? data.totalQuestions : data.total) || 0,
      correctAnswers: data.correctAnswers || 0,
      incorrectAnswers: data.incorrectAnswers || 0,
      percentage: data.percentage || 0,
      timeTaken: data.timeTaken || data.timeTakenFormatted || '',
      timeStarted: data.timeStarted || '',
      timeEnded: data.timeEnded || '',
      submittedAt: data.submittedAt || '',
      autoSubmitted: data.autoSubmitted || false,
      autoSubmitReason: data.autoSubmitReason || '',
      // Proctoring data (progress updates usually won't have these, but keep default-safe)
      violationCount: data.violationCount || 0,
      totalNoFace: data.totalNoFace || 0,
      totalMultipleFaces: data.totalMultipleFaces || 0,
      violationsDetails: data.violationsDetails || ''
    });

    updateOrInsertRow(masterSheet, rowData, rollNumber, testID, true);
    updateOrInsertRow(collegeSheet, rowData, rollNumber, testID, true);

    return createResponse(true, 'Progress synchronized successfully', null);
  } catch (error) {
    Logger.log('Error in handleMCQProgressUpdate: ' + error.toString());
    return createResponse(false, 'Error syncing progress: ' + error.toString(), null);
  }
}

/**
 * Sanitize sheet name to comply with Google Sheets naming rules
 * Sheet names cannot exceed 100 characters and cannot contain: [ ] / \ ? *
 */
function sanitizeSheetName(name) {
  if (!name || name.trim() === '') {
    return 'Unknown';
  }
  
  // Remove invalid characters
  let sanitized = name.replace(/[\[\]/\\?*]/g, '');
  
  // Trim to 100 characters (Google Sheets limit)
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // If empty after sanitization, use default
  if (sanitized === '') {
    return 'Unknown';
  }
  
  return sanitized;
}

function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setValues([SHEET_HEADERS]);
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setBackground('#4285f4');
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, SHEET_HEADERS.length);
    Logger.log('✅ Created worksheet tab "' + sheetName + '"');
  } else {
    Logger.log('Using existing worksheet tab "' + sheetName + '"');
  }
  return sheet;
}

function resizeColumns(sheet) {
  sheet.autoResizeColumns(1, SHEET_HEADERS.length);
}

function buildRowData(data) {
  const percentageDecimal = (data.percentage || 0) / 100;
  const totalQuestions = typeof data.totalQuestions === 'number' ? data.totalQuestions : (data.total || 0);
  return [
    data.timestamp ? new Date(data.timestamp) : new Date(),
    data.rollNumber || '',
    data.name || '',
    data.email || '',
    data.college || '',
    data.year || '',
    data.department || '',
    data.testID || '',
    data.testName || 'Unknown Test',
    data.score || 0,
    totalQuestions,
    data.correctAnswers || 0,
    data.incorrectAnswers || 0,
    percentageDecimal,
    data.timeTaken || '',
    data.timeStarted || '',
    data.timeEnded || '',
    data.submittedAt ? new Date(data.submittedAt) : '',
    data.autoSubmitted ? 'Yes' : 'No',
    data.autoSubmitReason || '',
    // Proctoring data
    data.violationCount || 0,
    data.totalNoFace || 0,
    data.totalMultipleFaces || 0,
    data.violationsDetails || ''
  ];
}

function findRowIndex(sheet, rollNumber, testID) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const existingRollNumber = row[ROLL_NUMBER_COLUMN - 1];
    const existingTestID = row[TEST_ID_COLUMN - 1];
    if (existingRollNumber === rollNumber && existingTestID === testID) {
      return i + 1;
    }
  }
  return -1;
}

function updateOrInsertRow(sheet, rowData, rollNumber, testID, isProgress) {
  const rowIndex = findRowIndex(sheet, rollNumber, testID);
  if (rowIndex === -1) {
    sheet.appendRow(rowData);
    const lastRow = sheet.getLastRow();
    formatRow(sheet, lastRow);
    resizeColumns(sheet);
    return lastRow;
  }

  const submittedAtValue = sheet.getRange(rowIndex, SUBMITTED_AT_COLUMN).getValue();
  if (submittedAtValue && submittedAtValue !== '' && isProgress) {
    Logger.log('Row already marked as submitted. Skipping progress update.');
    return rowIndex;
  }

  sheet.getRange(rowIndex, 1, 1, SHEET_HEADERS.length).setValues([rowData]);
  formatRow(sheet, rowIndex);
  resizeColumns(sheet);
  return rowIndex;
}

/**
 * Check if submission already exists (duplicate check)
 */
function checkDuplicateSubmission(sheet, rollNumber, testID) {
  try {
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const existingRollNumber = row[ROLL_NUMBER_COLUMN - 1];
      const existingTestID = row[TEST_ID_COLUMN - 1];
      const submittedAtValue = row[SUBMITTED_AT_COLUMN - 1];
      
      if (existingRollNumber === rollNumber && existingTestID === testID) {
        if (submittedAtValue && submittedAtValue !== '') {
          Logger.log('Duplicate found: Roll Number ' + rollNumber + ' already submitted Test ID ' + testID);
          return true;
        }
        return false;
      }
    }
    
    return false;
  } catch (error) {
    Logger.log('Error checking duplicate: ' + error.toString());
    return false; // Allow submission if check fails
  }
}

/**
 * Format a row in the sheet
 */
function formatRow(sheet, rowNumber) {
  try {
    const range = sheet.getRange(rowNumber, 1, 1, SHEET_HEADERS.length);
    
    // Alternate row colors for better readability
    if (rowNumber % 2 === 0) {
      range.setBackground('#f8f9fa');
    } else {
      range.setBackground('#ffffff');
    }
    
    // Format percentage column (column N)
    const percentageCell = sheet.getRange(rowNumber, 14);
    percentageCell.setNumberFormat('0.00%');
    
    // Format timestamp columns
    const timestampCell = sheet.getRange(rowNumber, 1);
    timestampCell.setNumberFormat('yyyy-mm-dd hh:mm:ss');
    
  } catch (error) {
    Logger.log('Error formatting row: ' + error.toString());
  }
}

/**
 * Create JSON response
 */
function createResponse(success, message, data) {
  const response = {
    success: success,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - Run this to test the script
 */
function testMCQSubmission() {
  const testData = {
    action: 'submitMCQ',
    rollNumber: '22CSB01',
    name: 'Test Student',
    email: 'test@example.com',
    college: 'KITE',
    year: '2K26',
    department: 'CSE',
    testID: 'MCQ001',
    testName: 'Test 1 - Time And Work',
    score: 18,
    total: 25,
    correctAnswers: 18,
    incorrectAnswers: 7,
    percentage: 72,
    timeTaken: '12m 15s',
    timeStarted: new Date().toISOString(),
    timeEnded: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    autoSubmitted: false
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

/**
 * Setup function - Creates a sample sheet for a college
 * Note: Sheets are now created automatically per college when submissions are made
 * This function can be used to create a sample sheet structure
 */
function setupSheet() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Create a sample sheet for testing (you can modify the college name)
    const sampleCollegeName = 'Sample College';
    const sheetName = sanitizeSheetName(sampleCollegeName);
    getOrCreateSheet(ss, sheetName);
    
    Logger.log('Sample sheet setup completed successfully for: ' + sampleCollegeName);
    Logger.log('Note: Sheets are automatically created per college when submissions are made.');
  } catch (error) {
    Logger.log('Error in setupSheet: ' + error.toString());
  }
}

