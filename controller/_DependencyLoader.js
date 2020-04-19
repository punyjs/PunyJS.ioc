/**
* @factory
*   @dependency offlineStorage TruJS.ioc.controller._OfflineStorage
*   @dependency externalLoader TruJS.ioc.externalLoader._ExternalLoader
*   @dependency errors TruJS.ioc.Errors
*   @singleton
*   @utility
* @naming
*   @alias dependencyLoader
*/
function _DependencyLoader(
    offlineStorage
    , externalLoader
    , consumerReference
    , namespaceParser
    , defaults
    , errors
) {
    /**
    * A reference to the worker object so `this` can be avoided
    * @property
    * @private
    */
    var self;

    /**
    * @worker
    */
    return self = Object.create(null, {
        /**
        * Loads a dependency from the local DB, and if missing, uses an external loader to get a copy of the dependency
        * @method
        */
        "load": {
            "enumerable": true
            , "value": function load(namespace) {
                //do a reload if we are skipping the local storage
                if (defaults.skipLocal) {
                    return self.reload(namespace);
                }
                var nsObj = namespaceParser(namespace);
                //load the dependnecy from the offline storage
                return offlineStorage.get(
                    nsObj.fqns
                )
                //load the dependency externally if missing otherwise resolve it
                .then(function thenSeeIfNeedLoad(result) {
                    //no result means we need to load the dependency
                    if (result === undefined) {
                        return loadExternalDependency(
                            nsObj
                        );
                    }
                    //resolve the result
                    return Promise.resolve(result);
                });
            }
        }
        /**
        * Uses an external loader to get a copy of the dependnecy
        * @method
        */
        , "reload": {
            "enumerable": true
            , "value": function reload(nsObj) {
                //load the dependency externally, skip the local storage
                return loadExternalDependency(
                    namespaceParser(nsObj)
                );
            }
        }
        /**
        * Deletes a dependency from the local DB
        * @method
        */
        , "delete": {
            "enumerable": true
            , "value": function deleteDependency(namespace) {
                return offlineStorage.delete(
                    namespaceParser(namespace).fqns
                );
            }
        }
        /**
        * Deletes all dependencies from the local DB
        * @method
        */
        , "clear": {
            "enumerable": true
            , "value": function reload(namespace) {
                return offlineStorage.clear(
                    namespaceParser(namespace).fqns
                );
            }
        }
    });

    /**
    * Starts the dependency loading process, returns a promise that will resolve
    * with the result from the call from the exteranl loader.
    * @function
    *   @param {string} namespace The namespace of the dependency to be set
    *   @returns {promise}
    */
    function loadExternalDependency(nsObj) {
        var nsObjList;
        //get the list of all dependencies required by this namespace, but not already loaded
        return Promise.resolve(
            generateDependencyList(
                nsObj
            )
        )
        //run the external loader
        .then(function thenLoadDependencies(namespaces) {
            nsObjList = namespaces;
            return externalLoader.load(
                namespaces
            );
        })
        //then check to see if the results contain all of the namespaces
        .then(function thenValidateResults(results) {
            return validateResults(
                nsObjList
                , results
            );
        })
        //save the value to the offline storage
        .then(function thenUpdateStorage(results) {
            if (defaults.skipLocal) {
                return Promise.resolve(results);
            }
            //save the results to offline storage
            return saveResults(
                results
            );
        })
        //resolve the dependency
        .then(function thenResolveDep(results) {
            //find the name wintin the results that points to the loaded dependency
            var depKey = nsObj.findMatchInList(
                Object.keys(results)
            );

            return Promise.resolve(
                results[depKey]
            );
        });
    }
    /**
    * Gets a list of dependencies that are required by the namespace. Remove any dependencies that have already been loaded. Return the list.
    * @function
    */
    function generateDependencyList(nsObj) {
        var references =
            //get the reference list for this namespace
            consumerReference.getReferences(
                nsObj
            )
            //filter out any that already exist
            .filter(function filterReferences(ref) {
                return !offlineStorage.has(ref);
            });

        return [nsObj].concat(references);
    }
    /**
    *
    * @function
    */
    function validateResults(requiredNsObjList, results) {
        return new Promise(function thenValidate(resolve, reject) {
            try {
                var resultKeys = Object.keys(results)
                , missing = []
                ;
                //loop through the namespace list and ensure each name is in the results collection
                requiredNsObjList.forEach(function forEachNs(nsObj) {
                    if (resultKeys.indexOf(nsObj.fqns) === -1
                        && resultKeys.indexOf(nsObj.localVersioned) === -1
                        && resultKeys.indexOf(nsObj.local) === -1) {
                        missing.push(nsObj.fqns);
                    }
                });

                if (missing.length > 0) {
                    reject(
                        new Error(
                            `${errors.missing_loaded_dependencies} (${missing})`
                        )
                    );
                }
                else {
                    resolve(results);
                }
            }
            catch(ex) {
                reject(ex);
            }
        });
    }
    /**
    * Updates the offline storage with the results
    * @function
    */
    function saveResults(results) {
        var procs = [];

        //create a list of promises that update the offline storage
        Object.keys(results)
        .forEach(function forEachResult(namespace) {
            var nsObj = namespaceParser(namespace);
            procs.push(
                offlineStorage.set(
                    nsObj.fqns
                    , results[namespace]
                )
            );
        });

        //wait for all promises to resolve
        return Promise.all(procs)
        .then(function thenReturnResults() {
            return Promise.resolve(results);
        });
    }
}