const textFileTypes = new Set(['.txt', '.md', '.markdown', '.csv']);

export async function extractTextFromUpload(file) {
  const extension = getExtension(file.name);

  if (textFileTypes.has(extension)) {
    return file.text();
  }

  if (extension === '.docx') {
    const mammoth = await import('mammoth');
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  if (extension === '.pdf') {
    const pdfParse = await import('pdf-parse');
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await pdfParse.default(buffer);
    return result.text || '';
  }

  throw new Error(`Unsupported file type: ${file.name}`);
}

function getExtension(filename = '') {
  const match = filename.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] || '';
}
