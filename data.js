"use strict";

const lineObjects = require('fs').readFileSync(__dirname +  '/data.txt').toString()
    .split('\n')
    .map(l => l.trim())
    .filter(l => l)
    .filter(l => l.indexOf('#') !== 0)
    .map(l => l.split(','))
    .map(a => {
        return {
            letter : a[0],
            number : Number(a[1]),
            luminosityClass : a[2],
            mass : Number(a[3]),
            luminosityRelative : Number(a[4]),
            radiusRelative : Number(a[5]),
            temperature : Number(a[6]),
            colourIndexBv : Number(a[7]),
            absoluteMagnitude : Number(a[8]),
            bolometricCorrection : Number(a[9]),
            bolometricMagnitude : Number(a[10]),
            colour : {
                r : Number(a[11]),
                g : Number(a[12]),
                b : Number(a[13])
            }
        };
    });

const lookupTree = {};
lineObjects.forEach(obj => {
    const {letter, number, luminosityClass} = obj,
        letterObj = lookupTree[letter] || (lookupTree[letter] = {}),
        numberObj = letterObj[number]  || (letterObj[number] = {});

    const objClone = {...obj};

    delete objClone.letter;
    delete objClone.number;
    delete objClone.luminosityClass;

    numberObj[luminosityClass] = objClone;
});

const NO_INFO = Object.freeze({}),
    // Luminosity classes that the parser can return, but which don't appear directly in data.txt
    LUMINOSITY_ALIASES = {
        'Ia+' : ['Ia0'],
        'I' : ['Ia', 'Ib'],
        'Iab' : ['Ia', 'Ib']
    },
    LUMINOSITY_WITH_MODIFIER_REGEX = /^(II|III|IV|V|VI|VII)[ab]$/,
    SPECTRAL_SEQUENCE = ['O', 'B', 'A', 'F', 'G', 'K', 'M', 'L', 'T', 'Y'],
    // These vary by orders of magnitude across the spectral classes, so are averaged on a log scale (ie geometric mean).
    // The magnitudes are already logarithmic, and the colour values are not, so they are averaged linearly.
    LOG_SCALE_FIELDS = ['mass', 'luminosityRelative', 'radiusRelative', 'temperature'],
    // The main luminosity classes in data.txt, from most to least luminous
    MAIN_LUMINOSITY_CLASSES = ['Ia0', 'Ia', 'Ib', 'II', 'III', 'IV', 'V', 'VI'],
    // Position of each luminosity class in order of decreasing luminosity, as [lowest, highest]. 'I' covers both Ia and Ib.
    LUMINOSITY_RANKS = {
        'Ia0' : [0, 0], 'Ia+' : [0, 0], 'Ia' : [1, 1], 'Iab' : [1.5, 1.5], 'I' : [1, 2], 'Ib' : [2, 2],
        'II' : [3, 3], 'III' : [4, 4], 'IV' : [5, 5], 'V' : [6, 6], 'VI' : [7, 7], 'VII' : [8, 8]
    };

function average(dataObjects, weights = dataObjects.map(() => 1)) {
    const result = {},
        totalWeight = weights.reduce((a, weight) => a + weight, 0);

    Object.keys(dataObjects[0]).forEach(key => {
        if (typeof dataObjects[0][key] === 'object') {
            result[key] = average(dataObjects.map(dataObject => dataObject[key]), weights);
        } else if (LOG_SCALE_FIELDS.includes(key)) {
            result[key] = Math.exp(dataObjects.reduce((a, dataObject, i) => a + Math.log(dataObject[key]) * weights[i], 0) / totalWeight);
        } else {
            result[key] = dataObjects.reduce((a, dataObject, i) => a + dataObject[key] * weights[i], 0) / totalWeight;
        }
    });

    return result;
}

// Returns the classes from 'from' to 'to' inclusive, including each whole-numbered subclass between them, eg B8-A1
// gives B8, B9, A0 and A1. Classes outside the O-M sequence (eg WN) are only expanded if both ends have the same letter.
function getClassesInRange(from, to) {
    const sameLetter = from.letter === to.letter;

    if (!sameLetter && !(SPECTRAL_SEQUENCE.includes(from.letter) && SPECTRAL_SEQUENCE.includes(to.letter))) {
        return [from, to];
    }

    // A letter without a number covers the whole letter, eg A-F means A0 to F9
    const toPosition = (clazz, defaultNumber) => (sameLetter ? 0 : SPECTRAL_SEQUENCE.indexOf(clazz.letter) * 10) + (clazz.number === undefined ? defaultNumber : clazz.number),
        fromClass = (position) => sameLetter ?
            {letter : from.letter, number : position} :
            {letter : SPECTRAL_SEQUENCE[Math.floor(position / 10)], number : Number((position % 10).toFixed(6))},
        positions = [toPosition(from, 0), toPosition(to, 9)].sort((a, b) => a - b),
        classPositions = [positions[0]];

    for (let position = Math.floor(positions[0]) + 1; position < positions[1]; position++) {
        classPositions.push(position);
    }
    if (positions[1] !== positions[0]) {
        classPositions.push(positions[1]);
    }

    return classPositions.map(fromClass);
}

// Returns the luminosity classes from 'from' to 'to' inclusive, including any main luminosity classes between them, eg II-IV gives II, III and IV
function getLuminositiesInRange(from, to) {
    const baseClass = luminosity => luminosity.replace(LUMINOSITY_WITH_MODIFIER_REGEX, '$1'),
        ranks = [LUMINOSITY_RANKS[baseClass(from)], LUMINOSITY_RANKS[baseClass(to)]].sort((a, b) => a[0] - b[0]),
        between = MAIN_LUMINOSITY_CLASSES.filter(luminosity => {
            const rank = LUMINOSITY_RANKS[luminosity][0];
            return rank > ranks[0][1] && rank < ranks[1][0];
        });

    return [from, ...between, to];
}

function getNextSubclass(letter, number) {
    const nextLetter = SPECTRAL_SEQUENCE[SPECTRAL_SEQUENCE.indexOf(letter) + 1];

    if (number === 9 && SPECTRAL_SEQUENCE.includes(letter) && nextLetter) {
        // eg the subclass after B9 is A0
        return {letter : nextLetter, number : 0};
    }
    return {letter, number : number + 1};
}

function getLuminosityKeys(luminosity) {
    if (LUMINOSITY_ALIASES[luminosity]) {
        return LUMINOSITY_ALIASES[luminosity];
    }
    // data.txt doesn't distinguish the 'a' and 'b' sub-divisions, eg 'IIIa' uses the data for 'III'
    return [luminosity.replace(LUMINOSITY_WITH_MODIFIER_REGEX, '$1')];
}

function lookupLuminosity(letter, number, luminosity) {
    const DEFAULT_NUMBER = '5',
        IS_WHITE_DWARF_REGEX = /^D.$/,
        NON_WHITE_DWARF_DEFAULT_LUMINOSITY = 'V',
        WHITE_DWARF_DEFAULT_LUMINOSITY = '',
        // Carbon and S-type stars are almost all giants
        GIANT_DEFAULT_LUMINOSITY = 'III',
        GIANT_LETTERS = ['C', 'R', 'N', 'S', 'MS', 'SC'],
        letterInfo = lookupTree[letter];

    if (letterInfo) {
        const numberInfo = letterInfo[number === undefined ? DEFAULT_NUMBER : number];
        if (numberInfo) {
            const isWhiteDwarf = !! letter.match(IS_WHITE_DWARF_REGEX),
                defaultLuminosity = isWhiteDwarf ? WHITE_DWARF_DEFAULT_LUMINOSITY :
                    GIANT_LETTERS.includes(letter) ? GIANT_DEFAULT_LUMINOSITY : NON_WHITE_DWARF_DEFAULT_LUMINOSITY,
                data = numberInfo[luminosity || defaultLuminosity];
            if (data) {
                return data;
            }
        }
    }

    return NO_INFO;
}

function lookupClass(letter, number, luminosity) {
    const dataObjects = getLuminosityKeys(luminosity)
        .map(luminosityKey => lookupLuminosity(letter, number, luminosityKey))
        .filter(data => data !== NO_INFO);

    return dataObjects.length ? average(dataObjects) : NO_INFO;
}

exports.NO_INFO = NO_INFO;
exports.average = average;
exports.getClassesInRange = getClassesInRange;
exports.getLuminositiesInRange = getLuminositiesInRange;
exports.lookup = (letter, number, luminosity) => {
    if (number === undefined || Number.isInteger(number)) {
        return lookupClass(letter, number, luminosity);
    }

    // data.txt only has whole-number subclasses, so interpolate between the two nearest ones, eg A3.5 is halfway between A3 and A4
    const lowerNumber = Math.floor(number),
        fraction = number - lowerNumber,
        upper = getNextSubclass(letter, lowerNumber),
        lowerData = lookupClass(letter, lowerNumber, luminosity),
        upperData = lookupClass(upper.letter, upper.number, luminosity);

    if (lowerData !== NO_INFO && upperData !== NO_INFO) {
        return average([lowerData, upperData], [1 - fraction, fraction]);
    }
    // If only one of the neighbouring subclasses has data then use that
    return lowerData !== NO_INFO ? lowerData : upperData;
};
