# stellar-classification-parser
A parser for Morgan-Keenan (MK) stellar classification codes. The library accepts an MK code as a string, and returns an object containing the information that can be derived from that code.

This project is available as a [NodeJS module](https://www.npmjs.com/package/stellar-classification-parser), and is also running online as a [free web service](https://api.codebox.net/starclass/parse/G5V).


## Using the NodeJS module
To use the NodeJS module in your project, include the `stellar-classification-parser` dependency in `package.json`:

    "dependencies": {
        "stellar-classification-parser": "^2.0.0"
    }

and call the `parse` function in your code, like this:

    const {parse} = require('stellar-classification-parser'),
          result = parse('G5V');

    console.log(JSON.stringify(result));

If the value can't be parsed then `parse` throws a `ParseError`. The error's `position` property gives the index of the first character that couldn't be parsed, and `expected` lists the text that would have been valid at that point. Strings longer than 100 characters also throw a `ParseError`, and values that aren't strings throw a `TypeError`.

    const {parse, ParseError} = require('stellar-classification-parser');

    try {
        parse('G5X');
    } catch (e) {
        if (e instanceof ParseError) {
            console.log(e.message);  // Unexpected 'X' at position 2 in 'G5X'
        }
    }

The `parse` method has an optional second parameter which, if set to `true`, adds a `data` object containing physical attributes of the star, such as its mass, temperature, luminosity, radius and colour. If the classification doesn't include a luminosity class then the data for a main-sequence (`V`) star is returned, except for carbon and S-type stars where a giant (`III`) is assumed, and if there is no numeric sub-division then `5` is assumed. Fractional sub-divisions (e.g. `B9.5`) are interpolated between the neighbouring sub-divisions. Ranges are averaged over every class between the two ends (so `B0-B9` includes `B1` to `B8`, and `II-IV` includes `III`), and choices and combinations are averaged over the classes given. Mass, luminosity, radius and temperature are averaged on a log scale, since they vary by orders of magnitude between classes. If no data is available the `data` object is empty.

## The result
A classification for a single star produces an object with up to three parts, `class`, `luminosity` and `peculiarities`, plus `data` if requested. For example `B2IVe:` gives:

    {
        class : {
            text : 'B2',
            value : { letter : 'B', number : 2 }
        },
        luminosity : {
            text : 'IV',
            value : { luminosityClass : 'IV', description : 'Sub-Giant' }
        },
        peculiarities : {
            text : 'e:',
            flags : { emissionLines : true },
            details : [
                { text : 'e', description : 'Emission lines', uncertain : true }
            ]
        }
    }

### class
`text` is the class part of the code. Exactly one of the following is present:

* `value` - a single class, e.g. `G5`
* `range` - a range of classes with `from` and `to`, e.g. `A3-5` or `A3-F2`
* `choice` - a list of alternative classes, e.g. `A3/5` or `A3/F2`
* `combination` - a list of classes that share a luminosity, e.g. `A5+A6V`

Each class has a `letter` and, if one was given, a `number`. Some types of star have extra information:

* Wolf-Rayet stars may have `subtypes` for early or late types and qualifiers, e.g. `WN7h` gives letter `WN` and code `h`
* White dwarfs (`D`) have `subtypes`, a list of `{code, description}`, e.g. `DAB` gives codes `A` and `B`. The `number` is the temperature index
* Carbon stars have letter `C`. In the modern notation they have a single subtype, e.g. `C-N5` gives code `N`; in the older notation `C5,4` the second number is reported as `abundance.C2Strength`
* S-type stars (letter `S`, `MS` or `SC`) may have an `abundance` object containing one of `ZrOTiORatio`, `CORatio` or `ZrOStrength`

If the class was marked as uncertain (e.g. `G5:`) then `uncertain` is `true`.

### luminosity
`text` is the luminosity part of the code, and exactly one of `value`, `range` or `choice` is present, as for `class`. Each luminosity has a `luminosityClass` (e.g. `III`) and a `description` (e.g. `Giant`). A luminosity prefix such as `sd` is converted into the equivalent luminosity class. If the luminosity was marked as uncertain (e.g. `G5V?`) then `uncertain` is `true`.

### peculiarities
`details` lists each peculiarity code in the order it appears, with a `description`. A code followed by `:` or `?` has `uncertain : true`, and a code or element in brackets, such as `(n)` or `(Sr)`, has `weak : true`. A strength index such as `Fe-0.5` has a numeric `value`. `flags` summarises which peculiarities are present, with element codes under `flags.elements`, and strength indices and their values under `flags.indices` (e.g. `{ iron : -0.5 }`). `text` is a normalised version of the peculiarities, with one space between each code.

### Multiple stars
A code describing several stars, each with its own luminosity, such as `F5V+K0III`, produces a `components` list, where each item is the result for one star in the format described above. When data is requested, each component gets its own `data`. A class without a luminosity is combined with the class after it, so `A5+A6V` is a single result with a `combination` class.

## Using the Web Service
The module is also available to use via a Web Service hosted at `https://api.codebox.net/starclass/parse`. To use it, simply add the value to be parsed on to the end of the url, for example: [https://api.codebox.net/starclass/parse/G5V](https://api.codebox.net/starclass/parse/G5V)

You can try out the web service in the [online demo](https://codebox.net/pages/star-classification-parser-web-service#demo) on the project home page.

## The Parser
The parser understands a large subset of the commonly used parts of the MK system, but probably not all of it. There does not appear to be any complete and universally accepted definition of exactly what notation is valid and what isn't. I found various online sources using different notation to indicate the same thing, and many examples of dialects that seem to be unique to a particular author and not used anywhere else.

I'm happy to accept pull requests if anything important is missing or incorrect. See [this grammar](https://github.com/codebox/stellar-classification-parser/blob/master/grammar.txt) for more insight into what will currently work.

Among other things, the parser understands:

* The standard `O`, `B`, `A`, `F`, `G`, `K`, and `M` letter codes with or without numeric sub-divisions
* Brown dwarf classes `L`, `T` and `Y`
* Wolf-Rayet classes `WN`, `WC`, `WO` and `WR`, early and late types such as `WNE` and `WNL`, and the qualifiers `h`, `ha`, `(h)`, `o` and `b` e.g. `WN7h`
* Ranges of letter/number codes e.g. `A5-6` or `A5-A6`
* Alternative letter/number codes e.g. `A5/A6`
* Combinations of letter/number codes e.g. `A5+A6`
* Multiple stars that each have their own luminosity e.g. `F5V+K0III`
* Luminosity prefixes (`sd`, `d`, `sg`, `g`) or suffixes (`I`, `Ia0`, `Ia+`, `Ia`, `Iab`, `Ib`, `II`, `III` etc )
* Luminosity suffix ranges and alternatives e.g. `O7V-VI` and `O7V/VI`
* Numerous spectral peculiarity codes e.g. `...`, `comp`, `e`, `eq`, `f`, `(f)`, `((f))`, `He wk`, `m`, and element codes such as `Sr` or `HgMn`. Codes in brackets, such as `(n)` or `(e)`, indicate a weak feature
* Strength indices for iron, CN, CH, barium, C2 and calcium e.g. `K1.5IIIFe-0.5` or `G8III CN+1 Ba2`
* Uncertainty markers `:` or `?` after the class, luminosity, or any peculiarity code e.g. `G5:`, `G0V?` or `B2IVe:`
* Codes for S-type stars including abundance indications for `ZrO/TiO`, `C/O` and `ZrO`, and the intermediate `MS` and `SC` types e.g. `S4/2 III` or `SC5/9`
* White dwarf codes `DA`, `DB`, `DO`, `DQ`, `DZ`, `DC` and `DX` with or without numeric suffixes, as well as peculiarity codes `P`, `E`, `H`, `V`, `PEC`
* Carbon star types `C-R`, `C-N`, `C-J`, `C-H`, `C-Hd` with optional numbers e.g. `C-N5`, the older `C5,4` notation, and the historical `R` and `N` classes

Spaces are ignored, so `K0 III` is treated the same as `K0III`, and `B8 III p HgMn` the same as `B8IIIpHgMn`.

## Changes in version 2.0.0
Version 2 makes several changes that are not backwards compatible:

* `parse` throws a `ParseError` (or a `TypeError` for non-string values) instead of returning `undefined`
* Uncertainty is reported as `uncertain : true` on the class, luminosity or peculiarity, instead of as `class.peculiarities` or `luminosity.peculiarities`
* Peculiarities are listed in the order they appear, bracketed elements have `weak : true`, and `peculiarities.text` is normalised with one space between codes
* White dwarfs use `number` and `subtypes` instead of `dwarfTemperature` and `dwarfType`, carbon stars use letter `C` with `subtypes`, and S-type abundances are grouped under `abundance`
* A bare `0` is no longer accepted as a luminosity class, so `G10` is no longer misread as a G1 hypergiant; use `Ia0` or `Ia+` instead
* When no luminosity class is given, data is now based on a main-sequence (`V`) star instead of a bright giant (`II`)
* Data for ranges now includes every class in the range, and mass, luminosity, radius and temperature are averaged on a log scale

It also adds support for multiple stars with their own luminosities (`F5V+K0III`), `?` as an uncertainty marker, uncertainty markers after peculiarities, the `Ia0` luminosity class, and data for white dwarfs, fractional sub-divisions and more luminosity classes.
