/**
* The controller provides an API for loading the IOC container and abstract
* dependency tree, resolving dependencies, and executing factory functions.
* @factory
*   @dependency dependencyController TruJS.ioc._dependencyController
*   @dependency offlineStorage TruJS.ioc._OfflineStorage
*   @dependency abstractTree TruJS.ioc._AbstractTree
*   @dependency externalLoader TruJS.ioc._ExternalLoader
*   @dependency reporter TruJS.core.log._Reporter
*   @dependency defaults TruJS.ioc.Defaults
*   @utility
*   @singleton
* ---
* @naming
*   @alias controller
*/
function _Controller(
    dependencyController
    , offlineStorage
    , abstractTree
    , externalLoader
    , consumerReference
    , reporter
    , defaults
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
        function Controller(namespace, args, options) {
            //this could be a factory
            if (!!args) {
                return self.exec(namespace, args, options);
            }
            else {
                return self.resolve(namespace);
            }
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
                "value": function resolve(namespace) {
                    //throw error if invalid
                    validateNamespace(namespace);
                    //execute the dependency resolver, which should return a promise
                    return dependencyController.resolve(
                        namespace
                    )
                    //then get the resulting value for the dependency
                    .then(function returnResultingValue(dep) {
                        return Promise.resolve(dep.value);
                    });
                }
            }
            /**
            * Resolves the path to a factory function, resolves the function args,
            * and then executes the function.
            * @method
            *   @param {string} namespace An abstract, concrete, or eval path to a function
            *   @param {array} [args] An array of arguments used for
            *   {Argument-Augmentation} when executing the factory function.
            *   @param {object} [options] A collection of options to use for the factory entry
            *   @async
            */
            , "exec": {
                "value": function exec(namespace, args, options) {
                    //throw error if invalid
                    validateNamespace(namespace);
                    //make sure the args and options are set
                    options = options || {};
                    args = args || [];
                    if (!Array.isArray(args) && !!args) {
                        args = [args];
                    }
                    //execute the factory runner
                    dependencyController.resolve(
                        namespace
                        , args
                        , options
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
                "value": function run(...args) {
                    //execute the run dependency
                    return dependencyController.resolve(
                        `.${defaults.runDependencyName}`
                    )
                    //then execute the resulting run worker function
                    .then(function thenRunWorker(resolvedEntry) {
                        var fn = resolvedEntry.value;
                        if (typeof fn !== "function") {
                            return Promise.reject(
                                new Error(
                                    `${errors.invalid_run} (${typeof fn})`
                                )
                            );
                        }
                        return Promise.resolve(fn.apply(null, args));
                    });
                }
            }
        }
    );

    /**
    *
    * @function
    */
    function validateNamespace(namespace) {
        //ensure that the namespace is a string
        if (typeof namespace !== "string") {
            throw new Error(
                `${errors.invalid_concrete_abstract_namespace} (${namespace})`
            );
        }
    }
}