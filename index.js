"use strict";

const fs = require('fs'),
    tree = require('./tree').tree,
    dataLookup = require('./data').lookup,
    {NO_INFO, average, getClassesInRange, getLuminositiesInRange, compareClasses, compareLuminosities} = require('./data'),
    grammarText = fs.readFileSync(__dirname + '/grammar.txt').toString(),
    START_SYMBOL = 'START',
    EPSILON = 'ε',
    MAX_CACHE_SIZE = 1000,
    // Well above the length of any real classification, but short enough to keep parsing time and recursion depth small
    MAX_INPUT_LENGTH = 100,
    cache = new Map(),
    parser = require('./parser').buildParser(grammarText, START_SYMBOL, EPSILON),
    LUMINOSITY_DESCRIPTIONS = {
        'Ia0' : 'Hypergiant',
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
    LUMINOSITY_PREFIXES = {
        'esd' : {luminosityClass : 'VI', description : 'Extreme Sub-Dwarf'},
        'usd' : {luminosityClass : 'VI', description : 'Ultra Sub-Dwarf'},
        'sd' : {luminosityClass : 'VI'},
        'd' : {luminosityClass : 'V'},
        'sg' : {luminosityClass : 'I'},
        'g' : {luminosityClass : 'III'},
        'c' : {luminosityClass : 'I'}
    },
    LUMINOSITY_SHORTHAND_SUFFIX_REGEX = /(a0|a\+|ab|a|b)$/,
    SUFFIXES = {
        whiteDwarf : populateDuplicates({
            'P' : {
                flagName : 'magneticPolarized',
                description : 'Magnetic white dwarf with detectable polarization'
            },
            'E' : {
                flagName : 'emissionLines',
                description : 'Emission lines present'
            },
            'e' : 'E',
            'X' : {
                flagName : 'peculiarOrUnclassifiable',
                description : 'Peculiar or unclassifiable spectrum'
            },
            'd' : {
                flagName : 'circumstellarDust',
                description : 'Circumstellar dust'
            },
            'H' : {
                flagName : 'magneticUnpolarized',
                description : 'Magnetic white dwarf without detectable polarization'
            },
            'V' : {
                flagName : 'variable',
                description : 'Variable'
            },
            'PEC' : {
                flagName : 'peculiarities',
                description : 'Peculiarities exist'
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
    // Indices giving the strength of particular features relative to normal, eg Fe-1 or CN+0.5
    INDICES = {
        'Fe' : {flagName : 'iron', description : 'Iron'},
        'CN' : {flagName : 'cyanogen', description : 'CN (cyanogen)'},
        'CH' : {flagName : 'methylidyne', description : 'CH (methylidyne)'},
        'Ba' : {flagName : 'barium', description : 'Barium'},
        'C2' : {flagName : 'dicarbon', description : 'C2 (Swan band)'},
        'Ca' : {flagName : 'calcium', description : 'Calcium'}
    },
    WOLF_RAYET_SUBTYPES = {
        'E' : 'Early (hotter) type',
        'L' : 'Late (cooler) type',
        'h' : 'Hydrogen emission lines',
        'ha' : 'Hydrogen emission and absorption lines',
        '(h)' : 'Weak hydrogen emission lines',
        'o' : 'No hydrogen lines',
        'b' : 'Broad emission lines'
    },
    WHITE_DWARF_SUBTYPES = {
        'A' : 'Hydrogen lines',
        'B' : 'Neutral helium lines',
        'O' : 'Ionised helium lines',
        'Q' : 'Carbon features',
        'Z' : 'Metal lines',
        'C' : 'No strong lines (continuous spectrum)',
        'X' : 'Unclassifiable spectrum'
    },
    CARBON_STAR_SUBTYPES = {
        'R' : 'Warmer carbon star (formerly class R)',
        'N' : 'Cooler carbon star (formerly class N)',
        'J' : 'Carbon star with strong carbon-13 features',
        'H' : 'CH star (metal-poor carbon star)',
        'Hd' : 'Hydrogen-deficient carbon star'
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

class ParseError extends Error {
    constructor(input, position, expected, message) {
        super(message || ParseError.buildMessage(input, position));
        this.name = 'ParseError';
        this.input = input;
        this.position = position;
        this.expected = expected;
    }

    static buildMessage(input, position) {
        if (position >= input.length) {
            return `Unexpected end of input in '${input}'`;
        }
        return `Unexpected '${input[position]}' at position ${position} in '${input}'`;
    }
}

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
    function isClassCombination() {
        return !tree.findOptional('CLASS_COMBINATION').empty;
    }
    function getClasses() {
        return tree.find('CLASS').map(classTree => {
            const result = {},
                wolfRayetLetter = classTree.findOptional('WOLF_RAYET_LETTER');
            let subtypeCodes = [];

            if (wolfRayetLetter.empty) {
                classTree.onOnlyValue('CLASS_LETTER', letter => result.letter = letter[0]);
            } else {
                // eg WNL is a WN star of the late (L) sub-type
                const letterText = wolfRayetLetter.get()[0];
                result.letter = letterText.substr(0, 2);
                subtypeCodes = [...letterText.substr(2).split('').filter(code => code), ...classTree.find('WOLF_RAYET_QUALIFIER').map(q => q.collectText())];
            }
            classTree.onOptionalValue('CLASS_NUMBER', classNumber => result.number = Number(classNumber.collectText()));

            if (subtypeCodes.length) {
                result.subtypes = subtypeCodes.map(code => ({
                    code,
                    description : WOLF_RAYET_SUBTYPES[code]
                }));
            }

            return result;
        });
    }
    function isUncertain() {
        return tree.find('CLASSES_SUFFIX').length > 0;
    }

    if (!tree.findOptional('AM_CLASSES').empty) {
        // Handled by populateAmClassDetails
        return;
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

            // Ranges are always reported hottest first, so a range written backwards such as K0-G8 becomes G8 to K0
            if (compareClasses(classDetails.range.from, classDetails.range.to) > 0) {
                classDetails.range = {
                    from : classDetails.range.to,
                    to : classDetails.range.from
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

        } else if (isClassCombination()) {
            const classCount = classes.length;
            assert(classCount === 2);

            classDetails.combination = [
                classes[0],
                classes[1]
            ];

        } else {
            assert(classes.length === 1);
            classDetails.value = classes[0];
        }

        if (isUncertain()) {
            classDetails.uncertain = true;
        }
    }
}

function populateAmClassDetails(tree, result) {
    const amClasses = tree.findOptional('AM_CLASSES');
    if (amClasses.empty) {
        return;
    }

    // Am (metallic-line) stars give separate types from the calcium K line, the hydrogen lines and the metal lines, eg kA2hA5mA7
    function getLineType(symbol) {
        const lineType = amClasses.findOptional(symbol);
        if (!lineType.empty) {
            const clazz = lineType.findOnly('AM_CLASS'),
                result = {};
            clazz.onOnlyValue('CLASS_LETTER', letter => result.letter = letter[0]);
            clazz.onOptionalValue('CLASS_NUMBER', classNumber => result.number = Number(classNumber.collectText()));
            return result;
        }
    }

    const lineTypes = {},
        calciumK = getLineType('AM_K_TYPE'),
        hydrogen = getLineType('AM_H_TYPE'),
        metallic = getLineType('AM_M_TYPE');

    if (calciumK) {
        lineTypes.calciumK = calciumK;
    }
    if (hydrogen) {
        lineTypes.hydrogen = hydrogen;
    }
    if (metallic) {
        lineTypes.metallic = metallic;
    }

    // The hydrogen line type is the best guide to temperature, so use it as the main class if it's present
    const mainType = hydrogen || calciumK;

    result.class = {
        text : amClasses.findOnly('AM_CLASSES_BODY').collectText(),
        value : Object.assign({}, mainType, {lineTypes})
    };
    if (amClasses.find('CLASSES_SUFFIX').length) {
        result.class.uncertain = true;
    }
}

function populateSTypeClassDetails(tree, result) {
    function isSType(){
        return !tree.findOptional('S_TYPE').empty;
    }
    function getBaseNumber(){
        const zeroToTen = tree.findOptional('S_TYPE').findOptional('ZERO_TO_TEN');
        if (!zeroToTen.empty) {
            return Number(zeroToTen.get());
        }
    }
    function getZrOTiORatio() {
        const oneToNine = tree.findOptional('ZRO_TIO_RATIO').findOptional('ONE_TO_NINE');
        if (!oneToNine.empty) {
            return Number(oneToNine.get());
        }
    }
    function getCORatio() {
        const oneToTen = tree.findOptional('C_O_RATIO').findOptional('ONE_TO_TEN');
        if (!oneToTen.empty) {
            return Number(oneToTen.get());
        }
    }
    function getZrOStrength() {
        const oneToFive = tree.findOptional('ZRO_STRENGTH').findOptional('ONE_TO_FIVE');
        if (!oneToFive.empty) {
            return Number(oneToFive.get());
        }
    }
    if (isSType()) {
        result.class = {
            text : tree.findOnly('S_TYPE').collectText(),
            value : {
                letter : tree.findOnly('S_TYPE_LETTER').get()[0]
            }
        };

        const baseNumber = getBaseNumber();
        if (baseNumber !== undefined) {
            result.class.value.number = baseNumber;
        }

        const abundance = {},
            zrOTiORatio = getZrOTiORatio(),
            cORatio = getCORatio(),
            zrOStrength = getZrOStrength();

        if (zrOTiORatio !== undefined) {
            abundance.ZrOTiORatio = zrOTiORatio;
        }
        if (cORatio !== undefined) {
            abundance.CORatio = cORatio;
        }
        if (zrOStrength !== undefined) {
            abundance.ZrOStrength = zrOStrength;
        }
        if (Object.keys(abundance).length) {
            result.class.value.abundance = abundance;
        }
    }
}

function populateWhiteDwarfDetails(tree, result) {
    function isWhiteDwarf(){
        return !tree.findOptional('WHITE_DWARF').empty;
    }
    function getType(){
        return tree.findOptional('DWARF_TYPES').collectText();
    }
    function getTemperature(){
        const temperature = tree.findOptional('DWARF_TEMPERATURE').collectText();
        if (temperature) {
            return Number(temperature);
        }
    }
    function getPeculiarities(){
        return tree.find('DWARF_PECULIARITY').map(p => p.get());
    }

    if (isWhiteDwarf()) {
        result.class = {
            text : 'D' + tree.findOptional('DWARF_TYPES').collectText() + tree.findOptional('DWARF_TEMPERATURE').collectText(),
            value : {
                letter : 'D'
            }
        };

        if (tree.find('CLASSES_SUFFIX').length) {
            result.class.uncertain = true;
        }

        // For white dwarfs the number is the temperature index, 50400/T
        const temperature = getTemperature();
        if (temperature !== undefined) {
            result.class.value.number = temperature;
        }

        const subtypes = getType().split('');
        if (subtypes.length) {
            result.class.value.subtypes = subtypes.map(code => ({
                code,
                description : WHITE_DWARF_SUBTYPES[code]
            }));
        }

        const peculiarities = getPeculiarities();
        if (peculiarities.length) {
            result.peculiarities = {
                text : peculiarities.map(p => p[0]).join(' '),
                flags : {},
                details : []
            };
            peculiarities.map(p => p[0]).forEach(peculiarity => {
                const details = SUFFIXES.whiteDwarf[peculiarity];
                assert(details, peculiarity);

                result.peculiarities.flags[details.flagName] = true;
                result.peculiarities.details.push({
                    text : peculiarity,
                    description : details.description
                });
            })
        }
    }
}

function populateCarbonStarDetails(tree, result) {
    function isCarbonStar(){
        return !tree.findOptional('CARBON_STAR').empty;
    }

    if (isCarbonStar()) {
        const carbonStar = tree.findOnly('CARBON_STAR'),
            carbonType = carbonStar.findOptional('CARBON_TYPE'),
            value = {
                letter : 'C'
            };

        result.class = {
            text : carbonStar.collectText(),
            value
        };

        carbonStar.onOptionalValue('CLASS_NUMBER', classNumber => value.number = Number(classNumber.collectText()));

        if (!carbonType.empty) {
            // Modern notation, eg C-N5
            const subtype = carbonType.get()[0].replace('C-', '');
            value.subtypes = [{
                code : subtype,
                description : CARBON_STAR_SUBTYPES[subtype]
            }];

        } else {
            // Older notation, eg C5,4 where the second number is the strength of the C2 bands
            const c2Strength = carbonStar.findOptional('CARBON_C2_STRENGTH').findOptional('NUMBER');
            if (!c2Strength.empty) {
                value.abundance = {
                    C2Strength : Number(c2Strength.get()[0])
                };
            }
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
        const rangeOrChoice = isLuminosityRange() ? tree.findOnly('LUMINOSITY_RANGE') : isLuminosityChoice() ? tree.findOnly('LUMINOSITY_CHOICE') : null;
        if (!rangeOrChoice) {
            return [tree.findOnly('LUMINOSITY').collectText()];
        }

        const [first, , second] = rangeOrChoice.children(),
            firstText = first.collectText(),
            secondText = second.collectText(),
            secondIsShorthand = /SHORTHAND$/.test(Object.keys(second.get())[0]);

        // Shorthand such as Iab-b or IIIa/b, where the second value only gives the sub-division, so means Iab-Ib or IIIa/IIIb
        return [firstText, secondIsShorthand ? firstText.replace(LUMINOSITY_SHORTHAND_SUFFIX_REGEX, '') + secondText : secondText];
    }
    function buildLuminosity(value) {
        return {
            luminosityClass : value,
            description : LUMINOSITY_DESCRIPTIONS[value]
        }
    }
    function isUncertain() {
        return tree.find('LUMINOSITIES_SUFFIX').length > 0;
    }

    if (hasLuminosityPrefix()) {
        const luminosityDetails = result.luminosity = {},
            prefix = tree.findOnly('LUMINOSITY_PREFIX').get()[0],
            prefixDetails = LUMINOSITY_PREFIXES[prefix],
            value = buildLuminosity(prefixDetails.luminosityClass);

        if (prefixDetails.description) {
            value.description = prefixDetails.description;
        }
        luminosityDetails.text = prefix;
        luminosityDetails.value = value;

    } else if (hasLuminositySuffix()) {
        const luminosityDetails = result.luminosity = {},
            luminosities = getLuminosityValues();

        luminosityDetails.text = tree.findOnly('LUMINOSITIES_BODY').collectText();

        if (isLuminosityRange()) {
            assert(luminosities.length === 2);

            // Ranges are always reported most luminous first, so V-III becomes III to V
            const [from, to] = compareLuminosities(luminosities[0], luminosities[1]) > 0 ? [luminosities[1], luminosities[0]] : luminosities;
            luminosityDetails.range = {
                from : buildLuminosity(from),
                to : buildLuminosity(to)
            };

        } else if (isLuminosityChoice()) {
            assert(luminosities.length === 2);

            luminosityDetails.choice = luminosities.map(buildLuminosity);

        } else {
            assert(luminosities.length === 1);
            luminosityDetails.value = buildLuminosity(luminosities[0]);
        }
    }

    if (isUncertain()) {
        result.luminosity.uncertain = true;
    }
}

function populatePeculiarities(tree, result) {
    function getSuffixes() {
        // Walk the SUFFIXES list in order, so that each peculiarity is kept together with any uncertainty markers that follow it
        const suffixes = [];
        let suffixesTree = tree.findOptional('SUFFIXES');

        while (!suffixesTree.empty) {
            const [suffix, uncertainties, remainingSuffixes] = suffixesTree.children(),
                suffixValue = suffix.findOnly('SUFFIX'),
                elementValue = suffixValue.findOptional('ELEMENT_VALUE'),
                index = suffixValue.findOptional('INDEX');

            if (!index.empty) {
                const name = index.findOnly('INDEX_NAME').get()[0],
                    valueText = index.findOnly('INDEX_VALUE').collectText();
                suffixes.push({
                    index : name,
                    // Separate names ending in a digit from the value, eg 'C2 6' rather than 'C26'
                    text : /[0-9]$/.test(name) ? `${name} ${valueText}` : name + valueText,
                    valueText,
                    value : Number(valueText),
                    uncertainty : uncertainties.collectText()
                });
            } else if (elementValue.empty) {
                const weakSuffix = suffixValue.findOptional('WEAK_SUFFIX');
                suffixes.push({
                    // A code in brackets, eg (n), indicates that the feature is only weakly present
                    text : weakSuffix.empty ? suffixValue.get().join(' ') : weakSuffix.get()[0],
                    weak : !weakSuffix.empty,
                    uncertainty : uncertainties.collectText()
                });
            } else {
                suffixes.push({
                    element : elementValue.findOnly('ELEMENT').get()[0],
                    // An element in brackets, eg (Sr), indicates that the lines are only mildly enhanced
                    weak : elementValue.get().length > 1,
                    uncertainty : uncertainties.collectText()
                });
            }
            suffixesTree = remainingSuffixes.findOptional('SUFFIXES');
        }

        return suffixes;
    }

    const suffixes = getSuffixes();
    if (!suffixes.length) {
        return;
    }

    const peculiarities = result.peculiarities = {
        text : '',
        flags : {},
        details : []
    };

    peculiarities.text = suffixes.map(suffix => {
        let details;

        if (suffix.index) {
            const indexDetails = INDICES[suffix.index];
            assert(indexDetails, suffix.index);

            (peculiarities.flags.indices || (peculiarities.flags.indices = {}))[indexDetails.flagName] = suffix.value;
            details = {
                text : suffix.text,
                description : `Strength index of ${indexDetails.description} features: ${suffix.valueText}`,
                value : suffix.value
            };

        } else if (suffix.element) {
            const elementDetails = ELEMENTS[suffix.element];
            assert(elementDetails, suffix.element);

            (peculiarities.flags.elements || (peculiarities.flags.elements = {}))[elementDetails.flagName] = true;
            details = {
                text : suffix.element,
                description : suffix.weak ? `Mildly enhanced spectral lines of ${elementDetails.description}` : `Abnormally strong spectral lines of ${elementDetails.description}`
            };
            if (suffix.weak) {
                details.weak = true;
            }

        } else {
            const suffixDetails = SUFFIXES.global[suffix.text];
            assert(suffixDetails, suffix.text);

            peculiarities.flags[suffixDetails.flagName] = true;
            details = {
                text : suffix.text,
                description : suffixDetails.description
            };
            if (suffix.weak) {
                details.weak = true;
            }
        }

        if (suffix.uncertainty) {
            details.uncertain = true;
        }
        peculiarities.details.push(details);

        const text = suffix.weak ? `(${details.text})` : details.text;
        return text + suffix.uncertainty;
    }).join(' ');
}

function transformStar(tree) {
    const result = {};

    populateClassDetails(tree, result);
    populateAmClassDetails(tree, result);
    populateSTypeClassDetails(tree, result);
    populateWhiteDwarfDetails(tree, result);
    populateCarbonStarDetails(tree, result);
    populateLuminosityDetails(tree, result);
    populatePeculiarities(tree, result);

    return result;
}

function transformParseTree(tree) {
    if (!tree.findOptional('COMPONENTS').empty) {
        // A system written with a separate luminosity for each star, eg F5V+K0III
        return {
            components : tree.find('STAR').map(transformStar)
        };
    }
    return transformStar(tree.findOnly('STAR'));
}

function roundData(data, round = n => Number(n.toPrecision(4))) {
    const result = {};

    Object.keys(data).forEach(key => {
        // Nested values are the RGB colour components, which are integers
        result[key] = typeof data[key] === 'object' ? roundData(data[key], Math.round) : round(data[key]);
    });

    return result;
}

function getData(result) {
    const classes = [],
        luminosities = [];

    if (result.class.value) {
        const value = result.class.value;

        if (value.letter === 'D') {
            // White dwarf data is keyed by sub-type (eg 'DA') and temperature, use each sub-type that is present
            (value.subtypes || []).forEach(subtype => {
                classes.push({
                    letter : value.letter + subtype.code,
                    number : value.number
                });
            });

        } else if (value.letter === 'C') {
            // C-R and C-N correspond to the older R and N classes. data.txt has no data for the other carbon star sub-types.
            const subtype = value.subtypes && value.subtypes[0].code;
            if (!subtype) {
                classes.push(value);
            } else if (subtype === 'R' || subtype === 'N') {
                classes.push({letter : subtype, number : value.number});
            }

        } else {
            classes.push(value);
        }

    } else if (result.class.range) {
        const range = result.class.range;
        classes.push(...getClassesInRange(range.from, range.to));

    } else if (result.class.choice) {
        const choice = result.class.choice;
        classes.push(choice[0]);
        classes.push(choice[1]);

    } else if (result.class.combination) {
        const combination = result.class.combination;
        classes.push(combination[0]);
        classes.push(combination[1]);

    } else {
        assert(false, JSON.stringify(result));
    }

    if (result.luminosity) {
        if (result.luminosity.value) {
            luminosities.push(result.luminosity.value.luminosityClass);

        } else if (result.luminosity.range) {
            const range = result.luminosity.range;
            luminosities.push(...getLuminositiesInRange(range.from.luminosityClass, range.to.luminosityClass));

        } else if (result.luminosity.choice) {
            luminosities.push(result.luminosity.choice[0].luminosityClass);
            luminosities.push(result.luminosity.choice[1].luminosityClass);

        } else {
            assert(false, JSON.stringify(result));
        }

    } else {
        luminosities.push('');
    }

    const dataObjects = [];

    classes.forEach(clazz => {
        luminosities.forEach(luminosity => {
            const dataResult = dataLookup(clazz.letter, clazz.number, luminosity);
            if (dataResult !== NO_INFO) {
                dataObjects.push(dataResult);
            }
        });
    });

    return dataObjects.length ? roundData(average(dataObjects)) : {};
}

function parseText(text) {
    if (cache.has(text)) {
        return cache.get(text);
    }

    const parseResult = parser.parse(text);
    let result;

    if (parseResult.success) {
        const treeWrapper = tree(parseResult.tree);
        result = {value : transformParseTree(treeWrapper)};
    } else {
        result = {error : {position : parseResult.position, expected : parseResult.expected}};
    }

    if (cache.size >= MAX_CACHE_SIZE) {
        // Map iterates in insertion order, so this evicts the oldest entry
        cache.delete(cache.keys().next().value);
    }
    cache.set(text, result);

    return result;
}

function parse(text, augmentWithData) {
    if (typeof text !== 'string') {
        throw new TypeError(`Expected a string to parse but received ${text === null ? 'null' : typeof text}`);
    }
    if (text.length > MAX_INPUT_LENGTH) {
        throw new ParseError(text, MAX_INPUT_LENGTH, [], `Input is longer than the maximum of ${MAX_INPUT_LENGTH} characters`);
    }

    const cachedResult = parseText(text);

    if (cachedResult.error) {
        throw new ParseError(text, cachedResult.error.position, [...cachedResult.error.expected]);
    }

    // Copy so that callers (and the data augmentation below) can't modify the cached value
    const result = deepCopy(cachedResult.value);
    if (augmentWithData) {
        if (result.components) {
            result.components.forEach(component => component.data = getData(component));
        } else {
            result.data = getData(result);
        }
    }
    return result;
}

exports.parse = parse;
exports.ParseError = ParseError;
