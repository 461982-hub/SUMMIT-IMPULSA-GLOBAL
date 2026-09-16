/**
 * Utilidad de alertas de sonido para el sistema
 * Utiliza la Web Audio API estándar del navegador para emitir señales sonoras
 * ejecutivas sin requerir archivos de audio externos.
 */

export function reproducirAlertaSonoraRechazo(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Tono de alerta de dos fases (880Hz -> 587Hz)
    const now = ctx.currentTime;
    
    // Oscilador 1 (Alerta aguda inicial)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.18);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Oscilador 2 (Tono de descenso de atención)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(587.33, now + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(440, now + 0.45);
    gain2.gain.setValueAtTime(0.25, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.45);
  } catch {
    // Si el navegador bloquea audio sin interacción previa, fallar silenciosamente
  }
}
