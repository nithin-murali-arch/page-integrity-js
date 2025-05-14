import {
  startScriptBlocking,
  stopScriptBlocking,
  getBlockedScripts,
  getBlockedScriptsCount,
  clearBlockedScripts,
  ScriptBlockingDependencies
} from '../src/script-blocking';
import { ScriptInterceptor } from '../src/utils/script-interceptor';
import { ScriptBlocker, BlockedScript } from '../src/utils/script-blocker';

describe('Script Blocking Functions', () => {
  let mockScriptInterceptor: jest.Mocked<ScriptInterceptor>;
  let mockScriptBlocker: jest.Mocked<ScriptBlocker>;
  let deps: ScriptBlockingDependencies;

  beforeEach(() => {
    mockScriptInterceptor = {
      start: jest.fn(),
      stop: jest.fn()
    } as any;

    mockScriptBlocker = {
      getAllBlockedScripts: jest.fn().mockReturnValue([]),
      getBlockedScriptsCount: jest.fn().mockReturnValue(0),
      clearBlockedScripts: jest.fn()
    } as any;

    deps = {
      scriptInterceptor: mockScriptInterceptor,
      scriptBlocker: mockScriptBlocker
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startScriptBlocking', () => {
    it('should start the script interceptor', () => {
      startScriptBlocking(deps);
      expect(mockScriptInterceptor.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopScriptBlocking', () => {
    it('should stop the script interceptor', () => {
      stopScriptBlocking(deps);
      expect(mockScriptInterceptor.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBlockedScripts', () => {
    it('should return all blocked scripts', () => {
      const blockedScripts: BlockedScript[] = [{
        url: 'https://test.com/script.js',
        reason: 'Malicious script detected',
        analysis: { isMalicious: true }
      }];
      mockScriptBlocker.getAllBlockedScripts.mockReturnValue(blockedScripts);

      const result = getBlockedScripts(deps);
      expect(result).toEqual(blockedScripts);
      expect(mockScriptBlocker.getAllBlockedScripts).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBlockedScriptsCount', () => {
    it('should return the count of blocked scripts', () => {
      mockScriptBlocker.getBlockedScriptsCount.mockReturnValue(5);

      const result = getBlockedScriptsCount(deps);
      expect(result).toBe(5);
      expect(mockScriptBlocker.getBlockedScriptsCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearBlockedScripts', () => {
    it('should clear all blocked scripts', () => {
      clearBlockedScripts(deps);
      expect(mockScriptBlocker.clearBlockedScripts).toHaveBeenCalledTimes(1);
    });
  });
}); 