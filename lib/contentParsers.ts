/**
 * Parse PDF file and extract text
 */
export async function parsePDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker path
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText.trim();
}

/**
 * Parse DOCX file and extract text
 */
export async function parseDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Scrape text from URL
 */
export async function scrapeURL(url: string): Promise<string> {
  try {
    // For client-side, we'll need a proxy API route
    // This will be handled by an API route
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to scrape URL');
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    throw new Error(`Failed to scrape URL: ${error}`);
  }
}

/**
 * Parse text file
 */
export async function parseTextFile(file: File): Promise<string> {
  return await file.text();
}

/**
 * Handle file upload and parse based on type
 */
export async function parseFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return await parsePDF(file);
    case 'docx':
    case 'doc':
      return await parseDOCX(file);
    case 'txt':
      return await parseTextFile(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}


