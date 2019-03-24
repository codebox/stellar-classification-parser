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

exports.lookup = (letter, number, luminosity) => {
    const NO_INFO = {},
        DEFAULT_NUMBER = '5',
        IS_WHITE_DWARF_REGEX = /^D.$/,
        NON_WHITE_DWARF_DEFAULT_LUMINOSITY = 'II',
        WHITE_DWARF_DEFAULT_LUMINOSITY = '',
        letterInfo = lookupTree[letter];

    if (letterInfo) {
        const numberInfo = letterInfo[number || DEFAULT_NUMBER];
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
};

