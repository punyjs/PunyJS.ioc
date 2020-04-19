/**
* @factory
*   @singleton
* @naming
*   @alias dependencyNotationEntryTyper
*/
function _DependencyNotationEntryTyper(

) {
    var cnsts = {
        /**
        * An array of characters that are used as prefixes
        * @property
        * @private
        * @constant
        */
        "entryPrefix": {
            ".": "abstract"
            , ":": "concrete"
            , "+": "eval"
        }
        /**
        * A collection of RegExp representations of dependency notation
        * conversion maps
        * @property
        * @private
        * @constant
        */
        , "conversionMaps": {
            "method": /^[.+:]string[-][.]string(?:[-]object)?$/
            , "factory": /^[.+:]string[-]array(?:[-](object|boolean))?$/
            , "eval": /^[+]string([-]object)?$/
            , "concrete": /^[:]string([-]object)?$/
            , "abstract": /^[.]string([-]object)?$/
            , "branch": /^object([-]object)?$/
            , "union": /^[:]string([-][:]string)+([-]object)?$/
        }
    };

    /**
    * Uses the conversionMaps entries to determine what the type of the entry is.
    * @worker
    */
    return function DependencyNotationEntryTyper(entry) {
        //any value that is not an array must be a literal
        if (!Array.isArray(entry)) {
            return "literal";
        }
        //turn the entry into an array of types
        var entryConversionMap = createEntryConversionMap(entry);
        //process that array of types with known signatures to get the type
        return processConversionMap(entryConversionMap);
    };

    /**
    * Turns the array of values into an array of types, plus any prefix
    * values, to create an entry conversion map
    * @function
    */
    function createEntryConversionMap(entry) {
        return entry.map(function mapEntry(m) {
            if (Array.isArray(m)) {
                return "array";
            }
            var prefix = typeof m === "string"
                && Object.keys(cnsts.entryPrefix).indexOf(m[0]) !== -1
                && m[0]
                || ""
            , type = typeof m
            ;
            return prefix + type;
        })
        .join("-");
    }
    /**
    * Looks for a RegExp match to one of the `cnsts.conversionMaps`
    * properties, using the value as the RegExp expression, and the
    * property name as the entry type. If a match is not found fallback
    * to "literal".
    * @function
    */
    function processConversionMap(entryMap) {
        var type = "literal";

        Object.keys(cnsts.conversionMaps)
            .every(function everyKey(key) {
                var reg = cnsts.conversionMaps[key]
                , match = !!reg && reg.test(entryMap);
                if (!!match) {
                    type = key;
                    return false;
                }
                return true;
            });

        return type;
    }
}