'use client';
import { useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { ChartOptions } from 'chart.js';
import { useSearchParams } from 'next/navigation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

interface ReportDownloadProps {
  address: string;
  areaSqm: number;
  monthlySolar: Record<string, number>;
  monthlyPrecip: Record<string, number>;
  mapImageDataUrl: string | null;
}

export default function ReportDownload({ address, areaSqm, monthlySolar, monthlyPrecip, mapImageDataUrl }: ReportDownloadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const units = searchParams?.get('units') === 'imperial' ? 'imperial' : 'metric';

  const [waterEfficiency, setWaterEfficiency] = useState(0.8);
  const [panelEfficiency, setPanelEfficiency] = useState(0.2);
  const [roofCoverage, setRoofCoverage] = useState(0.6);
  const [storageCapacity, setStorageCapacity] = useState(units === 'imperial' ? 100 : 400);
  const [dailyUsage, setDailyUsage] = useState(units === 'imperial' ? 80 : 300);

  const exponentialSample = (mean: number): number => {
    if (mean <= 0) return 0;
    return -mean * Math.log(1 - Math.random());
  };

  const runHarvestingSimulation = () => {
    const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let storage = 0;
    const dailyCaptured: number[] = [];
    const dailyCoveragePercent: number[] = [];

    months.forEach(month => {
      const dailyMeanPrecipMm = monthlyPrecip[String(month + 1)] || 0;
      for (let day = 0; day < daysInMonth[month]; day++) {
        const dailyPrecipMm = exponentialSample(dailyMeanPrecipMm);
        const capturedLiters = dailyPrecipMm * areaSqm * waterEfficiency;
        const capturedVolume = units === 'imperial'
          ? capturedLiters * 0.264172
          : capturedLiters;
        const spaceAvailable = storageCapacity - storage;
        const actualCaptured = Math.min(capturedVolume, spaceAvailable);
        storage += actualCaptured;
        const usageFromStorage = Math.min(dailyUsage, storage);
        storage -= usageFromStorage;
        const coveragePercent = dailyUsage > 0 ? (usageFromStorage / dailyUsage) * 100 : 0;
        dailyCaptured.push(actualCaptured);
        dailyCoveragePercent.push(coveragePercent);
      }
    });

    return { dailyCaptured, dailyCoveragePercent };
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const solarData = months.map((_,i) => monthlySolar[String(i+1)] ?? 0);
  const precipData = months.map((_,i) => monthlyPrecip[String(i+1)] ?? 0);

  const { dailyCaptured, dailyCoveragePercent } = runHarvestingSimulation();

  let dayIndex = 0;
  const monthlyAvgCaptured: number[] = [];
  const monthlyAvgCoverage: number[] = [];

  daysInMonth.forEach((days) => {
    const monthDays = dailyCaptured.slice(dayIndex, dayIndex + days);
    const monthCoverage = dailyCoveragePercent.slice(dayIndex, dayIndex + days);
    monthlyAvgCaptured.push(monthDays.reduce((sum, val) => sum + val, 0) / days);
    monthlyAvgCoverage.push(monthCoverage.reduce((sum, val) => sum + val, 0) / days);
    dayIndex += days;
  });

  const MJ_TO_KWH = 1 / 3.6;
  const solarDataKwh = solarData.map(v => v * MJ_TO_KWH);
  const solarDataMonthlyKwh = solarDataKwh.map((v, i) => v * daysInMonth[i]);
  const precipMonthlyRaw = precipData.map((v, i) => v * daysInMonth[i]);
  const displayPrecipMonthly = units === 'imperial'
    ? precipMonthlyRaw.map(v => v * 0.0393701)
    : precipMonthlyRaw.map(v => v * 0.1);
  const precipMonthlyUnitText = units === 'imperial' ? 'Precip (in/month)' : 'Precip (cm/month)';
  const waterUnitText = units === 'imperial' ? 'Water (gal/day)' : 'Water (L/day)';

  const baseChartOptions: Partial<ChartOptions<'line'>> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11 }
        }
      }
    },
    elements: {
      point: { radius: 3, hoverRadius: 5 },
      line: { tension: 0.3, borderWidth: 2.5 }
    }
  };

  const combinedOptions: ChartOptions<'line'> = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: { display: true, text: 'Energy and Precipitation Climatologies', font: { size: 14, weight: 'bold' }, padding: { bottom: 12 } }
    },
    scales: {
      y: { position: 'left', title: { display: true, text: 'Solar (kWh/m\u00b2/month)', font: { size: 11 } } },
      y1: { position: 'right', title: { display: true, text: precipMonthlyUnitText, font: { size: 11 } }, grid: { drawOnChartArea: false } }
    }
  } as ChartOptions<'line'>;

  const combinedData = {
    labels: months,
    datasets: [
      {
        label: 'Solar',
        data: solarDataMonthlyKwh,
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Precip',
        data: displayPrecipMonthly,
        borderColor: 'rgba(16,185,129,1)',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true,
        yAxisID: 'y1'
      }
    ]
  };

  const baseWaterCollectionData = units === 'imperial'
    ? precipData.map(v => (v * areaSqm * 0.264172) * 0.62)
    : precipData.map(v => (v * areaSqm) * 0.62);

  const energyDataKwhPerDay = solarData.map(v => v * MJ_TO_KWH * areaSqm * panelEfficiency * roofCoverage);
  const energyDataAdjusted = energyDataKwhPerDay.map((val, i) => val * daysInMonth[i]);
  const waterDataAdjusted = baseWaterCollectionData.map(v => v * waterEfficiency);

  const areaOptions: ChartOptions<'line'> = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: { display: true, text: 'Potential Capture above Roof', font: { size: 14, weight: 'bold' }, padding: { bottom: 12 } }
    },
    scales: {
      y: { position: 'left', title: { display: true, text: 'Energy (kWh/month)', font: { size: 11 } } },
      y1: { position: 'right', title: { display: true, text: waterUnitText, font: { size: 11 } }, grid: { drawOnChartArea: false } }
    }
  } as ChartOptions<'line'>;

  const areaData = {
    labels: months,
    datasets: [
      {
        label: 'Energy (kWh/month)',
        data: energyDataAdjusted,
        borderColor: 'rgba(59,130,246,0.8)',
        backgroundColor: 'rgba(59,130,246,0.08)',
        fill: true,
        yAxisID: 'y'
      },
      {
        label: units === 'imperial' ? 'Water (gal/day)' : 'Water (L/day)',
        data: waterDataAdjusted,
        borderColor: 'rgba(16,185,129,0.8)',
        backgroundColor: 'rgba(16,185,129,0.08)',
        fill: true,
        yAxisID: 'y1'
      }
    ]
  };

  const harvestingOptions: ChartOptions<'line'> = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: { display: true, text: 'Non-Potable Water Harvesting Performance', font: { size: 14, weight: 'bold' }, padding: { bottom: 12 } }
    },
    scales: {
      y: { position: 'left', title: { display: true, text: units === 'imperial' ? 'Captured (gal/day avg)' : 'Captured (L/day avg)', font: { size: 11 } } },
      y1: { position: 'right', title: { display: true, text: 'Usage Coverage (%)', font: { size: 11 } }, grid: { drawOnChartArea: false }, min: 0, max: 100 }
    }
  } as ChartOptions<'line'>;

  const harvestingData = {
    labels: months,
    datasets: [
      {
        label: units === 'imperial' ? 'Captured (gal/day)' : 'Captured (L/day)',
        data: monthlyAvgCaptured,
        borderColor: 'rgba(16,185,129,1)',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Coverage (%)',
        data: monthlyAvgCoverage,
        borderColor: 'rgba(251,146,60,1)',
        backgroundColor: 'rgba(251,146,60,0.1)',
        fill: true,
        yAxisID: 'y1'
      }
    ]
  };

  const formattedAreaText = units === 'imperial'
    ? `${(areaSqm * 10.7639).toLocaleString(undefined, { maximumFractionDigits: 1 })} ft\u00b2`
    : `${areaSqm.toLocaleString(undefined, { maximumFractionDigits: 1 })} m\u00b2`;

  const downloadPDF = async () => {
    if (!chartsRef.current) return;
    try {
      const doc = new jsPDF('p', 'mm', 'letter');
      const pageHeight = doc.internal.pageSize.getHeight();
      const usableWidth = 190;
      let currentY = 10;

      try {
        const logoResponse = await fetch('/@roofm2_logo.svg');
        if (logoResponse.ok) {
          const logoSvg = await logoResponse.text();
          const logoDataUrl = `data:image/svg+xml;base64,${btoa(logoSvg)}`;
          doc.addImage(logoDataUrl, 'SVG', 10, currentY, 40, 15);
          currentY += 20;
        } else { currentY += 5; }
      } catch { currentY += 5; }

      doc.setFontSize(16);
      doc.text(`Roofm\u00b2 Report for ${address}`, 10, currentY + 5);
      const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(formattedDate, 10, currentY + 13);
      currentY += 20;

      const spaceAfterHeader = pageHeight - currentY - 10;
      const maxMapHeight = spaceAfterHeader * 0.5;

      if (mapImageDataUrl) {
        try {
          const img = new Image();
          img.src = mapImageDataUrl;
          await img.decode();
          let finalMapWidth = usableWidth;
          let imgHeight = (img.height * finalMapWidth) / img.width;
          if (imgHeight > maxMapHeight) {
            imgHeight = maxMapHeight;
            finalMapWidth = (img.width * imgHeight) / img.height;
          }
          const mapX = 10 + (usableWidth - finalMapWidth) / 2;
          const mapY = currentY + 5;
          doc.addImage(mapImageDataUrl, 'PNG', mapX, mapY, finalMapWidth, imgHeight);
          currentY = mapY + imgHeight;
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

      const canvas = await html2canvas(chartsRef.current);
      const chartImgData = canvas.toDataURL('image/png');
      const chartImg = new Image();
      chartImg.src = chartImgData;
      await chartImg.decode();
      let finalChartWidth = usableWidth;
      let chartImgHeight = (chartImg.height * finalChartWidth) / chartImg.width;
      const remainingHeightForCharts = pageHeight - currentY - 10;
      if (chartImgHeight > remainingHeightForCharts) {
        chartImgHeight = remainingHeightForCharts;
        finalChartWidth = (chartImg.width * chartImgHeight) / chartImg.height;
      }
      const chartX = 10 + (usableWidth - finalChartWidth) / 2;
      const chartY = currentY + 5;
      doc.addImage(chartImgData, 'PNG', chartX, chartY, finalChartWidth, chartImgHeight);

      try {
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
            const logoSize = 15;
            const logoX = doc.internal.pageSize.getWidth() - logoSize - 10;
            const logoY = doc.internal.pageSize.getHeight() - logoSize - 10;
            doc.addImage(pngDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
          }
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
    <div ref={containerRef} className="space-y-8">
      {/* Charts */}
      <div ref={chartsRef} className="space-y-8">
        <div className="card p-6">
          <div className="h-64 sm:h-80 md:h-96">
            <Line options={combinedOptions} data={combinedData} />
          </div>
        </div>
        <div className="card p-6">
          <div className="h-64 sm:h-80 md:h-96">
            <Line options={areaOptions} data={areaData} />
          </div>
        </div>
        <div className="card p-6">
          <div className="h-64 sm:h-80 md:h-96">
            <Line options={harvestingOptions} data={harvestingData} />
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="card p-6 sm:p-8">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-6 text-center">
          Adjustment Factors
        </h3>
        <div className="max-w-lg mx-auto space-y-6">
          {/* Water Efficiency */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="waterEfficiency" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Water Collection Efficiency
              </label>
              <span className="text-sm font-bold text-accent-500">{(waterEfficiency * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-8">75%</span>
              <input id="waterEfficiency" type="range" min="0.75" max="0.9" step="0.01"
                value={waterEfficiency} onChange={(e) => setWaterEfficiency(parseFloat(e.target.value))}
                className="slider accent-accent-500" />
              <span className="text-xs text-gray-400 w-8">90%</span>
            </div>
          </div>
          {/* Panel Efficiency */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="panelEfficiency" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Solar Panel Efficiency
              </label>
              <span className="text-sm font-bold text-primary-500">{(panelEfficiency * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-8">15%</span>
              <input id="panelEfficiency" type="range" min="0.15" max="0.25" step="0.01"
                value={panelEfficiency} onChange={(e) => setPanelEfficiency(parseFloat(e.target.value))}
                className="slider accent-primary-500" />
              <span className="text-xs text-gray-400 w-8">25%</span>
            </div>
          </div>
          {/* Roof Coverage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="roofCoverage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Roof Coverage by Panels
              </label>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{(roofCoverage * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-8">40%</span>
              <input id="roofCoverage" type="range" min="0.4" max="0.8" step="0.01"
                value={roofCoverage} onChange={(e) => setRoofCoverage(parseFloat(e.target.value))}
                className="slider accent-gray-500" />
              <span className="text-xs text-gray-400 w-8">80%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Harvesting Plan */}
      <div className="card p-6 sm:p-8">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 text-center">
          Your Harvesting Plan
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          Model non-potable water harvesting with storage capacity and daily usage
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
          <div>
            <label htmlFor="storageCapacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Storage Capacity ({units === 'imperial' ? 'gal' : 'L'})
            </label>
            <input id="storageCapacity" type="number" min="0"
              value={storageCapacity} onChange={(e) => setStorageCapacity(Math.max(0, parseInt(e.target.value) || 0))}
              className="input-field"
              placeholder={units === 'imperial' ? 'e.g., 100' : 'e.g., 400'} />
          </div>
          <div>
            <label htmlFor="dailyUsage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Usage ({units === 'imperial' ? 'gal' : 'L'})
            </label>
            <input id="dailyUsage" type="number" min="0"
              value={dailyUsage} onChange={(e) => setDailyUsage(Math.max(0, parseInt(e.target.value) || 0))}
              className="input-field"
              placeholder={units === 'imperial' ? 'e.g., 80' : 'e.g., 300'} />
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button onClick={downloadPDF} className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Save Report as PDF
      </button>
    </div>
  );
}
