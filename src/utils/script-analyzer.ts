// Malicious behavior patterns to check for
const MALICIOUS_PATTERNS = {
  // Evasion techniques
  evasion: [
    // Attempting to bypass CSP
    /document\.write\s*\(\s*['"]<iframe[^>]*src\s*=\s*['"]javascript:/i,
    /document\.location\s*=\s*['"]javascript:/i,
    // Trying to hide script execution
    /(?:setTimeout|setInterval)\s*\(\s*['"][^'"]*['"]/i,
    // Attempting to bypass same-origin policy
    /document\.domain\s*=\s*['"][^'"]*['"]/i,
    // Trying to disable security features
    /Object\.defineProperty\s*\(\s*window\s*,\s*['"]onerror['"]/i,
  ],

  // Covert execution patterns
  covertExecution: [
    // Hidden iframe with malicious intent
    /document\.write\s*\(\s*['"]<iframe[^>]*style\s*=\s*['"]display\s*:\s*none[^>]*src\s*=\s*['"](?:javascript|data|vbscript):/i,
    // Stealthy script injection
    /document\.write\s*\(\s*['"]<script[^>]*src\s*=\s*['"](?:javascript|data|vbscript):/i,
    // Attempting to execute code in a hidden context
    /new\s+Worker\s*\(\s*['"]data:application\/javascript;base64/i,
    // Trying to execute code in a way that avoids detection
    /Function\s*\(\s*['"]return\s+eval\s*\(/i,
    // Direct eval usage
    /eval\s*\(\s*['"][^'"]*['"]\s*\)/i,
    // Function constructor usage
    /new\s+Function\s*\(\s*['"][^'"]*['"]\s*\)/i,
  ],

  // Security bypass attempts
  securityBypass: [
    // Attempting to modify security headers
    /Object\.defineProperty\s*\(\s*document\s*,\s*['"]cookie['"]/i,
    // Trying to bypass XSS filters
    /String\.fromCharCode\s*\(\s*\d+\s*\)\s*\.\s*replace\s*\(\s*['"]\s*['"]\s*,\s*['"]\s*['"]/i,
    // Attempting to disable security features
    /Object\.defineProperty\s*\(\s*navigator\s*,\s*['"]userAgent['"]/i,
    // Trying to bypass same-origin policy
    /document\.domain\s*=\s*['"]\*['"]/i,
    // Modifying window properties
    /Object\.defineProperty\s*\(\s*window\s*,\s*['"]alert['"]/i,
    /delete\s+window\.alert/i,
    /window\.alert\s*=\s*function/i,
  ],

  // Malicious intent indicators
  maliciousIntent: [
    // Attempting to steal sensitive data
    /document\.cookie\s*\+\s*['"](?:\s*&\s*|%26)?(?:key|token|auth|password|secret)=\s*\+\s*encodeURIComponent/i,
    // Trying to inject malicious code
    /document\.write\s*\(\s*['"]<script[^>]*>\s*eval\s*\(/i,
    // Attempting to modify security settings
    /Object\.defineProperty\s*\(\s*window\s*,\s*['"]localStorage['"]/i,
    // Trying to bypass security controls
    /document\.createElement\s*\(\s*['"]script['"]\s*\)\s*\.\s*setAttribute\s*\(\s*['"]crossorigin['"]/i,
    // Data exfiltration
    /fetch\s*\(\s*['"][^'"]*malicious[^'"]*['"]/i,
    /navigator\.sendBeacon\s*\(\s*['"][^'"]*malicious[^'"]*['"]/i,
  ]
};

export interface AnalysisConfig {
  minScore: number;
  maxThreats: number;
  checkSuspiciousStrings: boolean;
  weights: {
    evasion: number;
    covertExecution: number;
    securityBypass: number;
    maliciousIntent: number;
  };
  scoringRules: {
    minSafeScore: number;
    maxThreats: number;
    suspiciousStringWeight: number;
  };
}

export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  minScore: 3,
  maxThreats: 2,
  checkSuspiciousStrings: true,
  weights: {
    evasion: 3,
    covertExecution: 3,
    securityBypass: 2,
    maliciousIntent: 2
  },
  scoringRules: {
    minSafeScore: 3,
    maxThreats: 2,
    suspiciousStringWeight: 1
  }
};

export interface ScriptAnalysis {
  threats: string[];
  score: number;
  details: {
    pattern: string;
    matches: string[];
  }[];
  analysisDetails?: {
    suspiciousStrings?: string[];
    categories?: string[];
    staticScore?: number;
    dynamicScore?: number;
    originScore?: number;
    hashScore?: number;
  };
  isMalicious?: boolean;
}

export function analyzeScript(content: string, config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG): ScriptAnalysis {
  const threats: string[] = [];
  const details: { pattern: string; matches: string[] }[] = [];
  let score = 0;

  // Check each category of patterns
  for (const [category, patterns] of Object.entries(MALICIOUS_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        threats.push(category);
        details.push({
          pattern: pattern.toString(),
          matches: matches
        });
        // Weight different categories
        switch (category) {
          case 'evasion':
            score += 3; // Highest weight for evasion attempts
            break;
          case 'covertExecution':
            score += 3; // Highest weight for covert execution
            break;
          case 'securityBypass':
            score += 2; // Medium weight for security bypass attempts
            break;
          case 'maliciousIntent':
            score += 2; // Medium weight for malicious intent
            break;
        }
      }
    }
  }

  // Check for suspicious combinations
  if (threats.includes('evasion') && 
      (threats.includes('covertExecution') || threats.includes('securityBypass'))) {
    score += 2; // Multiple evasion techniques indicate malicious intent
  }

  // Check for suspicious string patterns
  const suspiciousStrings = config.checkSuspiciousStrings ? detectSuspiciousStrings(content) : [];
  if (suspiciousStrings.length > 0) {
    threats.push('suspicious-strings');
    score += suspiciousStrings.length;
  }

  return {
    threats,
    score,
    details,
    analysisDetails: {
      suspiciousStrings,
      categories: [...new Set(threats)]
    }
  };
}

export function detectSuspiciousStrings(content: string): string[] {
  const suspicious = [];
  // Known malicious patterns
  const maliciousPatterns = [
    /(?:bypass|evade|disable|override)\s*(?:security|protection|filter|policy)/i,
    /\.(?:php|asp|jsp|exe|dll|bat|cmd|sh|bash)(?:\?|$)/i,
    /(?:sql|nosql|command|shell|exec|system)\.(?:injection|attack)/i,
    /(?:hide|conceal|mask|obscure)\s*(?:execution|code|script|behavior)/i,
  ];
  for (const pattern of maliciousPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      suspicious.push(`suspicious-pattern:${pattern.toString()}`);
    }
  }
  return suspicious;
} 