"use strict";

/*
 * A backtracking parser for grammars written in the format used by grammar.txt:
 *
 *     SYMBOL -> part part | part | ε
 *
 * Parts that are defined as symbols are non-terminals, anything else is a terminal string. Whitespace in the
 * input is ignored between terminals.
 *
 * When there is more than one way to parse the input, each symbol prefers its longest match. Between matches
 * of the same length it prefers the one whose earlier parts are longest, and then the alternative listed first
 * in the grammar. Unlike a purely greedy parser, if a preferred match leads to a dead end then the shorter
 * matches are tried as well. The results for
 * each symbol at each position are memoised, keeping only one parse tree for each span of the input, so
 * parsing takes polynomial rather than exponential time.
 */

function parseGrammar(grammarText) {
    const rules = {};

    grammarText.split('\n').map(line => line.trim()).filter(line => line).forEach(line => {
        const [symbol, substitution] = line.split('->', 2).map(s => s.trim());
        if (!substitution) {
            throw new Error(`Invalid grammar line: '${line}'`);
        }
        const alternatives = substitution.split('|').map(alternative => alternative.trim().split(/\s+/));
        (rules[symbol] || (rules[symbol] = [])).push(...alternatives);
    });

    return rules;
}

// True if the first match's parts are longer than the second's, comparing the first part that differs
function prefersEarlierPartsLonger(childEnds1, childEnds2) {
    for (let i = 0; i < Math.min(childEnds1.length, childEnds2.length); i++) {
        if (childEnds1[i] !== childEnds2[i]) {
            return childEnds1[i] > childEnds2[i];
        }
    }
    return false;
}

function buildParser(grammarText, startSymbol = 'START', epsilon = 'ε') {
    const rules = parseGrammar(grammarText);

    if (!rules[startSymbol]) {
        throw new Error(`Start symbol '${startSymbol}' is not defined in the grammar`);
    }

    function parse(text) {
        const symbolMemo = new Map(),
            sequenceMemo = new Map(),
            inProgress = new Set();

        let furthestFailure = 0,
            expectedAtFurthestFailure = new Set();

        function skipWhitespace(position) {
            while (position < text.length && /\s/.test(text[position])) {
                position++;
            }
            return position;
        }

        function matchTerminal(terminal, position) {
            const start = skipWhitespace(position);

            if (text.startsWith(terminal, start)) {
                return start + terminal.length;
            }

            // Keep track of the furthest point reached, for error reporting
            if (start > furthestFailure) {
                furthestFailure = start;
                expectedAtFurthestFailure = new Set();
            }
            if (start === furthestFailure) {
                expectedAtFurthestFailure.add(terminal);
            }
            return -1;
        }

        function matchPart(part, position) {
            if (part === epsilon) {
                return [{end : position, tree : epsilon}];
            }
            if (rules[part]) {
                return matchSymbol(part, position);
            }
            const end = matchTerminal(part, position);
            return end < 0 ? [] : [{end, tree : part}];
        }

        // Returns the ways that the parts of an alternative, from 'index' onwards, can match the input starting at 'position'.
        // There is one result for each possible end position, in order of preference. Because the matches for each part are
        // tried longest first, the result kept for each end position is the one whose earlier parts are longest.
        function matchSequence(parts, index, position) {
            if (index === parts.length) {
                return [{end : position, children : [], childEnds : []}];
            }

            let memoForParts = sequenceMemo.get(parts);
            if (!memoForParts) {
                sequenceMemo.set(parts, memoForParts = new Map());
            }
            const key = `${index}@${position}`;
            if (memoForParts.has(key)) {
                return memoForParts.get(key);
            }

            const results = [],
                seenEnds = new Set();

            matchPart(parts[index], position).forEach(match => {
                matchSequence(parts, index + 1, match.end).forEach(rest => {
                    if (!seenEnds.has(rest.end)) {
                        seenEnds.add(rest.end);
                        results.push({
                            end : rest.end,
                            children : [match.tree, ...rest.children],
                            childEnds : [match.end, ...rest.childEnds]
                        });
                    }
                });
            });

            memoForParts.set(key, results);
            return results;
        }

        // Returns the ways that a symbol can match the input starting at 'position', with one result for each possible
        // end position, longest first
        function matchSymbol(symbol, position) {
            const key = `${symbol}@${position}`;
            if (symbolMemo.has(key)) {
                return symbolMemo.get(key);
            }
            if (inProgress.has(key)) {
                throw new Error(`Left-recursion detected in grammar for symbol '${symbol}'`);
            }
            inProgress.add(key);

            const bestByEnd = new Map();
            rules[symbol].forEach(alternative => {
                matchSequence(alternative, 0, position).forEach(match => {
                    const best = bestByEnd.get(match.end);
                    if (!best || prefersEarlierPartsLonger(match.childEnds, best.childEnds)) {
                        bestByEnd.set(match.end, match);
                    }
                });
            });
            const results = [...bestByEnd.values()]
                .sort((r1, r2) => r2.end - r1.end)
                .map(({end, children}) => ({end, tree : {[symbol] : children}}));

            inProgress.delete(key);
            symbolMemo.set(key, results);
            return results;
        }

        const completeMatch = matchSymbol(startSymbol, 0).find(result => skipWhitespace(result.end) === text.length);

        if (completeMatch) {
            return {
                success : true,
                tree : completeMatch.tree
            };
        }

        return {
            success : false,
            position : furthestFailure,
            expected : [...expectedAtFurthestFailure]
        };
    }

    return {parse};
}

exports.buildParser = buildParser;
