/**
*
* @factory
*/
function _MonolithPreProcessor(
    promise
    , buildHandlers_trujs_module_preprocess
    , buildHelpers_trujs_ioc_registryEntryCreator
    , utils_func_inspector
) {
    /**
    * @alias
    */
    var modulePreProcessor = buildHandlers_trujs_module_preprocess
    /**
    * @alias
    */
    , registryEntryCreator = buildHelpers_trujs_ioc_registryEntryCreator
    /**
    * A regexp pattern for matching new line (and CR)
    * @property
    */
    , NL_PATT = /\r?\n/g
    ;

    /**
    * @worker
    */
    return function MonolithPreProcessor(
        entry
        , assets
        , procDetail
    ) {
        //run the module preprocessor, it creates the naming for each asset
        return modulePreProcessor(
            entry
            , assets
            , procDetail
        )
        // then create header asset
        .then(function thenCreateHeaderAsset(pAssets) {
            assets = pAssets;
            return new promise(
                createHeader.bind(null, entry)
            );
        })
        //then create container asset
        .then(function thenUpdateContainerEntry(header) {
            assets.splice(1, 0, header);
            return new promise(
                updateContainerEntry.bind(null, entry, assets)
            );
        })
        //create register entries
        .then(function thenCreateRegisterEntries() {
            return new promise(
                createRegisterEntries.bind(null, entry, assets)
            );
        })
        ;
    };

    /**
    * Creates the begining of the script adding "use strict" and redeclaring the globals to hide them
    * @function
    */
    function createHeader(entry, resolve, reject) {
        try {
            var header = {
                "data": `"use strict";\n\nvar ${entry.config.hideGlobals.join(",")};`
            };

            resolve(header);
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * Updates the container entry to create an instance of _Container named `container`, exposes the `register` method, then exports the container, and finally hides the `container`
    * @function
    */
    function updateContainerEntry(entry, assets, resolve, reject) {
        try {
            var fnMeta = utils_func_inspector(
                assets[0].data
            )
            , container = fnMeta.fnText;

            assets[0].data = [
                "// Create the IOC container"
                , `var container = (${container})()`
                , ", register = container.register;"
                , "//export the container"
                , "module.exports = container;"
                , "//hide the container from the dependencies"
                , "container = undefined;"
            ]
            . join("\n");

            resolve();
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * Loops through the assets and changes them to register entries
    * @function
    */
    function createRegisterEntries(entry, assets, resolve, reject) {
        try {
            //loop through each asset and create a registry entry for each
            assets.forEach(function forEachAsset(asset, indx) {
                //skip the container and header entries
                if (indx < 2) {
                    return;
                }
                //create the register entry and update the asset data
                var regEntry = registryEntryCreator(
                    entry.config
                    , asset
                )
                , entryValue = typeof regEntry.value === "string"
                    ? regEntry.value.replace(NL_PATT, "\n    ")
                    : regEntry.value
                , options
                ;
                //swap out the data for the registry entry
                if (!!regEntry.options) {
                    options = JSON.stringify(regEntry.options)
                    asset.data = `register(\n    "${regEntry.namespace}"\n    , ${entryValue}\n    , ${options}\n);`;
                }
                else {
                    asset.data = `register(\n    "${regEntry.namespace}"\n    , ${entryValue}\n);`;
                }
            });

            resolve(assets);
        }
        catch(ex) {
            reject(ex);
        }
    }
}