/**
* @factory
*   @dependency dependencyNotationTranslator PunyJS.ioc._DependencyNotationTranslator
*   @dependency reporter PunyJS.core.log._Reporter
*   @dependency reporter PunyJS.ioc._ProcessDetails
* @naming
*   @alias resolvers.factory
*/
function _Factory(
    dependencyNotationTranslator
    , reporter
    , processDetails
    , defaults
) {
    /**
    * @worker
    *   @param {object} abstractEntry An instance of {iAbstractEntry}
    *   @param {function} dependencyResolver
    *   @param {object} parentProcDetails An instance of {iProcessDetails}
    *   @returns {any} The value of the resolved dependency
    *   @async
    *   @sideeffect {insert} abstractEntry.arguments
    */
    return function Factory(
        abstractEntry
        , dependencyResolver
        , procDetails
    ) {
        return Promise.resolve()
        .then(function thenStartFactoryResolve() {
            /// LOGGING
            reporter.ioc(
                `Resolve Factory: ${abstractEntry.namespace}`
                , procDetails
            );
            /// END LOGGING
            //resolve the factory entry
            return dependencyResolver(
                abstractEntry.factoryEntry
                , procDetails
            );
        })
        .then(function thenResolveDependencies(resolvedFactoryEntry) {
            var dependencies = getFactoryDependencies(
                abstractEntry
                , resolvedFactoryEntry
            );
            /// LOGGING
            reporter.ioc(
                `Resolve Factory Dependencies(${dependencies.length}): ${abstractEntry.namespace}`
                , procDetails
            );
            /// END LOGGING
            return resolveDependencies(
                resolvedFactoryEntry
                , dependencies
                , dependencyResolver
                , procDetails
            );
        })
        .then(function thenRunFactory(argsAndEntry) {
            /// LOGGING
            reporter.ioc(
                `Execute Factory: ${abstractEntry.namespace}`
                , procDetails
            );
            /// END LOGGING
            var resolvedFactoryEntry = argsAndEntry.pop()
            , args = argsAndEntry
            ;
            abstractEntry.arguments = args;
            return runFactory(
                resolvedFactoryEntry
                , args
            );
        })
        .then(function thenResolveEntry(result) {
            /// LOGGING
            reporter.ioc(
                `Factory Finished: ${abstractEntry.namespace}`
                , procDetails
            );
            /// END LOGGING
            return Promise.resolve({
                "value": result
            });
        });
    };

    /**
    * Loops through the dependency entries an resolves each
    * @function
    */
    function resolveDependencies(resolvedEntry, dependencies, dependencyResolver, procDetails) {
        var procs = [resolvedEntry];
        if (Array.isArray(dependencies)) {
            //add the dependencies
            procs = dependencies
                .map(function mapDep(depEntry) {
                    /**
                    * @feature $self
                    */
                    if (depEntry.namespace === "$self") {
                        return resolvedEntry;
                    }
                    return dependencyResolver(
                        depEntry
                        , procDetails
                    );
                });
            //put the entry on the end
            procs.push(resolvedEntry);
        }
        return Promise.all(procs);
    }
    /**
    * Execute the factory function with the arguments
    * @function
    */
    function runFactory(entry, args) {
        return new Promise(function thenRunFactory(resolve, reject) {
            try {
                args = args.map(function mapArg(arg) {
                    return arg.value;
                });
                var fn = entry.value
                , result = fn.apply(null, args)
                ;



                resolve(result);
            }
            catch(ex) {
                reject(ex);
            }
        });
    }
    /**
    * Combine the dependencies from the abstract entry and the resolved entry
    * @function
    */
    function getFactoryDependencies(abstractEntry, resolvedEntry) {
        var abstractDeps =
            abstractEntry.dependencies || []
        , resolvedDeps =
            resolvedEntry.dependencies || []
        , dependencies = [];

        //add the resolved entry's dependencies first
        resolvedDeps
        .forEach(function forEachResolvedDep(depEntry, indx) {
            if(!depEntry.namespace) {
                depEntry.namespace = `_argument${indx + 1}`;
            }
            dependencies[indx] = depEntry;
        });

        //add the abstract entry dependencies on top
        abstractDeps
        .forEach(function forEachAbstractDep(dep, indx) {
            if (dep.value !== defaults.ioc.skipPlaceholder) {
                if(!dep.namespace) {
                    dep.namespace = `_argument${indx + 1}`;
                }
                dependencies[indx] = dep;
            }
        });

        return dependencies;
    }
}