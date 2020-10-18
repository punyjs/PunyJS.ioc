/**
* @factory
* @naming
*   @alias sourceListController
* @interface iSource
*   @property {string} endpointType The type of endpoint; http, socket, file
*   @property {string} endpointUri The URI that points to the endpoint
*   @property {string} namepace The fully qualified namespace that the endpoint serves
*/
function _SourceListController(
    namespaceParser
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
    , sourceList
    /**
    * A collection of factory constants
    * @constants
    */
    , cnsts = {
        "sourceProperties": [
            "namespace"
            , "endpointType"
            , "endpointUri"
        ]
    }
    ;

    /**
    * @worker
    */
    return self = Object.create(null, {
        /**
        * Sets the internal array of {iSource}
        * @method
        *   @property {array} sources An array of {iSource}
        */
        "setSourceList": {
            "value": function setSourceList(sources) {
                if (!Array.isArray(sources)) {
                    throw new Error(`${errors.ioc.invalid_source_list} (${typeof sources})`);
                }
                //set the reference
                sourceList = sources;
                //initialize the source list
                for (var i = 0, l = sourceList.length; i < l; i++) {
                    validateEntry(sourceList[i]);
                    //apply the namespace values
                    apply(
                        namespaceParser(sourceList[i].namespace)
                        , sourceList[i]
                    );
                }
                //return self for chaining
                return self;
            }
        }
        /**
        * Inserts a source entry at the index
        * @method
        *   @property {object} sourceEntry An instance of {iSource} that will be inserted
        *   @property {number} index The position in the array to insert the item
        */
        , "insertSource": {
            "value": function insertSource(sourceEntry, index) {
                if (!sourceList) {
                    throw new Error(`${errors.ioc.missing_source_list}`);
                }
                validateEntry(sourceEntry);
                apply(
                    namespaceParser(sourceEntry.namespace)
                    , sourceEntry
                );
                if (index === undefined) {
                    sourceList.push(sourceEntry);
                }
                else {
                    sourceList.splice(index, 0, sourceEntry);
                }
                //return self for chaining
                return self;
            }
        }
        /**
        * Updates a source entry by `namespace` or `index`.
        * @method
        *   @property {string} namespace The fully qualified namespace
        *   @property {object} sourceEntry An instance of {iSource} that will be used to update the entry
        */
        , "updateSource": {
            "value": function updateSource(namespace, sourceEntry) {
                if (!sourceList) {
                    throw new Error(`${errors.ioc.missing_source_list}`);
                }
                validateEntry(sourceEntry);
                apply(
                    namespaceParser(sourceEntry.namespace)
                    , sourceEntry
                );
                var entryIndex = findIndexByNamespace(namespace);
                if (entryIndex === -1) {
                    self.insertSource(
                        entryCopy
                    );
                }
                else {
                    apply(sourceEntry, sourceList[entryIndex]);
                }
                //return self for chaining
                return self;
            }
        }
        /**
        * Removes a spurce list entry by `namespace`.
        *   @property {string} namespace The fully qualified namespace
        * @method
        */
        , "removeSource": {
            "value": function removeSource(namespace) {
                if (!sourceList) {
                    throw new Error(`${errors.ioc.missing_source_list}`);
                }
                //find the namespace index in the
                var entryIndex = findIndexByNamespace(namespace);
                if (entryIndex !== -1) {
                    sourceList.splice(entryIndex, 1);
                }
                //return self for chaining
                return self;
            }
        }
    });

    /**
    * Finds and returns the index of the entry with namespace
    * @function
    */
    function findIndexByNamespace(namespace) {
        for(var i = 0, l = sourceList.length; i < l; i++) {
            if (sourceList[i].namespace === namespace) {
                return i;
            }
        }
        return -1;
    }
    /**
    * Checks the sourceEntry object for the required properties
    */
    function validateEntry(sourceEntry) {
        if (
            !sourceEntry.hasOwnProperty("namespace")
            || !sourceEntry.hasOwnProperty("endpointUri")
            || !sourceEntry.hasOwnProperty("endpointType")
        ) {
            throw new Error(errors.ioc.invalid_source_entry);
        }
    }
    /**
    * Checks the sourceEntry object for the required properties
    */
    function apply(source, target) {
        Object.keys(source)
        .forEach(function forEachKey(key) {
            target[key] = source[key];
        });
    }
}