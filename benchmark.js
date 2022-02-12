const REPEAT_TIMES = 10;

function assertEqual(expect, acctual) {
    if (expect !== acctual) {
        console.log('assertFailed, expected=' + expect + ', acctual=' + acctual);
    }
}

const suits = [{
    name: 'init 10k element (almost 300k bridge calls)',
    setup: () => {
        Module._clear();
        assertEqual(0, Module._get_element_count());
    },
    teardown: () => {
        const getFirstChild = Module.cwrap('get_first_child', 'string', ['string'])
        const appendChild = Module.cwrap('append_child', null, ['string', 'string']);
        const getElementAttr = Module.cwrap('get_element_attr', 'string', ['string', 'string']);
        const setElementAttr = Module.cwrap('set_element_attr', null, ['string', 'string', 'string']);
        const addElement = Module.cwrap('add_element', null, ['string']);
        const getElementCount = Module.cwrap('get_element_count', 'number', []);

        assertEqual(10000, Module._get_element_count());
        assertEqual('value-20', getElementAttr('node-100', 'attr-20'));
        assertEqual('value-7', getElementAttr('node-999', 'attr-7'));
        assertEqual('', getElementAttr('node-999', 'attr-1000'));
        assertEqual('', getElementAttr('node-A', 'attr-1'));
    },
    targets: [{
        name: 'ccall',
        code: () => {
            const getFirstChild = Module.cwrap('get_first_child', 'string', ['string'])
            const appendChild = Module.cwrap('append_child', null, ['string', 'string']);
            const getElementAttr = Module.cwrap('get_element_attr', 'string', ['string', 'string']);
            const setElementAttr = Module.cwrap('set_element_attr', null, ['string', 'string', 'string']);
            const addElement = Module.cwrap('add_element', null, ['string']);
            const getElementCount = Module.cwrap('get_element_count', 'number', []);

            const t0 = performance.now();
            for (let i = 0; i < 10000; i++) {
                addElement('node-' + i);
                for (let j = 0; j < 30; j++) {
                    setElementAttr('node-' + i, 'attr-' + j, 'value-' + j);
                }
            }
            const t1 = performance.now();

            return t1 - t0;
        },
    }, {
        name: 'directly',
        code: () => {
            const ptrs = [
                Module._malloc(1024),
                Module._malloc(1024),
                Module._malloc(1024),
            ];

            const setElementAttr = (id, key, value) => {
                Module.stringToUTF8(id, ptrs[0], 1024);
                Module.stringToUTF8(key, ptrs[1], 1024);
                Module.stringToUTF8(value, ptrs[2], 1024);
                Module._set_element_attr(ptrs[0], ptrs[1], ptrs[2]);
            };

            const addElement = (id) => {
                Module.stringToUTF8(id, ptrs[0], 1024);
                Module._add_element(ptrs[0]);
            };

            const getElementCount = () => {
                return Module._get_element_count();
            }

            const t0 = performance.now();
            for (let i = 0; i < 10000; i++) {
                addElement('node-' + i);
                for (let j = 0; j < 30; j++) {
                    setElementAttr('node-' + i, 'attr-' + j, 'value-' + j);
                }
            }
            const t1 = performance.now();

            ptrs.forEach(ptr => {
                Module._free(ptr);
            });

            return t1 - t0;
        },
    }, {
        name: 'wasm',
        code: () => {
            const t0 = performance.now();
            Module._case_create_elements();
            const t1 = performance.now();

            return t1 - t0;
        },
    }]
}, {
    name: 'restruct elements (almost 20k bridge calls)',
    setup: () => {
        // create 10k elements, names from node-0 to node-9999
        Module._case_create_elements();
        assertEqual(10000, Module._get_element_count());
    },
    teardown: () => {
        const getFirstChild = Module.cwrap('get_first_child', 'string', ['string'])
        assertEqual('node-1', getFirstChild('node-0'));
    },
    targets: [{
        name: 'ccall',
        code: () => {
            const appendChild = Module.cwrap('append_child', null, ['string', 'string']);
            const getFirstChild = Module.cwrap('get_first_child', 'string', ['string'])

            const t0 = performance.now();
            for (let i = 0; i < 100; i++) {
                for (let j = 0; j < 99; j++) {
                    appendChild('node-' + i, 'node-' + (i + j + 1));
                }

                for (let j = 0; j < 99; j++) {
                    getFirstChild('node-' + i);
                }
            }
            const t1 = performance.now();

            return t1 - t0;
        }
    }, {
        name: 'directly',
        code: () => {
            const ptrs = [
                Module._malloc(1024),
                Module._malloc(1024),
            ];

            const appendChild = (parentId, childId) => {
                Module.stringToUTF8(parentId, ptrs[0], 1024);
                Module.stringToUTF8(childId, ptrs[1], 1024);
                Module._append_child(ptrs[0], ptrs[1]);
            };

            const getFirstChild = (id) => {
                Module.stringToUTF8(id, ptrs[0], 1024);
                const ptr = Module._get_first_child(ptrs[0]);
                return Module.UTF8ToString(ptr, 1024);
            };

            const t0 = performance.now();
            for (let i = 0; i < 100; i++) {
                for (let j = 0; j < 99; j++) {
                    appendChild('node-' + i, 'node-' + (i + j + 1));
                }

                for (let j = 0; j < 99; j++) {
                    getFirstChild('node-' + i);
                }
            }
            const t1 = performance.now();

            ptrs.forEach(Module._free);

            return t1 - t0;
        }
    }, {
        name: 'wasm',
        code: () => {
            const t0 = performance.now();
            Module._case_restruct_tree();
            return performance.now() - t0;
        }
    }]
}]

Module.postRun.push(() => {
    suits.forEach(suit => {
        suit.targets.forEach(target => {
            console.log(`Running Suit "${suit.name}" with ${target.name} ${REPEAT_TIMES}x times...`);
            let duration = 0;

            for (let i = 0; i < REPEAT_TIMES; i++) {
                suit.setup();
                duration += target.code();
                suit.teardown();
            }

            console.log(`Suit "${suit.name}" with ${target.name} average cost is ${duration/REPEAT_TIMES} milliseconds.`);
        });
    });
});
