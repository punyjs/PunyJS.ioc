/**
* The controller provides an API for loading the IOC container and abstract
* dependency tree, resolving dependencies, and executing factory functions.
* @factory
*   @dependency dependencyController PunyJS.ioc._dependencyController
*   @dependency offlineStorage PunyJS.ioc._OfflineStorage
*   @dependency externalLoader PunyJS.ioc._ExternalLoader
*   @dependency reporter PunyJS.core.log._Reporter
*   @dependency defaults PunyJS.ioc.Defaults
*   @utility
*   @singleton
* ---
* @naming
*   @alias controller
*/
function _Controller(
    dependencyController
    , offlineStorage
    , externalLoader
    , consumerReference
    , reporter
    , defaults
    , errors
) {
    /**
    * A reference to the worker object so `this` can be avoided
    * @property
    * @private
    */
    var self
    /**
    * A reference to the programs container
    * @property
    */
    , container
    /**
    * A grouping of setup methods
    * @property
    */
    , setup = Object.create(null, {
        /**
        * Sets the concrete dependency container
        * @method
        */
        "setContainer": {
            "enumerable": true
            , "value": function setContainer(cntnr) {
                //update the dependency resolver
                dependencyController.setContainer(cntnr);
                container = cntnr;
                //return self for chaining
                return self.setup;
            }
        }
        /**
        * Sets the abstract dependency tree
        * @method
        */
        , "setAbstractTree": {
            "enumerable": true
            , "value": function setAbstractTree(tree) {
                //update the dependency resolver
                dependencyController.setAbstractTree(tree);
                //return self for chaining
                return self.setup;
            }
        }
        /**
        * Sets the global object that will be used for eval
        * @method
        */
        , "setGlobal": {
            "enumerable": true
            , "value": function setGlobal(g) {
                //update the dependency resolver
                dependencyController.setGlobal(g);
                //update the offline storage
                offlineStorage.setDbms(
                    g.indexedDB
                    || g.mozIndexedDB
                    || g.webkitIndexedDB
                    || g.msIndexedDB
                );
                //return self for chaining
                return self.setup;
            }
        }
        /**
        * Sets the external loader for the dependency loading
        * @method
        */
        , "setSourceList": {
            "enumerable": true
            , "value": function setSourceList(sourceList) {
                //set the source list on the external loader
                externalLoader.setSourceList(sourceList);
                //return self for chaining
                return self.setup;
            }
        }
        /**
        * Sets the consumer reference list
        * @method
        */
        , "setConsumerReferences": {
            "enumerable": true
            , "value": function setConsumerReferences(refs) {
                consumerReference.setConsumerReferences(refs);
                //return self for chaining
                return self.setup;
            }
        }
        /**
        * Returns the reporter used by the controller
        * @method
        */
        , "getReporter": {
            "enumerable": true
            , "value": function () {
                return reporter;
            }
        }
        /**
        * @method
        *   @async
        */
        , "initialize": {
            "enumerable": true
            , "value": function initialize() {
                return consumerReference.initialize()
                .then(function thenInitDb() {
                    return offlineStorage.initialize();
                });
            }
        }
    });

    /**
    * @worker
    *   @hybrid
    */
    return self = Object.defineProperties(
        /**
        * Set the prototype to the controller function
        * @function
        */
        function Controller(extEntry) {
            if (typeof extEntry === "string") {
                extEntry = [extEntry];
            }
            return self.resolve(extEntry);
        }
        /**
        * @properties
        */
        , {
            /**
            * A collection of setup methods that can be chained together
            * @property
            */
            "setup": {
                "enumerable": true
                , "value": setup
            }
            /**
            * A collection of methods for controlling the source list
            * @property
            */
            , "source": {
                "enumerable": true
                , "value": externalLoader
            }
            /**
            * A collection of methods for controlling the abstract and concrete dependnecies
            * @property
            */
            , "dependency": {
                "enumerable": true
                , "value": dependencyController
            }
            /**
            * Resolves a dependency path to a concrete value
            * @method
            *   @param {string} namespace An abstract, concrete, or eval abstract namespace
            *   @async
            */
            , "resolve": {
                "enumerable": true
                , "value": function resolve(extEntry) {
                    //execute the dependency resolver, which should return a promise
                    return dependencyController.resolve(
                        extEntry
                    )
                    //then get the resulting value for the dependency
                    .then(function returnResultingValue(dep) {
                        return Promise.resolve(dep.value);
                    });
                }
            }
            /**
            * Executes the `$run$` factory and then executes the `$run$` worker with
            * the `args`.
            * @method
            *   @async
            */
            , "run": {
                "enumerable": true
                , "value": function run(...args) {
                    //execute the run dependency
                    return dependencyController.resolve(
                        [`.${defaults.ioc.runDependencyName}`]
                    )
                    //then execute the resulting run worker function
                    .then(function thenRunWorker(resolvedEntry) {
                        var fn = resolvedEntry.value;
                        if (typeof fn !== "function") {
                            return Promise.reject(
                                new Error(
                                    `${errors.ioc.invalid_run} (${typeof fn})`
                                )
                            );
                        }
                        return Promise.resolve(fn.apply(null, args));
                    });
                }
            }
        }
    );
}