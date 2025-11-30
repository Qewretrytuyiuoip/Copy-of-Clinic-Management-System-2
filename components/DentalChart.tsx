import React from 'react';
import { SessionTreatment } from '../types';

// ... (بقية مكون ToothPath تبقى كما هي)
const ToothPath: React.FC<{ 
    id: number; 
    d: string; 
    x: number; 
    y: number; 
    treatments: SessionTreatment[]; 
    onClick: (id: number) => void; 
    labelX?: number; 
    labelY?: number;
}> = ({ id, d, x, y, treatments, onClick, labelX, labelY }) => {
    // ... (بقية الرمز)
    const hasTreatments = treatments.some(t => t.number === id);
    const isCompleted = treatments.some(t => t.number === id && t.completed);
    
    let fillColor = "fill-white dark:fill-slate-700";
    if (hasTreatments) {
        fillColor = isCompleted ? "fill-green-100 dark:fill-green-900" : "fill-orange-100 dark:fill-orange-900";
    }

    return (
        <g onClick={() => onClick(id)} className="cursor-pointer group hover:opacity-80 transition-opacity">
            <path
                d={d}
                transform={`translate(${x}, ${y})`}
                className={`${fillColor} stroke-gray-800 dark:stroke-gray-300 stroke-[1.5] transition-colors`}
            />
            <text 
                x={x + (labelX || 15)} 
                y={y + (labelY || -10)} 
                className="text-[10px] font-bold fill-gray-600 dark:fill-gray-400 select-none pointer-events-none"
                textAnchor="middle"
            >
                {id}
            </text>
            {/* ... (التعليقات الخاصة بالنقطة) */}
        </g>
    );
};

const DentalChart: React.FC<DentalChartProps> = ({ treatments, onToothClick }) => {
    const molarPath = "M0,10 Q5,0 15,0 Q25,0 30,10 Q32,20 30,30 Q25,40 15,40 Q5,40 0,30 Q-2,20 0,10 Z";
    const premolarPath = "M2,10 Q8,0 15,0 Q22,0 28,10 Q30,20 28,30 Q22,38 15,38 Q8,38 2,30 Q0,20 2,10 Z";
    const incisorPath = "M5,5 Q10,0 15,0 Q20,0 25,5 Q28,15 25,25 Q20,32 15,32 Q10,32 5,25 Q2,15 5,5 Z";

    const centerX = 300;
    const startY_Upper = 50;
    const startY_Lower = 250;

    const teethData = [
        // ... (بيانات الأسنان تبقى كما هي)
    
        // Upper Right (18-11)
        { id: 11, d: incisorPath, x: centerX - 35, y: startY_Upper + 100, lx: 15, ly: 50 },
        { id: 12, d: incisorPath, x: centerX - 65, y: startY_Upper + 90, lx: 15, ly: 50 },
        { id: 13, d: incisorPath, x: centerX - 95, y: startY_Upper + 75, lx: 15, ly: 50 },
        { id: 14, d: premolarPath, x: centerX - 125, y: startY_Upper + 55, lx: 15, ly: 50 },
        { id: 15, d: premolarPath, x: centerX - 155, y: startY_Upper + 35, lx: 15, ly: 50 },
        { id: 16, d: molarPath, x: centerX - 190, y: startY_Upper + 10, lx: 15, ly: 50 },
        { id: 17, d: molarPath, x: centerX - 225, y: startY_Upper - 5, lx: 15, ly: 50 },
        { id: 18, d: molarPath, x: centerX - 260, y: startY_Upper - 15, lx: 15, ly: 50 },

        // Upper Left (21-28)
        { id: 21, d: incisorPath, x: centerX + 5, y: startY_Upper + 100, lx: 15, ly: 50 },
        { id: 22, d: incisorPath, x: centerX + 35, y: startY_Upper + 90, lx: 15, ly: 50 },
        { id: 23, d: incisorPath, x: centerX + 65, y: startY_Upper + 75, lx: 15, ly: 50 },
        { id: 24, d: premolarPath, x: centerX + 95, y: startY_Upper + 55, lx: 15, ly: 50 },
        { id: 25, d: premolarPath, x: centerX + 125, y: startY_Upper + 35, lx: 15, ly: 50 },
        { id: 26, d: molarPath, x: centerX + 160, y: startY_Upper + 10, lx: 15, ly: 50 },
        { id: 27, d: molarPath, x: centerX + 195, y: startY_Upper - 5, lx: 15, ly: 50 },
        { id: 28, d: molarPath, x: centerX + 230, y: startY_Upper - 15, lx: 15, ly: 50 },

        // Lower Right (48-41)
        { id: 41, d: incisorPath, x: centerX - 35, y: startY_Lower - 20, lx: 15, ly: -15 },
        { id: 42, d: incisorPath, x: centerX - 65, y: startY_Lower - 10, lx: 15, ly: -15 },
        { id: 43, d: incisorPath, x: centerX - 95, y: startY_Lower + 5, lx: 15, ly: -15 },
        { id: 44, d: premolarPath, x: centerX - 125, y: startY_Lower + 25, lx: 15, ly: -15 },
        { id: 45, d: premolarPath, x: centerX - 155, y: startY_Lower + 45, lx: 15, ly: -15 },
        { id: 46, d: molarPath, x: centerX - 190, y: startY_Lower + 70, lx: 15, ly: -15 },
        { id: 47, d: molarPath, x: centerX - 225, y: startY_Lower + 85, lx: 15, ly: -15 },
        { id: 48, d: molarPath, x: centerX - 260, y: startY_Lower + 95, lx: 15, ly: -15 },

        // Lower Left (31-38)
        { id: 31, d: incisorPath, x: centerX + 5, y: startY_Lower - 20, lx: 15, ly: -15 },
        { id: 32, d: incisorPath, x: centerX + 35, y: startY_Lower - 10, lx: 15, ly: -15 },
        { id: 33, d: incisorPath, x: centerX + 65, y: startY_Lower + 5, lx: 15, ly: -15 },
        { id: 34, d: premolarPath, x: centerX + 95, y: startY_Lower + 25, lx: 15, ly: -15 },
        { id: 35, d: premolarPath, x: centerX + 125, y: startY_Lower + 45, lx: 15, ly: -15 },
        { id: 36, d: molarPath, x: centerX + 160, y: startY_Lower + 70, lx: 15, ly: -15 },
        { id: 37, d: molarPath, x: centerX + 195, y: startY_Lower + 85, lx: 15, ly: -15 },
        { id: 38, d: molarPath, x: centerX + 230, y: startY_Lower + 95, lx: 15, ly: -15 },
    ];

    return (
        <div className="w-full overflow-x-auto flex justify-center py-4 bg-white dark:bg-slate-800 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700">
            <svg 
                viewBox="0 0 600 450" 
                className="w-full max-w-[600px] h-auto select-none"
            >
                {/* 🦷 اللثة العلوية: مسار منحني بشكل أكثر وضوح ولون وردي */}
                <path 
                    d="M30,30 C150,150 450,150 570,30" 
                    fill="none" 
                    stroke="#fecaca" // لون وردي فاتح (tailwind: rose-200)
                    strokeWidth="30" // سماكة أكبر للبروز
                    strokeLinecap="round" 
                    className="dark:stroke-rose-900/50 opacity-70" // دعم الوضع الداكن
                />

                {/* 🦷 اللثة السفلية: مسار منحني بشكل أكثر وضوح ولون وردي */}
                <path 
                    d="M30,420 C150,300 450,300 570,420" 
                    fill="none" 
                    stroke="#fecaca" // لون وردي فاتح (tailwind: rose-200)
                    strokeWidth="30" // سماكة أكبر للبروز
                    strokeLinecap="round" 
                    className="dark:stroke-rose-900/50 opacity-70" // دعم الوضع الداكن
                />

                {teethData.map(tooth => (
                    <ToothPath 
                        key={tooth.id}
                        {...tooth}
                        treatments={treatments}
                        onClick={onToothClick}
                        labelX={tooth.lx}
                        labelY={tooth.ly}
                    />
                ))}

                {/* Labels for Quadrants */}
                <text x="50" y="20" className="text-xs font-bold fill-gray-400">يمين</text>
                <text x="550" y="20" className="text-xs font-bold fill-gray-400">يسار</text>
            </svg>
        </div>
    );
};

export default DentalChart;