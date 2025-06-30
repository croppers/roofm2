'use client';
import { useRef, useState } from 'react';
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

  // State for sliders
  const [waterEfficiency, setWaterEfficiency] = useState(0.8); // Default 80%
  const [panelEfficiency, setPanelEfficiency] = useState(0.2); // Default 20%
  const [roofCoverage, setRoofCoverage] = useState(0.6); // Default 60%

  // State for harvesting plan
  const [storageCapacity, setStorageCapacity] = useState(units === 'imperial' ? 100 : 400); // Default 100 gal or 400 L
  const [dailyUsage, setDailyUsage] = useState(units === 'imperial' ? 80 : 300); // Default 80 gal or 300 L

  // Exponential distribution sampler for daily precipitation
  const exponentialSample = (mean: number): number => {
    if (mean <= 0) return 0;
    // Using exponential distribution to model daily precipitation amounts
    return -mean * Math.log(1 - Math.random());
  };

  // Run harvesting simulation
  const runHarvestingSimulation = () => {
    const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    let storage = 0;
    const dailyCaptured: number[] = [];
    const dailyCoveragePercent: number[] = [];
    
    months.forEach(month => {
      const monthlyPrecipMm = monthlyPrecip[String(month + 1)] || 0;
      const dailyMeanPrecipMm = monthlyPrecipMm; // Already in mm/day
      
      for (let day = 0; day < daysInMonth[month]; day++) {
        // Sample daily precipitation using exponential distribution
        const dailyPrecipMm = exponentialSample(dailyMeanPrecipMm);
        
        // Calculate water captured (applying efficiency)
        const capturedLiters = dailyPrecipMm * areaSqm * waterEfficiency;
        const capturedVolume = units === 'imperial' 
          ? capturedLiters * 0.264172 // Convert to gallons
          : capturedLiters;
        
        // Add to storage (up to capacity)
        const spaceAvailable = storageCapacity - storage;
        const actualCaptured = Math.min(capturedVolume, spaceAvailable);
        storage += actualCaptured;
        
        // Calculate daily usage from storage
        const usageFromStorage = Math.min(dailyUsage, storage);
        storage -= usageFromStorage;
        
        // Calculate coverage percentage
        const coveragePercent = dailyUsage > 0 ? (usageFromStorage / dailyUsage) * 100 : 0;
        
        dailyCaptured.push(actualCaptured);
        dailyCoveragePercent.push(coveragePercent);
      }
    });
    
    return { dailyCaptured, dailyCoveragePercent };
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const solarData = months.map((_,i) => monthlySolar[String(i+1)] ?? 0);
  const precipData = months.map((_,i) => monthlyPrecip[String(i+1)] ?? 0);
  
  // Run harvesting simulation when inputs change
  const { dailyCaptured, dailyCoveragePercent } = runHarvestingSimulation();
  
  // Calculate monthly averages for the harvesting chart
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayIndex = 0;
  const monthlyAvgCaptured: number[] = [];
  const monthlyAvgCoverage: number[] = [];
  
  daysInMonth.forEach((days) => {
    const monthDays = dailyCaptured.slice(dayIndex, dayIndex + days);
    const monthCoverage = dailyCoveragePercent.slice(dayIndex, dayIndex + days);
    
    const avgCaptured = monthDays.reduce((sum, val) => sum + val, 0) / days;
    const avgCoverage = monthCoverage.reduce((sum, val) => sum + val, 0) / days;
    
    monthlyAvgCaptured.push(avgCaptured);
    monthlyAvgCoverage.push(avgCoverage);
    dayIndex += days;
  });
  
  // Prepare water unit label (daily) for area plot
  const waterUnitText = units === 'imperial' ? 'Water (gal/day)' : 'Water (L/day)';
  
  // Convert solar radiation from MJ/m²/day to kWh/m²/day (1 kWh = 3.6 MJ)
  const MJ_TO_KWH = 1 / 3.6;
  const solarDataKwh = solarData.map(v => v * MJ_TO_KWH);

  // Convert daily values to monthly
  const solarDataMonthlyKwh = solarDataKwh.map((v, i) => v * daysInMonth[i]);
  const precipMonthlyRaw = precipData.map((v, i) => v * daysInMonth[i]); // mm/month
  // Convert precipitation to units per month
  const displayPrecipMonthly = units === 'imperial'
    ? precipMonthlyRaw.map(v => v * 0.0393701) // inches/month
    : precipMonthlyRaw.map(v => v * 0.1);      // cm/month
  // Unit label for precipitation
  const precipMonthlyUnitText = units === 'imperial' ? 'Precip (inches/month)' : 'Precip (cm/month)';

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
          text: 'Solar (kWh/m²/month)',
          font: {
            size: 11
          }
        } 
      },
      y1:{ 
        position: 'right', 
        title: { 
          display: true, 
          text: precipMonthlyUnitText,
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
      { label: 'Solar', data: solarDataMonthlyKwh, borderColor: 'rgba(59,130,246,1)', yAxisID:'y' },
      { label: 'Precip', data: displayPrecipMonthly, borderColor: 'rgba(16,185,129,1)', yAxisID:'y1' }
    ]
  };

  // Calculate water collection values based on area and initial conversion factor
  const baseWaterCollectionData = units === 'imperial'
    ? precipData.map(v => (v * areaSqm * 0.264172) * 0.62) // L to gallons, * 0.62
    : precipData.map(v => (v * areaSqm) * 0.62); // L/day, * 0.62

  // Compute energy capture: MJ/m²/day * area => MJ/day, convert to kWh, apply efficiencies, then to kWh/month
  const energyDataKwhPerDay = solarData.map(v => v * MJ_TO_KWH * areaSqm * panelEfficiency * roofCoverage);
  const energyDataAdjusted = energyDataKwhPerDay.map((val, i) => val * daysInMonth[i]);
  const waterDataAdjusted = baseWaterCollectionData.map(v => v * waterEfficiency); // Apply efficiency slider

  const areaOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Potential Capture above Roof',
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
          text: 'Energy (kWh/month)',
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
      { label: 'Energy (kWh/month)', data: energyDataAdjusted, borderColor: 'rgba(59,130,246,0.6)', yAxisID: 'y' },
      { label: units === 'imperial' ? 'Water (gal/day)' : 'Water (L/day)', data: waterDataAdjusted, borderColor: 'rgba(16,185,129,0.6)', yAxisID: 'y1' }
    ]
  };

  // Harvesting Plan chart options
  const harvestingOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Non-Potable Water Harvesting Performance',
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
          text: units === 'imperial' ? 'Captured (gal/day avg)' : 'Captured (L/day avg)',
          font: {
            size: 11
          }
        } 
      },
      y1: { 
        position: 'right', 
        title: { 
          display: true, 
          text: 'Usage Coverage (%)',
          font: {
            size: 11
          }
        }, 
        grid: { 
          drawOnChartArea: false 
        },
        min: 0,
        max: 100
      }
    }
  };
  
  const harvestingData = {
    labels: months,
    datasets: [
      { 
        label: units === 'imperial' ? 'Captured (gal/day)' : 'Captured (L/day)', 
        data: monthlyAvgCaptured, 
        borderColor: 'rgba(16,185,129,1)', 
        backgroundColor: 'rgba(16,185,129,0.1)',
        yAxisID: 'y' 
      },
      { 
        label: 'Coverage (%)', 
        data: monthlyAvgCoverage, 
        borderColor: 'rgba(251,146,60,1)', 
        backgroundColor: 'rgba(251,146,60,0.1)',
        yAxisID: 'y1' 
      }
    ]
  };

  // Prepare formatted area string for PDF
  const formattedAreaText = units === 'imperial'
    ? `${(areaSqm * 10.7639).toLocaleString(undefined, { maximumFractionDigits: 1 })} ft²`
    : `${areaSqm.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²`;

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

          // Add computed area and slider settings
          doc.setFontSize(12);
          doc.text(`Roof Area: ${formattedAreaText}`, 10, currentY + 5);
          doc.text(`Water Efficiency: ${(waterEfficiency * 100).toFixed(0)}%`, 10, currentY + 12);
          doc.text(`Panel Efficiency: ${(panelEfficiency * 100).toFixed(0)}%`, 10, currentY + 19);
          doc.text(`Coverage: ${(roofCoverage * 100).toFixed(0)}%`, 10, currentY + 26);
          doc.text(`Storage: ${storageCapacity.toLocaleString()} ${units === 'imperial' ? 'gal' : 'L'}`, 10, currentY + 33);
          doc.text(`Daily Usage: ${dailyUsage.toLocaleString()} ${units === 'imperial' ? 'gal' : 'L'}`, 10, currentY + 40);
          currentY += 44;

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
      <div ref={chartsRef} className="charts-container space-y-[3rem]">
        <div className="mb-8 w-3/4 mx-auto h-64 sm:h-80 md:h-96 overflow-hidden py-4">
          <Line options={combinedOptions} data={combinedData} />
        </div>
        <div className="mb-0 mt-8 w-3/4 mx-auto h-64 sm:h-80 md:h-96 overflow-hidden py-4">
          <Line options={areaOptions} data={areaData} />
        </div>
        <div className="mb-0 mt-8 w-3/4 mx-auto h-64 sm:h-80 md:h-96 overflow-hidden py-4">
          <Line options={harvestingOptions} data={harvestingData} />
        </div>
      </div>
      {/* Group sliders and button with uniform spacing */}
      <div className="space-y-[3rem] mt-[3rem]">
        <div className="w-1/2 mx-auto space-y-6">
          {/* Water Efficiency Slider */}
          <div className="py-2">
            <label htmlFor="waterEfficiency" className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Water Collection Efficiency: {(waterEfficiency * 100).toFixed(0)}%
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">75%</span>
              <input
                id="waterEfficiency"
                type="range"
                min="0.75"
                max="0.9"
                step="0.01"
                value={waterEfficiency}
                onChange={(e) => setWaterEfficiency(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <span className="text-xs text-gray-500">90%</span>
            </div>
          </div>
          {/* Panel Efficiency Slider */}
          <div className="py-2">
            <label htmlFor="panelEfficiency" className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Solar Panel Efficiency: {(panelEfficiency * 100).toFixed(0)}%
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">15%</span>
              <input
                id="panelEfficiency"
                type="range"
                min="0.15"
                max="0.25"
                step="0.01"
                value={panelEfficiency}
                onChange={(e) => setPanelEfficiency(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs text-gray-500">25%</span>
            </div>
          </div>
          {/* Roof Coverage Slider */}
          <div className="py-2">
            <label htmlFor="roofCoverage" className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Roof Coverage by Panels: {(roofCoverage * 100).toFixed(0)}%
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">40%</span>
              <input
                id="roofCoverage"
                type="range"
                min="0.4"
                max="0.8"
                step="0.01"
                value={roofCoverage}
                onChange={(e) => setRoofCoverage(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-500"
              />
              <span className="text-xs text-gray-500">80%</span>
            </div>
          </div>
        </div>
        
        {/* Your Harvesting Plan Section */}
        <div className="w-3/4 mx-auto">
          <h2 className="text-xl font-bold text-center mb-6">Your Harvesting Plan</h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Model non-potable water harvesting with storage capacity and daily usage
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-3/4 mx-auto">
            {/* Storage Capacity Input */}
            <div>
              <label htmlFor="storageCapacity" className="block text-sm font-medium text-gray-700 mb-2">
                Storage Capacity ({units === 'imperial' ? 'gallons' : 'liters'})
              </label>
              <input
                id="storageCapacity"
                type="number"
                min="0"
                value={storageCapacity}
                onChange={(e) => setStorageCapacity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder={units === 'imperial' ? 'e.g., 100' : 'e.g., 400'}
              />
              <p className="mt-1 text-xs text-gray-500">
                Total non-potable water storage capacity
              </p>
            </div>
            
            {/* Daily Usage Input */}
            <div>
              <label htmlFor="dailyUsage" className="block text-sm font-medium text-gray-700 mb-2">
                Daily Non-Potable Water Usage ({units === 'imperial' ? 'gallons' : 'liters'})
              </label>
              <input
                id="dailyUsage"
                type="number"
                min="0"
                value={dailyUsage}
                onChange={(e) => setDailyUsage(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder={units === 'imperial' ? 'e.g., 80' : 'e.g., 300'}
              />
              <p className="mt-1 text-xs text-gray-500">
                Daily usage for irrigation, toilet flushing, etc.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={downloadPDF}
            className="w-3/4 mx-auto px-4 py-3 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out text-sm font-medium"
          >
            Save Report
          </button>
        </div>
      </div>
    </div>
  );
} 