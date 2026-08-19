# Backend Setup — Google Drive + Apps Script

This guide walks through setting up the free serverless backend that receives photo uploads from the PWA and stores them in Google Drive with metadata in Google Sheets.

## Prerequisites

- A Google account
- The deployment URL from the PWA (you'll set this as `VITE_GAS_WEBHOOK_URL`)

## Step 1: Create Google Drive Folder

1. Open [Google Drive](https://drive.google.com)
2. Create a new folder named **Kendra & Diego Wedding 2026**
3. Open the folder and copy the **Folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
                                        ^^^^^^^^^^^^^^^
   ```

## Step 2: Create Metadata Sheet

1. Inside the **Kendra & Diego Wedding 2026** folder, create a new **Google Sheet** named **Wedding_Live_Feed_DB**
2. Rename the first tab to **Feed**
3. Create the header row in row 1:

| A1 | B1 | C1 | D1 | E1 | F1 |
|----|----|----|----|----|-----|
| Timestamp | Phase | ImageUrl | FileId | Transcript | AudioFileId |

4. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
                                   ^^^^^^^^^^^^^^^
   ```

## Step 3: Deploy Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Rename the project to **Wedding_Photo_Backend**
4. Replace the editor contents with this code:

```javascript
const PARENT_FOLDER_ID = "YOUR_GOOGLE_DRIVE_PARENT_FOLDER_ID";
const SPREADSHEET_ID = "YOUR_GOOGLE_SHEET_ID";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    const phaseName = data.phaseName || "00_General";

    // Auto-create or resolve phase subfolder
    const folderIter = parentFolder.getFoldersByName(phaseName);
    const targetFolder = folderIter.hasNext()
      ? folderIter.next()
      : parentFolder.createFolder(phaseName);

    // Save Image
    const imgBase64 = data.image.includes(",")
      ? data.image.split(",")[1]
      : data.image;
    const imgBlob = Utilities.newBlob(
      Utilities.base64Decode(imgBase64),
      "image/jpeg",
      `PHOTO_${Date.now()}.jpg`
    );
    const imageFile = targetFolder.createFile(imgBlob);
    imageFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const directImageUrl =
      "https://lh3.googleusercontent.com/d/" + imageFile.getId();

    // Optional Audio Voice Memo
    let audioFileId = "";
    if (data.audio) {
      const audioBase64 = data.audio.includes(",")
        ? data.audio.split(",")[1]
        : data.audio;
      const audioBlob = Utilities.newBlob(
        Utilities.base64Decode(audioBase64),
        data.audioMimeType || "audio/webm",
        `VOICE_${Date.now()}.webm`
      );
      const audioFile = targetFolder.createFile(audioBlob);
      audioFileId = audioFile.getId();
    }

    // Append to Google Sheet Live Feed DB
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Feed");
    sheet.appendRow([
      new Date().toISOString(),
      phaseName,
      directImageUrl,
      imageFile.getId(),
      data.transcript || "",
      audioFileId,
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "success",
        imageUrl: directImageUrl,
        fileId: imageFile.getId(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Feed");
    const rows = sheet.getDataRange().getValues();
    rows.shift(); // Remove header row

    const feed = rows
      .map((r) => ({
        timestamp: r[0],
        phase: r[1],
        imageUrl: r[2],
        fileId: r[3],
        transcript: r[4],
        audioFileId: r[5],
      }))
      .reverse();

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "success",
        feed: feed,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

5. Update `PARENT_FOLDER_ID` with your Drive Folder ID
6. Update `SPREADSHEET_ID` with your Sheet ID

## Step 4: Deploy as Web App

1. Click **Deploy** > **New Deployment**
2. Select type: **Web App**
3. Configure:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Authorize the permissions when prompted
6. Copy the **Deployment URL** (looks like `https://script.google.com/macros/s/.../exec`)

## Step 5: Set Environment Variable

Add the deployment URL to your `.env` file:

```
VITE_GAS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

For Cloudflare/Vercel deployments, add this as an environment variable in the dashboard.

## Step 6: Test the Backend

### Test POST (photo upload)

```bash
curl -X POST \
  'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec' \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "phaseName": "01_Ceremony",
    "transcript": "Congratulations!",
    "audio": "",
    "audioMimeType": "audio/webm"
  }'
```

### Test GET (fetch feed)

```bash
curl 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
```

Expected response:
```json
{
  "status": "success",
  "feed": [
    {
      "timestamp": "2026-09-11T17:30:00.000Z",
      "phase": "01_Ceremony",
      "imageUrl": "https://lh3.googleusercontent.com/d/FILE_ID",
      "fileId": "FILE_ID",
      "transcript": "Congratulations!",
      "audioFileId": ""
    }
  ]
}
```

## Google Drive Folder Structure

After guests upload photos, your Drive folder will automatically organize into:

```
Kendra & Diego Wedding 2026/
├── 00_Pre_Ceremony/
│   ├── PHOTO_1726082400000.jpg
│   └── VOICE_1726082400001.webm
├── 01_Ceremony/
│   ├── PHOTO_1726086000000.jpg
│   └── ...
├── 02_Cocktail_Hour/
│   └── ...
├── 03_Reception_Party/
│   └── ...
└── Wedding_Live_Feed_DB.xlsx
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 403 error on deploy | Re-authorize permissions; ensure "Who has access" is set to "Anyone" |
| Images not appearing in Drive | Check Apps Script logs (Executions) for errors |
| Sheet not updating | Ensure the tab is named exactly "Feed" (case-sensitive) |
| CORS errors from PWA | The PWA sends `Content-Type: text/plain` to bypass CORS; ensure your fetch uses this content type |
| `SyntaxError: Unexpected token` | Ensure the POST body is valid JSON wrapped in `JSON.stringify()` |
