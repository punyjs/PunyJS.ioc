/**
* @factoryEntry
*/
function _ConsumerReference(
    namespaceParser
    , errors
) {
    /**
    * A reference to the worker object
    * @property
    *   @private
    */
    var self
    /**
    * The internal collection of consumer references, using the fully qualified namespace as the key.
    * @property
    *   @private
    */
    , consumerReferences = {}
    ;

    /**
    * @worker
    */
    return self = Object.create(null, {
        /**
        * Sets the consumer references collection
        * @method
        */
        "setConsumerReferences": {
            "value": function setReference(references) {
                consumerReferences =
                    JSON.parse(JSON.stringify(references));
                //returns self for chaining
                return self;
            }
        }
        /**
        *
        * @method
        */
        , "initialize": {
            "value": function initialize() {
                return initializeList();
            }
        }
        /**
        * Sets 1..n references for `namespace`
        * @method
        */
        , "setReferences": {
            "value": function setReference(namespace, references) {
                //add an entry for this namespace
                if (!consumerReferences.hasOwnProperty(namespace)) {
                    consumerReferences[namespace] = [];
                }
                //add the references to the end of the list
                consumerReferences[namespace] =
                    consumerReferences[namespace]
                    .concat(refernces);
                //returns self for chaining
                return self;
            }
        }
        /**
        * Gets the reference list for `namespace`, throwing an error if one doesn't exist
        * @method
        */
        , "getReferences": {
            "value": function getReference(nsObj) {
                var refKey = nsObj.findMatchInList(
                    Object.keys(consumerReferences)
                );

                if (!!refKey) {
                    return consumerReferences[refKey];
                }

                throw new Error(`${errors.missing_consumer} (${nsObj.fqns})`);
            }
        }
    });

    /**
    * @function
    */
    function initializeList() {
        return new Promise(function thenInitilizeRefs(resolve, reject) {
            try {
                Object.keys(consumerReferences)
                .forEach(function forEachRef(key) {
                    consumerReferences[key] =
                        initializeRef(consumerReferences[key]);
                });

                resolve();
            }
            catch(ex) {
                reject(ex);
            }
        });
    }
    /**
    * @function
    */
    function initializeRef(ref) {
        return ref.map(function mapRefEntry(entry) {
            return namespaceParser(entry);
        });
    }
}