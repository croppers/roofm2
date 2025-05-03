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
  const totalEnergy = totalSolar * areaSqm;
  const totalWater = totalPrecip * areaSqm; // mm * m² = liters

  // Combined chart options with twin axes (linear scales are default)
  const combinedOptions: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      y: { position: 'left', title: { display: true, text: 'Solar (W/m²)' } },
      y1:{ position: 'right', title: { display: true, text: 'Precip (mm)' }, grid:{ drawOnChartArea:false } }
    }
  };
  const combinedData = {
    labels: months,
    datasets: [
      { label: 'Solar', data: solarData, borderColor: 'rgba(59,130,246,1)', yAxisID:'y' },
      { label: 'Precip', data: precipData, borderColor: 'rgba(16,185,129,1)', yAxisID:'y1' }
    ]
  };

  const areaOptions = { responsive: true, scales:{ y:{ title:{display:true,text:'Total'}} } };
  const areaData = {
    labels: months,
    datasets: [
      { label:'Energy (W·m²)', data: solarData.map(v=>v*areaSqm), borderColor:'rgba(59,130,246,0.6)' },
      { label:'Water (L)', data: precipData.map(v=>v*areaSqm), borderColor:'rgba(16,185,129,0.6)' }
    ]
  };

  const downloadPDF = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current);
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF('p','mm','letter');
    // Header logo and title
    doc.addImage('/roofm2_logo.png','PNG',10,10,40,15);
    doc.setFontSize(16);
    doc.text(`Roofm² Report for ${address}`, 55, 20);
    doc.text(new Date().toLocaleDateString(), 55, 28);
    doc.addImage(imgData,'PNG',10,35,190,0);
    doc.save('roof_report.pdf');
  };

  return (
    <div ref={containerRef} className="p-4 bg-white rounded shadow">
      <div className="mb-4">
        <Line options={combinedOptions} data={combinedData} />
      </div>
      <div className="mb-4">
        <Line options={areaOptions} data={areaData} />
      </div>
      <div className="flex justify-between items-center">
        <div>
          <p>Total Solar: {totalSolar.toFixed(1)} W/m²·mo</p>
          <p>Total Precip: {totalPrecip.toFixed(1)} mm·mo</p>
          <p>Energy: {totalEnergy.toFixed(1)} W</p>
          <p>Water: {totalWater.toFixed(1)} L</p>
        </div>
        <button onClick={downloadPDF} className="px-4 py-2 bg-blue-600 text-white rounded">Download PDF</button>
      </div>
    </div>
  );
} 