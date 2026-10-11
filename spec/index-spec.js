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
        it("letters with fractional number ranges are handled correctly", () => {
            theText("B0.5-1.5").isParsedToExactly({
                class : {
                    text : 'B0.5-1.5',
                    range : {
                        from : {
                            letter : 'B',
                            number : 0.5
                        },
                        to : {
                            letter : 'B',
                            number : 1.5
                        }
                    }
                }
            });
        });

        it("A5- is invalid", () => theText("A5-").cannotBeParsed());
        it("A5/ is invalid", () => theText("A5/").cannotBeParsed());
        it("A- is invalid", () => theText("A-").cannotBeParsed());
        it("A/ is invalid", () => theText("A/").cannotBeParsed());
        it("A5-V is invalid", () => theText("A5-V").cannotBeParsed());
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
        it("G50 is invalid (use Ia0 for hypergiants)", () => theText("G50").cannotBeParsed());
        it("G10 is invalid", () => theText("G10").cannotBeParsed());
        it("M10 is invalid", () => theText("M10").cannotBeParsed());
        it("G5I is valid", () => theText("G5I").isParsedToExactly(resultWithLuminosity('I', 'Supergiant')));
        it("G5Ia0 is valid", () => theText("G5Ia0").isParsedToExactly(resultWithLuminosity('Ia0', 'Hypergiant')));
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
        it("with Ia0 in a range", () => {
            const result = parse('B1Ia0-Ia');
            expect(result.luminosity.text).toEqual('Ia0-Ia');
            expect(result.luminosity.range.from.luminosityClass).toEqual('Ia0');
            expect(result.luminosity.range.to.luminosityClass).toEqual('Ia');
        });
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
            it('zero', () => theText("DA0").isParsedToExactly({
                class : {
                    text: 'DA0',
                    value: {
                        letter: 'D',
                        dwarfType : 'A',
                        dwarfTemperature : 0
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
                    mass: 1.9,
                    luminosityRelative: 17,
                    radiusRelative: 1.89,
                    temperature: 8650,
                    colourIndexBv: 0.05,
                    absoluteMagnitude: 1.9,
                    bolometricCorrection: -0.23,
                    bolometricMagnitude: 1.67,
                    colour: {
                        r: 202,
                        g: 215,
                        b: 255
                    }
                })
            });

            it("letter and number only", () => {
                const data = parse('A3', true).data;
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

            it("letter, number zero and luminosity", () => {
                const data = parse('A0V', true).data;
                expect(data).toEqual({
                    mass: 2.9,
                    luminosityRelative: 67.4,
                    radiusRelative: 2.88,
                    temperature: 9900,
                    colourIndexBv: -0.06,
                    absoluteMagnitude: 0.6,
                    bolometricCorrection: -0.42,
                    bolometricMagnitude: 0.18,
                    colour: {
                        r: 185,
                        g: 201,
                        b: 255
                    }
                })
            });

            it("letter and number range", () => {
                const data = parse('A3-A7', true).data;
                expect(data).toEqual({
                    mass: 2.1,
                    luminosityRelative: 20.55,
                    radiusRelative: 2.005,
                    temperature: 8650,
                    colourIndexBv: 0.05,
                    absoluteMagnitude: 1.8,
                    bolometricCorrection: -0.235,
                    bolometricMagnitude: 1.565,
                    colour: {
                        r: 196,
                        g: 210,
                        b: 255
                    }
                })
            });

            it("letter and number choice", () => {
                const data = parse('A3/A9', true).data;
                expect(data).toEqual({
                    mass: 2.05,
                    luminosityRelative: 18.88,
                    radiusRelative: 1.975,
                    temperature: 8400,
                    colourIndexBv: 0.1,
                    absoluteMagnitude: 1.95,
                    bolometricCorrection: -0.21,
                    bolometricMagnitude: 1.74,
                    colour: {
                        r: 205,
                        g: 216,
                        b: 255
                    }
                })
            });

            it("letter and number combination", () => {
                const data = parse('A3+A9', true).data;
                expect(data).toEqual({
                    mass: 2.05,
                    luminosityRelative: 18.88,
                    radiusRelative: 1.975,
                    temperature: 8400,
                    colourIndexBv: 0.1,
                    absoluteMagnitude: 1.95,
                    bolometricCorrection: -0.21,
                    bolometricMagnitude: 1.74,
                    colour: {
                        r: 205,
                        g: 216,
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
                const data = parse('A3V/VII', true).data;
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

            it("should handle all components with no data", () => {
                const data = parse('A3VII', true).data;
                expect(data).toEqual({})
            });

            describe("fractional subclasses", () => {
                it("are interpolated between the neighbouring subclasses", () => {
                    const data = parse('A3.5', true).data;
                    expect(data.mass).toEqual(2.25);
                    expect(data.temperature).toEqual(9025);
                    expect(data.colour).toEqual({r: 194, g: 209, b: 255});
                });
                it("are weighted by distance from the neighbouring subclasses", () => {
                    const data = parse('O9.7V', true).data;
                    expect(data.mass).toEqual(18.25);
                    expect(data.temperature).toEqual(28660);
                });
                it("are interpolated across letter boundaries", () => {
                    const data = parse('B9.5V', true).data;
                    expect(data.mass).toEqual(3.15);
                    expect(data.temperature).toEqual(10810);
                });
                it("use the lower subclass if there is no higher one", () => {
                    expect(parse('M9.5V', true).data).toEqual(parse('M9V', true).data);
                    expect(parse('DA9.5', true).data).toEqual(parse('DA9', true).data);
                });
                it("are interpolated for white dwarf temperatures", () => {
                    const data = parse('DA4.5', true).data;
                    expect(data.mass).toEqual(0.55);
                    expect(data.temperature).toEqual(11340);
                });
                it("are interpolated in ranges", () => {
                    expect(parse('A3-3.5', true).data.mass).toEqual(2.325);
                });
            });

            describe("luminosity classes without their own rows in the data", () => {
                const G5_IA0_DATA = {
                        mass: 12.5,
                        luminosityRelative: 1070000,
                        radiusRelative: 1840,
                        temperature: 4400,
                        colourIndexBv: 1.13,
                        absoluteMagnitude: -9.5,
                        bolometricCorrection: -0.83,
                        bolometricMagnitude: -10.33,
                        colour: {
                            r: 255,
                            g: 230,
                            b: 183
                        }
                    },
                    G5_IA_IB_AVERAGE_DATA = {
                        mass: 5.5,
                        luminosityRelative: 98900,
                        radiusRelative: 479,
                        temperature: 4400,
                        colourIndexBv: 1.13,
                        absoluteMagnitude: -6.1,
                        bolometricCorrection: -0.83,
                        bolometricMagnitude: -6.93,
                        colour: {
                            r: 255,
                            g: 230,
                            b: 183
                        }
                    };

                it("Ia+ uses Ia0", () => expect(parse('G5Ia+', true).data).toEqual(G5_IA0_DATA));
                it("Ia0 gives the same data as Ia+", () => expect(parse('G5Ia0', true).data).toEqual(G5_IA0_DATA));
                it("I uses the average of Ia and Ib", () => expect(parse('G5I', true).data).toEqual(G5_IA_IB_AVERAGE_DATA));
                it("Iab uses the average of Ia and Ib", () => expect(parse('G5Iab', true).data).toEqual(G5_IA_IB_AVERAGE_DATA));
                it("a and b sub-divisions use the main luminosity class", () => {
                    const g5IIIData = parse('G5III', true).data;
                    expect(g5IIIData.mass).toEqual(2);
                    expect(parse('G5IIIa', true).data).toEqual(g5IIIData);
                    expect(parse('G5IIIb', true).data).toEqual(g5IIIData);
                });
                it("I is counted once in a luminosity range", () => {
                    expect(parse('G5I-III', true).data.mass).toEqual(3.75);
                });
                it("VII has no data", () => expect(parse('G5VII', true).data).toEqual({}));
            });

            describe("white dwarfs", () => {
                const DA4_DATA = {
                    mass: 0.6,
                    luminosityRelative: 0.00182,
                    radiusRelative: 0.00922,
                    temperature: 12600,
                    colourIndexBv: -0.13,
                    absoluteMagnitude: 12.5,
                    bolometricCorrection: -0.9,
                    bolometricMagnitude: 11.6,
                    colour: {
                        r: 192,
                        g: 207,
                        b: 255
                    }
                };

                it("sub-type and temperature", () => {
                    expect(parse('DA4', true).data).toEqual(DA4_DATA);
                });

                it("sub-type, temperature and peculiarity", () => {
                    expect(parse('DA4V', true).data).toEqual(DA4_DATA);
                });

                it("multiple sub-types", () => {
                    expect(parse('DAO4', true).data).toEqual(DA4_DATA);
                });

                it("sub-type only", () => {
                    expect(parse('DA', true).data).toEqual({
                        mass: 0.5,
                        luminosityRelative: 0.000693,
                        radiusRelative: 0.0089,
                        temperature: 10080,
                        colourIndexBv: -0.07,
                        absoluteMagnitude: 13.1,
                        bolometricCorrection: -0.45,
                        bolometricMagnitude: 12.65,
                        colour: {
                            r: 207,
                            g: 218,
                            b: 255
                        }
                    });
                });

                it("no sub-type", () => {
                    expect(parse('D4', true).data).toEqual({});
                });

                it("sub-type with no data", () => {
                    expect(parse('DX4', true).data).toEqual({});
                });
            });

        });
    });

    describe("uncertainty markers", function() {
        it("? after the class marks the class as uncertain", () => {
            expect(parse('G5?').class.peculiarities).toEqual({
                text : '?',
                flags : {
                    uncertain : true
                },
                details : [{
                    text : '?',
                    description : 'Uncertain spectral class'
                }]
            });
        });

        it("? after the luminosity marks the luminosity as uncertain", () => {
            expect(parse('G0V?').luminosity.peculiarities).toEqual({
                text : '?',
                flags : {
                    uncertain : true
                },
                details : [{
                    text : '?',
                    description : 'Uncertain luminosity'
                }]
            });
        });

        it(": after a peculiarity marks that peculiarity as uncertain", () => theText("B2IVe:").isParsedToExactly({
            class : {
                text : 'B2',
                value : {
                    letter : 'B',
                    number : 2
                }
            },
            luminosity : {
                text : 'IV',
                value : {
                    luminosityClass : 'IV',
                    description : 'Sub-Giant'
                }
            },
            peculiarities : {
                text : 'e:',
                flags : {
                    emissionLines : true
                },
                details : [{
                    text : 'e',
                    description : 'Emission lines',
                    uncertain : true
                }]
            }
        }));

        it("? after a peculiarity marks that peculiarity as uncertain", () => {
            const peculiarities = parse('G5Vn?').peculiarities;
            expect(peculiarities.text).toEqual('n?');
            expect(peculiarities.details).toEqual([{
                text : 'n',
                description : 'Broad absorption due to spinning',
                uncertain : true
            }]);
        });

        it("only apply to the peculiarity immediately before them", () => {
            const peculiarities = parse('B8IIIpHg:Mn').peculiarities;
            expect(peculiarities.text).toEqual('p Hg: Mn');
            expect(peculiarities.details.map(d => [d.text, !!d.uncertain])).toEqual([
                ['p', false],
                ['Hg', true],
                ['Mn', false]
            ]);
        });

        it("can be repeated", () => {
            const peculiarities = parse('G5e::').peculiarities;
            expect(peculiarities.text).toEqual('e::');
            expect(peculiarities.details[0].uncertain).toBe(true);
        });

        it("work on multi-word peculiarities", () => {
            expect(parse('G He wk:').peculiarities.details).toEqual([{
                text : 'He wk',
                description : 'Weak Helium lines',
                uncertain : true
            }]);
        });

        it("before a peculiarity apply to the luminosity, not the peculiarity", () => {
            const result = parse('G5III:e');
            expect(result.luminosity.peculiarities.flags.uncertain).toBe(true);
            expect(result.peculiarities.details[0].uncertain).toBeUndefined();
        });

        it("work inside components", () => {
            const components = parse('F5Ve:+K0III?').components;
            expect(components[0].peculiarities.details[0].uncertain).toBe(true);
            expect(components[1].luminosity.peculiarities.flags.uncertain).toBe(true);
        });

        it("cannot appear on their own", () => {
            expect(parse('?')).toBeUndefined();
            expect(parse(':')).toBeUndefined();
        });
    });

    describe("multiple stars with their own luminosities", function() {
        it("are parsed as separate components", () => {
            expect(parse('F5V+K0III')).toEqual({
                components : [
                    parse('F5V'),
                    parse('K0III')
                ]
            });
        });

        it("keep peculiarities with their own component", () => {
            expect(parse('B2Ve+K0III')).toEqual({
                components : [
                    parse('B2Ve'),
                    parse('K0III')
                ]
            });
        });

        it("allow components without a luminosity after the first", () => {
            expect(parse('K0III+F')).toEqual({
                components : [
                    parse('K0III'),
                    parse('F')
                ]
            });
        });

        it("allow luminosity prefixes, ranges and white dwarfs as components", () => {
            expect(parse('sdB+dM3').components).toEqual([parse('sdB'), parse('dM3')]);
            expect(parse('G8III-IV+DA').components).toEqual([parse('G8III-IV'), parse('DA')]);
        });

        it("allow more than two components", () => {
            expect(parse('A5V+A6V+K0III').components).toEqual([parse('A5V'), parse('A6V'), parse('K0III')]);
        });

        it("treat classes before a shared luminosity as a combination", () => {
            expect(parse('A5+A6V').components).toBeUndefined();
            expect(parse('A5+A6V+K0III').components).toEqual([parse('A5+A6V'), parse('K0III')]);
        });

        it("can be written with spaces", () => {
            expect(parse('F5 V + K0 III')).toEqual(parse('F5V+K0III'));
        });

        it("can follow an Ia+ luminosity", () => {
            expect(parse('B1Ia++O9V').components).toEqual([parse('B1Ia+'), parse('O9V')]);
            expect(parse('B1Ia+ + O9V').components).toEqual([parse('B1Ia+'), parse('O9V')]);
        });

        it("are read as a separator after Ia if there is no other +", () => {
            expect(parse('B1Ia+O9V').components).toEqual([parse('B1Ia'), parse('O9V')]);
        });

        it("must have a component on each side of every +", () => {
            expect(parse('F5V+')).toBeUndefined();
            expect(parse('+F5V')).toBeUndefined();
            expect(parse('F5V++K0III')).toBeUndefined();
        });

        it("have data added to each component", () => {
            const result = parse('F5V+K0III', true);
            expect(result.data).toBeUndefined();
            expect(result.components[0].data).toEqual(parse('F5V', true).data);
            expect(result.components[1].data).toEqual(parse('K0III', true).data);
            expect(result.components[0].data.mass).toBeGreaterThan(0);
        });
    });

    describe("spaces", function() {
        it("are ignored between parts of the classification", () => {
            expect(parse('K0 III')).toEqual(parse('K0III'));
            expect(parse('B8 III p HgMn')).toEqual(parse('B8IIIpHgMn'));
            expect(parse('G5 II / III')).toEqual(parse('G5II/III'));
        });
        it("are ignored at the start and end", () => {
            expect(parse(' G2V ')).toEqual(parse('G2V'));
        });
    });

    describe("invalid input", function() {
        it("non-string values cannot be parsed", () => {
            [undefined, null, 5, {}, [], true].forEach(value => {
                expect(() => parse(value)).not.toThrow();
                expect(parse(value)).toBeUndefined();
            });
        });

        it("empty string cannot be parsed", () => theText("").cannotBeParsed());

        it("very long strings cannot be parsed", () => {
            const text = 'G' + 'e'.repeat(10000);
            expect(() => parse(text)).not.toThrow();
            expect(parse(text)).toBeUndefined();
        });

        it("strings up to the maximum length can be parsed", () => {
            expect(parse('G' + 'e'.repeat(99)).peculiarities.details.length).toEqual(99);
            expect(parse('G' + 'e'.repeat(100))).toBeUndefined();
        });
    });

    describe("caching", function() {
        it("an unparseable input does not affect a different valid input", () => {
            expect(parse('B7V_true')).toBeUndefined();
            expect(parse('B7V', true)).toBeTruthy();
            expect(parse('B7V_undefined')).toBeUndefined();
            expect(parse('B7V')).toBeTruthy();
        });

        it("data is only included when requested", () => {
            expect(parse('B8V', true).data).toBeDefined();
            expect(parse('B8V').data).toBeUndefined();
        });

        it("modifying a returned result does not affect later results", () => {
            const first = parse('B9V');
            first.class.text = 'modified';
            delete first.luminosity;

            const second = parse('B9V');
            expect(second.class.text).toEqual('B9');
            expect(second.luminosity.text).toEqual('V');
        });
    });
});
