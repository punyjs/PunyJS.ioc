/**
*
* @factory
*/
function _MonolithCollector(
    promise
    , buildHelpers_trujs_ioc_dependencyTreeGenerator
    , buildHelpers_trujs_ioc_assetPathListGenerator
    , buildHandlers_trujs_file_collect
) {
    /**
    * @alias
    */
    var dependencyTreeGenerator = buildHelpers_trujs_ioc_dependencyTreeGenerator
    /**
    * @alias
    */
    , assetPathListGenerator = buildHelpers_trujs_ioc_assetPathListGenerator
    /**
    * @alias
    */
    , fileCollect = buildHandlers_trujs_file_collect
    ;

    /**
    * @worker
    */
    return function MonolithCollector(
        entry
        , config
        , assets
        , procDetail
    ) {
        //generate the complete dependency tree
        return dependencyTreeGenerator(
            entry
        )
        //use the dependency tree to generate the list of dependency paths
        .then(function thenCreatePathList(dtree) {
            return assetPathListGenerator(
                entry
                , dtree
            );
        })
        //then use the dependency paths to load the assets
        .then(function thenCollectAssets(paths) {
            entry.files = paths;
            return fileCollect(
                entry
                , config
                , assets
                , procDetail
            );
        });
    };
}