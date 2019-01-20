"use strict";

const r = require('fs').readFileSync('./data.txt').toString()
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
console.log(r)