describe("Browser compatibility", function() {
    "use strict";

    const Module = require('module'),
        path = require('path'),
        PROJECT_DIR = path.resolve(__dirname, '..'),
        NODE_ONLY_MODULES = ['fs', 'path', 'os', 'child_process'];

    it("the library can be loaded without any Node-only modules", () => {
        const originalLoad = Module._load,
            projectModules = Object.keys(require.cache).filter(file => file.startsWith(PROJECT_DIR) && !file.includes('node_modules') && !file.includes(`${path.sep}spec${path.sep}`)),
            cachedModules = {};

        // Load a fresh copy of the library, failing if it tries to use any Node-only modules
        projectModules.forEach(file => {
            cachedModules[file] = require.cache[file];
            delete require.cache[file];
        });
        Module._load = function(request, ...args) {
            if (NODE_ONLY_MODULES.includes(request)) {
                throw new Error(`Library tried to load the Node-only module '${request}'`);
            }
            return originalLoad.call(this, request, ...args);
        };

        try {
            const {parse} = require('../index');
            expect(parse('G5V', true).data.temperature).toBeGreaterThan(0);
        } finally {
            Module._load = originalLoad;
            Object.assign(require.cache, cachedModules);
        }
    });
});
