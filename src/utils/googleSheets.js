export async function findOrCreateFolder(token, name) {
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Drive folder search failed: ${await res.text()}`);
  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: name,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });
  if (!createRes.ok) throw new Error(`Folder creation failed: ${await createRes.text()}`);
  const createData = await createRes.json();
  return createData.id;
}

export async function findOrCreateSpreadsheet(token, folderId, name) {
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.spreadsheet' and name='${name}' and '${folderId}' in parents and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: name }
    })
  });
  const createData = await createRes.json();
  const spreadsheetId = createData.spreadsheetId;

  // Move spreadsheet to folder
  await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });

  return spreadsheetId;
}

export async function findOrCreateSheet(token, spreadsheetId, sheetTitle) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const sheet = data.sheets.find(s => s.properties.title === sheetTitle);
  
  if (sheet) {
    return { sheetId: sheet.properties.sheetId, isNew: false, sheetProps: sheet.properties };
  }

  // Create new sheet tab
  const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [{
        addSheet: {
          properties: { title: sheetTitle }
        }
      }]
    })
  });
  const addData = await addRes.json();
  return { sheetId: addData.replies[0].addSheet.properties.sheetId, isNew: true };
}

function getColumnLetter(colIndex) {
  let temp, letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    red: parseInt(h.substring(0, 2), 16) / 255,
    green: parseInt(h.substring(2, 4), 16) / 255,
    blue: parseInt(h.substring(4, 6), 16) / 255,
  };
}

function getRgbColor(colorStr) {
  if (!colorStr) return { red: 0.95, green: 0.95, blue: 0.95 };
  if (colorStr.startsWith('#')) return hexToRgb(colorStr);
  
  // Map our cozy CSS variable themes to light RGB tints for Sheets
  if (colorStr.includes('peach') || colorStr.includes('orange')) return hexToRgb('#fef3e6'); // Very light peach
  if (colorStr.includes('blue') || colorStr.includes('slate')) return hexToRgb('#eef3f9');  // Very light blue
  if (colorStr.includes('rose') || colorStr.includes('red')) return hexToRgb('#fef0f2');    // Very light pink
  if (colorStr.includes('sage') || colorStr.includes('mint')) return hexToRgb('#eef7f2');   // Very light sage
  if (colorStr.includes('lavender') || colorStr.includes('purple')) return hexToRgb('#f5f2fb'); // Very light purple
  if (colorStr.includes('yellow')) return hexToRgb('#fdf9e6'); // Very light yellow
  
  return { red: 0.96, green: 0.96, blue: 0.96 }; // Default light grey
}

export async function populateSheet(token, spreadsheetId, sheetId, monthName, habits, targetDate) {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Prepare headers
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const dayNames = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  });

  const lastColLetter = getColumnLetter(daysInMonth + 1);
  const totalColLetter = getColumnLetter(daysInMonth + 2);
  const graphColLetter = getColumnLetter(daysInMonth + 3);

  // Values matrix
  const values = [];
  
  // Row 1: Month Title
  const row1 = ['', monthName];
  values.push(row1);
  
  // Row 2: Day Numbers
  const row2 = ['', ...dayNumbers, 'Total', 'Trend'];
  values.push(row2);
  
  // Row 3: Day Names
  const row3 = ['', ...dayNames, '', ''];
  values.push(row3);

  // Row 4+: Habits
  habits.forEach((habit, index) => {
    const rowNum = 4 + index;
    const row = [`${habit.name}`];
    
    // Checkboxes / True/False
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isCompleted = (habit.completedDates || []).includes(d.toDateString());
      row.push(isCompleted);
    }
    
    // Total formula
    row.push(`=COUNTIF(B${rowNum}:${lastColLetter}${rowNum}, TRUE)`);
    // Sparkline formula
    row.push(`=SPARKLINE(${totalColLetter}${rowNum}, {"charttype","bar";"max",${daysInMonth};"color1","#111111"})`);
    
    values.push(row);
  });

  // Check for time-tracked habits
  const timeHabits = habits.filter(h => h.requiresTime);
  let timeStartRowIndex = -1;

  if (timeHabits.length > 0) {
    values.push([]); // Empty row as gap
    
    timeStartRowIndex = values.length; // 0-indexed for batchUpdate
    
    // Put 'Time Spent (minutes)' in the first data column (index 1) so we can merge it
    const timeHeaderRow = ['', 'Time Spent (minutes)', ...Array.from({length: daysInMonth - 1}, () => ''), 'Total', ''];
    values.push(timeHeaderRow);

    timeHabits.forEach((habit, index) => {
      const rowNum = timeStartRowIndex + 2 + index; // +1 for 1-index, +1 for header row
      const row = [`${habit.name}`];
      
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const timeSpent = (habit.timeRecords && habit.timeRecords[d.toDateString()]) || 0;
        row.push(timeSpent === 0 ? '' : timeSpent);
      }
      
      row.push(`=INT(SUM(B${rowNum}:${lastColLetter}${rowNum})/60) & " hr " & MOD(SUM(B${rowNum}:${lastColLetter}${rowNum}), 60) & " min"`);
      row.push(''); // No sparkline for time yet, or could add one
      
      values.push(row);
    });
  }

  // Write values
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${monthName}!A1:${graphColLetter}${values.length}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  // Apply beautiful formatting via batchUpdate
  const batchRequests = [];

  // Merge Row 1 for Month title
  batchRequests.push({
    mergeCells: {
      range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 1, endColumnIndex: daysInMonth + 3 },
      mergeType: "MERGE_ALL"
    }
  });

  // Format Month Title
  batchRequests.push({
    repeatCell: {
      range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 1, endColumnIndex: daysInMonth + 3 },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.4, green: 0.8, blue: 0.8 }, // Cyan header
          textFormat: { bold: true, fontSize: 14 },
          horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE"
        }
      },
      fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)"
    }
  });

  // Format Days Header (Numbers and Names)
  batchRequests.push({
    repeatCell: {
      range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: daysInMonth + 1 },
      cell: {
        userEnteredFormat: {
          textFormat: { fontSize: 9 },
          horizontalAlignment: "CENTER",
        }
      },
      fields: "userEnteredFormat(textFormat,horizontalAlignment)"
    }
  });

  if (habits.length > 0) {
    // Add Checkboxes to Habit Area
    batchRequests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: 3, endRowIndex: 3 + habits.length, startColumnIndex: 1, endColumnIndex: daysInMonth + 1 },
        cell: {
          dataValidation: {
            condition: { type: "BOOLEAN" },
            showCustomUi: true
          },
          userEnteredFormat: {
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE"
          }
        },
        fields: "dataValidation,userEnteredFormat(horizontalAlignment,verticalAlignment)"
      }
    });

    // Habit Names alignment right
    batchRequests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: 3, endRowIndex: 3 + habits.length, startColumnIndex: 0, endColumnIndex: 1 },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: "RIGHT",
            textFormat: { bold: true },
            padding: { right: 10 }
          }
        },
        fields: "userEnteredFormat(horizontalAlignment,textFormat,padding)"
      }
    });

    // Habit Row Colors
    habits.forEach((habit, index) => {
      const rgbColor = getRgbColor(habit.color);
      batchRequests.push({
        repeatCell: {
          range: { sheetId: sheetId, startRowIndex: 3 + index, endRowIndex: 4 + index, startColumnIndex: 0, endColumnIndex: daysInMonth + 2 },
          cell: {
            userEnteredFormat: {
              backgroundColor: rgbColor
            }
          },
          fields: "userEnteredFormat(backgroundColor)"
        }
      });
    });
  }

  if (timeStartRowIndex !== -1 && timeHabits.length > 0) {
    // Whole Time Table Background
    batchRequests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: timeStartRowIndex, endRowIndex: timeStartRowIndex + 1 + timeHabits.length, startColumnIndex: 0, endColumnIndex: daysInMonth + 2 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.97, green: 0.95, blue: 0.91 } // Very light warm sand tint
          }
        },
        fields: "userEnteredFormat(backgroundColor)"
      }
    });

    // Merge Time Section Header across all day columns
    batchRequests.push({
      mergeCells: {
        range: { sheetId: sheetId, startRowIndex: timeStartRowIndex, endRowIndex: timeStartRowIndex + 1, startColumnIndex: 1, endColumnIndex: daysInMonth + 1 },
        mergeType: "MERGE_ALL"
      }
    });

    // Time Section Header Formatting
    batchRequests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: timeStartRowIndex, endRowIndex: timeStartRowIndex + 1, startColumnIndex: 1, endColumnIndex: daysInMonth + 2 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.82, green: 0.78, blue: 0.73 }, // Stronger warm tint
            textFormat: { bold: true, foregroundColor: { red: 0.1, green: 0.1, blue: 0.1 } },
            horizontalAlignment: "CENTER"
          }
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
      }
    });

    // Time Habit Names
    batchRequests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: timeStartRowIndex + 1, endRowIndex: timeStartRowIndex + 1 + timeHabits.length, startColumnIndex: 0, endColumnIndex: 1 },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: "RIGHT",
            textFormat: { bold: true },
            padding: { right: 10 }
          }
        },
        fields: "userEnteredFormat(horizontalAlignment,textFormat,padding)"
      }
    });

    // Time Numbers Center
    batchRequests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: timeStartRowIndex + 1, endRowIndex: timeStartRowIndex + 1 + timeHabits.length, startColumnIndex: 1, endColumnIndex: daysInMonth + 2 },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: "CENTER",
            numberFormat: { type: "NUMBER", pattern: "#,##0" }
          }
        },
        fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
      }
    });
  }

  // Column width adjustments
  batchRequests.push({
    updateDimensionProperties: {
      range: { sheetId: sheetId, dimension: "COLUMNS", startIndex: 1, endIndex: daysInMonth + 1 },
      properties: { pixelSize: 36 }, // Widen day columns
      fields: "pixelSize"
    }
  });
  batchRequests.push({
    updateDimensionProperties: {
      range: { sheetId: sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 1 },
      properties: { pixelSize: 150 }, // Wider habit names
      fields: "pixelSize"
    }
  });
  batchRequests.push({
    updateDimensionProperties: {
      range: { sheetId: sheetId, dimension: "COLUMNS", startIndex: daysInMonth + 2, endIndex: daysInMonth + 3 },
      properties: { pixelSize: 150 }, // Wider graph column
      fields: "pixelSize"
    }
  });

  // Freeze Row and Column
  batchRequests.push({
    updateSheetProperties: {
      properties: {
        sheetId: sheetId,
        gridProperties: {
          frozenRowCount: 3,
          frozenColumnCount: 1
        }
      },
      fields: "gridProperties.frozenRowCount,gridProperties.frozenColumnCount"
    }
  });

  // Send batch formatting
  const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests: batchRequests })
  });
  if (!batchRes.ok) throw new Error(`Batch formatting failed: ${await batchRes.text()}`);
}

export async function syncToGoogleSheets(token, habits) {
  if (!token) throw new Error('No Google token available. Please reconnect Google in the Profile tab.');
  
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // 1. Folder
  const folderId = await findOrCreateFolder(token, 'Habit Tracker Analytics');

  // 2. Spreadsheet
  const spreadsheetName = `Habit Tracker ${year}`;
  const spreadsheetId = await findOrCreateSpreadsheet(token, folderId, spreadsheetName);

  // 3. Sheet
  const { sheetId } = await findOrCreateSheet(token, spreadsheetId, monthName);

  // 4. Populate
  await populateSheet(token, spreadsheetId, sheetId, monthName, habits, currentDate);
  
  return spreadsheetId; // Return so we can link to it
}
