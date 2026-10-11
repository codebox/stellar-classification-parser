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
        '0' : ['Ia0'],
        'Ia+' : ['Ia0'],
        'I' : ['Ia', 'Ib'],
        'Iab' : ['Ia', 'Ib']
    },
    LUMINOSITY_WITH_MODIFIER_REGEX = /^(II|III|IV|V|VI|VII)[ab]$/,
    SPECTRAL_SEQUENCE = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

function average(dataObjects, weights = dataObjects.map(() => 1)) {
    const result = {},
        totalWeight = weights.reduce((a, weight) => a + weight, 0);

    Object.keys(dataObjects[0]).forEach(key => {
        if (typeof dataObjects[0][key] === 'object') {
            result[key] = average(dataObjects.map(dataObject => dataObject[key]), weights);
        } else {
            result[key] = dataObjects.reduce((a, dataObject, i) => a + dataObject[key] * weights[i], 0) / totalWeight;
        }
    });

    return result;
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
        letterInfo = lookupTree[letter];

    if (letterInfo) {
        const numberInfo = letterInfo[number === undefined ? DEFAULT_NUMBER : number];
        if (numberInfo) {
            const isWhiteDwarf = !! letter.match(IS_WHITE_DWARF_REGEX),
                defaultLuminosity = isWhiteDwarf ? WHITE_DWARF_DEFAULT_LUMINOSITY : NON_WHITE_DWARF_DEFAULT_LUMINOSITY,
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
