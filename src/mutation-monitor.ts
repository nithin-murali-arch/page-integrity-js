import { PageIntegrityConfig, BlockedEventInfo } from './types';

export class MutationMonitor {
  private config: PageIntegrityConfig;
  private observer: MutationObserver | null = null;

  constructor(config: PageIntegrityConfig) {
    this.config = {
      strictMode: config.strictMode ?? true,
      allowedMutations: config.allowedMutations ?? {
        elementTypes: ['div', 'span', 'p', 'a', 'img']
      },
      onBlocked: config.onBlocked
    };
  }

  public updateConfig(newConfig: PageIntegrityConfig): void {
    this.config = {
      ...this.config,
      ...newConfig,
      allowedMutations: newConfig.allowedMutations ?? this.config.allowedMutations
    };
  }

  public startMonitoring(): void {
    this.stopMonitoring(); // Ensure clean state

    this.observer = new MutationObserver((mutations) => {
      this.processMutations(mutations);
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  public stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  public processMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof Element) {
            this.handleTargetMutations(node);
          }
        }
      }
    }
  }

  private handleTargetMutations(element: Element): void {
    if (!this.isAllowedMutation(element)) {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      if (this.config.onBlocked) {
        const stack = new Error().stack || '';
        this.config.onBlocked({
          type: 'mutation',
          target: element,
          stackTrace: stack,
          context: {
            mutationType: 'insert'
          }
        });
      }
    }
  }

  private isAllowedMutation(element: Element): boolean {
    if (!this.config.strictMode) {
      return true;
    }
    if (!this.config.allowedMutations?.elementTypes) {
      return true;
    }
    return this.config.allowedMutations.elementTypes.includes(element.tagName.toLowerCase());
  }
} 