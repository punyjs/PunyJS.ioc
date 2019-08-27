/**
*
* @factory
*/
function _RegistryEntryCreator(
    utils_func_inspector
) {
    /**
    * A regexp pattern to remove the leading comments from a javascript file
    * @property
    */
    var LEADING_COMM_PATT = /^^(?:(?:[/][*]{2}(?:.+?)(?<=[*])[/])|(?:[/]{2}[^\r\n]*)|\s)+/ms
    /**
    * A regexp pattern to remove whitespace
    * @property
    */
    , WS_PATT = /\w/g
    /**
    * A regexp pattern to split a string by commas
    * @property
    */
    , SPLIT_PATT = /[,]/g
    /**
    * A regexp pattern for matching underscores
    * @property
    */
    , LD_PATT = /[_]/g
    ;

    /**
    * @worker
    */
    return function RegistryEntryCreator(config, asset) {
        var namespace = asset.naming.namespace
        , value = asset.data
        , options = asset.options;
        //if this is javascript remove any leading comments
        if (asset.path.ext === ".js") {
            value = value.replace(LEADING_COMM_PATT, "");
            //if this is a factory, add the dependencies
            if (asset.entries[0].type === "factory") {
                if (!options) {
                    options = {};
                }
                options.dependencies = getFactoryDependencies(asset);
            }
        }
        //if not json we'll need to encapsulate it
        else if (asset.path.ext !== ".json") {
            value = `"${value}"`;
        }

        return {
            "namespace": namespace
            , "value": value
            , "options": options
        };
    };

    /**
    * Extracts the function arguments and changes them to dot notation paths to abstract namespaces
    * @function
    */
    function getFactoryDependencies(asset) {
        var funcMeta = utils_func_inspector(
            asset.data
        );

        return funcMeta.params
            .map(function mapParams(param) {
                return [`.${param.replace(LD_PATT, ".")}`];
            });
    }
}