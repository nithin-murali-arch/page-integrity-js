declare global {
  var createMockScriptElement: (src?: string, text?: string) => HTMLScriptElement;
  var simulateDOMChange: (target: Node, type: 'childList' | 'attributes' | 'characterData', changes: Partial<MutationRecord>) => void;
}

export {}; 