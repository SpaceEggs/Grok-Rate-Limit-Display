const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class TestElement {
    constructor({ tagName = 'div', attributes = {}, textContent = '', children = [] } = {}) {
        this.tagName = tagName.toLowerCase();
        this.attributes = attributes;
        this.textContent = textContent;
        this.children = children;
    }

    getAttribute(name) {
        return this.attributes[name] || null;
    }

    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
        const results = [];
        const walk = (node) => {
            if (node !== this && matchesSelector(node, selector)) {
                results.push(node);
            }
            for (const child of node.children) {
                walk(child);
            }
        };
        walk(this);
        return results;
    }
}

function matchesSelector(element, selector) {
    if (selector === 'span.font-semibold') {
        return element.tagName === 'span' && (element.attributes.class || '').split(/\s+/).includes('font-semibold');
    }
    if (selector === 'span.inline-block') {
        return element.tagName === 'span' && (element.attributes.class || '').split(/\s+/).includes('inline-block');
    }
    const ariaButtonMatch = selector.match(/^button\[aria-label=['"](.+)['"]\]$/);
    if (ariaButtonMatch) {
        return element.tagName === 'button' && element.getAttribute('aria-label') === ariaButtonMatch[1];
    }
    if (selector === 'button') {
        return element.tagName === 'button';
    }
    return false;
}

function loadHooks() {
    const scriptPath = path.join(__dirname, '..', 'Grok Rate Limit Display-5.3.0.user.js');
    const source = fs.readFileSync(scriptPath, 'utf8');
    const sandbox = {
        console,
        setTimeout,
        clearTimeout,
        setInterval: () => 1,
        clearInterval: () => {},
        MutationObserver: class {
            observe() {}
            disconnect() {}
        },
        window: {
            __GRLD_ENABLE_TEST_HOOKS__: true,
            location: { pathname: '/', origin: 'https://grok.com' },
        },
        document: {
            body: { contains: () => true },
            visibilityState: 'visible',
            addEventListener: () => {},
            querySelector: () => null,
            getElementById: () => null,
        },
    };
    sandbox.window.document = sandbox.document;

    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: scriptPath });
    return sandbox.window.__GRLD_TEST_HOOKS__;
}

function makeQueryBar(modelLabel, ariaLabel = 'Model select') {
    const modelButton = new TestElement({
        tagName: 'button',
        attributes: { 'aria-label': ariaLabel },
        children: [
            new TestElement({
                tagName: 'span',
                attributes: { class: 'font-semibold' },
                textContent: modelLabel,
            }),
        ],
    });
    return new TestElement({ children: [modelButton] });
}

function normalize(value) {
    return JSON.parse(JSON.stringify(value));
}

const hooks = loadHooks();

assert.ok(hooks, 'test hooks should be exposed when enabled');
assert.strictEqual(hooks.getCurrentModelKey(makeQueryBar('Grok 4.3 (beta)', '模型选择')), 'grok-420-computer-use-sa');
assert.strictEqual(hooks.getCurrentModelKey(makeQueryBar('Expert', '模型选择')), 'grok-4');
assert.strictEqual(hooks.getCurrentModelKey(makeQueryBar('Fast', '模型选择')), 'grok-3');

assert.deepStrictEqual(
    normalize(hooks.processRateLimitData({
        highEffortRateLimits: {
            remainingQueries: 35,
            totalQueries: 50,
            waitTimeSeconds: 7200,
        },
        lowEffortRateLimits: {
            remainingQueries: 120,
            usedQueries: 30,
            waitTimeSeconds: 1800,
        },
    }, 'both')),
    {
        highRemaining: 35,
        highTotal: 50,
        highWaitTimeSeconds: 7200,
        lowRemaining: 120,
        lowTotal: 150,
        lowWaitTimeSeconds: 1800,
        waitTimeSeconds: 7200,
    }
);

assert.deepStrictEqual(
    normalize(hooks.processRateLimitData({
        remainingQueries: 12,
        totalQueries: 20,
        waitTimeSeconds: 3600,
    }, 'both')),
    {
        remainingQueries: 12,
        totalQueries: 20,
        waitTimeSeconds: 3600,
    }
);

assert.deepStrictEqual(
    normalize(hooks.processRateLimitData({
        highEffortRateLimits: {
            remainingQueries: 35,
            totalQueries: 50,
            waitTimeSeconds: 7200,
        },
    }, 'high')),
    {
        remainingQueries: 35,
        totalQueries: 50,
        waitTimeSeconds: 7200,
    }
);

assert.strictEqual(hooks.formatQuotaText(35, 50), '35/50');
assert.strictEqual(hooks.formatQuotaText(35, undefined), '35');
assert.strictEqual(hooks.formatResetTime(7200), '2h');
assert.strictEqual(hooks.formatResetTime(7380), '2h 03m');
assert.strictEqual(hooks.getRateLimitWaitTime({ resetAfterSeconds: 7200 }), 7200);
assert.strictEqual(hooks.getRateLimitWaitTime({ windowSizeSeconds: 7200 }), 7200);
assert.strictEqual(
    hooks.getRateLimitWaitTime({ resetTime: new Date(Date.now() + 7200 * 1000).toISOString() }) > 7100,
    true
);
assert.strictEqual(hooks.formatSingleTitle({ remainingQueries: 35, totalQueries: 50, waitTimeSeconds: 7380 }), '35/50 queries remaining. Resets in 2h 03m');
assert.strictEqual(
    hooks.formatBothTitle({
        highRemaining: 35,
        highTotal: 50,
        highWaitTimeSeconds: 7380,
        lowRemaining: 120,
        lowTotal: 150,
        lowWaitTimeSeconds: 1800,
    }),
    'High: 35/50, resets in 2h 03m | Low: 120/150, resets in 30m'
);
assert.deepStrictEqual(
    normalize(hooks.buildTooltipRows({
        response: {
            remainingQueries: 45,
            totalQueries: 50,
            waitTimeSeconds: 7200,
        },
        effort: 'high',
        modelName: 'grok-420-computer-use-sa',
    })),
    [
        ['Quota', '45/50'],
        ['Model', 'grok-420-computer-use-sa'],
        ['Reset', '2h'],
    ]
);
assert.deepStrictEqual(
    normalize(hooks.buildTooltipRows({
        response: {
            highRemaining: 35,
            highTotal: 50,
            highWaitTimeSeconds: 7200,
            lowRemaining: 120,
            lowTotal: 150,
            lowWaitTimeSeconds: 1800,
        },
        effort: 'both',
        modelName: 'grok-4-auto',
    })),
    [
        ['Quota', 'High 35/50 | Low 120/150'],
        ['Model', 'grok-4-auto'],
        ['Reset', 'High 2h | Low 30m'],
    ]
);

console.log('getCurrentModelKey tests passed');
