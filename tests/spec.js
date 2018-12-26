describe("Classifier", function() {
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

});
