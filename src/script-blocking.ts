import { ScriptBlocker } from './utils/script-blocker';
import { ScriptInterceptor } from './utils/script-interceptor';

export { ScriptBlocker };

export interface ScriptBlockingDependencies {
  scriptInterceptor: ScriptInterceptor;
  scriptBlocker: ScriptBlocker;
}

export function startScriptBlocking(deps: ScriptBlockingDependencies): void {
  deps.scriptInterceptor.start();
}

export function stopScriptBlocking(deps: ScriptBlockingDependencies): void {
  deps.scriptInterceptor.stop();
}

export function getBlockedScripts(deps: ScriptBlockingDependencies): any[] {
  return deps.scriptBlocker.getAllBlockedScripts();
}

export function getBlockedScriptsCount(deps: ScriptBlockingDependencies): number {
  return deps.scriptBlocker.getBlockedScriptsCount();
}

export function clearBlockedScripts(deps: ScriptBlockingDependencies): void {
  deps.scriptBlocker.clearBlockedScripts();
} 