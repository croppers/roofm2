'use client';
import { useRef } from 'react';
import Image from 'next/image';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ReportDownloadProps {
  address: string;
  areaSqm: number;
  monthlySolar: Record<string, number>;   // keys '1'..'12'
  monthlyPrecip: Record<string, number>;
}

export default function ReportDownload({ address, areaSqm, monthlySolar, monthlyPrecip }: ReportDownloadProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const solarData = months.map((_,i) => monthlySolar[String(i+1)] ?? 0);
  const precipData = months.map((_,i) => monthlyPrecip[String(i+1)] ?? 0);

  // Annual totals
  const totalSolar = solarData.reduce((sum,v) => sum+v, 0);
  const totalPrecip = precipData.reduce((sum,v) => sum+v, 0);
  
  // Convert from W to kW for the energy calculation
  const totalEnergyKW = (totalSolar * areaSqm) / 1000;
  const totalWater = totalPrecip * areaSqm; // mm * m² = liters
  
  // Calculate daily averages (divide by 365 for annual average per day)
  const dailyEnergyKW = totalEnergyKW / 365;
  const dailyWaterL = totalWater / 365;

  // Combined chart options with twin axes (linear scales are default)
  const combinedOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Energy and Precipitation Climatologies',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 10
        }
      }
    },
    scales: {
      y: { position: 'left', title: { display: true, text: 'Solar (W/m²/day)' } },
      y1:{ position: 'right', title: { display: true, text: 'Precip (mm/day)' }, grid:{ drawOnChartArea:false } }
    }
  };
  const combinedData = {
    labels: months,
    datasets: [
      { label: 'Solar', data: solarData, borderColor: 'rgba(59,130,246,1)', yAxisID:'y' },
      { label: 'Precip', data: precipData, borderColor: 'rgba(16,185,129,1)', yAxisID:'y1' }
    ]
  };

  const areaOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Adjusted for Selected Roof Area',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 10
        }
      }
    },
    scales: {
      y: { position: 'left', title: { display: true, text: 'Energy (kW/day)' } },
      y1: { position: 'right', title: { display: true, text: 'Water (L/day)' }, grid: { drawOnChartArea: false } }
    }
  };
  const areaData = {
    labels: months,
    datasets: [
      { label: 'Energy (kW/day)', data: solarData.map(v => (v * areaSqm) / 1000), borderColor: 'rgba(59,130,246,0.6)', yAxisID: 'y' },
      { label: 'Water (L/day)', data: precipData.map(v => v * areaSqm), borderColor: 'rgba(16,185,129,0.6)', yAxisID: 'y1' }
    ]
  };

  const downloadPDF = async () => {
    if (!containerRef.current) return;

    try {
      const canvas = await html2canvas(containerRef.current);
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'letter');
      
      // Try to add the logo from SVG file
      try {
        const logoResponse = await fetch('/@roofm2_logo.svg');
        if (logoResponse.ok) {
          const logoSvg = await logoResponse.text();
          const logoDataUrl = `data:image/svg+xml;base64,${btoa(logoSvg)}`;
          doc.addImage(logoDataUrl, 'SVG', 10, 10, 40, 15);
        } else {
          console.warn('Logo not found, continuing without it');
        }
      } catch (error) {
        console.warn('Failed to add logo:', error);
        // Continue without the logo
      }
      
      // Add title and date
      doc.setFontSize(16);
      doc.text(`Roofm² Report for ${address}`, 55, 20);
      doc.text(new Date().toLocaleDateString(), 55, 28);
      
      // Add chart image
      doc.addImage(imgData, 'PNG', 10, 35, 190, 0);
      doc.save('roof_report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div ref={containerRef} className="p-4 bg-white rounded shadow">
      <div className="mb-4">
        <Line options={combinedOptions} data={combinedData} />
      </div>
      <div className="mb-4">
        <Line options={areaOptions} data={areaData} />
      </div>
      <div className="flex justify-end">
        <button onClick={downloadPDF} className="px-4 py-2 bg-blue-600 text-white rounded">
          Save Report
        </button>
      </div>
    </div>
  );
} 