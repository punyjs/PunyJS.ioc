/**
* Finds the dependency for the {iAbstractEntry} `depEntry`
* @factory
*   @dependency abstractTree PunyJS.ioc._AbstractTree
*   @dependency resolvers A collection of abstract entry resolvers
*   @dependency errors PunyJS.ioc.Errors
*   @dependency reporter PunyJS.core.log._Reporter
*   @dependency reporter PunyJS.ioc._ProcessDetails
*   @utility
*   @singleton
* ---
* @naming
*   @alias dependencyController
* ---
* @interface iResolvedEntry
*   @property {string} namespace The namespace of the resolved entry
*   @property {any} value The value of the resolved entry
*   @property {array} [dependencies] An array of dependencies, required by the resolved entry, in dependency notation
*   @property {array} [arguments] An array of resolved arguments
*/
function _DependencyController(
    abstractTree
    , dependencyNotationTranslator
    , dependencyLoader
    , resolvers
    , errors
    , reporter
    , processDetails
) {
    /**
    * A reference to the worker function
    * @property
    * @pivate
    */
    var self
    /**
    * A regex pattern for splitting abstract namespaces in jpath notation
    * @property
    */
    , JPATH_PATT = /[.]/
    /**
    * The container of concrete dependencies used by the controller to manage and resolve them.
    * @property
    * @private
    */
    , container
    /**
    * The global object used for evals
    * @property
    * @private
    */
    , global
    /**
    * A collection to hold handles for processes that are waiting for a single dependency to be resolved.
    * @property
    * @private
    */
    , resolveHandles = {}
    ;

    /**
    * @worker
    */
    return self = Object.create(null, {
        /**
        * Sets the abstractTree
        * @property
        */
        "setAbstractTree": {
            "value": function setAbstractTree(tree) {
                //initialize the tree
                abstractTree.setTree(tree);
            }
        }
        /**
        * Sets the ioc container
        * @property
        */
        , "setContainer": {
            "value": function setContainer(cnt) {
                if (!!container) {
                    throw new Error(errors.container_set);
                }
                //TODO: validate that it is a container
                container = cnt;
            }
        }
        /**
        * Sets the global
        * @property
        */
        , "setGlobal": {
            "value": function setGlobal(glbl) {
                global = glbl;
            }
        }
        /**
        * Checks if a namespace exists
        * @method
        *   @param {string} namespace A namespace in dependency notation
        */
        , "has": {
            "enumerable": true
            , "value": function has(namespace) {
                //make sure we've got a proper namespace
                //create a dependency entry
                var depEntry = getDependencyEntry(
                    namespace
                );
                //based on the abstract entry's type
                //if it's abstract then check that the abstract namespace exists in the abstract tree
                if (depEntry.type === "abstract") {
                    return abstractTree.hasNode(
                        depEntry.namespace
                    );
                }
                //if it's concrete then check to see if the namespace exists in the container
                if (depEntry.type === "concrete") {
                    return container.hasNamespace(
                        depEntry.namespace
                    );
                }
                //if it's an eval then see if the name exists in the global scope
                if (depEntry.type === "eval") {
                    return global.hasOwnProperty(
                        depEntry.expression
                    );
                }
            }
        }
        /**
        * Adds a dependency; concrete or abstract
        * @method
        */
        , "add": {
            "enumerable": true
            , "value": function add(namespace, value
            , options) {
                //make sure we've got a proper namespace
                //create a dependency entry
                var depEntry = getDependencyEntry(
                    namespace
                );

                if (depEntry.type === "abstract") {
                    if (
                        abstractTree.hasNode(namespace.substring(1))
                    ) {
                        throw new Error(
                            `${errors.abstract_dependency_exists} ('${namespace}')`
                        );
                    }
                    abstractTree.upsertNode({
                        "path": depEntry.namespace
                        , "value": value
                    });
                }

                if (depEntry.type === "concrete") {
                    //add this value to the container
                    container
                        .set(
                            depEntry.namespace
                            , values
                            , options
                        );
                }
            }
        }
        /**
        * Adds or updates an entry
        * @method
        *   @development
        *   @param {string} namespace
        *   @param {any} value
        *   @param {object} [options] An options object used when adding a concrete value to the IOC container.
        */
        , "upsert": {
            "enumerable": true
            , "value": function upsertEntry(namespace, value, options) {
                //make sure we've got a proper namespace
                //create a dependency entry
                var depEntry = getDependencyEntry(
                    namespace
                );

                if (depEntry.type === "abstract") {
                    //add this value to the abstract tree
                    abstractTree
                        .upsertNode({
                            "path": depEntry.namespace
                            , "value": value
                        });
                }
                if (depEntry.type === "concrete") {
                    //add this value to the container
                    container
                        .set(
                            depEntry.namespace
                            , values
                            , options
                        );
                }
            }
        }
        /**
        * Resolves an instance of {iAbstractEntry}
        * @method
        *   @param {string} namespace A namespace in dependency notation
        */
        , "resolve": {
            "value": function resolve(namespace, args, options) {
                //make sure we've got a proper namespace
                //create a dependency entry
                var depEntry = getDependencyEntry(
                    namespace
                    , args
                    , options
                );
                //start a process details chain
                var procDetails = processDetails(
                    depEntry.namespace
                    , "_DependencyController.resolveEntry"
                );
                reporter.ioc(
                    `Resolve Entry: ${procDetails.name}`
                    , procDetails
                );
                //resolve the entry
                return resolveEntry(
                    depEntry
                    , procDetails
                )
                //then record the result
                .then(function thenReportComplete(result) {
                    reporter.ioc(
                        `Dependency Completely Resolved: ${procDetails.namespace || procDetails.name}`
                        , procDetails
                    );
                    return Promise.resolve(result);
                });
            }
        }
        /**
        *
        * @method
        *   @development
        *   @param {string} namespace The namespace of the dependency to remove; concrete or abstract
        */
        , "remove": {
            "value": function load(namespace) {
                //make sure we've got a proper namespace
                //create a dependency entry
                var depEntry = getDependencyEntry(
                    namespace
                );

                if (depEntry === "abstract") {
                    abstractTree.removeNode(
                        namespace
                    );
                }
                if (depEntry === "concrete") {
                    //remove the value fron the container
                    container.deregister(
                        namespace
                    );
                }
            }
        }
        /**
        * Removes the resolved value, from memory, for an abstract namespace, or from the container for a concrete entry. Eval namespaces can not be reset, and attempting to will throw an error
        * @method
        *   @param {string} namespace A namespace in dependency notation
        */
        , "reset": {
            "value": function reset(namespace) {
                //make sure we've got a proper namespace
                //create a dependency entry
                var depEntry = getDependencyEntry(
                    namespace
                )
                , abstractEntry;

                //we can't reset evals
                if (depEntry.type === "eval") {
                    throw new Error(
                        `${errors.no_reset_eval} ('${namespace}')`
                    );
                }

                //deregister the concrete entry from the container
                if (depEntry.type === "concrete") {
                    container.deregister(
                        depEntry.namespace
                    );
                }

                //remove the `value` from the abstract entry
                if (depEntry.type === "abstract") {
                    abstractEntry = abstractTree.findNode(
                        depEntry.namespace
                    );
                    if (!!abstractEntry) {
                        abstractEntry.value = undefined;
                    }
                    else {
                        throw new Error(
                            `${errors.missing_abstract_namespace} ('${namespace}')`
                        );
                    }
                }
            }
        }
        /**
        * Removes the resolved value and reloads the dependency, ignoring and replacing the dependency in the local DB
        * @method
        *   @async
        *   @param {string} namespace A namespace in dependency notation
        */
        , "reload": {
            "value": function reset(namespace) {
                //make sure we've got a proper namespace
                //create a dependency entry
                var depEntry = getDependencyEntry(
                    namespace
                )
                , abstractEntry
                , concreteNs;

                //we can't reload evals
                if (depEntry.type === "eval") {
                    throw new Error(
                        `${errors.no_reset_eval} ('${namespace}')`
                    );
                }

                //determine the concrete
                if (depEntry.type === "abstract") {
                    abstractEntry = abstractTree.findNode(
                        depEntry.namespace
                    );
                    if (!!abstractEntry) {
                        abstractEntry.value = undefined;
                        concreteNs = getConcreteNamespace(
                            abstractEntry
                        );
                    }
                    else {
                        throw new Error(
                            `${errors.missing_abstract_namespace} ('${namespace}')`
                        );
                    }
                }

                if (depEntry.type === "concrete") {
                    concreteNs = depEntry.namespace;
                }

                //reload the concrete dependnecy
                if (!!concreteNs) {
                    dependencyLoader.reload(
                        concreteNs
                    );
                }
            }
        }
    });
    /**
    * Validates the string namespace and if it's valid, creates a dependency entry for it
    * @function
    */
    function getDependencyEntry(namespace) {
        //make sure we've got a proper namespace
        validateNamespace(namespace);
        //create a dependency entry
        return dependencyNotationTranslator(
            [namespace]
        );
    }
    /**
    * Ensures the namespace is a string in dependency notation
    * @function
    */
    function validateNamespace(namespace) {
        //ensure that the namespace is a string
        if (typeof namespace !== "string") {
            throw new Error(`${errors.invalid_concrete_abstract_namespace} (${namespace})`);
        }
        if (namespace[0] !== "."
            && namespace[0] !== ":"
            && namespace[0] !== "+") {
            throw new Error(`${errors.invalid_concrete_abstract_namespace} (${namespace})`);
        }
    }
    /**
    * Locates the abstract namespace on the tree and determines it's concrete namespace
    * @function
    */
    function getConcreteNamespace(namespace) {
        //another abstract entry, recurse
        if (abstractEntry.type === "abstract") {
            return getConcreteNamespace(
                abstractTree.findNode(
                    abstractEntry.namespace
                )
            );
        }
        //concrete entry, return namespace
        if (abstractEntry.type === "concrete")  {
            return abstractEntry.namespace;
        }
    }
    /**
    * @functiong
    */
    function resolveEntry(abstractEntry, parentProcDetails) {
        //create the process detilas for this resolution
        var procDetails = processDetails(
            abstractEntry.namespace
            , "_DependencyController.resolveEntry"
            , parentProcDetails
        );

        //see if this dependency has already been resolved
        if (abstractEntry.isResolved) {
            /// LOGGING
            reporter.ioc(
                `Resolved from cache: ${procDetails.name}`
                , procDetails
            );
            /// END LOGGING
            return Promise.resolve(
                abstractEntry.value
            );
        }

        //if we have a namespace let's add a resolve handle in case there are multiple requests for the same namespace
        if (!!abstractEntry.namespace) {
            //if there isn't an entry in the wait handle collection, create one
            if (!resolveHandles.hasOwnProperty(abstractEntry.namespace)) {
                resolveHandles[abstractEntry.namespace] = [];
            }
            //if there is, then we are already resolving this and should add a wait handle
            else {
                return new Promise(function thenWaitForResolve(resolve, reject) {
                    /// LOGGING
                    reporter.ioc(
                        `Waiting for Resolution: ${abstractEntry.namespace}`
                        , procDetails
                    );
                    /// END LOGGING
                    //add this promise to the waiter
                    resolveHandles[abstractEntry.namespace]
                        .push([
                            resolve
                            , reject
                            , procDetails
                            , abstractEntry
                        ]);
                });
            }
        }

        //resolve the dependency
        var proc = resolveDependency(
            procDetails
            , abstractEntry
        );

        //perform any bind operations
        if (abstractEntry.type !== "method"
            && !!abstractEntry.options
            && abstractEntry.options.hasOwnProperty("bind"))
        {
            proc = proc.then(function thenExecuteBind(resolvedEntry) {
                return resolvers.bind(
                    abstractEntry
                    , resolvedEntry
                    , resolveEntry
                    , procDetails
                );
            });
        }

        //update the abstract entry and return the resolved value
        return proc
        .then(function returnResolved(resolvedEntry) {
            //get the handles and remove the handles object for this namespace
            var handles = resolveHandles[abstractEntry.namespace];
            delete resolveHandles[abstractEntry.namespace];
            //finalize this first entry
            finalizeEntry(abstractEntry, resolvedEntry);
            //return the resolved value as well as start resolving the handles
            return Promise.race([
                resolvedEntry
                , executeHandles(
                    abstractEntry
                    , handles
                    , procDetails
                    , resolvedEntry
                )
            ]);
        })
        .catch(function catchException(err) {
            //get the handles and remove the handles object for this namespace
            var handles = resolveHandles[abstractEntry.namespace];
            delete resolveHandles[abstractEntry.namespace];
            //return the rejected error
            return Promise.race([
                Promise.reject(err)
                , executeHandles(
                    abstractEntry
                    , handles
                    , procDetails
                    , null
                    , err
                )
            ]);
        });
    }
    /**
    * Resolves the dependency based on it's type
    * @function
    */
    function resolveDependency(procDetails, abstractEntry) {
        //evals always resolve to a concrete value
        if (abstractEntry.type === "eval") {
            return resolvers.evaluate(
                abstractEntry
                , global
                , procDetails
            );
        }
        //concrete entries can have an array of dependencies
        else if (abstractEntry.type === "concrete") {
            return resolvers.concrete(
                abstractEntry
                , container
                , procDetails
            );
        }
        //abstract types alway return another abstract entry
        else if (abstractEntry.type === "abstract") {
            //find the entry on the abstract tree
            return resolvers.abstract(
                abstractEntry
                , abstractTree
                , resolveEntry
                , procDetails
            );
        }
        //methods have a target t
        else if (abstractEntry.type === "method") {
            return resolvers.method(
                abstractEntry
                , resolveEntry
                , procDetails
            );
        }
        //branches
        else if (abstractEntry.type === "branch") {
            return resolvers.branch(
                abstractEntry
                , resolveEntry
                , procDetails
            );
        }
        //factories have dependencies to resolve
        else if (abstractEntry.type === "factory") {
            return resolvers.factory(
                abstractEntry
                , resolveEntry
                , procDetails
            );
        }
        //literals just resolve the abstract value
        else if (abstractEntry.type === "literal") {
            return resolvers.literal(
                abstractEntry
                , procDetails
            );
        }
        //Lookup the custom resolver by type
        else if (!!resolvers[abstractEntry.type]) {
            return resolvers[abstractEntry.type](
                abstractEntry
                , resolveEntry
                , procDetails
            );
        }

        /// LOGGING
        reporter.ioc(
            `Unable to resolve type ${abstractEntry.type}`
            , procDetails
        );
        /// END LOGGING
        //if we made it here it's a bad type
        return Promise.reject(
            new Error(`${errors.invalid_entry_type} ("${abstractEntry.type}")`)
        );
    }
    /**
    * @function
    */
    function executeHandles(abstractEntry, handles, procDetails, resolvedEntry, err) {
        if (Array.isArray(handles) && handles.length > 0) {
            return new Promise(function () {
                /// LOGGING
                reporter.ioc(
                    `Resolving Handles: ${abstractEntry.namespace}`
                    , procDetails
                );
                /// END LOGGING
                handles.forEach(function forEachHandle(handle) {
                    var resolve = handle[0]
                    , reject = handle[1]
                    , procDetails = handle[2]
                    , abstractEntry = handle[3];
                    if (!!resolvedEntry) {
                        /// LOGGING
                        reporter.ioc(
                            `Dependency Resolved: ${procDetails.name}`
                            , procDetails
                        );
                        /// END LOGGING
                        finalizeEntry(abstractEntry, resolvedEntry);
                        resolve(resolvedEntry);
                    }
                    else {
                        reject(err);
                    }
                });
            });
        }
    }
    /**
    * @function
    */
    function finalizeEntry(abstractEntry, resolvedEntry) {
        //update the abstract entry with the resolved entry but not if it's a factory without singleton = true
        if (abstractEntry.type !== "factory"
            || abstractEntry.options.singleton === true)
        {
            abstractEntry.value = resolvedEntry;
            abstractEntry.isResolved = true;
        }
    }
}