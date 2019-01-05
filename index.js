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
        return tree.find('CLASSES_SUFFIX').map(s => s.get()[0]);
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
                assert(details, suffix);

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
        return !tree.findOptional('S_TYPE').empty;
    }
    function getBaseNumber(){
        const zeroToTen = tree.findOptional('ZERO_TO_TEN');
        if (!zeroToTen.empty) {
            return Number(zeroToTen.get());
        }
    }
    function getZrOTiORatio() {
        const oneToNine = tree.findOptional('ONE_TO_NINE');
        if (!oneToNine.empty) {
            return Number(oneToNine.get());
        }
    }
    if (isSType()) {
        const classDetails = result.class = {
            value : {
                letter : 'S'
            }
        };
        classDetails.text = tree.findOnly('S_TYPE').collectText();

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
        return !tree.findOptional('LUMINOSITY_PREFIX').empty;
    }
    function hasLuminositySuffix() {
        return !tree.findOptional('LUMINOSITIES').empty;
    }
    function isLuminosityRange() {
        return !tree.findOptional('LUMINOSITY_RANGE').empty;
    }
    function isLuminosityChoice() {
        return !tree.findOptional('LUMINOSITY_CHOICE').empty;
    }
    function getLuminosityValues() {
        return tree.find('LUMINOSITY').map(t => t.collectText());
    }
    function buildLuminosity(value) {
        return {
            luminosityClass : value,
            description : LUMINOSITY_DESCRIPTIONS[value]
        }
    }
    function getLuminositySuffixes() {
        return tree.find('LUMINOSITIES_SUFFIX').map(s => s.get()[0]);
    }

    if (hasLuminosityPrefix()) {
        const luminosityDetails = result.luminosity = {},
            prefix = tree.findOnly('LUMINOSITY_PREFIX').get()[0],
            value = LUMINOSITY_PREFIX_TRANSLATION[prefix];

        luminosityDetails.text = prefix;
        luminosityDetails.value = buildLuminosity(value);

    } else if (hasLuminositySuffix()) {
        const luminosityDetails = result.luminosity = {},
            luminosities = getLuminosityValues();

        luminosityDetails.text = tree.findOnly('LUMINOSITIES_BODY').collectText();

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
            assert(details, suffix);

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
        return tree.find('SUFFIX').filter(s => s.get().every(i => typeof i === 'string')).map(s => s.get().join(' '));
    }

    function getElements() {
        return tree.find('ELEMENT').map(e => e.get()[0]);
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
            });
        });
    }
}

function transformParseTree(tree) {
    const result = {};

    populateClassDetails(tree, result);
    populateSTypeClassDetails(tree, result);
    populateLuminosityDetails(tree, result);
    populatePeculiarities(tree, result);

    return result;
}

function parse(text) {
    let result = cache[text];

    if (!result) {
        const parseResult = parser.parse(text);

        if (parseResult && !parseResult.remainder) {
            console.log('parseResult=', JSON.stringify(parseResult));
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
