import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';

// ── Template mapping by docType ──────────────────────────────────────────────
const TEMPLATE_MAP = {
  'clearance':              'clearance-template.docx',
  'clearance-no-derogatory': 'clearance-no-derogatory-template.docx',
  'indigency':              'indigency-template.docx',
  'residency':              'residency-template.docx',
};

// ── Transparent 1×1 PNG fallback (used when no photo is provided) ────────────
const TRANSPARENT_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
  'Nl7BcQAAAABJRU5ErkJggg==',
  'base64'
);

export async function POST(request) {
  try {
    const data = await request.json();

    // Resolve template filename from the docType field
    const docType      = data.docType || 'clearance';
    const templateFile = TEMPLATE_MAP[docType];

    if (!templateFile) {
      return NextResponse.json(
        { error: `Unknown document type: "${docType}". Valid types: ${Object.keys(TEMPLATE_MAP).join(', ')}` },
        { status: 400 }
      );
    }

    const templatePath = path.join(process.cwd(), 'templates', templateFile);

    // Check if the template file exists
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: `Template not found: ${templateFile}. Please place your .docx template in the /templates directory.` },
        { status: 404 }
      );
    }

    // Read the template
    const templateContent = fs.readFileSync(templatePath, 'binary');

    // ── Image Module Configuration ─────────────────────────────────────────
    const imageOpts = {
      centered: false,
      fileType: 'docx',
      getImage: function (tagValue) {
        // If the tag value is a base64 Data URL, extract and decode it
        if (tagValue && tagValue.startsWith('data:image')) {
          const base64str = tagValue.split(',')[1];
          return Buffer.from(base64str, 'base64');
        }
        // Fallback: transparent 1×1 pixel so the template renders cleanly
        return TRANSPARENT_1PX;
      },
      getSize: function () {
        // Force passport-sized photo: 120×120 px ≈ 1.25 × 1.25 inches at 96 DPI
        return [120, 120];
      },
    };
    const imageModule = new ImageModule(imageOpts);

    // Initialize PizZip and Docxtemplater with the image module
    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule],
    });

    // Render the document — pass the entire payload so any tag in the
    // template gets filled regardless of which template is used.
    // If photo is empty, the image module will use the transparent fallback.
    doc.render(data);

    // Generate the output buffer
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Build a clean filename
    const safeName = (data.residentName || 'Document').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    const filename = `${data.trackingNo || 'DOC'}_${safeName}.docx`;

    // Return the generated document
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });
  } catch (error) {
    console.error('DOCX generation error:', error);

    // Docxtemplater-specific errors (e.g. missing tags)
    if (error.properties && error.properties.errors) {
      const templateErrors = error.properties.errors.map((e) => ({
        message: e.message,
        tag: e.properties?.tag,
      }));
      return NextResponse.json({ error: 'Template rendering failed.', details: templateErrors }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to generate document.' }, { status: 500 });
  }
}
