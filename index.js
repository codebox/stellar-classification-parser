"use strict";

const fs = require('fs'),
    grammarText = fs.readFileSync('./grammar.txt').toString(),
    START_SYMBOL = 'START',
    EPSILON = 'ε',
    UNABLE_TO_PARSE = 'nope',
    cache = {},
    parser = require('top-down-parser').buildParser(grammarText, START_SYMBOL, EPSILON);

function assert(stmt) {
    if (!stmt) {
        throw new Error('Assertion failed')
    }
}

function deepCopy(o) {
    return JSON.parse(JSON.stringify(o));
}

function search(o, name) {
    let results = [];
    Object.keys(o).forEach(k => {
        if (k === name) {
            results.push(o[k]);
        }
        let values = o[k];
        if (!Array.isArray(values)){
            values = [values];
        }
        values.forEach(v => {
            if (typeof v === 'object') {
                results.push(...search(v, name));
            }
        })
    });
    return results.filter(k => k !== EPSILON);
}

function searchForOne(o, name, def) {
    const results = search(o, name);
    let result;

    if (results.length === 0) {
        if (def !== undefined) {
            result = def;
        } else {
            throw Error('no value found');
        }

    } else if (results.length === 1) {
        const match = results[0];
        if (Array.isArray(match)) {
            if (match.length === 1){
                result = match[0];
            } else {
                throw Error(`expected array with 1 value but found ${match}`)
            }
        } else {
            result = match;
        }

    } else {
        throw Error('multiple values found');
    }

    if (result === EPSILON) {
        return def;
    } else {
        return result;
    }
}

function collectText(node) {
    let text = '';
    if (typeof node === 'object') {
        if (Array.isArray(node)) {
            return node.map(collectText).join('');
        } else {
            return Object.values(node).map(collectText).join('');
        }
    } else if (node !== EPSILON) {
        text += node;
    }
    return text;
}

function populateClassDetails(tree, result) {
    function isClassRange() {
        return search(tree, 'CLASS_RANGE').length > 0;
    }
    function isClassChoice() {
        return search(tree, 'CLASS_CHOICE').length > 0;
    }
    function getClasses() {
        return search(tree, 'CLASS').map(classNode => {
            const result = {
                letter : searchForOne(classNode, 'CLASS_LETTER')
            }, numbersNode = search(classNode, 'CLASS_NUMBERS');

            if (numbersNode && numbersNode.length) {
                const numberText = collectText(numbersNode);
                if (numberText){
                    result.number = Number(numberText);
                }
            }
            return result;
        });
    }

    const classDetails = result.class = {},
        classes = getClasses();

    classDetails.text = collectText(searchForOne(tree, 'CLASSIFICATION_BODY'));

    if (isClassRange()) {
        const classCount = classes.length;
        assert(classCount === 1 || classCount === 2);

        if (classCount === 1) {
            // Class is of the form A3-4
            const numberAtEndOfRange = Number(collectText(search(tree, 'CLASS_RANGE')[0][2])),
                fromClass = classes[0],
                toClass = deepCopy(fromClass);
            toClass.number = numberAtEndOfRange;

            classDetails.range = {
                from : fromClass,
                to : toClass
            };

        } else if (classCount === 2) {
            // Class is of the form A3-A4
            classDetails.range = {
                from : classes[0],
                to : classes[1]
            };
        }
    } else if (isClassChoice()) {
        const classCount = classes.length;
        assert(classCount === 1 || classCount === 2);

        if (classCount === 1) {
            // Class is of the form A3/4
            const numberAtEndOfRange = Number(collectText(search(tree, 'CLASS_CHOICE')[0][2])),
                class1 = classes[0],
                class2 = deepCopy(class1);
            class2.number = numberAtEndOfRange;
            classDetails.choice = [
                class1,
                class2
            ];

        } else if (classCount === 2) {
            // Class is of the form A3/A4
            classDetails.choice = [
                classes[0],
                classes[1]
            ];
        }

    } else {
        assert(classes.length === 1);
        classDetails.value = classes[0];
    }
}

function populateLuminosityDetails(tree, result) {
    //TODO
}

function transformParseTree(tree) {
    const result = {};

    populateClassDetails(tree, result);
    populateLuminosityDetails(tree, result);

    return result;
}

function parse(text) {
    let result = cache[text];

    if (!result) {
        const parseResult = parser.parse(text);

        if (parseResult && !parseResult.remainder) {
            cache[text] = transformParseTree(parseResult.tree);
        } else {
            cache[text] = UNABLE_TO_PARSE;
        }
    }
    console.log(JSON.stringify(result))
    if (result !== UNABLE_TO_PARSE) {

        return result;
    }
}

exports.parse = parse;