import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  initGoogleDriveAuth, 
  signInWithGoogleDrive, 
  signOutGoogleDrive, 
  syncAllDataToDrive, 
  restoreDataFromDrive,
  getDriveAccessToken, 
  DriveUploadedFile,
  TARGET_DRIVE_FOLDER_ID,
  TARGET_DRIVE_FOLDER_URL
} from '../services/googleDriveService';
import { ProyectoEducativo, Moneda, NotificacionGerencia } from '../types';

export interface UseGoogleDriveAutoSyncReturn {
  user: User | null;
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncedFiles: DriveUploadedFile[];
  syncError: string | null;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  conectarGoogleDrive: () => Promise<void>;
  desconectarGoogleDrive: () => Promise<void>;
  sincronizarAhora: () => Promise<boolean>;
  restaurarDesdeDrive: () => Promise<{ proyectos: ProyectoEducativo[]; moneda?: Moneda } | null>;
  folderId: string;
  folderUrl: string;
}

export const useGoogleDriveAutoSync = (
  proyectos: ProyectoEducativo[],
  moneda: Moneda,
  notificaciones: NotificacionGerencia[] = [],
  onNotificar?: (mensaje: string) => void
): UseGoogleDriveAutoSyncReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getDriveAccessToken());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem('summit_drive_last_sync');
      return saved ? new Date(saved) : null;
    } catch {
      return null;
    }
  });
  const [syncedFiles, setSyncedFiles] = useState<DriveUploadedFile[]>(() => {
    try {
      const saved = localStorage.getItem('summit_drive_synced_files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('summit_drive_auto_sync_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const setAutoSyncEnabled = (enabled: boolean) => {
    setAutoSyncEnabledState(enabled);
    try {
      localStorage.setItem('summit_drive_auto_sync_enabled', String(enabled));
    } catch (e) {
      console.error(e);
    }
  };

  // Inicializar listener de sesión de Google
  useEffect(() => {
    const unsubscribe = initGoogleDriveAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Función núcleo de sincronización
  const ejecutarSincronizacion = useCallback(
    async (proyectosActuales: ProyectoEducativo[], monedaActual: Moneda, notifs: NotificacionGerencia[]): Promise<boolean> => {
      const activeToken = token || getDriveAccessToken();
      if (!activeToken) {
        return false;
      }

      setIsSyncing(true);
      setSyncError(null);

      try {
        const result = await syncAllDataToDrive({
          proyectos: proyectosActuales,
          moneda: monedaActual,
          notificaciones: notifs,
          accessToken: activeToken,
          folderId: TARGET_DRIVE_FOLDER_ID,
        });

        const now = new Date();
        setLastSyncTime(now);
        setSyncedFiles(result.files);

        try {
          localStorage.setItem('summit_drive_last_sync', now.toISOString());
          localStorage.setItem('summit_drive_synced_files', JSON.stringify(result.files));
        } catch (e) {
          console.warn('Error guardando timestamp de sincronización:', e);
        }

        return true;
      } catch (err: any) {
        console.error('[Google Drive Sync Error]:', err);
        const errMsg = err?.message || 'Error desconocido al sincronizar con Google Drive';
        setSyncError(errMsg);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [token]
  );

  // Sincronización manual bajo demanda
  const sincronizarAhora = async (): Promise<boolean> => {
    if (!token && !getDriveAccessToken()) {
      try {
        await conectarGoogleDrive();
      } catch (e) {
        return false;
      }
    }
    const ok = await ejecutarSincronizacion(proyectos, moneda, notificaciones);
    if (ok && onNotificar) {
      onNotificar('Datos sincronizados exitosamente en la carpeta de Google Drive');
    }
    return ok;
  };

  // Auto-sincronización reactiva con debounce de 2.5 segundos cuando hay cambios
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const activeToken = token || getDriveAccessToken();
    if (!activeToken) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Primer chequeo: si hay token pero nunca se sincronizó o tiene proyectos, sincronizar al iniciar
      if (proyectos.length > 0 && !lastSyncTime) {
        ejecutarSincronizacion(proyectos, moneda, notificaciones);
      }
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      ejecutarSincronizacion(proyectos, moneda, notificaciones).then((ok) => {
        if (ok && onNotificar) {
          onNotificar('Auto-guardado en Google Drive completado.');
        }
      });
    }, 2500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [proyectos, moneda, notificaciones, autoSyncEnabled, token, ejecutarSincronizacion, lastSyncTime, onNotificar]);

  // Conectar con Google Drive
  const conectarGoogleDrive = async () => {
    try {
      setIsSyncing(true);
      const res = await signInWithGoogleDrive();
      setUser(res.user);
      setToken(res.accessToken);
      if (onNotificar) {
        onNotificar(`Conectado como ${res.user.email}. Iniciando guardado automático en Drive...`);
      }
      // Ejecutar sincronización inicial inmediata con los datos actuales
      await ejecutarSincronizacion(proyectos, moneda, notificaciones);
    } catch (err: any) {
      setSyncError(err?.message || 'Error al conectar con Google Drive');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Desconectar Google Drive
  const desconectarGoogleDrive = async () => {
    await signOutGoogleDrive();
    setUser(null);
    setToken(null);
    if (onNotificar) {
      onNotificar('Sesión de Google Drive desconectada');
    }
  };

  // Restaurar datos desde Google Drive
  const restaurarDesdeDrive = async () => {
    const activeToken = token || getDriveAccessToken();
    if (!activeToken) {
      throw new Error('Debes conectar tu cuenta de Google para restaurar.');
    }
    setIsSyncing(true);
    try {
      const data = await restoreDataFromDrive(TARGET_DRIVE_FOLDER_ID, activeToken);
      if (data && onNotificar) {
        onNotificar(`Se restauraron ${data.proyectos.length} proyectos desde Google Drive.`);
      }
      return data;
    } catch (err: any) {
      setSyncError(err?.message || 'Error al restaurar desde Drive');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    user,
    isAuthenticated: Boolean(user && (token || getDriveAccessToken())),
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
    folderId: TARGET_DRIVE_FOLDER_ID,
    folderUrl: TARGET_DRIVE_FOLDER_URL,
  };
};
