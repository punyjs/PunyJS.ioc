/**
* The monolith formatter creates the dependency tree file and adds it to the assets
* @factory
*/
function _MonolithFormatter(
    promise
    , fs_fileInfo
    , defaults
) {
    /**
    * A collection of constants
    * @property
    */
    var cnsts = {
        "nodeExport": "module.exports = "
        , "browserExport": "export default "
        , "defaultEngine": "browser"
    };

    /**
    * @worker
    */
    return function MonolithFormatter(
        entry
        , assets
        , procDetail
    ) {
        //create the dependency tree
        return createDependencyTreeFile(
            entry
        )
        //add the dtree file to the assets
        .then(function thenAddToAssets(dtreeFile) {
            assets.push(
                dtreeFile
            );
            return promise.resolve(assets);
        });
    };

    /**
    * Creates the dependency tree file object
    * @function
    */
    function createDependencyTreeFile(entry) {
        try {
            //get the dependency tree path
            var dTreePath = entry.config[
                defaults.dtreeFileNamePropertyName
            ]
            //create the file
            , dtreeFile = fs_fileInfo(
                dTreePath
                , createDependencyTree(
                    entry
                )
            );

            return promise.resolve(dtreeFile);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * Creates the data for the dependency tree file
    * @function
    */
    function createDependencyTree(entry) {
        var env = entry.engine || cnsts.defaultEngine
        , exp = cnsts[`${env}Export`]
        , data = JSON.stringify(entry.dtree);

        return `${exp}\n${data};`
            .replace(/\r?\n/g, "\n    ");
    }
    /**
    * @function
    */
    function createTreeEntry(tree) {
        return JSON.stringify(tree);
    }
}