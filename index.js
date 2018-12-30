"use strict";

const fs = require('fs'),
    tree = require('./tree').tree,
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
        class : populateDuplicates({
            ':' : {
                flagName : 'uncertain',
                description : 'Uncertain spectral class'
            }
        }),
        luminosity : populateDuplicates({
            ':' : {
                flagName : 'uncertain',
                description : 'Uncertain luminosity'
            }
        }),
        global : populateDuplicates({
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
            },
            'eq' : {
                flagName : 'emissionLinesPCygni',
                description : 'Emission lines with P Cygni profile'
            },
            'f' : {
                flagName : 'n3He2Emission',
                description : 'N III and He II emission'
            },
            '(f)' : {
                flagName : 'n3WeakHe2Emission',
                description : 'N III and weak/missing He II emission'
            },
            '((f))' : {
                flagName : 'he2WeakN3Emission',
                description : 'He II and weak N III emission'
            },
            'He wk' : {
                flagName : 'weakHeliumLines',
                description : 'Weak Helium lines'
            },
            'm' : {
                flagName : 'enhancedMetalFeatures',
                description : 'Enhanced metal features'
            },
            'n' : {
                flagName : 'broadAbsorptionDueToSpinning',
                description : 'Broad absorption due to spinning'
            },
            'nn' : {
                flagName : 'veryBroadAbsorptionFeatures',
                description : 'Very broad absorption features'
            },
            'p' : {
                flagName : 'unspecifiedPeculiarity',
                description : 'Unspecified peculiarity'
            },
            's' : {
                flagName : 'narrowAbsorptionLines',
                description : 'Narrow absorption lines'
            },
            'sh' : {
                flagName : 'shellStarFeatures',
                description : 'Shell star features'
            },
            'v' : {
                flagName : 'variableSpectralFeature',
                description : 'Variable spectral feature'
            },
            'var' : 'v',
            'w' : {
                flagName : 'weakLines',
                description : 'Weak lines'
            },
            'wl' : 'w',
            'wk' : 'w'
        })
    },
    ELEMENTS = {
        'Sr' : {
            flagName : 'strontium',
            description : 'Strontium'
        },
        'He' : {
            flagName : 'helium',
            description : 'Helium'
        },
        'Eu' : {
            flagName : 'europium',
            description : 'Europium'
        },
        'Si' : {
            flagName : 'silicon',
            description : 'Silicon'
        },
        'Hg' : {
            flagName : 'mercury',
            description : 'Mercury'
        },
        'Mn' : {
            flagName : 'manganese',
            description : 'Manganese'
        },
        'Cr' : {
            flagName : 'chromium',
            description : 'Chromium'
        },
        'Fe' : {
            flagName : 'iron',
            description : 'Iron'
        },
        'K'  : {
            flagName : 'potassium',
            description : 'Potassium'
        }
    };

function populateDuplicates(obj) {
    Object.keys(obj).forEach(k => {
        const v = obj[k];
        if (typeof v === 'string' && obj[v]) {
            obj[k] = obj[v];
        }
    });
    return Object.freeze(obj);
}
function assert(stmt, msg) {
    if (!stmt) {
        throw new Error('Assertion failed ' + (msg || ''))
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
        return !tree.findOptional('CLASS_RANGE').empty;
    }
    function isClassChoice() {
        return !tree.findOptional('CLASS_CHOICE').empty;
    }
    function getClasses() {
        return tree.find('CLASS').map(classTree => {
            const result = {};

            classTree.onOnlyValue('CLASS_LETTER', letter => result.letter = letter[0]);
            classTree.onOptionalValue('CLASS_NUMBER', classNumber => result.number = Number(classNumber.collectText()));

            return result;
        });
    }
    function getClassSuffixes() {
        return tree.find('CLASSES_SUFFIX');
    }

    const classes = getClasses();
    if (classes.length) {
        const classDetails = result.class = {};

        classDetails.text = tree.findOnly('CLASSES_BODY').collectText();

        if (isClassRange()) {
            const classRange = tree.findOnly('CLASS_RANGE'),
                classCount = classes.length;
            assert(classCount === 1 || classCount === 2);

            if (classCount === 1) {
                // Class is of the form A3-4
                const numberAtEndOfRange = Number(classRange.child(2).collectText()),
                    fromClass = classes[0],
                    toClass = deepCopy(fromClass);
                toClass.number = numberAtEndOfRange;

                classDetails.range = {
                    from: fromClass,
                    to: toClass
                };

            } else if (classCount === 2) {
                // Class is of the form A3-A4
                classDetails.range = {
                    from: classes[0],
                    to: classes[1]
                };
            }
        } else if (isClassChoice()) {
            const classChoice = tree.findOnly('CLASS_CHOICE'),
                classCount = classes.length;
            assert(classCount === 1 || classCount === 2);

            if (classCount === 1) {
                // Class is of the form A3/4
                const numberAtEndOfRange = Number(classChoice.child(2).collectText()),
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
                text: classSuffixes.join(''),
                flags: {},
                details: []
            };
            classSuffixes.forEach(suffix => {
                const details = SUFFIXES.class[suffix];
                assert(details);

                peculiarities.flags[details.flagName] = true;
                peculiarities.details.push({
                    text: suffix,
                    description: details.description
                });
            });
        }
    }
}

function populateSTypeClassDetails(tree, result) {
    function isSType(){
        return search(tree, 'S_TYPE').length > 0;
    }
    function getBaseNumber(){
        const baseValues = search(tree, 'S_TYPE_BASE_CLASS')[0];
        if (baseValues.length > 1) {
            assert(baseValues.length === 2);
            assert(baseValues[1].ZERO_TO_TEN)
            return Number(baseValues[1].ZERO_TO_TEN)
        }
    }
    function getZrOTiORatio() {
        const ratioParts = search(tree, 'ZRO_TIO_RATIO');
        if (ratioParts.length){
            assert(ratioParts[0].length === 2, ratioParts);
            return Number(ratioParts[0][1].ONE_TO_NINE);
        }
    }
    if (isSType()) {
        const classDetails = result.class = {
            value : {
                letter : 'S'
            }
        };
        classDetails.text = search(tree, 'S_TYPE').map(collectText).join('');

        const baseNumber = getBaseNumber();
        if (baseNumber !== undefined) {
            result.class.value.number = baseNumber;
        }

        const zrOTiORatio = getZrOTiORatio();
        if (zrOTiORatio !== undefined) {
            result.class.value.ZrOTiORatio = zrOTiORatio;
        }
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
        return search(tree, 'SUFFIX')
            .map(suffix => Array.isArray(suffix) ? suffix : [suffix])
            .map(suffixArray => suffixArray.filter(el => typeof el ==='string'))
            .filter(suffixArray => suffixArray.length)
            .map(suffixArray => suffixArray.join(' '))
    }

    function getElements() {
        return search(tree, 'ELEMENT').filter(el => typeof el === 'string');
    }

    const suffixes = getSuffixes();
    if (suffixes.length) {
        result.peculiarities = {
            text : suffixes.join(' '),
            flags : {},
            details : []
        };

        suffixes.forEach(suffix => {
            const details = SUFFIXES.global[suffix];
            assert(details, suffix);

            result.peculiarities.flags[details.flagName] = true;
            result.peculiarities.details.push({
                text : suffix,
                description : details.description
            });
        });
    }

    const elements = getElements();
    if (elements.length) {
        if (!result.peculiarities) {
            result.peculiarities = {
                text : '',
                flags : {},
                details : []
            };
        } else {
            result.peculiarities.text += ' ';
        }

        result.peculiarities.text += elements.join(' ');
        const flags = result.peculiarities.flags.elements = {};

        elements.forEach(element => {
            const details = ELEMENTS[element];

            flags[details.flagName] = true;
            result.peculiarities.details.push({
                text : element,
                description : `Abnormally strong spectral lines of ${details.description}`
            })
        });
    }
}

function transformParseTree(tree) {
    const result = {};

    populateClassDetails(tree, result);
    // populateSTypeClassDetails(tree, result);
    // populateLuminosityDetails(tree, result);
    // populatePeculiarities(tree, result);

    return result;
}

function parse(text) {
    let result = cache[text];

    if (!result) {
        const parseResult = parser.parse(text);

        if (parseResult && !parseResult.remainder) {
            const treeWrapper = tree(parseResult.tree);
            result = transformParseTree(treeWrapper);
        } else {
            result = UNABLE_TO_PARSE;
        }
        cache[text] = result
    }

    if (result !== UNABLE_TO_PARSE) {
        console.log('result=', JSON.stringify(result));
        return result;
    }
}

exports.parse = parse;
