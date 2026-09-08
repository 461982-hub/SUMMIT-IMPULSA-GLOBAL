import React, { useState } from 'react';
import { 
  Calculator, 
  HelpCircle, 
  Target, 
  CheckCircle2, 
  TrendingUp, 
  FileSpreadsheet, 
  DollarSign, 
  Users, 
  Percent, 
  BookOpen,
  Receipt,
  ShieldCheck
} from 'lucide-react';
import { MARGENES_REFERENCIA } from '../utils/initialData';
import { ISVTaxGuideSection } from './ISVTaxGuideSection';
import { Moneda } from '../types';

interface FormulasExplanationGuideProps {
  moneda?: Moneda;
  tabInicial?: 'formulas' | 'isv';
}

export const FormulasExplanationGuide: React.FC<FormulasExplanationGuideProps> = ({ 
  moneda = 'LPS',
  tabInicial = 'formulas'
}) => {
  const [tabActiva, setTabActiva] = useState<'formulas' | 'isv'>(tabInicial);

  const formulas = [
    {
      paso: '1',
      titulo: 'Gasto Total Operativo',
      color: 'amber',
      formula: 'Gasto Total = Costo Docente + Zoom + Papelería + Gastos Varios',
      descripcion: 'Suma de todos los costos directos necesarios para operar el curso. El costo docente se calcula multiplicando las horas de clase por la tarifa por hora (L 200/hr por defecto).'
    },
    {
      paso: '2',
      titulo: 'Precio de Venta Requerido',
      color: 'blue',
      formula: 'Venta Requerida = Gasto Total Operativo × (1 + Margen %)',
      descripcion: 'Ingreso mínimo que se debe generar para cubrir el 100% de los costos operativos y asegurar el porcentaje de utilidad establecido (ej. 30%, 40%, 50%).'
    },
    {
      paso: '3',
      titulo: 'Ganancia Operativa Base',
      color: 'emerald',
      formula: 'Ganancia Operativa = Venta Requerida - Gasto Total Operativo',
      descripcion: 'Utilidad monetaria neta proyectada al alcanzar exactamente la meta de alumnos proyectados.'
    },
    {
      paso: '4',
      titulo: 'Precio Sugerido por Alumno (Ticket)',
      color: 'purple',
      formula: 'Precio Sugerido = Precio Venta Requerido ÷ Alumnos Proyectados',
      descripcion: 'Monto que se le debe cobrar a cada participante individualmente para alcanzar la meta financiera con el grupo mínimo de alumnos.'
    },
    {
      paso: '5',
      titulo: 'Diferencia & Ganancia por Alumnos Adicionales',
      color: 'indigo',
      formula: 'Ganancia Adicional = (Alumnos Finales - Alumnos Proyectados) × Precio Sugerido',
      descripcion: 'Al superar el punto mínimo proyectado, cada alumno extra aporta el 100% de su matrícula directamente a la ganancia, ya que los costos fijos ya están cubiertos.'
    },
    {
      paso: '6',
      titulo: 'TOTAL GANANCIAS FINALES',
      color: 'emerald',
      formula: 'TOTAL GANANCIAS = Ganancia Operativa + Ganancia Alumnos Adicionales',
      descripcion: 'Resultado económico final neto que queda para la institución o facilitador tras concluir las inscripciones y dictar las clases.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Navegación entre Fórmulas Matemáticas y Régimen ISV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTabActiva('formulas')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              tabActiva === 'formulas'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Fórmulas & Rentabilidad</span>
          </button>
          
          <button
            type="button"
            onClick={() => setTabActiva('isv')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              tabActiva === 'isv'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Régimen Fiscal ISV (SAR)</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-2">
          {tabActiva === 'formulas' 
            ? 'Lógica de costos, márgenes y punto de equilibrio' 
            : 'Tabla de servicios, gravamen 15% y exenciones SAR'}
        </div>
      </div>

      {tabActiva === 'isv' ? (
        <ISVTaxGuideSection moneda={moneda} />
      ) : (
        <>
          {/* Encabezado */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Metodología & Fórmulas de la Matriz de Rentabilidad
              </h2>
              <p className="text-xs text-slate-500">
                Explicación detallada de la lógica matemática y parámetros de la hoja de cálculo de Google Sheets
              </p>
            </div>
          </div>

          {/* Grid de Fórmulas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formulas.map((item) => (
              <div
                key={item.paso}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                      {item.paso}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {item.titulo}
                    </h3>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs font-semibold text-slate-800 my-2.5">
                    {item.formula}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Guía de Márgenes de Referencia */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Guía de Referencia de Márgenes Operativos & Alumnos Mínimos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Reglas de negocio recomendadas según el tamaño del grupo
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {MARGENES_REFERENCIA.map((item) => (
                <div
                  key={item.margen}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {item.margen}%
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                      ≥ {item.alumnosMinimos} alum.
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {item.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

