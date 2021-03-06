describe("Classifier", function() {
    "use strict";

    const parse = require('../index').parse;

    function theText(txt) {
        return {
            isParsedToExactly(expectedResult) {
                expect(parse(txt)).toEqual(expectedResult);
            },
            cannotBeParsed() {
                expect(parse(txt)).not.toBeTruthy();
            }
        };
    }

    describe("handles single letters correctly", function() {
        function resultWithLetter(letter) {
            return {
                class : {
                    text : letter,
                    value : {
                        letter
                    }
                }
            };
        }
        it("WN is valid", () => theText("WN").isParsedToExactly(resultWithLetter('WN')));
        it("WC is valid", () => theText("WC").isParsedToExactly(resultWithLetter('WC')));
        it("O is valid", () => theText("O").isParsedToExactly(resultWithLetter('O')));
        it("B is valid", () => theText("B").isParsedToExactly(resultWithLetter('B')));
        it("A is valid", () => theText("A").isParsedToExactly(resultWithLetter('A')));
        it("F is valid", () => theText("F").isParsedToExactly(resultWithLetter('F')));
        it("G is valid", () => theText("G").isParsedToExactly(resultWithLetter('G')));
        it("K is valid", () => theText("K").isParsedToExactly(resultWithLetter('K')));
        it("M is valid", () => theText("M").isParsedToExactly(resultWithLetter('M')));

        it("X is invalid", () => theText("X").cannotBeParsed());
        it("Q is invalid", () => theText("Q").cannotBeParsed());
    });

    describe("handles single letters and numbers correctly", function() {
        function resultWithLetterAndNumber(letter, number){
            return {
                class : {
                    text : `${letter}${number}`,
                    value : {
                        letter,
                        number
                    }
                }
            };
        }
        it("A0 is valid", () => theText("A0").isParsedToExactly(resultWithLetterAndNumber('A', 0)));
        it("F5 is valid", () => theText("F5").isParsedToExactly(resultWithLetterAndNumber('F', 5)));
        it("K9 is valid", () => theText("K9").isParsedToExactly(resultWithLetterAndNumber('K', 9)));
        it("G2.5 is valid", () => theText("G2.5").isParsedToExactly(resultWithLetterAndNumber('G', 2.5)));

        it("Q0 is invalid", () => theText("Q0").cannotBeParsed());
        it("F33 is invalid", () => theText("F33").cannotBeParsed());
        it("F2.5.7 is invalid", () => theText("F2.5.7").cannotBeParsed());
        it("F2.55 is invalid", () => theText("F2.55").cannotBeParsed());
    });

    describe("multiple", () => {
        it("letters are handled correctly in ranges", () => {
            theText("A-F").isParsedToExactly({
                class: {
                    text: 'A-F',
                    range: {
                        from: {
                            letter: 'A'
                        },
                        to: {
                            letter: 'F'
                        }
                    }
                }
            });
        });
        it("letters are handled correctly in choices", () => {
            theText("A/F").isParsedToExactly({
                class : {
                    text : 'A/F',
                    choice : [
                        {
                            letter : 'A'
                        },
                        {
                            letter : 'F'
                        }
                    ]
                }
            });
        });
        it("letters with numbers are handled correctly in ranges", () => {
            theText("A8-F2").isParsedToExactly({
                class: {
                    text: 'A8-F2',
                    range: {
                        from: {
                            letter: 'A',
                            number: 8
                        },
                        to: {
                            letter: 'F',
                            number: 2
                        }
                    }
                }
            });
        });
        it("letters with numbers are handled correctly in choices", () => {
            theText("A8/F2").isParsedToExactly({
                class : {
                    text : 'A8/F2',
                    choice : [
                        {
                            letter : 'A',
                            number : 8
                        },
                        {
                            letter : 'F',
                            number : 2
                        }
                    ]
                }
            });
        });
        it("letters with number ranges are handled correctly", () => {
            theText("A5-9").isParsedToExactly({
                class: {
                    text: 'A5-9',
                    range: {
                        from: {
                            letter: 'A',
                            number: 5
                        },
                        to: {
                            letter: 'A',
                            number: 9
                        }
                    }
                }
            });
        });
        it("letters with number choices are handled correctly", () => {
            theText("A5/6").isParsedToExactly({
                class : {
                    text : 'A5/6',
                    choice : [
                        {
                            letter : 'A',
                            number : 5
                        },
                        {
                            letter : 'A',
                            number : 6
                        }
                    ]
                }
            });
        });
        it("combination of two letters handled correctly", () => {
            theText("A+F").isParsedToExactly({
                class : {
                    text : 'A+F',
                    combination : [
                        {
                            letter : 'A'
                        },
                        {
                            letter : 'F'
                        }
                    ]
                }
            });
        });
        it("combination of two letters with numbers handled correctly", () => {
            theText("A2+F3").isParsedToExactly({
                class : {
                    text : 'A2+F3',
                    combination : [
                        {
                            letter : 'A',
                            number : 2
                        },
                        {
                            letter : 'F',
                            number : 3
                        }
                    ]
                }
            });
        });
    });

    describe("handles single luminosities correctly", function() {
        function resultWithLuminosity(luminosity, description, text = luminosity){
            return {
                class : {
                    text : `G5`,
                    value : {
                        letter : 'G',
                        number : 5
                    }
                },
                luminosity : {
                    text,
                    value : {
                        luminosityClass : luminosity,
                        description
                    }
                }
            };
        }
        it("G50 is valid", () => theText("G50").isParsedToExactly(resultWithLuminosity('0', 'Hypergiant')));
        it("G5I is valid", () => theText("G5I").isParsedToExactly(resultWithLuminosity('I', 'Supergiant')));
        it("G5Ia+ is valid", () => theText("G5Ia+").isParsedToExactly(resultWithLuminosity('Ia+', 'Hypergiant')));
        it("G5Ia is valid", () => theText("G5Ia").isParsedToExactly(resultWithLuminosity('Ia', 'Luminous Supergiant')));
        it("G5Iab is valid", () => theText("G5Iab").isParsedToExactly(resultWithLuminosity('Iab', 'Intermediate size Luminous Supergiant')));
        it("G5Ib is valid", () => theText("G5Ib").isParsedToExactly(resultWithLuminosity('Ib', 'Less Luminous Supergiant')));
        it("G5II is valid", () => theText("G5II").isParsedToExactly(resultWithLuminosity('II', 'Bright Giant')));
        it("G5IIa is valid", () => theText("G5IIa").isParsedToExactly(resultWithLuminosity('IIa', 'Luminous Bright Giant')));
        it("G5IIb is valid", () => theText("G5IIb").isParsedToExactly(resultWithLuminosity('IIb', 'Less Luminous Bright Giant')));
        it("G5III is valid", () => theText("G5III").isParsedToExactly(resultWithLuminosity('III', 'Giant')));
        it("G5IIIa is valid", () => theText("G5IIIa").isParsedToExactly(resultWithLuminosity('IIIa', 'Luminous Giant')));
        it("G5IIIb is valid", () => theText("G5IIIb").isParsedToExactly(resultWithLuminosity('IIIb', 'Less Luminous Giant')));
        it("G5IV is valid", () => theText("G5IV").isParsedToExactly(resultWithLuminosity('IV', 'Sub-Giant')));
        it("G5IVa is valid", () => theText("G5IVa").isParsedToExactly(resultWithLuminosity('IVa', 'Luminous Sub-Giant')));
        it("G5IVb is valid", () => theText("G5IVb").isParsedToExactly(resultWithLuminosity('IVb', 'Less Luminous Sub-Giant')));
        it("G5V is valid", () => theText("G5V").isParsedToExactly(resultWithLuminosity('V', 'Dwarf (Main Sequence)')));
        it("G5Va is valid", () => theText("G5Va").isParsedToExactly(resultWithLuminosity('Va', 'Luminous Dwarf (Main Sequence)')));
        it("G5Vb is valid", () => theText("G5Vb").isParsedToExactly(resultWithLuminosity('Vb', 'Less Luminous Dwarf (Main Sequence)')));
        it("G5VI is valid", () => theText("G5VI").isParsedToExactly(resultWithLuminosity('VI', 'Sub-Dwarf')));
        it("G5VIa is valid", () => theText("G5VIa").isParsedToExactly(resultWithLuminosity('VIa', 'Luminous Sub-Dwarf')));
        it("G5VIb is valid", () => theText("G5VIb").isParsedToExactly(resultWithLuminosity('VIb', 'Less Luminous Sub-Dwarf')));
        it("G5VII is valid", () => theText("G5VII").isParsedToExactly(resultWithLuminosity('VII', 'White-Dwarf')));
        it("G5VIIa is valid", () => theText("G5VIIa").isParsedToExactly(resultWithLuminosity('VIIa', 'Luminous White-Dwarf')));
        it("G5VIIb is valid", () => theText("G5VIIb").isParsedToExactly(resultWithLuminosity('VIIb', 'Less Luminous White-Dwarf')));

        it("G5VIII is invalid", () => theText("G5VIII").cannotBeParsed());
        it("G5X is invalid", () => theText("G5X").cannotBeParsed());

        it("sdG5 is valid", () => theText("sdG5").isParsedToExactly(resultWithLuminosity('VI', 'Sub-Dwarf', 'sd')));
        it("dG5 is valid", () => theText("dG5").isParsedToExactly(resultWithLuminosity('V', 'Dwarf (Main Sequence)', 'd')));
        it("sgG5 is valid", () => theText("sgG5").isParsedToExactly(resultWithLuminosity('I', 'Supergiant', 'sg')));
        it("gG5 is valid", () => theText("gG5").isParsedToExactly(resultWithLuminosity('III', 'Giant', 'g')));

        it("gG5V is invalid", () => theText("gG5V").cannotBeParsed());
        it("sg/gG5 is invalid", () => theText("sg/gG5").cannotBeParsed());
        it("sg-gG5 is invalid", () => theText("sg-gG5").cannotBeParsed());
        it("sdG5III/IV is invalid", () => theText("sdG5III/IV").cannotBeParsed());
        it("sdG5III-IV is invalid", () => theText("sdG5III-IV").cannotBeParsed());
    });

    describe("handles multiple luminosities correctly", function() {
        it("with ranges", () => theText("G5II-III").isParsedToExactly({
            class : {
                text : 'G5',
                value : {
                    letter : 'G',
                    number : 5
                }
            },
            luminosity : {
                text : 'II-III',
                range : {
                    from : {
                        luminosityClass : 'II',
                        description : 'Bright Giant'
                    },
                    to : {
                        luminosityClass : 'III',
                        description : 'Giant'
                    }
                }
            }
        }));
        it("with choices", () => theText("G5II/III").isParsedToExactly({
            class : {
                text : 'G5',
                value : {
                    letter : 'G',
                    number : 5
                }
            },
            luminosity : {
                text : 'II/III',
                choice : [
                    {
                        luminosityClass : 'II',
                        description : 'Bright Giant'
                    },
                    {
                        luminosityClass : 'III',
                        description : 'Giant'
                    }
                ]
            }
        }));
        it("with range of classes and choice of luminosities", () => theText("G5-K2II/III").isParsedToExactly({
            class : {
                text : 'G5-K2',
                range : {
                    from : {
                        letter : 'G',
                        number : 5
                    },
                    to : {
                        letter : 'K',
                        number : 2
                    }
                }
            },
            luminosity : {
                text : 'II/III',
                choice : [
                    {
                        luminosityClass : 'II',
                        description : 'Bright Giant'
                    },
                    {
                        luminosityClass : 'III',
                        description : 'Giant'
                    }
                ]
            }
        }));
        it("with choice of classes and choice of luminosities", () => theText("G5/K2II/III").isParsedToExactly({
            class : {
                text : 'G5/K2',
                choice : [
                    {
                        letter : 'G',
                        number : 5
                    },
                    {
                        letter : 'K',
                        number : 2
                    }
                ]
            },
            luminosity : {
                text : 'II/III',
                choice : [
                    {
                        luminosityClass : 'II',
                        description : 'Bright Giant'
                    },
                    {
                        luminosityClass : 'III',
                        description : 'Giant'
                    }
                ]
            }
        }));
    });

    describe("handles suffixes correctly", () => {
        describe("after class", () => {
            it("uncertainty", () => theText("G5:").isParsedToExactly({
                class : {
                    text : 'G5',
                    value : {
                        letter : 'G',
                        number : 5
                    },
                    peculiarities : {
                        text : ':',
                        flags : {
                            uncertain : true
                        },
                        details : [{
                            text : ':',
                            description : 'Uncertain spectral class'
                        }]
                    }
                }
            }));
        });
        describe("after luminosity", () => {
            it("uncertainty", () => theText("G5II:").isParsedToExactly({
                class : {
                    text: 'G5',
                    value: {
                        letter: 'G',
                        number: 5
                    }
                },
                luminosity : {
                    text : 'II',
                    value : {
                        luminosityClass : 'II',
                        description : 'Bright Giant'
                    },
                    peculiarities : {
                        text : ':',
                        flags : {
                            uncertain : true
                        },
                        details : [{
                            text : ':',
                            description : 'Uncertain luminosity'
                        }]
                    }
                }
            }));
        });
        describe("after everything", () => {
            it("undescribed peculiarities", () => theText("G...").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : '...',
                    flags : {
                        undescribed : true
                    },
                    details : [{
                        text : '...',
                        description : 'Undescribed peculiarities'
                    }]
                }
            }));
            it("composite spectrum", () => theText("A-F comp").isParsedToExactly({
                class : {
                    text: 'A-F',
                    range: {
                        from: {
                            letter: 'A'
                        },
                        to: {
                            letter: 'F'
                        }
                    }
                },
                peculiarities : {
                    text : 'comp',
                    flags : {
                        compositeSpectrum : true
                    },
                    details : [{
                        text : 'comp',
                        description : 'Composite spectrum'
                    }]
                }
            }));
            it("emission lines", () => theText("GIIIe").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                luminosity : {
                    text: 'III',
                    value: {
                        luminosityClass: 'III',
                        description: 'Giant'
                    }
                },
                peculiarities: {
                    text: 'e',
                    flags: {
                        emissionLines: true
                    },
                    details: [{
                        text: 'e',
                        description: 'Emission lines'
                    }]
                }
            }));
            it("Emission lines with P Cygni profile", () => theText("Geq").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'eq',
                    flags : {
                        emissionLinesPCygni : true
                    },
                    details : [{
                        text : 'eq',
                        description : 'Emission lines with P Cygni profile'
                    }]
                }
            }));
            it("N III and He II emission", () => theText("Gf").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'f',
                    flags : {
                        n3He2Emission : true
                    },
                    details : [{
                        text : 'f',
                        description : 'N III and He II emission'
                    }]
                }
            }));
            it("N III and weak/missing He II emission", () => theText("G(f)").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : '(f)',
                    flags : {
                        n3WeakHe2Emission : true
                    },
                    details : [{
                        text : '(f)',
                        description : 'N III and weak/missing He II emission'
                    }]
                }
            }));
            it("He II and weak N III emission", () => theText("G((f))").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : '((f))',
                    flags : {
                        he2WeakN3Emission : true
                    },
                    details : [{
                        text : '((f))',
                        description : 'He II and weak N III emission'
                    }]
                }
            }));
            it("Weak Helium lines", () => theText("G He wk").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'He wk',
                    flags : {
                        weakHeliumLines : true
                    },
                    details : [{
                        text : 'He wk',
                        description : 'Weak Helium lines'
                    }]
                }
            }));
            it("Enhanced metal features", () => theText("Gm").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'm',
                    flags : {
                        enhancedMetalFeatures : true
                    },
                    details : [{
                        text : 'm',
                        description : 'Enhanced metal features'
                    }]
                }
            }));
            it("Broad absorption due to spinning", () => theText("Gn").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'n',
                    flags : {
                        broadAbsorptionDueToSpinning : true
                    },
                    details : [{
                        text : 'n',
                        description : 'Broad absorption due to spinning'
                    }]
                }
            }));
            it("Very broad absorption features", () => theText("Gnn").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'nn',
                    flags : {
                        veryBroadAbsorptionFeatures : true
                    },
                    details : [{
                        text : 'nn',
                        description : 'Very broad absorption features'
                    }]
                }
            }));
            it("Unspecified peculiarity", () => theText("Gp").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'p',
                    flags : {
                        unspecifiedPeculiarity : true
                    },
                    details : [{
                        text : 'p',
                        description : 'Unspecified peculiarity'
                    }]
                }
            }));
            it("Narrow absorption lines", () => theText("Gs").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 's',
                    flags : {
                        narrowAbsorptionLines : true
                    },
                    details : [{
                        text : 's',
                        description : 'Narrow absorption lines'
                    }]
                }
            }));
            it("Shell star features", () => theText("Gsh").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'sh',
                    flags : {
                        shellStarFeatures : true
                    },
                    details : [{
                        text : 'sh',
                        description : 'Shell star features'
                    }]
                }
            }));
            it("Variable spectral feature (abbreviated)", () => theText("Gv").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'v',
                    flags : {
                        variableSpectralFeature : true
                    },
                    details : [{
                        text : 'v',
                        description : 'Variable spectral feature'
                    }]
                }
            }));
            it("Variable spectral feature", () => theText("Gvar").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'var',
                    flags : {
                        variableSpectralFeature : true
                    },
                    details : [{
                        text : 'var',
                        description : 'Variable spectral feature'
                    }]
                }
            }));
            it("Weak lines (w)", () => theText("Gw").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'w',
                    flags : {
                        weakLines : true
                    },
                    details : [{
                        text : 'w',
                        description : 'Weak lines'
                    }]
                }
            }));
            it("Weak lines (wl)", () => theText("Gwl").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'wl',
                    flags : {
                        weakLines : true
                    },
                    details : [{
                        text : 'wl',
                        description : 'Weak lines'
                    }]
                }
            }));
            it("Weak lines (wk)", () => theText("Gwk").isParsedToExactly({
                class : {
                    text: 'G',
                    value: {
                        letter: 'G'
                    }
                },
                peculiarities : {
                    text : 'wk',
                    flags : {
                        weakLines : true
                    },
                    details : [{
                        text : 'wk',
                        description : 'Weak lines'
                    }]
                }
            }));
            describe("traces of element", () => {
                function resultForElement(abbrev, flag, name) {
                    return {
                        class : {
                            text: 'G',
                            value: {
                                letter: 'G'
                            }
                        },
                        peculiarities : {
                            text : abbrev,
                            flags : {
                                elements : {
                                    [flag]: true
                                }
                            },
                            details : [{
                                text : abbrev,
                                description : 'Abnormally strong spectral lines of ' + name
                            }]
                        }
                    };
                }

                it("Strontium", () => theText("GSr").isParsedToExactly(resultForElement('Sr', 'strontium', 'Strontium')));
                it("Helium", () => theText("GHe").isParsedToExactly(resultForElement('He', 'helium', 'Helium')));
                it("Europium", () => theText("GEu").isParsedToExactly(resultForElement('Eu', 'europium', 'Europium')));
                it("Silicon", () => theText("GSi").isParsedToExactly(resultForElement('Si', 'silicon', 'Silicon')));
                it("Mercury", () => theText("GHg").isParsedToExactly(resultForElement('Hg', 'mercury', 'Mercury')));
                it("Manganese", () => theText("GMn").isParsedToExactly(resultForElement('Mn', 'manganese', 'Manganese')));
                it("Chromium", () => theText("GCr").isParsedToExactly(resultForElement('Cr', 'chromium', 'Chromium')));
                it("Iron", () => theText("GFe").isParsedToExactly(resultForElement('Fe', 'iron', 'Iron')));
                it("Potassium", () => theText("GK").isParsedToExactly(resultForElement('K', 'potassium', 'Potassium')));

                it("Element in brackets", () => theText("G(Fe)").isParsedToExactly({
                    class : {
                        text: 'G',
                        value: {
                            letter: 'G'
                        }
                    },
                    peculiarities : {
                        text : 'Fe',
                        flags : {
                            elements : {
                                iron: true
                            }
                        },
                        details : [{
                            text : 'Fe',
                            description : 'Abnormally strong spectral lines of Iron'
                        }]
                    }
                }));
            });
        });
        it("multiple peculiarities", () => theText("G He wk pvarHe (Sr)...").isParsedToExactly({
            class : {
                text: 'G',
                value: {
                    letter: 'G'
                }
            },
            peculiarities : {
                text : "He wk p var ... He Sr",
                flags : {
                    weakHeliumLines : true,
                    unspecifiedPeculiarity : true,
                    variableSpectralFeature : true,
                    undescribed : true,
                    elements : {
                        helium : true,
                        strontium : true
                    }
                },
                details : [
                    {
                        text : "He wk",
                        description : "Weak Helium lines"
                    },{
                        text : "p",
                        description : "Unspecified peculiarity"
                    },{
                        text : "var",
                        description : "Variable spectral feature"
                    },{
                        text : "...",
                        description : "Undescribed peculiarities"
                    },{
                        text : "He",
                        description : "Abnormally strong spectral lines of Helium"
                    },{
                        text : "Sr",
                        description : "Abnormally strong spectral lines of Strontium"
                    }
                ]
            }
        }));
    });
    describe('S-Type stars', () => {
        it('type only', () => theText("S").isParsedToExactly({
            class : {
                text: 'S',
                value: {
                    letter: 'S'
                }
            }
        }));
        describe('type and number only', () => {
            function typeAndNumberOnly(num) {
                return {
                    class : {
                        text: 'S' + num,
                        value: {
                            letter: 'S',
                            number : num
                        }
                    }
                };
            }
            it("S0",   () => theText("S0").isParsedToExactly(typeAndNumberOnly(0)));
            it("S5",   () => theText("S5").isParsedToExactly(typeAndNumberOnly(5)));
            it("S10",  () => theText("S10").isParsedToExactly(typeAndNumberOnly(10)));
            it("S11",  () => theText("S11").cannotBeParsed());
            it("S1.5", () => theText("S1.5").cannotBeParsed());
        });
        describe('type, number and abundance', () => {
            function zrOTiOAbundance(ratio) {
                return {
                    class : {
                        text: 'S5,' + ratio,
                        value: {
                            letter: 'S',
                            number : 5,
                            ZrOTiORatio : ratio
                        }
                    }
                };
            }
            it("S5,1",  () => theText("S5,1").isParsedToExactly(zrOTiOAbundance(1)));
            it("S5,9",  () => theText("S5,9").isParsedToExactly(zrOTiOAbundance(9)));
            it("S5,0",  () => theText("S5,0").cannotBeParsed());
            it("S5,10", () => theText("S5,10").cannotBeParsed());

            function cOAbundance(ratio) {
                return {
                    class : {
                        text: 'S5/' + ratio,
                        value: {
                            letter: 'S',
                            number : 5,
                            CORatio : ratio
                        }
                    }
                };
            }
            it("S5/1",  () => theText("S5/1").isParsedToExactly(cOAbundance(1)));
            it("S5/10", () => theText("S5/10").isParsedToExactly(cOAbundance(10)));
            it("S5/0",  () => theText("S5/0").cannotBeParsed());
            it("S5/11", () => theText("S5/11").cannotBeParsed());

            function zrOAbundance(strength) {
                return {
                    class : {
                        text: 'S5*' + strength,
                        value: {
                            letter: 'S',
                            number : 5,
                            ZrOStrength : strength
                        }
                    }
                };
            }
            it("S5*1", () => theText("S5*1").isParsedToExactly(zrOAbundance(1)));
            it("S5*5", () => theText("S5*5").isParsedToExactly(zrOAbundance(5)));
            it("S5*0", () => theText("S5*0").cannotBeParsed());
            it("S5*6", () => theText("S5*6").cannotBeParsed());
        });
    });
    describe('White Dwarfs', () => {
        it('basic type only', () => theText("D").isParsedToExactly({
            class : {
                text: 'D',
                value: {
                    letter: 'D'
                }
            }
        }));
        describe('sub-types', () => {
            function dwarfWithSubType(st) {
                return {
                    class : {
                        text: 'D' + st,
                        value: {
                            letter: 'D',
                            dwarfType : st
                        }
                    }
                };
            }
            it("DA", () => theText("DA").isParsedToExactly(dwarfWithSubType('A')));
            it("DB", () => theText("DB").isParsedToExactly(dwarfWithSubType('B')));
            it("DO", () => theText("DO").isParsedToExactly(dwarfWithSubType('O')));
            it("DQ", () => theText("DQ").isParsedToExactly(dwarfWithSubType('Q')));
            it("DZ", () => theText("DZ").isParsedToExactly(dwarfWithSubType('Z')));
            it("DC", () => theText("DC").isParsedToExactly(dwarfWithSubType('C')));
            it("DX", () => theText("DX").isParsedToExactly(dwarfWithSubType('X')));

            it("DAB", () => theText("DAB").isParsedToExactly(dwarfWithSubType('AB')));
            it("DAO", () => theText("DAO").isParsedToExactly(dwarfWithSubType('AO')));
            it("DAZ", () => theText("DAZ").isParsedToExactly(dwarfWithSubType('AZ')));
            it("DBZ", () => theText("DBZ").isParsedToExactly(dwarfWithSubType('BZ')));
        });
        describe('temperatures', () => {
            it('single digit', () => theText("D5").isParsedToExactly({
                class : {
                    text: 'D5',
                    value: {
                        letter: 'D',
                        dwarfTemperature : 5
                    }
                }
            }));
            it('double digit', () => theText("DA10").isParsedToExactly({
                class : {
                    text: 'DA10',
                    value: {
                        letter: 'D',
                        dwarfType : 'A',
                        dwarfTemperature : 10
                    }
                }
            }));
            it('fractional value', () => theText("DAB1.5").isParsedToExactly({
                class : {
                    text: 'DAB1.5',
                    value: {
                        letter: 'D',
                        dwarfType : 'AB',
                        dwarfTemperature : 1.5
                    }
                }
            }));
        });
        describe('peculiarities', () => {
            it('P', () => theText("DP").isParsedToExactly({
                class : {
                    text: 'D',
                    value: {
                        letter: 'D'
                    }
                },
                peculiarities : {
                    text : 'P',
                    flags : {
                        magneticPolarized : true
                    },
                    details : [{
                        text : 'P',
                        description : 'Magnetic white dwarf with detectable polarization'
                    }]
                }
            }));
            it('E', () => theText("DE").isParsedToExactly({
                class : {
                    text: 'D',
                    value: {
                        letter: 'D'
                    }
                },
                peculiarities : {
                    text : 'E',
                    flags : {
                        emissionLines : true
                    },
                    details : [{
                        text : 'E',
                        description : 'Emission lines present'
                    }]
                }
            }));
            it('H', () => theText("DH").isParsedToExactly({
                class : {
                    text: 'D',
                    value: {
                        letter: 'D'
                    }
                },
                peculiarities : {
                    text : 'H',
                    flags : {
                        magneticUnpolarized : true
                    },
                    details : [{
                        text : 'H',
                        description : 'Magnetic white dwarf without detectable polarization'
                    }]
                }
            }));
            it('V', () => theText("DV").isParsedToExactly({
                class : {
                    text: 'D',
                    value: {
                        letter: 'D'
                    }
                },
                peculiarities : {
                    text : 'V',
                    flags : {
                        variable : true
                    },
                    details : [{
                        text : 'V',
                        description : 'Variable'
                    }]
                }
            }));
            it('PEC', () => theText("DPEC").isParsedToExactly({
                class : {
                    text: 'D',
                    value: {
                        letter: 'D'
                    }
                },
                peculiarities : {
                    text : 'PEC',
                    flags : {
                        peculiarities : true
                    },
                    details : [{
                        text : 'PEC',
                        description : 'Peculiarities exist'
                    }]
                }
            }));

            it('HVPEC', () => theText("DHVPEC").isParsedToExactly({
                class : {
                    text: 'D',
                    value: {
                        letter: 'D'
                    }
                },
                peculiarities : {
                    text : 'HVPEC',
                    flags : {
                        magneticUnpolarized : true,
                        variable : true,
                        peculiarities : true
                    },
                    details : [{
                        text : 'H',
                        description : 'Magnetic white dwarf without detectable polarization'
                    }, {
                        text : 'V',
                        description : 'Variable'
                    }, {
                        text : 'PEC',
                        description : 'Peculiarities exist'
                    }]
                }
            }));
        });
    });
    describe('carbon stars', () => {
        function carbonStarOfType(type) {
            return {
                class : {
                    text: type,
                    value: {
                        letter: type
                    }
                }
            };
        }
        it('C-R',  () => theText("C-R").isParsedToExactly(carbonStarOfType('C-R')));
        it('C-N',  () => theText("C-N").isParsedToExactly(carbonStarOfType('C-N')));
        it('C-J',  () => theText("C-J").isParsedToExactly(carbonStarOfType('C-J')));
        it('C-H',  () => theText("C-H").isParsedToExactly(carbonStarOfType('C-H')));
        it('C-Hd', () => theText("C-Hd").isParsedToExactly(carbonStarOfType('C-Hd')));

        it('C-X',    () => theText("C-X").cannotBeParsed());
        it('C-RI',   () => theText("C-RI").cannotBeParsed());
        it('C-Rvar', () => theText("C-Rvar").cannotBeParsed());
    });

    describe("additional data", function() {
        describe("should add data when flag is set", () => {
            it("letter only", () => {
                const data = parse('A', true).data;
                expect(data).toEqual({
                    mass: 7.2,
                    luminosityRelative: 1290,
                    radiusRelative: 16.5,
                    temperature: 8650,
                    colourIndexBv: 0.05,
                    absoluteMagnitude: -2.8,
                    bolometricCorrection: -0.23,
                    bolometricMagnitude: -3.03,
                    colour: {
                        r: 194,
                        g: 210,
                        b: 255
                    }
                })
            });

            it("letter and number only", () => {
                const data = parse('A3', true).data;
                expect(data).toEqual({
                    mass: 8.1,
                    luminosityRelative: 1660,
                    radiusRelative: 16.7,
                    temperature: 9150,
                    colourIndexBv: -0.04,
                    absoluteMagnitude: -3,
                    bolometricCorrection: -0.3,
                    bolometricMagnitude: -3.3,
                    colour: {
                        r: 190,
                        g: 207,
                        b: 255
                    }
                })
            });

            it("letter, number and luminosity", () => {
                const data = parse('A3V', true).data;
                expect(data).toEqual({
                    mass: 2.4,
                    luminosityRelative: 28.9,
                    radiusRelative: 2.2,
                    temperature: 9150,
                    colourIndexBv: -0.04,
                    absoluteMagnitude: 1.4,
                    bolometricCorrection: -0.3,
                    bolometricMagnitude: 1.1,
                    colour: {
                        r: 191,
                        g: 207,
                        b: 255
                    }
                })
            });

            it("letter and number range", () => {
                const data = parse('A3-A7', true).data;
                expect(data).toEqual({
                    mass: 7.65,
                    luminosityRelative: 1385,
                    radiusRelative: 16.95,
                    temperature: 8650,
                    colourIndexBv: 0.05,
                    absoluteMagnitude: -2.85,
                    bolometricCorrection: -0.235,
                    bolometricMagnitude: -3.085,
                    colour: {
                        r: 194,
                        g: 210,
                        b: 255
                    }
                })
            });

            it("letter and number choice", () => {
                const data = parse('A3/A9', true).data;
                expect(data).toEqual({
                    mass: 7.6,
                    luminosityRelative: 1315,
                    radiusRelative: 17.5,
                    temperature: 8400,
                    colourIndexBv: 0.1,
                    absoluteMagnitude: -2.8,
                    bolometricCorrection: -0.21,
                    bolometricMagnitude: -3.01,
                    colour: {
                        r: 196,
                        g: 212,
                        b: 255
                    }
                })
            });

            it("letter and number combination", () => {
                const data = parse('A3+A9', true).data;
                expect(data).toEqual({
                    mass: 7.6,
                    luminosityRelative: 1315,
                    radiusRelative: 17.5,
                    temperature: 8400,
                    colourIndexBv: 0.1,
                    absoluteMagnitude: -2.8,
                    bolometricCorrection: -0.21,
                    bolometricMagnitude: -3.01,
                    colour: {
                        r: 196,
                        g: 212,
                        b: 255
                    }
                })
            });

            it("luminosity range", () => {
                const data = parse('A3II-IV', true).data;
                expect(data).toEqual({
                    mass: 6.2,
                    luminosityRelative: 850.9,
                    radiusRelative: 9.675,
                    temperature: 9150,
                    colourIndexBv: -0.04,
                    absoluteMagnitude: -1,
                    bolometricCorrection: -0.3,
                    bolometricMagnitude: -1.3,
                    colour: {
                        r: 190,
                        g: 206,
                        b: 255
                    }
                })
            });

            it("luminosity choice", () => {
                const data = parse('A3II/III', true).data;
                expect(data).toEqual({
                    mass: 7.15,
                    luminosityRelative: 873.5,
                    radiusRelative: 10.27,
                    temperature: 9150,
                    colourIndexBv: -0.04,
                    absoluteMagnitude: -1.4,
                    bolometricCorrection: -0.3,
                    bolometricMagnitude: -1.7,
                    colour: {
                        r: 190,
                        g: 205,
                        b: 255
                    }
                })
            });

            it("should handle one component with no data", () => {
                const data = parse('A3/3.5', true).data;
                expect(data).toEqual({
                    mass: 8.1,
                    luminosityRelative: 1660,
                    radiusRelative: 16.7,
                    temperature: 9150,
                    colourIndexBv: -0.04,
                    absoluteMagnitude: -3,
                    bolometricCorrection: -0.3,
                    bolometricMagnitude: -3.3,
                    colour: {
                        r: 190,
                        g: 207,
                        b: 255
                    }
                })
            });

            it("should handle all components with no data", () => {
                const data = parse('A3.5', true).data;
                expect(data).toEqual({})
            });

        });
    });
});
