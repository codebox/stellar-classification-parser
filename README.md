# stellar-classification-parser
A parser for Morgan-Keenan (MK) stellar classification codes. The library accepts an MK code as a string, and returns an object containing the information that can be derived from that code.

This project is available as a [NodeJS module](https://www.npmjs.com/package/stellar-classification-parser), and is also running online as a [free web service](https://api.codebox.net/starclass/parse/G5V).


## Using the NodeJS module
To use the NodeJS module in your project, include the `stellar-classification-parser` dependency in `package.json`:

    "dependencies": {
        "stellar-classification-parser": "^1.1.4"
    }

and call the `parse` function in your code, like this:

    const parser = require('stellar-classification-parser'),
          result = parser.parse('G5V');
    
    console.log(JSON.stringify(result));


The `parse` method has an optional second parameter which, if set to `true`, may return some additional data related to the physical attributes of the star, such as its temperature, luminosity, radius and colour.

## Using the Web Service
The module is also available to use via a Web Service hosted at `https://api.codebox.net/starclass/parse`. To use it, simply add the value to be parsed on to the end of the url, for example: [https://api.codebox.net/starclass/parse/G5V](https://api.codebox.net/starclass/parse/G5V)

You can try out the web service in the [online demo](https://codebox.net/pages/star-classification-parser-web-service#demo) on the project home page.

## The Parser
The parser understands a large subset of the commonly used parts of the MK system, but probably not all of it. There does not appear to be any complete and universally accepted definition of exactly what notation is valid and what isn't. I found various online sources using different notation to indicate the same thing, and many examples of dialects that seem to be unique to a particular author and not used anywhere else.

I'm happy to accept pull requests if anything important is missing or incorrect. See [this grammar](https://github.com/codebox/stellar-classification-parser/blob/master/grammar.txt) for more insight into what will currently work.

Among other things, the parser understands:
    
* The standard `O`, `B`, `A`, `F`, `G`, `K`, and `M` letter codes with or without numeric sub-divisions
* Ranges of letter/number codes e.g. `A5-6` or `A5-A6`
* Alternative letter/number codes e.g. `A5/A6`
* Combinations of letter/number codes e.g. `A5+A6`
*Luminosity prefixes (`sd`, `d`, `sg`, `g`) or suffixes (`0`, `I`, `Ia+`, `Ia`, `Iab`, `Ib`, `II`, `III` etc )
* Luminosity suffix ranges and alternatives e.g. `O7V-VI` and `O7V/VI`
* Numerous spectral peculiarity codes e.g. `...`, `comp`, `e`, `eq`, `f`, `(f)`, `((f))`, `He wk`, `m`
* Codes for S-type stars including abundance indications for `ZrO/TiO`, `C/O` and `ZrO`
* White dwarf codes `DA`, `DB`, `DO`, `DQ`, `DZ`, `DC` and `DX` with or without numeric suffixes, as well as peculiarity codes `P`, `E`, `H`, `V`, `PEC`
* Carbon star types `C-R`, `C-N`, `C-J`, `C-H`, `C-Hd`
