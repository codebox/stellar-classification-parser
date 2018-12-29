"use strict";

function tree(root, epsilon = 'ε') {
    function search(node, name) {
        let results = [];

        if (Array.isArray(node)) {
            node.forEach(item => {
                results.push(...search(item, name));
            });

        } else if (typeof node === 'object') {
            Object.keys(node).forEach(key => {
                const value = node[key];

                if (key === name) {
                    results.push(value);
                } else {
                    results.push(...search(value, name));
                }
            });
        }

        return results
            .filter(r => r !== epsilon)
            .filter(r => !(Array.isArray(r) && r.length === 1 && r[0] === epsilon))
    }

    function collectText(node) {
        let text = '';
        if (typeof node === 'object') {
            if (Array.isArray(node)) {
                return node.map(collectText).join('');
            } else {
                return Object.values(node).map(collectText).join('');
            }
        } else if (node !== epsilon) {
            text += node;
        }
        return text;
    }

    const EMPTY = Object.freeze({
        find(name) {
            return [];
        },
        findOnly(name) {
            throw new Error(`findOnly(${name}) was called on EMPTY tree`);
        },
        findOptional(name) {
            return EMPTY;
        },
        collectText() {
            return '';
        },
        onValue(childName, fn) {},
        onOnlyValue(childName, fn) {},
        onOptionalValue(childName, fn) {},
        toString() {
            return 'EMPTY';
        },
        get() {
            return;
        },
        empty : true
    });

    return {
        find(name) {
            return search(root, name).map(m => tree(m, epsilon));
        },

        findOnly(name) {
            const matches = search(root, name);
            if (matches.length === 1){
                return matches[0];
            }
            throw new Error(`Expected single match for findOnly(${name}) but instead found ${matches.length}, matches were ${JSON.stringify(matches)}`);
        },

        findOptional(name) {
            const matches = search(root, name);

            if (matches.length === 1){
                return tree(matches[0], epsilon);

            } else if (matches.length === 0) {
                return EMPTY;

            } else {
                throw new Error(`Expected one or zero matches for findOptional(${name}) but instead found ${matches.length}, matches were ${JSON.stringify(matches)}`);
            }

        },

        collectText() {
            return collectText(root);
        },

        onValue(childName, fn) {
            search(root, childName).forEach(fn);
            return this;
        },

        onOnlyValue(childName, fn) {
            fn(this.findOnly(childName));
        },

        onOptionalValue(childName, fn) {
            const value = this.findOptional(childName);
            if (!value.empty) {
                fn(value.get());
            }
        },

        toString() {
            return JSON.stringify(root);
        },

        get() {
            return root;
        }
    };
}

exports.tree = tree;

/*
    a :

 */

/*
 node
 find(name) -> [node]
 findOnly(name) -> err or node
 findOptional(name) -> node or EMPTY (a special node which contains nowt)
 collectText() -> string values concat together
 onValue(childName,fn) - calls fn for each matching child
 onOnlyValue(childName,fn) - err or calls fn for only matching value
 onOptionalValue(childName,fn) - calls fn if single value exists
 epsilons are ignored (not returned)

 root.findOptional('CLASS_CHOICE').find('CLASS').map(cl => {
 const result = {}
 cl.onOnlyValue('CLASS_LETTER', v => result.letter = v);
 cl.onOptionalValue('CLASS_NUMBER', v => v.onOnlyValue('NUMBER', v => result.number = Number(v)));
 return result;
 })


 */