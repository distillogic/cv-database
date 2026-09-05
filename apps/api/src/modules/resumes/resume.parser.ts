import fs from "node:fs/promises";

import mammoth from "mammoth";

const PDF_MIME_TYPE =
  "application/pdf";

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type PdfTextResult = {
  text: string;
};

type ModernPdfParser = {
  getText: () => Promise<PdfTextResult>;
  destroy?: () => Promise<void> | void;
};

type ModernPdfParserConstructor = new (
  options: {
    data: Buffer;
  }
) => ModernPdfParser;

type PdfParseModule = {
  PDFParse?: ModernPdfParserConstructor;

  default?: (
    data: Buffer
  ) => Promise<PdfTextResult>;
};

export async function extractResumeText(
  filePath: string,
  mimeType: string
): Promise<string> {
  if (mimeType === PDF_MIME_TYPE) {
    const text =
      await extractPdfText(filePath);

    return cleanExtractedText(text);
  }

  if (mimeType === DOCX_MIME_TYPE) {
    const text =
      await extractDocxText(filePath);

    return cleanExtractedText(text);
  }

  throw new Error(
    `Unsupported resume type: ${mimeType}`
  );
}

async function extractPdfText(
  filePath: string
): Promise<string> {
  const fileBuffer =
    await fs.readFile(filePath);

  const importedModule =
    await import("pdf-parse");

  const pdfModule =
    importedModule as unknown as PdfParseModule;

  // pdf-parse v2+
  if (pdfModule.PDFParse) {
    const parser =
      new pdfModule.PDFParse({
        data: fileBuffer,
      });

    try {
      const result =
        await parser.getText();

      return result.text;
    } finally {
      if (parser.destroy) {
        await parser.destroy();
      }
    }
  }

  // Older pdf-parse versions
  if (
    typeof pdfModule.default ===
    "function"
  ) {
    const result =
      await pdfModule.default(
        fileBuffer
      );

    return result.text;
  }

  throw new Error(
    "Unsupported pdf-parse version"
  );
}

async function extractDocxText(
  filePath: string
): Promise<string> {
  const result =
    await mammoth.extractRawText({
      path: filePath,
    });

  return result.value;
}

function cleanExtractedText(
  text: string
): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}