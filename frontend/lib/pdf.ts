import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type RoofData = {
  address: string;
  area_m2: number;
  area_ft2: number;
  solar: {
    month: string;
    month_num: number;
    energy_kwh: number;
    annual_total_kwh: number;
  }[];
  rainfall: {
    month: string;
    month_num: number;
    water_liters: number;
    water_gallons: number;
    annual_total_liters: number;
    annual_total_gallons: number;
  }[];
};

export async function generatePDF(data: RoofData): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a page to the document
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  
  // Get the standard fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set page margins
  const margin = 50;
  const contentWidth = page.getWidth() - margin * 2;
  
  // Draw title
  page.drawText('RoofM² Analysis Report', {
    x: margin,
    y: page.getHeight() - margin,
    size: 24,
    font: helveticaBold,
    color: rgb(0, 0, 0.6),
  });
  
  // Draw address
  page.drawText(`Address: ${data.address}`, {
    x: margin,
    y: page.getHeight() - margin - 40,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  // Draw summary section
  const summaryY = page.getHeight() - margin - 80;
  
  // Roof area box
  drawBox(
    page,
    margin,
    summaryY - 60,
    contentWidth / 3 - 10,
    60,
    rgb(0.9, 0.95, 1)
  );
  
  page.drawText('Roof Area', {
    x: margin + 10,
    y: summaryY - 20,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`${data.area_m2.toFixed(1)} m²`, {
    x: margin + 10,
    y: summaryY - 40,
    size: 16,
    font: helveticaBold,
    color: rgb(0, 0.4, 0.8),
  });
  
  page.drawText(`${data.area_ft2.toFixed(1)} ft²`, {
    x: margin + 10,
    y: summaryY - 60,
    size: 12,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Solar potential box
  drawBox(
    page,
    margin + contentWidth / 3,
    summaryY - 60,
    contentWidth / 3 - 10,
    60,
    rgb(1, 0.95, 0.8)
  );
  
  page.drawText('Solar Potential', {
    x: margin + contentWidth / 3 + 10,
    y: summaryY - 20,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`${Math.round(data.solar[0].annual_total_kwh)} kWh/year`, {
    x: margin + contentWidth / 3 + 10,
    y: summaryY - 40,
    size: 16,
    font: helveticaBold,
    color: rgb(0.8, 0.6, 0),
  });
  
  page.drawText('Assuming no shade', {
    x: margin + contentWidth / 3 + 10,
    y: summaryY - 60,
    size: 12,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Rainwater harvest box
  drawBox(
    page,
    margin + (contentWidth / 3) * 2,
    summaryY - 60,
    contentWidth / 3 - 10,
    60,
    rgb(0.9, 1, 0.9)
  );
  
  page.drawText('Rainwater Harvest', {
    x: margin + (contentWidth / 3) * 2 + 10,
    y: summaryY - 20,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`${Math.round(data.rainfall[0].annual_total_liters)} L/year`, {
    x: margin + (contentWidth / 3) * 2 + 10,
    y: summaryY - 40,
    size: 16,
    font: helveticaBold,
    color: rgb(0, 0.6, 0.3),
  });
  
  page.drawText(`${Math.round(data.rainfall[0].annual_total_gallons)} gal/year`, {
    x: margin + (contentWidth / 3) * 2 + 10,
    y: summaryY - 60,
    size: 12,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Monthly data section
  const tableY = summaryY - 100;
  page.drawText('Monthly Breakdown', {
    x: margin,
    y: tableY,
    size: 16,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Table headers
  const colWidths = [contentWidth * 0.25, contentWidth * 0.25, contentWidth * 0.25, contentWidth * 0.25];
  const startX = margin;
  let currentY = tableY - 30;
  
  // Header row
  page.drawText('Month', {
    x: startX,
    y: currentY,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Solar (kWh)', {
    x: startX + colWidths[0],
    y: currentY,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Rainfall (L)', {
    x: startX + colWidths[0] + colWidths[1],
    y: currentY,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Rainfall (gal)', {
    x: startX + colWidths[0] + colWidths[1] + colWidths[2],
    y: currentY,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Draw horizontal line
  page.drawLine({
    start: { x: startX, y: currentY - 10 },
    end: { x: startX + contentWidth, y: currentY - 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  
  // Table rows
  currentY -= 30;
  
  for (let i = 0; i < data.solar.length; i++) {
    const isEven = i % 2 === 0;
    
    if (isEven) {
      drawBox(
        page,
        startX,
        currentY - 5,
        contentWidth,
        20,
        rgb(0.95, 0.95, 0.95)
      );
    }
    
    page.drawText(data.solar[i].month, {
      x: startX,
      y: currentY,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(data.solar[i].energy_kwh.toFixed(1), {
      x: startX + colWidths[0],
      y: currentY,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(data.rainfall[i].water_liters.toFixed(1), {
      x: startX + colWidths[0] + colWidths[1],
      y: currentY,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(data.rainfall[i].water_gallons.toFixed(1), {
      x: startX + colWidths[0] + colWidths[1] + colWidths[2],
      y: currentY,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    currentY -= 20;
    
    // Check if we need to add a new page
    if (currentY < margin + 50 && i < data.solar.length - 1) {
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      currentY = newPage.getHeight() - margin - 40;
      
      // Add header to new page
      newPage.drawText('RoofM² Analysis Report - Continued', {
        x: margin,
        y: newPage.getHeight() - margin,
        size: 16,
        font: helveticaBold,
        color: rgb(0, 0, 0.6),
      });
      
      // Add table headers to new page
      currentY -= 30;
      newPage.drawText('Month', {
        x: startX,
        y: currentY,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      newPage.drawText('Solar (kWh)', {
        x: startX + colWidths[0],
        y: currentY,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      newPage.drawText('Rainfall (L)', {
        x: startX + colWidths[0] + colWidths[1],
        y: currentY,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      newPage.drawText('Rainfall (gal)', {
        x: startX + colWidths[0] + colWidths[1] + colWidths[2],
        y: currentY,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      // Draw horizontal line
      newPage.drawLine({
        start: { x: startX, y: currentY - 10 },
        end: { x: startX + contentWidth, y: currentY - 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      
      currentY -= 30;
      page = newPage;
    }
  }
  
  // Add footer
  page.drawText('Generated by RoofM² - No shade analysis included. For estimation purposes only.', {
    x: page.getWidth() / 2 - 180,
    y: margin / 2,
    size: 10,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Serialize the PDFDocument to bytes
  return await pdfDoc.save();
}

function drawBox(
  page: any,
  x: number,
  y: number,
  width: number,
  height: number,
  color: any
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
} 