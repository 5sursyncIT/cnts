"use client";

import React, { useState, useEffect, useRef } from 'react';
import bwipjs from 'bwip-js';
import { Printer, RefreshCw, AlertTriangle, Check, FileText } from 'lucide-react';
import { Alert, Button, Card, CardBody, CardHeader, Field, Input, PageHeader } from '@/components/ui';

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
    fetch('/api/etiquetage/next-din')
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
        const res = await fetch('/api/etiquetage/validate', {
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
          includetext: true,
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
          includetext: true,
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
          includetext: true,
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
          includetext: true,
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

  const FIELDS: { key: keyof LabelData; label: string; hint: string }[] = [
    { key: 'din', label: 'Numéro de don (DIN)', hint: 'Format : =A9999YYNNNNNNCC' },
    { key: 'productCode', label: 'Code produit', hint: 'Format : =Eaaaabbbb' },
    { key: 'aboRh', label: 'Code ABO/Rh', hint: 'Format : =%gg00' },
    { key: 'expiration', label: 'Date de péremption', hint: 'Format : &>CYYMMDDHHmm' },
  ];

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          title="Étiquetage ISBT 128"
          description="Génération d’étiquettes conformes pour les produits sanguins finis"
          actions={
            <Button onClick={handlePrint} icon={<Printer className="h-4 w-4" aria-hidden="true" />}>
              Imprimer l’étiquette
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulaire de saisie */}
        <Card className="print:hidden lg:col-span-1">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" aria-hidden="true" />
                Données du produit
              </span>
            }
          />
          <CardBody className="space-y-4">
            {FIELDS.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                <Input
                  type="text"
                  value={data[f.key]}
                  onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                  className="font-mono"
                  spellCheck={false}
                  autoComplete="off"
                />
              </Field>
            ))}

            <div className="border-t border-gray-100 pt-4" aria-live="polite">
              {validating ? (
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Vérification ISBT 128…
                </div>
              ) : validation?.valid ? (
                <Alert tone="success" className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {validation.message}
                </Alert>
              ) : (
                <Alert tone="danger" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {validation?.message || "Données non conformes"}
                </Alert>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Aperçu de l'étiquette (zone imprimable) */}
        <div className="label-print-area lg:col-span-2">
          <Card className="flex min-h-[600px] flex-col items-center justify-center overflow-x-auto p-6 sm:p-8 print:min-h-0 print:rounded-none print:border-none print:p-0 print:shadow-none">
            {/* Simulation d'une étiquette 100 mm x 100 mm (approximatif à l'écran) */}
            <div className="relative grid h-[100mm] w-[100mm] shrink-0 grid-cols-2 grid-rows-2 gap-2 border border-gray-300 bg-white p-4 text-gray-900 print:border-none">
              {/* Quadrant 1 : DIN */}
              <div className="flex flex-col items-start justify-between border-b border-r border-gray-200 p-2">
                <span className="text-[8px] font-bold uppercase">Numéro de don (DIN)</span>
                <canvas ref={canvasDinRef} className="max-w-full" aria-label={`Code-barres DIN ${data.din}`} role="img" />
              </div>

              {/* Quadrant 2 : ABO/Rh */}
              <div className="flex flex-col items-end justify-between border-b border-gray-200 p-2">
                <span className="text-right text-[8px] font-bold uppercase">Groupe ABO/Rh</span>
                <canvas ref={canvasAboRef} className="max-w-full" aria-label={`Code-barres ABO/Rh ${data.aboRh}`} role="img" />
              </div>

              {/* Quadrant 3 : code produit */}
              <div className="flex flex-col items-start justify-between border-r border-gray-200 p-2">
                <span className="text-[8px] font-bold uppercase">Code produit</span>
                <canvas ref={canvasProdRef} className="max-w-full" aria-label={`Code-barres produit ${data.productCode}`} role="img" />
                <div className="mt-2 text-[10px] leading-tight">
                  <strong>Concentré de globules rouges</strong>
                  <br />
                  Déleucocyté, CPD
                </div>
              </div>

              {/* Quadrant 4 : péremption */}
              <div className="flex flex-col items-end justify-between p-2">
                <span className="text-right text-[8px] font-bold uppercase">Date de péremption</span>
                <canvas ref={canvasExpRef} className="max-w-full" aria-label={`Code-barres péremption ${data.expiration}`} role="img" />
              </div>

              {/* Centre : DataMatrix (superposé) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2">
                <canvas ref={canvasDataMatrixRef} aria-label="Code DataMatrix combiné" role="img" />
              </div>
            </div>

            <p className="mt-6 text-sm text-gray-500 print:hidden">
              Aperçu de l’étiquette finale (format standard 100 × 100 mm)
            </p>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .label-print-area,
          .label-print-area * {
            visibility: visible;
          }
          .label-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            border: none;
          }
          /* Masquer les éléments non imprimables dans la zone d'impression */
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
