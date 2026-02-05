"use client";

import React, { useState, useEffect, useRef } from 'react';
import bwipjs from 'bwip-js';
import { Printer, RefreshCw, AlertTriangle, Check, FileText } from 'lucide-react';

// --- Types ---

interface LabelData {
  din: string;        // Donation Identification Number (e.g., =A00002312345600)
  productCode: string; // Product Code (e.g., =E0123V00)
  aboRh: string;      // ABO/Rh Code (e.g., =%5100)
  expiration: string; // Expiration Date (e.g., &>02602032359)
}

const INITIAL_DATA: LabelData = {
  din: '=A99992312345600',
  productCode: '=E0330V00',
  aboRh: '=%5100', // A Pos
  expiration: '&>02602282359', // CYYMMDDHHmm
};

// --- Components ---

export default function LabelingPage() {
  const [data, setData] = useState<LabelData>(INITIAL_DATA);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<{valid: boolean, message: string} | null>(null);
  const [validating, setValidating] = useState(false);
  
  // Refs for canvases
  const canvasDinRef = useRef<HTMLCanvasElement>(null);
  const canvasProdRef = useRef<HTMLCanvasElement>(null);
  const canvasAboRef = useRef<HTMLCanvasElement>(null);
  const canvasExpRef = useRef<HTMLCanvasElement>(null);
  const canvasDataMatrixRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Fetch next DIN from backend
    fetch('/api/backend/etiquetage/next-din')
      .then(res => res.json())
      .then(d => {
        if(d.din) setData(prev => ({...prev, din: d.din}));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    generateBarcodes();
    
    // Debounce validation
    const timer = setTimeout(() => {
        validateData();
    }, 500);
    return () => clearTimeout(timer);
  }, [data]);

  const validateData = async () => {
    setValidating(true);
    try {
        const res = await fetch('/api/backend/etiquetage/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                din: data.din,
                product_code: data.productCode,
                abo_rh: data.aboRh,
                expiration: data.expiration
            })
        });
        if (res.ok) {
            setValidation(await res.json());
        }
    } catch (e) {
        console.error(e);
    } finally {
        setValidating(false);
    }
  };

  const generateBarcodes = () => {
    try {
      // DIN (Code 128)
      if (canvasDinRef.current) {
        bwipjs.toCanvas(canvasDinRef.current, {
          bcid: 'code128',
          text: data.din,
          scale: 2,
          height: 10,
          incluetext: true,
          textxalign: 'center',
        });
      }

      // Product Code (Code 128)
      if (canvasProdRef.current) {
        bwipjs.toCanvas(canvasProdRef.current, {
          bcid: 'code128',
          text: data.productCode,
          scale: 2,
          height: 10,
          incluetext: true,
          textxalign: 'center',
        });
      }

      // ABO/Rh (Code 128)
      if (canvasAboRef.current) {
        bwipjs.toCanvas(canvasAboRef.current, {
          bcid: 'code128',
          text: data.aboRh,
          scale: 2,
          height: 10,
          incluetext: true,
          textxalign: 'center',
        });
      }

      // Expiration (Code 128)
      if (canvasExpRef.current) {
        bwipjs.toCanvas(canvasExpRef.current, {
          bcid: 'code128',
          text: data.expiration,
          scale: 2,
          height: 10,
          incluetext: true,
          textxalign: 'center',
        });
      }

      // DataMatrix (Combined)
      if (canvasDataMatrixRef.current) {
        const compositeData = `${data.din}${data.productCode}${data.aboRh}${data.expiration}`;
        bwipjs.toCanvas(canvasDataMatrixRef.current, {
          bcid: 'datamatrix',
          text: compositeData,
          scale: 3,
          width: 20,
          height: 20,
        });
      }
    } catch (e) {
      console.error("Barcode generation error:", e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Étiquetage ISBT 128</h1>
          <p className="text-gray-500">Génération d'étiquettes conformes pour les produits sanguins finis.</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
        >
          <Printer size={18} />
          Imprimer l'étiquette
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire de saisie */}
        <div className="lg:col-span-1 space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm print:hidden">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText size={20} className="text-gray-500" />
            Données du Produit
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de Don (DIN)</label>
            <input
              type="text"
              value={data.din}
              onChange={(e) => setData({ ...data, din: e.target.value })}
              className="w-full rounded-lg border-gray-300 border p-2 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Format: =A9999YYNNNNNNCC</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code Produit</label>
            <input
              type="text"
              value={data.productCode}
              onChange={(e) => setData({ ...data, productCode: e.target.value })}
              className="w-full rounded-lg border-gray-300 border p-2 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Format: =Eaaaabbbb</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code ABO/Rh</label>
            <input
              type="text"
              value={data.aboRh}
              onChange={(e) => setData({ ...data, aboRh: e.target.value })}
              className="w-full rounded-lg border-gray-300 border p-2 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Format: =%gg00</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
            <input
              type="text"
              value={data.expiration}
              onChange={(e) => setData({ ...data, expiration: e.target.value })}
              className="w-full rounded-lg border-gray-300 border p-2 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Format: &amp;&gt;CYYMMDDHHmm</p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            {validating ? (
                <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-3 rounded-lg text-sm">
                    <RefreshCw size={16} className="animate-spin" />
                    Vérification ISBT 128...
                </div>
            ) : validation?.valid ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg text-sm">
                    <Check size={16} />
                    {validation.message}
                </div>
            ) : (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg text-sm">
                    <AlertTriangle size={16} />
                    {validation?.message || "Données non conformes"}
                </div>
            )}
          </div>
        </div>

        {/* Aperçu de l'étiquette (Zone imprimable) */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[600px] print:shadow-none print:border-none print:p-0">
            {/* Simulation d'une étiquette 100mm x 100mm (approximatif à l'écran) */}
            <div className="w-[100mm] h-[100mm] bg-white border border-gray-300 relative p-4 grid grid-cols-2 grid-rows-2 gap-2 print:border-none">
              
              {/* Quadrant 1: DIN */}
              <div className="border-r border-b border-gray-200 p-2 flex flex-col items-start justify-between">
                <span className="text-[8px] uppercase font-bold">Donation Identification Number</span>
                <canvas ref={canvasDinRef} className="max-w-full" />
              </div>

              {/* Quadrant 2: ABO/Rh */}
              <div className="border-b border-gray-200 p-2 flex flex-col items-end justify-between">
                <span className="text-[8px] uppercase font-bold text-right">ABO/Rh Blood Group</span>
                <canvas ref={canvasAboRef} className="max-w-full" />
              </div>

              {/* Quadrant 3: Product Code */}
              <div className="border-r border-gray-200 p-2 flex flex-col items-start justify-between">
                <span className="text-[8px] uppercase font-bold">Product Code</span>
                <canvas ref={canvasProdRef} className="max-w-full" />
                <div className="mt-2 text-[10px] leading-tight">
                  <strong>Concentré de Globules Rouges</strong><br />
                  Déleucocyté, CPD
                </div>
              </div>

              {/* Quadrant 4: Expiration */}
              <div className="p-2 flex flex-col items-end justify-between">
                <span className="text-[8px] uppercase font-bold text-right">Expiration Date</span>
                <canvas ref={canvasExpRef} className="max-w-full" />
              </div>

              {/* Center: DataMatrix (Overlay) */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-2">
                <canvas ref={canvasDataMatrixRef} />
              </div>

            </div>
            
            <p className="mt-8 text-sm text-gray-400 print:hidden">
              Aperçu de l'étiquette finale (Format standard 100x100mm)
            </p>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .lg\\:col-span-2, .lg\\:col-span-2 * {
            visibility: visible;
          }
          .lg\\:col-span-2 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            border: none;
          }
          /* Hide non-print elements inside the print area if any */
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
