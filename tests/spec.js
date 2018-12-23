describe("Classifier", function() {
  const parse = require('../index').parse;

  function theText(txt) {
    return {
      isParsedToExactly(expectedResult) {
        console.log(txt,'=>',parse(txt))
        expect(parse(txt)).toEqual(expectedResult);
      },
      cannotBeParsed() {
        expect(parse(txt)).not.toBeTruthy();
      }
    };
  }

  it("handles single letters correctly", function() {
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
    theText("O").isParsedToExactly(resultWithLetter('O'));
    theText("B").isParsedToExactly(resultWithLetter('B'));
    theText("A").isParsedToExactly(resultWithLetter('A'));
    theText("F").isParsedToExactly(resultWithLetter('F'));
    theText("G").isParsedToExactly(resultWithLetter('G'));
    theText("K").isParsedToExactly(resultWithLetter('K'));
    theText("M").isParsedToExactly(resultWithLetter('M'));

    theText("X").cannotBeParsed();
    theText("Q").cannotBeParsed();
  });

  it("handles single letters and numbers correctly", function() {
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
    theText("A0").isParsedToExactly(resultWithLetterAndNumber('A', 0));
    theText("F5").isParsedToExactly(resultWithLetterAndNumber('F', 5));
    theText("K9").isParsedToExactly(resultWithLetterAndNumber('K', 9));
    theText("G2.5").isParsedToExactly(resultWithLetterAndNumber('G', 2.5));

    theText("Q0").cannotBeParsed();
    theText("F33").cannotBeParsed();
    theText("F2.5.7").cannotBeParsed();
    theText("F2.55").cannotBeParsed();
  });

  describe("multiple", () => {
    it("letters are handled correctly", () => {
      theText("A-F").isParsedToExactly({
        class : {
          text : 'A-F',
          range : {
            from : {
              letter : 'A'
            },
            to : {
              letter : 'F'
            }
          }
        }
      });
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
    it("letters with numbers are handled correctly", () => {
      theText("A8-F2").isParsedToExactly({
        class : {
          text : 'A8-F2',
          range : {
            from : {
              letter : 'A',
              number : 8
            },
            to : {
              letter : 'F',
              number : 2
            }
          }
        }
      });
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
    it("numbers are handled correctly", () => {
      theText("A5-9").isParsedToExactly({
        class : {
          text : 'A5-9',
          range : {
            from : {
              letter : 'A',
              number : 5
            },
            to : {
              letter : 'A',
              number : 9
            }
          }
        }
      });
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
  })

  it("handles single luminosities correctly", function() {
    function resultWithLuminosity(luminosity, description){
      return {
        class : {
          text : `G5`,
          value : {
            letter : 'G',
            number : 5
          }
        },
        luminosity : {
          text : luminosity,
          value : {
              luminosityClass : luminosity,
              description
          }
        }
      };
    }
    theText("G50").isParsedToExactly(resultWithLuminosity('0', 'Hypergiant'));
    theText("G5I").isParsedToExactly(resultWithLuminosity('I', 'Supergiant'));
    theText("G5Ia+").isParsedToExactly(resultWithLuminosity('Ia+', 'Hypergiant'));
    theText("G5Ia").isParsedToExactly(resultWithLuminosity('Ia', 'Luminous Supergiant'));
    theText("G5Iab").isParsedToExactly(resultWithLuminosity('Iab', 'Intermediate size Luminous Supergiant'));
    theText("G5Ib").isParsedToExactly(resultWithLuminosity('Ib', 'Less Luminous Supergiant'));
    theText("G5II").isParsedToExactly(resultWithLuminosity('II', 'Bright Giant'));
    theText("G5IIa").isParsedToExactly(resultWithLuminosity('IIa', 'Luminous Bright Giant'));
    theText("G5IIb").isParsedToExactly(resultWithLuminosity('IIb', 'Less Luminous Bright Giant'));
    theText("G5III").isParsedToExactly(resultWithLuminosity('III', 'Giant'));
    theText("G5IIIa").isParsedToExactly(resultWithLuminosity('IIIa', 'Luminous Giant'));
    theText("G5IIIb").isParsedToExactly(resultWithLuminosity('IIIb', 'Less Luminous Giant'));
    theText("G5IV").isParsedToExactly(resultWithLuminosity('IV', 'Sub-Giant'));
    theText("G5IVa").isParsedToExactly(resultWithLuminosity('IVa', 'Luminous Sub-Giant'));
    theText("G5IVb").isParsedToExactly(resultWithLuminosity('IVb', 'Less Luminous Sub-Giant'));
    theText("G5V").isParsedToExactly(resultWithLuminosity('V', 'Dwarf (Main Sequence)'));
    theText("G5Va").isParsedToExactly(resultWithLuminosity('Va', 'Luminous Dwarf (Main Sequence)'));
    theText("G5Vb").isParsedToExactly(resultWithLuminosity('Vb', 'Less Luminous Dwarf (Main Sequence)'));
    theText("G5VI").isParsedToExactly(resultWithLuminosity('VI', 'Sub-Dwarf'));
    theText("G5VIa").isParsedToExactly(resultWithLuminosity('VIa', 'Luminous Sub-Dwarf'));
    theText("G5VIb").isParsedToExactly(resultWithLuminosity('VIb', 'Less Luminous Sub-Dwarf'));
    theText("G5VII").isParsedToExactly(resultWithLuminosity('VII', 'White-Dwarf'));
    theText("G5VIIa").isParsedToExactly(resultWithLuminosity('VIIa', 'Luminous White-Dwarf'));
    theText("G5VIIb").isParsedToExactly(resultWithLuminosity('VIIb', 'Less Luminous White-Dwarf'));

    theText("G5VIII").cannotBeParsed();
    theText("G5X").cannotBeParsed();

    theText("sdG5").isParsedToExactly(resultWithLuminosity('sd', 'Sub-Dwarf'));
    theText("dG5").isParsedToExactly(resultWithLuminosity('d', 'Dwarf (Main Sequence)'));
    theText("sgG5").isParsedToExactly(resultWithLuminosity('sg', 'Supergiant'));
    theText("gG5").isParsedToExactly(resultWithLuminosity('g', 'Giant'));

    theText("gG5V").cannotBeParsed();    
    theText("sg/gG5").cannotBeParsed();    
    theText("sg-gG5").cannotBeParsed();    
    theText("sdG5III/IV").cannotBeParsed();    
    theText("sdG5III-IV").cannotBeParsed();    
  });

  it("handles multiple luminosities correctly", function() {
    theText("G5II-III").isParsedToExactly({
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
      });
    theText("G5II/III/IV").isParsedToExactly({
        class : {
          text : 'G5',
          value : {
            letter : 'G',
            number : 5
          }
        },
        luminosity : {
          text : 'II/III/IV',
          choice : [
            {
                luminosityClass : 'II',
                description : 'Bright Giant'
            },
            {
                luminosityClass : 'III',
                description : 'Giant'
            },
            {
                luminosityClass : 'IV',
                description : 'Sub-Giant'
            }
          ]
        }
      });
    theText("G5-K2II/III/IV").isParsedToExactly({
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
          text : 'II/III/IV',
          choice : [
            {
                luminosityClass : 'II',
                description : 'Bright Giant'
            },
            {
                luminosityClass : 'III',
                description : 'Giant'
            },
            {
                luminosityClass : 'IV',
                description : 'Sub-Giant'
            }
          ]
        }
      });
    theText("G5/K2II/III/IV").isParsedToExactly({
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
          text : 'II/III/IV',
          choice : [
            {
                luminosityClass : 'II',
                description : 'Bright Giant'
            },
            {
                luminosityClass : 'III',
                description : 'Giant'
            },
            {
                luminosityClass : 'IV',
                description : 'Sub-Giant'
            }
          ]
        }
      });
  });

});
