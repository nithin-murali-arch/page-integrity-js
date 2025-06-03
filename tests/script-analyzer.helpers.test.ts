import { detectSuspiciousStrings } from '../src/utils/script-analyzer';

describe('detectSuspiciousStrings', () => {
  it('detects security bypass patterns', () => {
    expect(detectSuspiciousStrings('document.domain = "*"')).toHaveLength(1);
    expect(detectSuspiciousStrings('Object.defineProperty(window, "cookie")')).toHaveLength(1);
    expect(detectSuspiciousStrings('delete window.alert')).toHaveLength(1);
    expect(detectSuspiciousStrings('window.alert = function(){}')).toHaveLength(1);
  });

  it('detects dangerous file operations and extensions', () => {
    expect(detectSuspiciousStrings('file.php')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.asp')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.jsp')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.exe')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.dll')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.bat')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.cmd')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.sh')).toHaveLength(1);
    expect(detectSuspiciousStrings('file.bash')).toHaveLength(1);
    expect(detectSuspiciousStrings('fs.writeFile("test.txt")')).toHaveLength(1);
    expect(detectSuspiciousStrings('child_process.spawn("ls")')).toHaveLength(1);
  });

  it('detects attack patterns', () => {
    expect(detectSuspiciousStrings('UNION ALL SELECT')).toHaveLength(1);
    expect(detectSuspiciousStrings('sp_executesql')).toHaveLength(1);
    expect(detectSuspiciousStrings('eval("alert(1)")')).toHaveLength(1);
    expect(detectSuspiciousStrings('document.write("<script>")')).toHaveLength(1);
    expect(detectSuspiciousStrings('unescape("%u0041")')).toHaveLength(1);
    expect(detectSuspiciousStrings('String.fromCharCode(65)')).toHaveLength(1);
  });

  it('detects code obfuscation', () => {
    expect(detectSuspiciousStrings('0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4A,0x4B,0x4C')).toHaveLength(1);
    expect(detectSuspiciousStrings('\\x41\\x42\\x43\\x44\\x45\\x46\\x47\\x48\\x49\\x4A\\x4B\\x4C')).toHaveLength(1);
    expect(detectSuspiciousStrings('%41%42%43%44%45%46%47%48%49%4A%4B%4C')).toHaveLength(1);
    expect(detectSuspiciousStrings('a = b + c - d * e / f % g & h | i ^ j')).toHaveLength(1);
  });

  it('returns empty array for benign input', () => {
    expect(detectSuspiciousStrings('console.log("hello world");')).toHaveLength(0);
    expect(detectSuspiciousStrings('')).toHaveLength(0);
  });
}); 