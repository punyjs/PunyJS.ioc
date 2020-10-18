/**
* @factory
*   @dependency errors PunyJS.ioc.Errors
*   @dependency dependencyLoader PunyJS.ioc._DependencyLoader
*   @dependency dependencyNotationTranslator PunyJS.ioc._DependencyNotationTranslator
*   @dependency reporter PunyJS.core.log._Reporter
*   @dependency reporter PunyJS.ioc._ProcessDetails
* @naming
*   @alias resolvers.concrete
*/
function _Concrete(
    errors
    , dependencyLoader
    , dependencyNotationTranslator
    , reporter
    , processDetails
) {

    /**
    * Finds a concrete value in the ioc container
    * @worker
    *   @param {object} abstractEntry An instance of {iAbstractEntry}
    *   @param {object} container An instance of {iContainer}
    *   @param {object} parentProcDetails An instance of {iProcessDetails}
    *   @returns {any} The value of the resolved dependency
    *   @async
    */
    return function Concrete(
        abstractEntry
        , container
        , procDetails
    ) {
        if (!container) {
            return Promise.reject(
                new Error(errors.ioc.missing_container)
            );
        }

        //start a promise
        var proc = Promise.resolve();

        //if the namespace is missing then load it
        if (!container.hasNamespace(abstractEntry.namespace)) {
            proc = proc.then(function thenLoadDependency() {
                /// LOGGING
                reporter.ioc(
                    `Load Concrete Dependency: ${abstractEntry.namespace}`
                    , procDetails
                );
                /// END LOGGING
                //execute the dependency laoder
                return dependencyLoader.load(
                    abstractEntry.namespace
                );
            })
            //catch load errors
            .catch(function catchError(err) {
                return Promise.reject(
                    `${errors.ioc.failed_load_dependency} (${abstractEntry.namespace}) ${err}`
                );
            })
            //update the container at namespace
            .then(function thenUpdateContainer(result) {
                /// LOGGING
                reporter.ioc(
                    `Concrete Dependency Loaded: ${abstractEntry.namespace}`
                    , procDetails
                );
                /// END LOGGING
                //update the container
                container.set(
                    abstractEntry.namespace
                    , result.value
                    , result.options
                );
                return Promise.resolve(result);
            });
        }

        //resolve the iContainerEntry at the namespace
        proc = proc.then(function thenReadContainer() {
            /// LOGGING
            reporter.ioc(
                `Resolve Concrete: ${abstractEntry.namespace}`
                , procDetails
            );
            /// END LOGGING
            return Promise.resolve(
                container.get(abstractEntry.namespace)
            );
        });

        //add the dependencies from the iContainerEntry instance to the abstract
        proc = proc.then(function thenTranslateDependencies(concreteEntry) {
            /// LOGGING
            reporter.ioc(
                `Concrete Resolved: ${abstractEntry.namespace} [${typeof concreteEntry.value}]`
                , procDetails
            );
            /// END LOGGING
            return Promise.resolve({
                "value": concreteEntry.value
                , "dependencies": translateDependencies(concreteEntry)
            });
        });

        return proc;
    };

    /**
    * Translates the dependencies, which are in dependency notation, to
    * instances of {iAbstractEntry}.
    * @function
    */
    function translateDependencies(concreteEntry) {
        if (
            !!concreteEntry.options
            && Array.isArray(concreteEntry.options.dependencies)
        ) {
            return concreteEntry.options.dependencies
                .map(function mapDep(dep) {
                    return dependencyNotationTranslator(dep);
                });
        }
    }
}