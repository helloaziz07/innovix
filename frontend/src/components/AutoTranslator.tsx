/**
 * Innovix — AutoTranslator Engine
 * 
 * Uses DOM MutationObserver to intercept English text nodes and automatically 
 * translates them to the user's selected language using the Sarvam API.
 */
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';

const DEBOUNCE_MS = 50;
const IGNORE_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'TEXTAREA']);

// Global cache to prevent re-translating same strings
import preloadedCache from '@/lib/preloadedCache.json';

const getCache = (lang: string) => {
  try {
    const data = localStorage.getItem(`innovix_translation_${lang}`);
    if (data) {
      return JSON.parse(data);
    }
    // Fallback to preloaded dictionary for 0ms delay!
    const base = lang.split('-')[0] || 'en';
    const preloaded = (preloadedCache as Record<string, Record<string, string>>)[base] || {};
    return preloaded;
  } catch {
    const base = lang.split('-')[0] || 'en';
    const preloaded = (preloadedCache as Record<string, Record<string, string>>)[base] || {};
    return preloaded;
  }
};

const setCache = (lang: string, cache: Record<string, string>) => {
  try {
    localStorage.setItem(`innovix_translation_${lang}`, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save translation cache', e);
  }
};

export function AutoTranslator() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const observerRef = useRef<MutationObserver | null>(null);

  // We keep a local memory cache for speed
  const memCache = useRef<Record<string, string>>({});
  
  // Pending nodes waiting for API response
  const pendingNodes = useRef<Map<string, Set<Node>>>(new Map());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If English, we don't translate the DOM (assuming base UI is English)
    if (!currentLang || currentLang.startsWith('en')) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      // Restore all translated text back to English instantly
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (node.parentElement?.closest('.no-translate')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      let n;
      while ((n = walker.nextNode())) {
        const anyNode = n as any;
        if (anyNode.__originalText && n.textContent !== anyNode.__originalText) {
          n.textContent = anyNode.__originalText;
        }
      }
      return;
    }

    // Load initial cache for this language
    memCache.current = getCache(currentLang);
    pendingNodes.current.clear();

    const processTextNode = (node: Node) => {
      // Must be a text node
      if (node.nodeType !== Node.TEXT_NODE) return;
      
      const parent = node.parentElement;
      if (!parent) return;
      if (IGNORE_TAGS.has(parent.tagName) || parent.closest('.no-translate')) return;
      
      // Store original English text on the node if not already stored
      const anyNode = node as any;
      if (!anyNode.__originalText) {
        anyNode.__originalText = (node.textContent || '').trim();
      }

      const originalText = anyNode.__originalText;
      
      // Skip empty or purely numeric/symbol strings
      if (!originalText || originalText.length < 2 || /^[^a-zA-Z]+$/.test(originalText)) return;

      // Also skip if it already matches a cached translation
      if (Object.values(memCache.current).includes(originalText)) return;

      // If we already translated this English string, update instantly
      if (memCache.current[originalText]) {
        // Prevent infinite loops by verifying it needs updating
        if (node.textContent !== memCache.current[originalText]) {
          node.textContent = memCache.current[originalText];
        }
        return;
      }

      // Otherwise, queue for translation
      if (!pendingNodes.current.has(originalText)) {
        pendingNodes.current.set(originalText, new Set());
      }
      pendingNodes.current.get(originalText)!.add(node);
      
      scheduleTranslation();
    };

    const scheduleTranslation = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(async () => {
        const textsToTranslate = Array.from(pendingNodes.current.keys());
        if (textsToTranslate.length === 0) return;

        // Copy maps and clear pending so new nodes don't block
        const nodesToUpdate = new Map(pendingNodes.current);
        pendingNodes.current.clear();

        try {
          const res = await api.post('/translation/batch', {
            texts: textsToTranslate,
            target_lang: currentLang.split('-')[0], // e.g. 'hi-IN' -> 'hi'
            source_lang: 'en'
          });

          const translatedTexts: string[] = res.data.translated;

          let updatedCache = false;

          textsToTranslate.forEach((originalText, index) => {
            const translatedText = translatedTexts[index];
            if (translatedText && translatedText !== originalText) {
              memCache.current[originalText] = translatedText;
              updatedCache = true;

              // Update all nodes that had this text
              const nodes = nodesToUpdate.get(originalText);
              if (nodes) {
                nodes.forEach(node => {
                  if (node.isConnected) { // Only update if still in DOM
                    node.textContent = translatedText;
                  }
                });
              }
            }
          });

          if (updatedCache) {
            setCache(currentLang, memCache.current);
          }

        } catch (error) {
          console.error('[AutoTranslator] Batch translation failed:', error);
          // Put them back in queue on failure
          textsToTranslate.forEach(text => {
            if (!pendingNodes.current.has(text)) {
              pendingNodes.current.set(text, nodesToUpdate.get(text)!);
            }
          });
        }
      }, DEBOUNCE_MS);
    };

    // 1. Initial sweep of the DOM using a TreeWalker
    const walkDOM = () => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (parent && (IGNORE_TAGS.has(parent.tagName) || parent.closest('.no-translate'))) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let node;
      while ((node = walker.nextNode())) {
        processTextNode(node);
      }
    };

    walkDOM();

    // 2. Observe future DOM changes
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              processTextNode(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              // Traverse added element for text nodes
              const walker = document.createTreeWalker(
                node,
                NodeFilter.SHOW_TEXT
              );
              let childNode;
              while ((childNode = walker.nextNode())) {
                processTextNode(childNode);
              }
            }
          });
        } else if (mutation.type === 'characterData') {
          processTextNode(mutation.target);
        }
      });
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentLang]);

  return null; // This is a logic-only component
}
