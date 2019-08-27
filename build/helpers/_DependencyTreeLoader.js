/**
*
* @factory
*/
function _DependencyTreeLoader(
    promise
    , is_array
    , workspacePath
    , buildHelpers_buildPathProcessor
    , fs_fileLoader
    , defaults
    , errors
) {
    /**
    * A reg exp pattern for replaceing the dots in a namespace
    * @property
    */
    var DOT_PATT = /[.]/g
    /**
    * @alias
    */
    , fileLoader = fs_fileLoader
    ;

    /**
    * @worker
    */
    return function DependencyTreeLoader(entry) {
        //create the list of dependency trees to load
        return new promise(
            createLoadList.bind(null, entry)
        )
        //then load the trees
        .then(function thenLoadTrees(paths) {
            return loadTreePaths(
                paths
            );
        });
    };

    /**
    * Uses the manifest entry's `dtree` and `base` property values to create a list of dtree paths
    * @function
    */
    function createLoadList(entry, resolve, reject) {
        try {
            var dtree = entry.dtree || defaults.dtreeName
            , base = entry.base
            , paths
            ;

            //ensure there is a base
            if (!base) {
                base = [];
            }
            //ensure the base is an array
            if (!is_array(base)) {
                base = [base];
            }
            //add the dtree to the base
            base.push(dtree);

            //loop through the base array and turn each member into a fq path
            paths = base.map(function mapBase(val) {
                return buildHelpers_buildPathProcessor(
                    val
                    , entry.config.project
                );
            });

            resolve(paths);
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * Starts a file load process for each path
    * @function
    */
    function loadTreePaths(paths) {
        var procs = [];

        paths.forEach(function forEachPath(path) {
            procs.push(
                fileLoader(path)
            );
        });

        //load the paths
        return promise.all(
            procs
        )
        //then convert the data to JSON
        .then(function thenParseJson(dataList) {
            return convertData(
                dataList
                , paths
            );
        });
    }
    /**
    * Converts the utf8 text to JSON
    * @function
    */
    function convertData(dataList, paths) {
        try {
            //keep track of the index so if there is an error we know what the path is
            var curIndx = 0;

            return promise.resolve(
                dataList.map(function mapData(data, indx) {
                    curIndx = indx;
                    //convert the data to JSON and then translate it
                    return JSON.parse(data);
                })
            );
        }
        catch(ex) {
            return promise.reject(
                new Error(
                    `${errors.invalid_dep_tree} (${paths[curIndx]}) ${ex}`
                )
            );
        }
    }
}