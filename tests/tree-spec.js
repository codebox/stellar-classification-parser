describe("Tree", function() {
    "use strict";

    const tree = require('../tree').tree;

    describe("find method", () => {
        it("finds all occurrences of specified value", () => {
            const t = tree({
                X : [{a:1}],
                b : {X:2},
                c : [{X:3}],
                d : {X : {e : 4}}
            });
            expect(t.find('X').map(n => n.get())).toEqual([
                [{a:1}],
                2,
                3,
                {e:4}
            ]);
        });

        it("handles nested matches correctly", () => {
            const t = tree({
                X : {X:1}
            });
            expect(t.find('X').map(n => n.get())).toEqual([
                {X:1}
            ]);
        });

        it("handles no matches correctly", () => {
            const t = tree({
                a : 1,
                b : [],
                c : {},
                d : [{e:{f:1}}]
            });
            expect(t.find('X')).toEqual([]);
        });

        it("ignores epsilon values", () => {
            const EPSILON = 'e',
                t = tree({
                    X : EPSILON,
                    a : [{X:EPSILON}],
                    b : [{X:[EPSILON]}]
                }, EPSILON);
            expect(t.find('X')).toEqual([]);
        });
    });

    describe("findOnly method", () => {
        it("finds single occurrence of specified value", () => {
            expect(tree({a : 1, b : 2, X : 3}).findOnly('X')).toEqual(3);
            expect(tree({a : 1, b : 2, c : [{X:3}]}).findOnly('X')).toEqual(3);
            expect(tree({a : 1, b : 2, c : {X:3}}).findOnly('X')).toEqual(3);
        });
        it("throws error if specified value cant be found", () => {
            expect(() => tree({a: 1, b: 2, c : [{d:3}]}).findOnly('X')).toThrowError(Error);
        });
        it("throws error if specified value appears multiple times", () => {
            expect(() => tree({a: 1, X: 2, c : [{X:3}]}).findOnly('X')).toThrowError(Error);
        });
    });

    describe("findOptional method", () => {
        it("finds single occurrence of specified value", () => {
            expect(tree({a : 1, b : 2, X : 3}).findOptional('X').get()).toEqual(3);
            expect(tree({a : 1, b : 2, c : [{X:3}]}).findOptional('X').get()).toEqual(3);
            expect(tree({a : 1, b : 2, c : {X:3}}).findOptional('X').get()).toEqual(3);
        });
        it("returns empty result if specified value cant be found", () => {
            expect(tree({a: 1, b: 2, c : [{d:3}]}).findOptional('X').get()).toBe(undefined);
        });
        it("throws error if specified value appears multiple times", () => {
            expect(() => tree({a: 1, X: 2, c : [{X:3}]}).findOptional('X')).toThrowError(Error);
        });
    });

    describe("collectText", () => {
        it("returns empty string if no text found", () => {
            expect(tree({}).collectText()).toEqual('');
            expect(tree([]).collectText()).toEqual('');
            expect(tree('').collectText()).toEqual('');
            expect(tree({a:{b:[],c:{}}}).collectText()).toEqual('');
        });
        it("collects text correctly", () => {
            expect(tree('a').collectText()).toEqual('a');
            expect(tree({a:'1', b:[2,{c:'3'}], d:{e:[4,5]}}).collectText()).toEqual('12345');
        });
    });
});
