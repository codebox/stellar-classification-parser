"use strict";

const fs = require('fs'),
    grammarText = fs.readFileSync('./grammar.txt').toString(),
    START_SYMBOL = 'START',
    EPSILON = 'ε',
    UNABLE_TO_PARSE = 'nope',
    cache = {},
    parser = require('top-down-parser').buildParser(grammarText, START_SYMBOL, EPSILON),
    LUMINOSITY_DESCRIPTIONS = {
        '0' : 'Hypergiant',
        'Ia+' : 'Hypergiant',
        'Ia' : 'Luminous Supergiant',
        'Iab' : 'Intermediate size Luminous Supergiant',
        'Ib' : 'Less Luminous Supergiant',
        'I' : 'Supergiant',
        'II' : 'Bright Giant',
        'IIa' : 'Luminous Bright Giant',
        'IIb' : 'Less Luminous Bright Giant',
        'III' : 'Giant',
        'IIIa' : 'Luminous Giant',
        'IIIb' : 'Less Luminous Giant',
        'IV' : 'Sub-Giant',
        'IVa' : 'Luminous Sub-Giant',
        'IVb' : 'Less Luminous Sub-Giant',
        'V' : 'Dwarf (Main Sequence)',
        'Va' : 'Luminous Dwarf (Main Sequence)',
        'Vb' : 'Less Luminous Dwarf (Main Sequence)',
        'VI' : 'Sub-Dwarf',
        'VIa' : 'Luminous Sub-Dwarf',
        'VIb' : 'Less Luminous Sub-Dwarf',
        'VII' : 'White-Dwarf',
        'VIIa' : 'Luminous White-Dwarf',
        'VIIb' : 'Less Luminous White-Dwarf'
    },
    LUMINOSITY_PREFIX_TRANSLATION = {
        "sd" : "VI",
        "d" : "V",
        "sg" : "I",
        "g" : "III"
    },
    SUFFIXES = {
        class : {
            ':' : {
                flagName : 'uncertain',
                description : 'Uncertain spectral class'
            }
        },
        luminosity : {
            ':' : {
                flagName : 'uncertain',
                description : 'Uncertain luminosity'
            }
        },
        global : {
            '...' : {
                flagName : 'undescribed',
                description : 'Undescribed peculiarities'
            },
            'comp' : {
                flagName : 'compositeSpectrum',
                description : 'Composite spectrum'
            },
            'e' : {
                flagName : 'emissionLines',
                description : 'Emission lines'
            }
        }
    }

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
            const result = {};
            classNode.forEach(classPath => {
                if (classPath.hasOwnProperty('CLASS_LETTER')){
                    result.letter = classPath['CLASS_LETTER'];
                } else if (classPath.hasOwnProperty('CLASS_NUMBER')){
                    result.number = classPath['CLASS_NUMBER'];
                }
            });
            return result;
        });
    }
    function getClassSuffixes() {
        return search(tree, 'CLASSES_SUFFIX');
    }

    const classDetails = result.class = {},
        classes = getClasses();
    classDetails.text = collectText(searchForOne(tree, 'CLASSES_BODY'));

    if (isClassRange()) {
        const classRangeChildNodes = search(tree, 'CLASS_RANGE')[0];
        assert(classRangeChildNodes.length === 3);

        const classCount = classes.length;
        assert(classCount === 1 || classCount === 2);

        if (classCount === 1) {
            // Class is of the form A3-4
            const numberAtEndOfRange = classRangeChildNodes[2]['CLASS_NUMBER'],
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
        const classChoiceChildNodes = search(tree, 'CLASS_CHOICE')[0];
        assert(classChoiceChildNodes.length === 3);

        const classCount = classes.length;
        assert(classCount === 1 || classCount === 2);

        if (classCount === 1) {
            // Class is of the form A3/4
            const numberAtEndOfRange = classChoiceChildNodes[2]['CLASS_NUMBER'],
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

    const classSuffixes = getClassSuffixes();
    if (classSuffixes.length) {
        const peculiarities = classDetails.peculiarities = {
            text : classSuffixes.join(''),
            flags : {},
            details : []
        };
        classSuffixes.forEach(suffix => {
            const details = SUFFIXES.class[suffix];
            assert(details);
            peculiarities.flags[details.flagName] = true;
            peculiarities.details.push({
                text : suffix,
                description : details.description
            });
        });
    }
}

function populateLuminosityDetails(tree, result) {
    function hasLuminosityPrefix() {
        return search(tree, 'LUMINOSITY_PREFIX').length > 0;
    }
    function hasLuminositySuffix() {
        return search(tree, 'LUMINOSITIES').length > 0;
    }
    function isLuminosityRange() {
        return search(tree, 'LUMINOSITY_RANGE').length > 0;
    }
    function isLuminosityChoice() {
        return search(tree, 'LUMINOSITY_CHOICE').length > 0;
    }
    function getLuminosityValues() {
        return search(tree, 'LUMINOSITY').map(collectText);
    }
    function buildLuminosity(value) {
        return {
            luminosityClass : value,
            description : LUMINOSITY_DESCRIPTIONS[value]
        }
    }
    function getLuminositySuffixes() {
        return search(tree, 'LUMINOSITIES_SUFFIX');
    }

    if (hasLuminosityPrefix()) {
        const luminosityDetails = result.luminosity = {},
            prefix = searchForOne(tree, 'LUMINOSITY_PREFIX'),
            value = LUMINOSITY_PREFIX_TRANSLATION[prefix];

        luminosityDetails.text = prefix;
        luminosityDetails.value = buildLuminosity(value);

    } else if (hasLuminositySuffix()) {
        const luminosityDetails = result.luminosity = {},
            luminosities = getLuminosityValues();

        luminosityDetails.text = collectText(searchForOne(tree, 'LUMINOSITIES_BODY'));

        if (isLuminosityRange()) {
            assert(luminosities.length === 2);

            luminosityDetails.range = {
                from : buildLuminosity(luminosities[0]),
                to : buildLuminosity(luminosities[1])
            };

        } else if (isLuminosityChoice()) {
            assert(luminosities.length === 2);

            luminosityDetails.choice = luminosities.map(buildLuminosity);

        } else {
            assert(luminosities.length === 1);
            luminosityDetails.value = buildLuminosity(luminosities[0]);
        }
    }

    const luminositySuffixes = getLuminositySuffixes();
    if (luminositySuffixes.length) {
        const peculiarities = result.luminosity.peculiarities = {
            text : luminositySuffixes.join(''),
            flags : {},
            details : []
        };
        luminositySuffixes.forEach(suffix => {
            const details = SUFFIXES.luminosity[suffix];
            assert(details);
            peculiarities.flags[details.flagName] = true;
            peculiarities.details.push({
                text : suffix,
                description : details.description
            });
        });
    }
}

function populatePeculiarities(tree, result) {
    function getSuffixes() {
        return search(tree, 'SUFFIX');
    }

    const suffixes = getSuffixes();
    if (suffixes.length) {
        result.peculiarities = {
            text : suffixes.join(''),
            flags : {},
            details : []
        };

        suffixes.forEach(suffix => {
            const details = SUFFIXES.global[suffix];
            assert(details);
            result.peculiarities.flags[details.flagName] = true;
            result.peculiarities.details.push({
                text : suffix,
                description : details.description
            });
        });
    }
}

function flattenParseTree(tree) {
    function walk(node, handler = n => n) {
        Object.keys(node).forEach(key => {
            const value = node[key];
            if (typeof value === 'object') {
                walk(value, handler);
            }
        });
        Object.keys(node).forEach(key => {
            handler(node, key, node[key]);
        });
    }

    function trimSingleElementArrays(obj, key, val) {
        if (Array.isArray(val) && val.length === 1 && typeof val[0] === 'string') {
            obj[key] = val[0];
        }
    }

    function removeEpsilons(obj, key, val) {
        if (val === EPSILON) {
            delete obj[key];
        }
    }

    function removeRangeAndChoiceDelimiters(obj, key, val) {
        if (val === '/' || val === '-') {
            delete obj[key];
        }
    }

    function removeEmptyObjects(obj, key, val) {
        if (Object.keys(val).length === 0 && val.constructor === Object) {
            delete obj[key];
        } else if (Array.isArray(val) && val.length === 0) {
            delete obj[key];
        }
    }

    function filterArrays(obj, key, val) {
        function isEmptyObject(o) {
            return Object.keys(o).length === 0 && o.constructor === Object
        }
        function isEmptyArray(o) {
            return Array.isArray(o) && o.length === 0;
        }
        function isEmptyValue(o){
            return o === undefined || o === null || o === '';
        }
        if (Array.isArray(val)) {
            obj[key] = val.filter(o => !isEmptyObject(o) && !isEmptyArray(o) && !isEmptyValue(o));
        }
    }

    function flattenClassNumbers(obj, key, val) {
        if (key === 'CLASS_NUMBER') {
            obj[key] = Number(collectText(obj[key]));
        }
    }

    walk(tree, removeEpsilons);
    //walk(tree, removeRangeAndChoiceDelimiters);
    walk(tree, filterArrays);
    walk(tree, removeEmptyObjects);
    walk(tree, filterArrays);
    walk(tree, trimSingleElementArrays);
    walk(tree, filterArrays);
    walk(tree, flattenClassNumbers);
}

function transformParseTree(tree) {
    const result = {};

    populateClassDetails(tree, result);
    populateLuminosityDetails(tree, result);
    populatePeculiarities(tree, result);

    return result;
}

function parse(text) {
    let result = cache[text];

    if (!result) {
        const parseResult = parser.parse(text);
        console.log('before flattening',JSON.stringify(parseResult))

        if (parseResult && !parseResult.remainder) {
            flattenParseTree(parseResult.tree)
            console.log('after flattening',JSON.stringify(parseResult))
            result = transformParseTree(parseResult.tree);
        } else {
            result = UNABLE_TO_PARSE;
        }
        cache[text] = result
    }

    if (result !== UNABLE_TO_PARSE) {
        console.log('result=',JSON.stringify(result));
        return result;
    }
}

exports.parse = parse;
