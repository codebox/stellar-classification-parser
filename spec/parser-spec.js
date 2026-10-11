describe("Parser", function() {
    "use strict";

    const buildParser = require('../parser').buildParser;

    function treeFor(grammar, text) {
        const result = buildParser(grammar).parse(text);
        expect(result.success).toBe(true);
        return result.tree;
    }

    describe("grammar", () => {
        it("throws an error if the start symbol is not defined", () => {
            expect(() => buildParser('X -> a')).toThrowError(/Start symbol/);
        });

        it("throws an error for lines without ->", () => {
            expect(() => buildParser('START -> a\nnonsense')).toThrowError(/Invalid grammar line/);
        });

        it("throws an error when parsing with a left-recursive grammar", () => {
            expect(() => buildParser('START -> START a | a').parse('aa')).toThrowError(/Left-recursion/);
        });

        it("combines alternatives from multiple lines for the same symbol", () => {
            const parser = buildParser('START -> a\nSTART -> b');
            expect(parser.parse('a').success).toBe(true);
            expect(parser.parse('b').success).toBe(true);
        });

        it("treats each space-separated part as a separate terminal", () => {
            expect(treeFor('START -> He wk', 'He wk')).toEqual({START : ['He', 'wk']});
        });
    });

    describe("parse trees", () => {
        it("contain terminals, symbols and epsilons", () => {
            expect(treeFor('START -> X Y\nX -> a\nY -> b | ε', 'a')).toEqual({START : [{X : ['a']}, {Y : ['ε']}]});
        });

        it("ignore whitespace between terminals", () => {
            expect(treeFor('START -> a b', '  a   b ')).toEqual({START : ['a', 'b']});
        });

        it("only succeed if all input is consumed", () => {
            const result = buildParser('START -> a').parse('ab');
            expect(result.success).toBe(false);
        });
    });

    describe("ambiguity", () => {
        it("prefers the longest match for each symbol", () => {
            expect(treeFor('START -> X Y\nX -> a | aa\nY -> a | ε', 'aa')).toEqual({START : [{X : ['aa']}, {Y : ['ε']}]});
        });

        it("prefers the earlier alternative between matches with the same parts", () => {
            expect(treeFor('START -> X | Y\nX -> a\nY -> a', 'a')).toEqual({START : [{X : ['a']}]});
        });

        it("prefers longer earlier parts between alternatives of the same length", () => {
            expect(treeFor('START -> X Y | X\nX -> a | a b\nY -> b', 'ab')).toEqual({START : [{X : ['a', 'b']}]});
        });

        it("backtracks to a shorter match if the longest one leads to a dead end", () => {
            expect(treeFor('START -> X + Y\nX -> a | a+\nY -> b', 'a+b')).toEqual({START : [{X : ['a']}, '+', {Y : ['b']}]});
        });

        it("backtracks through repeated symbols", () => {
            // The longest ITEM at the third character is 'en', but that leaves 'd' which can't be matched
            const grammar = 'START -> LIST end\nLIST -> ITEM LIST | ε\nITEM -> e | en';
            expect(treeFor(grammar, 'eeend')).toEqual({START : [
                {LIST : [{ITEM : ['e']}, {LIST : [{ITEM : ['e']}, {LIST : ['ε']}]}]},
                'end'
            ]});
        });

        it("handles highly ambiguous input in reasonable time", () => {
            const grammar = 'START -> LIST\nLIST -> ITEM LIST | ε\nITEM -> n | nn | nnn',
                start = Date.now();
            expect(buildParser(grammar).parse('n'.repeat(200)).success).toBe(true);
            expect(Date.now() - start).toBeLessThan(1000);
        });
    });

    describe("errors", () => {
        it("report the furthest position reached and what was expected there", () => {
            const result = buildParser('START -> a X\nX -> b | c').parse('a d');
            expect(result.success).toBe(false);
            expect(result.position).toEqual(2);
            expect(result.expected).toEqual(['b', 'c']);
        });

        it("report the end of the input when the input is incomplete", () => {
            const result = buildParser('START -> a b').parse('a');
            expect(result.position).toEqual(1);
            expect(result.expected).toEqual(['b']);
        });
    });
});
