
export class DriveService {
  static async uploadImage(base64Data: string, fileName: string, accessToken: string, folderId?: string) {
    const boundary = 'foo_bar_baz';
    const mimeType = 'image/png';
    
    // Remove the data:image/png;base64, prefix
    const base64Content = base64Data.split(',')[1] || base64Data;

    const metadata = {
      name: fileName,
      parents: folderId ? [folderId] : []
    };

    const multipartRequestBody =
      `--${boundary}
` +
      `Content-Type: application/json; charset=UTF-8

` +
      `${JSON.stringify(metadata)}
` +
      `--${boundary}
` +
      `Content-Type: ${mimeType}
` +
      `Content-Transfer-Encoding: base64

` +
      `${base64Content}
` +
      `--${boundary}--`;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Drive upload failed: ${error.error?.message || response.statusText}`);
    }

    const json = await response.json();
    console.log('Drive Upload Response:', json);
    return json;
  }

  static async findOrCreateFolder(folderName: string, accessToken: string): Promise<string> {
    const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Drive findFolder failed:', error);
        throw new Error(`Drive findFolder failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    // Create folder
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    const folderData = await createResponse.json();
    return folderData.id;
  }

  static async listFiles(folderId: string, accessToken: string) {
    const query = `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
    const fields = 'files(id, name, thumbnailLink, webViewLink, createdTime)';
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=createdTime desc`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Drive listFiles failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  }
}
