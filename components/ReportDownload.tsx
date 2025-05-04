'use client';
import { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { ChartOptions } from 'chart.js';
import { useSearchParams } from 'next/navigation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ReportDownloadProps {
  address: string;
  areaSqm: number;
  monthlySolar: Record<string, number>;   // keys '1'..'12'
  monthlyPrecip: Record<string, number>;
  mapImageDataUrl: string | null;
}

export default function ReportDownload({ address, areaSqm, monthlySolar, monthlyPrecip, mapImageDataUrl }: ReportDownloadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const units = searchParams?.get('units') === 'imperial' ? 'imperial' : 'metric';

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const solarData = months.map((_,i) => monthlySolar[String(i+1)] ?? 0);
  const precipData = months.map((_,i) => monthlyPrecip[String(i+1)] ?? 0);
  
  // Convert precipitation data if using imperial units
  const displayPrecipData = units === 'imperial' 
    ? precipData.map(value => value * 0.0393701) // mm to inches
    : precipData;
    
  const precipUnitText = units === 'imperial' ? 'Precip (inches/day)' : 'Precip (mm/day)';
  const waterUnitText = units === 'imperial' ? 'Water (gal/day)' : 'Water (L/day)';

  // Combined chart options with twin axes (linear scales are default)
  const combinedOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Energy and Precipitation Climatologies',
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: {
          bottom: 10
        }
      },
      legend: {
        labels: {
          boxWidth: 10,
          font: {
            size: 11
          }
        }
      }
    },
    scales: {
      y: { 
        position: 'left', 
        title: { 
          display: true, 
          text: 'Solar (W/m²/day)',
          font: {
            size: 11
          }
        } 
      },
      y1:{ 
        position: 'right', 
        title: { 
          display: true, 
          text: precipUnitText,
          font: {
            size: 11
          }
        }, 
        grid:{ 
          drawOnChartArea: false 
        } 
      }
    }
  };
  
  const combinedData = {
    labels: months,
    datasets: [
      { label: 'Solar', data: solarData, borderColor: 'rgba(59,130,246,1)', yAxisID:'y' },
      { label: 'Precip', data: displayPrecipData, borderColor: 'rgba(16,185,129,1)', yAxisID:'y1' }
    ]
  };

  // Calculate water collection values based on area
  const waterCollectionData = units === 'imperial'
    ? precipData.map(v => v * areaSqm * 0.264172) // L to gallons
    : precipData.map(v => v * areaSqm); // L/day

  const areaOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Adjusted for Selected Roof Area',
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: {
          bottom: 10
        }
      },
      legend: {
        labels: {
          boxWidth: 10,
          font: {
            size: 11
          }
        }
      }
    },
    scales: {
      y: { 
        position: 'left', 
        title: { 
          display: true, 
          text: 'Energy (kW/day)',
          font: {
            size: 11
          }
        } 
      },
      y1: { 
        position: 'right', 
        title: { 
          display: true, 
          text: waterUnitText,
          font: {
            size: 11
          }
        }, 
        grid: { 
          drawOnChartArea: false 
        } 
      }
    }
  };
  
  const areaData = {
    labels: months,
    datasets: [
      { label: 'Energy (kW/day)', data: solarData.map(v => (v * areaSqm) / 1000), borderColor: 'rgba(59,130,246,0.6)', yAxisID: 'y' },
      { label: units === 'imperial' ? 'Water (gal/day)' : 'Water (L/day)', data: waterCollectionData, borderColor: 'rgba(16,185,129,0.6)', yAxisID: 'y1' }
    ]
  };

  const downloadPDF = async () => {
    if (!chartsRef.current) return;

    try {
      const doc = new jsPDF('p', 'mm', 'letter');
      const pageHeight = doc.internal.pageSize.getHeight();
      const usableWidth = 190; // doc width (210mm) - 2*10mm margin
      let currentY = 10; 

      // Add Logo
      try {
        const logoResponse = await fetch('/@roofm2_logo.svg');
        if (logoResponse.ok) {
          const logoSvg = await logoResponse.text();
          const logoDataUrl = `data:image/svg+xml;base64,${btoa(logoSvg)}`;
          doc.addImage(logoDataUrl, 'SVG', 10, currentY, 40, 15);
          currentY += 20;
        } else {
          console.warn('Logo not found, continuing without it');
          currentY += 5;
        }
      } catch (error) {
        console.warn('Failed to add logo:', error);
        currentY += 5;
      }
      
      // Add Title and Date
      doc.setFontSize(16);
      doc.text(`Roofm² Report for ${address}`, 10, currentY + 5);
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(formattedDate, 10, currentY + 13);
      currentY += 20; // Update Y after title block
      
      // Define max height for map (e.g., ~40% of remaining page height)
      const spaceAfterHeader = pageHeight - currentY - 10; // -10 for bottom margin
      const maxMapHeight = spaceAfterHeader * 0.5; // Max height for map ~50% of available space
      
      // Add Map Screenshot if available
      if (mapImageDataUrl) {
        try {
          const img = new Image();
          img.src = mapImageDataUrl;
          await img.decode(); 
          let finalMapWidth = usableWidth; // Start with max width
          let imgHeight = (img.height * finalMapWidth) / img.width; // Calculate proportional height

          // If proportional height exceeds max allowed height, recalculate width based on max height
          if (imgHeight > maxMapHeight) {
            imgHeight = maxMapHeight; // Set height to max
            finalMapWidth = (img.width * imgHeight) / img.height; // Calculate proportional width
          }
          
          // Center the image horizontally if width is less than max
          const mapX = 10 + (usableWidth - finalMapWidth) / 2;
          const mapY = currentY + 5; // Position with padding
          doc.addImage(mapImageDataUrl, 'PNG', mapX, mapY, finalMapWidth, imgHeight);
          currentY = mapY + imgHeight; // Update Y position
        } catch (e) {
          console.error("Error adding map image to PDF:", e);
        }
      }
      
      // Capture and Add Charts Image
      const canvas = await html2canvas(chartsRef.current);
      const chartImgData = canvas.toDataURL('image/png');
      const chartImg = new Image();
      chartImg.src = chartImgData;
      await chartImg.decode();
      let finalChartWidth = usableWidth;
      let chartImgHeight = (chartImg.height * finalChartWidth) / chartImg.width;
      const remainingHeightForCharts = pageHeight - currentY - 10; // Remaining space
      
      // If proportional height exceeds remaining space, recalculate width based on max height
      if (chartImgHeight > remainingHeightForCharts) {
        chartImgHeight = remainingHeightForCharts;
        finalChartWidth = (chartImg.width * chartImgHeight) / chartImg.height;
      }
      
      // Center the image horizontally if width is less than max
      const chartX = 10 + (usableWidth - finalChartWidth) / 2;
      const chartY = currentY + 5; 
      doc.addImage(chartImgData, 'PNG', chartX, chartY, finalChartWidth, chartImgHeight);
      
      // Add small logo to bottom right corner
      try {
        // Fetch the SVG, convert to PNG via canvas, then embed
        const logoResponse = await fetch('/@roofm2_logo.svg');
        if (logoResponse.ok) {
          const svgText = await logoResponse.text();
          const svgBase64 = btoa(unescape(encodeURIComponent(svgText)));
          const img = new Image();
          img.src = `data:image/svg+xml;base64,${svgBase64}`;
          await img.decode();
          const offCanvas = document.createElement('canvas');
          offCanvas.width = img.width;
          offCanvas.height = img.height;
          const ctx = offCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const pngDataUrl = offCanvas.toDataURL('image/png');
            const logoSize = 15; // mm
            const logoX = doc.internal.pageSize.getWidth() - logoSize - 10;
            const logoY = doc.internal.pageSize.getHeight() - logoSize - 10;
            doc.addImage(pngDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
          }
        } else {
          console.warn('Could not fetch logo for footer');
        }
      } catch (error) {
        console.warn('Error adding footer logo:', error);
      }
      
      doc.save('roof_report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div ref={containerRef} className="p-0 bg-white rounded shadow w-full overflow-hidden">
      <div ref={chartsRef} className="charts-container">
        <div className="mb-0 w-3/4 mx-auto h-64 sm:h-80 md:h-96 overflow-hidden py-4">
          <Line options={combinedOptions} data={combinedData} />
        </div>
        <div className="mb-0 w-3/4 mx-auto h-64 sm:h-80 md:h-96 overflow-hidden py-4">
          <Line options={areaOptions} data={areaData} />
        </div>
      </div>
      <div className="flex justify-center pt-0">
        <button onClick={downloadPDF} className="w-3/4 mx-auto px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out text-sm font-medium">
          Save Report
        </button>
      </div>
    </div>
  );
} 