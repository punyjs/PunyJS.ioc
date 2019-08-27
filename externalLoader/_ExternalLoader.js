/**
* @factory
* @naming
*   @alias externalLoader
*/
function _ExternalLoader(
    sourceListController
    , sourceFinder
    , loaders
    , errors
) {
    /**
    * A reference to the work object for internal use
    * @property
    * @private
    */
    var self
    /**
    * The array of sources used to resolve dependencies
    * @property
    * @private
    */
    , sourceList;

    /**
    * @worker
    */
    return self = Object.create(null, {
        /**
        * Set the internal source list
        * @method
        */
        "setSourceList": {
            "value": function setSourceList(sources) {
                //make a copy of the list so there isn't any external interference
                sources = JSON.parse(JSON.stringify(sources));
                //set the source list on the controller and store locally
                sourceListController.setSourceList(sources);
                sourceList = sources;
                //return self for chaining
                return self;
            }
        }
        /**
        * Inserts a source entry at index
        * @method
        */
        , "insertSource": {
            "value": function insertSource(sourceEntry, index) {
                sourceListController.insertSource(
                    sourceEntry
                    , index
                );
                //return self for chaining
                return self;
            }
        }
        /**
        * Updates a source entry by `namespace` or `index`.
        * @method
        */
        , "updateSource": {
            "value": function updateSource(namespace, sourceEntry) {
                sourceListController.updateSource(
                    namespace
                    , sourceEntry
                );
                //return self for chaining
                return self;
            }
        }
        /**
        * Removes a source list entry by `namespace`.
        * @method
        */
        , "removeSource": {
            "value": function removeSource(namespace) {
                sourceListController.removeSource(
                    namespace
                );
                //return self for chaining
                return self;
            }
        }
        /**
        * Starts the load process for `namespace`
        * @method
        *   @async
        */
        , "load": {
            "value": function load(namespaces) {
                ///INPUT VALIDATION
                if (!sourceList) {
                    throw new Error(`${errors.missing_source_list}`);
                }
                if (!namespaces) {
                    throw new Error(`${errors.invalid_namespace} (${typeof namespaces})`);
                }
                if (!Array.isArray(namespaces)) {
                    namespaces = [namespaces];
                }
                ///INPUT VALIDATION END

                return loadSources(
                    createListOfSources(namespaces)
                );
            }
        }
    });

    /**
    * @function
    */
    function createListOfSources(namespaces) {
        var sources = [];

        namespaces.forEach(function forEachNs(nsObj) {
            var source = sourceFinder(sourceList, nsObj);
            if (!source) {
                throw new Error(
                    `${errors.source_not_found} (${nsObj})`
                );
            }
            if (sources.indexOf(source) === -1) {
                sources.push(source);
            }
        });

        return sources;
    }
    /**
    * @function
    */
    function findSource(namespace) {
        return new Promise(function thenFindSource(resolve, reject) {
            try {
                resolve(
                    sourceFinder(sourceList, namespace)
                );
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    /**
    * @function
    */
    function loadSources(sources) {
        var procs =
            sources.map(function forEachSource(source) {
                return loadFromSource(source);
            });

        return Promise.all(procs)
        .then(function thenConcatResults(results) {
            return Promise.resolve(
                combineResults(results)
            );
        });
    }
    /**
    * @function
    */
    function loadFromSource(source) {
        var loader = loaders[source.endpointType];
        if (!loader) {
            throw new Error(
                `${errors.invalid_source_endpoint_type} (${source.endpointType})`
            );
        }
        return loader(source);
    }
    /**
    * Combines the dependency collections from all of the
    * @function
    */
    function combineResults(results) {
        var allResults = {};

        //loop through each result
        results.forEach(function forEachResult(result) {
            //loop through the result's contents
            Object.keys(result)
            .forEach(function forEachKey(key) {
                allResults[key] = result[key];
            });
        });

        return allResults;
    }
}