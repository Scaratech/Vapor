
const ZW = "\u200B"; // Zero width

const patterns = [
    /unblocked/gi,
    /games?/gi,
];

function insertZW(s: string): string {
    if (s.length < 2) return s;

    const chars = Array.from(s);
    const mid = chars
        .slice(1, -1)
        .map((c) => (/[a-z]/i.test(c) ? ZW + c : c))
        .join("");

    return chars[0] + mid + ZW + chars[chars.length - 1];
}

function obfMatch(_match: string): string {
    return insertZW(_match);
}

export function obfStr(input: string): string {
    let out = input;

    for (const re of patterns) {
        out = out.replace(re, obfMatch);
    }

    return out;
}

function shouldSkip(el: Element): boolean {
    const tag = el.tagName.toLowerCase();

    if (tag === 'script' || tag === 'style' || tag === 'noscript') return true;
    if ((el as HTMLElement).isContentEditable) return true;
    if (tag === 'input' || tag === 'textarea') return true;

    return false;
}

const safe = new Set(['placeholder', 'title', 'alt', 'aria-label']);

function obfAttrs(el: Element) {
    for (const attr of Array.from(el.attributes)) {
        const name = attr.name;
        const value = attr.value;

        if (!safe.has(name)) continue;
        if (!value) continue;
        if (!/(unblocked|games?)/i.test(value)) continue;

        const dataKey = `data-obf-${name}`;

        if (!el.getAttribute(dataKey)) {
            el.setAttribute(dataKey, value);
            try {
                el.setAttribute(name, obfStr(value));
            } catch { }
        }
    }
}

function processTextNode(node: Text, processed: WeakSet<Text>) {
    if (processed.has(node)) return;
    const s = node.nodeValue || '';
    if (!/(unblocked|games?)/i.test(s)) return;

    try {
        node.nodeValue = obfStr(s);
        processed.add(node);
    } catch { }
}

function walker(root: Node, processed: WeakSet<Text>) {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
            if (n.nodeType === Node.TEXT_NODE) {
                const val = (n as Text).nodeValue || '';
                return /(unblocked|games?)/i.test(val) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }

            if (n.nodeType === Node.ELEMENT_NODE) {
                const el = n as Element;
                return shouldSkip(el) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
            }

            return NodeFilter.FILTER_SKIP;
        }
    } as any);

    let current: Node | null = tw.currentNode;
    current = tw.nextNode();

    while (current) {
        if (current.nodeType === Node.TEXT_NODE) {
            processTextNode(current as Text, processed);
        } else if (current.nodeType === Node.ELEMENT_NODE) {
            obfAttrs(current as Element);
        }

        current = tw.nextNode();
    }

    if (root.nodeType === Node.ELEMENT_NODE) obfAttrs(root as Element);
}

export function obfuscator(root: ParentNode = document): void {
    const processed = new WeakSet<Text>();

    try {
        walker(root as unknown as Node, processed);
    } catch { }

    const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
                processTextNode(m.target as Text, processed);
            }

            if (m.type === 'childList') {
                for (const node of Array.from(m.addedNodes)) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        processTextNode(node as Text, processed);
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node as Element;
                        if (!shouldSkip(el)) {
                            obfAttrs(el);
                            walker(el, processed);
                        }
                    }
                }
            }

            if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) {
                const el = m.target as Element;
                if (!shouldSkip(el)) obfAttrs(el);
            }
        }
    });

    try {
        mo.observe(document.documentElement, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: Array.from(safe),
        });
    } catch { }
}
