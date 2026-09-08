import React from 'react';
import { 
  Cloud, 
  CloudCheck, 
  CloudUpload, 
  ExternalLink, 
  FolderSync, 
  AlertCircle, 
  Loader2, 
  SlidersHorizontal,
  LogIn
} from 'lucide-react';
import { UseGoogleDriveAutoSyncReturn } from '../utils/useGoogleDriveAutoSync';

interface GoogleDriveSyncBarProps {
  driveSync: UseGoogleDriveAutoSyncReturn;
  onAbrirModalDrive: () => void;
}

export const GoogleDriveSyncBar: React.FC<GoogleDriveSyncBarProps> = ({
  driveSync,
  onAbrirModalDrive,
}) => {
  const {
    user,
    isAuthenticated,
    isSyncing,
    lastSyncTime,
    syncedFiles,
    syncError,
    autoSyncEnabled,
    conectarGoogleDrive,
    sincronizarAhora,
    folderId,
    folderUrl,
  } = driveSync;

  const formatearTiempo = (fecha: Date | null) => {
    if (!fecha) return 'Pendiente';
    return fecha.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div 
      id="google-drive-sync-bar"
      className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-blue-800/40 px-4 sm:px-6 lg:px-8 py-2 text-xs shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Lado Izquierdo: Identidad de la sincronización y Estado */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Logo y Badge de Google Drive */}
          <div className="flex items-center gap-1.5 bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-400/30">
            <svg className="w-4 h-4 text-blue-300 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.01 1.99c-.19 0-.38.05-.55.15L3.39 6.84c-.35.2-.56.58-.56.98v9.36c0 .4.21.78.56.98l8.07 4.7c.34.2.76.2 1.1 0l8.07-4.7c.35-.2.56-.58.56-.98V7.82c0-.4-.21-.78-.56-.98l-8.07-4.7a1.1 1.1 0 0 0-.57-.15z" opacity=".2"/>
              <path d="M7.71 14.5L4 8h5.36l3.71 6.5H7.71zm8.58 0l-3.71-6.5h5.42l3.71 6.5h-5.42zm-2.86-5L10.57 4h5.43l2.86 5.5h-5.43z" fill="#4285F4"/>
            </svg>
            <span className="font-bold tracking-tight text-white flex items-center gap-1">
              Google Drive <span className="text-blue-300 font-normal hidden sm:inline">Auto-Guardado</span>
            </span>
          </div>

          {/* Carpeta Oficial con enlace directo */}
          <a
            href={folderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-200 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.8 rounded-md border border-white/10 transition-colors"
            title="Abrir carpeta oficial de respaldo en Google Drive"
          >
            <FolderSync className="w-3 h-3 text-blue-400" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              Carpeta: {folderId.substring(0, 12)}...
            </span>
            <ExternalLink className="w-2.5 h-2.5 text-blue-300 shrink-0" />
          </a>

          {/* Estado de sincronización en tiempo real */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {isSyncing ? (
                <span className="inline-flex items-center gap-1 text-amber-300 font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Guardando en Drive...
                </span>
              ) : syncError ? (
                <button
                  onClick={onAbrirModalDrive}
                  className="inline-flex items-center gap-1 text-rose-300 hover:text-rose-200 bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/40 text-[11px] font-semibold"
                >
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  <span>Atención requerida</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-300 font-medium text-[11px]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>
                    Auto-sincronizado {lastSyncTime ? `(${formatearTiempo(lastSyncTime)})` : ''}
                  </span>
                  {syncedFiles.length > 0 && (
                    <span className="hidden lg:inline text-slate-300 text-[10px]">
                      • {syncedFiles.length} archivos actualizados en vivo
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Conexión requerida para auto-guardado en tu carpeta</span>
            </div>
          )}
        </div>

        {/* Lado Derecho: Botones de Acción */}
        <div className="flex items-center gap-2 shrink-0">
          {!isAuthenticated ? (
            <button
              id="btn-conectar-drive-bar"
              onClick={conectarGoogleDrive}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-xs text-xs"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span>Conectar Google Drive</span>
            </button>
          ) : (
            <>
              {/* Botón Guardar / Sincronizar Ahora */}
              <button
                id="btn-sync-ahora-bar"
                onClick={() => sincronizarAhora()}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white font-semibold rounded-lg border border-white/15 transition-all text-xs"
                title="Sincronizar todos los datos y reportes de inmediato"
              >
                {isSyncing ? (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                ) : (
                  <CloudUpload className="w-3 h-3 text-blue-300" />
                )}
                <span>Sincronizar Ahora</span>
              </button>

              {/* Botón Ver Carpeta */}
              <a
                href={folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold rounded-lg border border-emerald-500/50 transition-all text-xs"
                title="Abrir tu carpeta de Google Drive en una nueva pestaña"
              >
                <Cloud className="w-3 h-3" />
                <span className="hidden sm:inline">Ver en Drive</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>

              {/* Botón Ajustes / Detalles */}
              <button
                id="btn-ajustes-drive-bar"
                onClick={onAbrirModalDrive}
                className="inline-flex items-center gap-1 p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Configuración y Estado de Sincronización de Drive"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
