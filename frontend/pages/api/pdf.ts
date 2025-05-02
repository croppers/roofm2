import type { NextApiRequest, NextApiResponse } from 'next';
import { generatePDF } from '../../lib/pdf';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    if (!data || !data.address || !data.area_m2 || !data.solar || !data.rainfall) {
      return res.status(400).json({ detail: 'Invalid data provided' });
    }

    const pdfBytes = await generatePDF(data);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=roof-report-${Date.now()}.pdf`);
    res.setHeader('Content-Length', pdfBytes.length);

    // Send the PDF
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ detail: 'Failed to generate PDF' });
  }
} 