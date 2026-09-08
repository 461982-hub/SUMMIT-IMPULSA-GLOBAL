import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Download, 
  FileJson, 
  FileText, 
  ShieldCheck, 
  FolderSync, 
  LogOut, 
  LogIn,
  Loader2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { UseGoogleDriveAutoSyncReturn } from '../utils/useGoogleDriveAutoSync';
import { ProyectoEducativo, Moneda } from '../types';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveSync: UseGoogleDriveAutoSyncReturn;
  proyectos: ProyectoEducativo[];
  moneda: Moneda;
  onRestaurarDatos?: (datos: { proyectos: ProyectoEducativo[]; moneda?: Moneda }) => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  driveSync,
  proyectos,
  moneda,
  onRestaurarDatos,
}) => {
  const {
    user,
    isAuthenticated,
    isSyncing,
    lastSyncTime,
    syncedFiles,
    syncError,
    autoSyncEnabled,
    setAutoSyncEnabled,
    conectarGoogleDrive,
    desconectarGoogleDrive,
    sincronizarAhora,
    restaurarDesdeDrive,
    folderId,
    folderUrl,
  } = driveSync;

  const [confirmarRestaurar, setConfirmarRestaurar] = useState(false);
  const [feedbackRestaurar, setFeedbackRestaurar] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEjecutarRestauracion = async () => {
    try {
      setFeedbackRestaurar('Descargando archivo desde Google Drive...');
      const data = await restaurarDesdeDrive();
      if (data && onRestaurarDatos) {
        onRestaurarDatos(data);
        setFeedbackRestaurar(`¡Éxito! Se restauraron ${data.proyectos.length} proyectos.`);
        setConfirmarRestaurar(false);
      }
    } catch (err: any) {
      setFeedbackRestaurar(`Error: ${err?.message || 'No se pudo restaurar'}`);
    }
  };

  const formatearFecha = (d: Date | null) => {
    if (!d) return 'Sin sincronización registrada';
    return d.toLocaleString('es-HN', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/30">
              <svg className="w-8 h-8 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.71 14.5L4 8h5.36l3.71 6.5H7.71zm8.58 0l-3.71-6.5h5.42l3.71 6.5h-5.42zm-2.86-5L10.57 4h5.43l2.86 5.5h-5.43z" fill="#4285F4"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  Sincronización Automática en Google Drive
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-1">
                Toda la información y reportes generados se guardan automáticamente en tu carpeta designada de Google Drive.
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* Carpeta Oficial de Google Drive */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800">
                  Carpeta Oficial de Destino
                </span>
                <p className="text-xs font-mono font-bold text-slate-800 break-all">
                  ID: {folderId}
                </p>
                <p className="text-[11px] text-slate-600">
                  Espacio en la nube autorizado para respaldar matrices, estados financieros y auditorías.
                </p>
              </div>

              <a
                href={folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <span>Abrir en Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Estado de Conexión de Cuenta */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-slate-300 shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {user ? (user.displayName || user.email) : 'Cuenta no conectada'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {user ? user.email : 'Se requiere autenticar con Google para guardar en Drive'}
                  </span>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={desconectarGoogleDrive}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Desconectar</span>
                </button>
              ) : (
                <button
                  onClick={conectarGoogleDrive}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all"
                >
                  {isSyncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  <span>Conectar Cuenta de Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Configuración de Auto-Guardado */}
          <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <FolderSync className="w-4 h-4 text-emerald-600" />
                Auto-Guardado Reactivo en Tiempo Real
              </span>
              <p className="text-[11px] text-slate-500">
                Guarda automáticamente en la carpeta de Drive cada vez que creas, modificas o recalculas un proyecto.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Mensaje de Error si existiera */}
          {syncError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Aviso de sincronización:</span>
                <span>{syncError}</span>
              </div>
            </div>
          )}

          {/* Lista de Archivos Generados Automáticamente en la Carpeta */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Archivos Gestionados en tu Carpeta
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Última sincronización: {formatearFecha(lastSyncTime)}
              </span>
            </div>

            <div className="space-y-2">
              {/* 1. Base de datos JSON */}
              <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block font-mono">
                      MATRIZ_PROYECTOS_SUMMIT_2026.json
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Base de datos completa con {proyectos.length} proyectos, métricas financieras y correlativos.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  JSON Oficial
                </span>
              </div>

              {/* 2. Informe Consolidado Markdown */}
              <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block font-mono">
                      INFORME_EJECUTIVO_CONSOLIDADO.md
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Informe ejecutivo legible con tablas de rentabilidad, balance y desglose SAR 15% ISV.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                  Markdown / Doc
                </span>
              </div>

              {/* 3. Registro de Auditoría JSON */}
              <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block font-mono">
                      AUDITORIA_Y_ALERTAS_GERENCIALES.json
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Semáforo de riesgos (Crítico, Medio, Bajo) y bitácora de dictámenes inter-gerenciales.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                  Auditoría
                </span>
              </div>
            </div>
          </div>

          {/* Restauración desde Google Drive */}
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  Restaurar Datos desde Google Drive
                </span>
                <p className="text-[11px] text-slate-500">
                  Si cambiaste de dispositivo o borraste el caché local, puedes cargar los datos guardados en Drive.
                </p>
              </div>

              {!confirmarRestaurar ? (
                <button
                  type="button"
                  onClick={() => setConfirmarRestaurar(true)}
                  disabled={!isAuthenticated || isSyncing}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors shrink-0 disabled:opacity-50"
                >
                  Restaurar
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleEjecutarRestauracion}
                    disabled={isSyncing}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmarRestaurar(false)}
                    className="px-2 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {feedbackRestaurar && (
              <p className="text-[11px] font-semibold text-blue-700 mt-1">
                {feedbackRestaurar}
              </p>
            )}
          </div>

        </div>

        {/* Pie del Modal con acciones principales */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            {isSyncing ? (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Transmitiendo cambios a Google Drive...
              </span>
            ) : (
              <span>Carpeta conectada de forma segura con protocolo OAuth 2.0</span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cerrar
            </button>

            <button
              id="btn-modal-sync-ahora"
              onClick={() => sincronizarAhora()}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Sincronizar Todo Ahora</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
