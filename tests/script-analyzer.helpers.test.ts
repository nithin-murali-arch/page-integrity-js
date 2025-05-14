import { detectSuspiciousStrings } from '../src/utils/script-analyzer';

describe('detectSuspiciousStrings', () => {
  it('detects bypass/evade/disable/override security patterns', () => {
    expect(detectSuspiciousStrings('bypass security')).toHaveLength(1);
    expect(detectSuspiciousStrings('evade protection')).toHaveLength(1);
    expect(detectSuspiciousStrings('disable filter')).toHaveLength(1);
    expect(detectSuspiciousStrings('override policy')).toHaveLength(1);
  });

  it('detects suspicious file types', () => {
    expect(detectSuspiciousStrings('file.php')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.asp')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.jsp')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.exe')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.dll')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.bat')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.cmd')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.sh')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.bash')).toHaveLength(1);
  });

  it('detects common attack patterns', () => {
    expect(detectSuspiciousStrings('sql.injection')).toHaveLength(1);
    expect(detectSuspiciousStrings('nosql.attack')).toHaveLength(1);
    expect(detectSuspiciousStrings('command.injection')).toHaveLength(1);
    expect(detectSuspiciousStrings('shell.attack')).toHaveLength(1);
    expect(detectSuspiciousStrings('exec.injection')).toHaveLength(1);
    expect(detectSuspiciousStrings('system.attack')).toHaveLength(1);
  });

  it('detects hide/conceal/mask/obscure execution/code/script/behavior', () => {
    expect(detectSuspiciousStrings('hide execution')).toHaveLength(1);
    expect(detectSuspiciousStrings('conceal code')).toHaveLength(1);
    expect(detectSuspiciousStrings('mask script')).toHaveLength(1);
    expect(detectSuspiciousStrings('obscure behavior')).toHaveLength(1);
  });

  it('returns empty array for benign input', () => {
    expect(detectSuspiciousStrings('console.log("hello world");')).toHaveLength(0);
    expect(detectSuspiciousStrings('')).toHaveLength(0);
  });
}); 