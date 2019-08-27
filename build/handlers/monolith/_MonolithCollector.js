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
        , assets
        , procDetail
    ) {
        var assetPathData;
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
            assetPathData = paths;
            entry.files = getfilePaths(paths);
            return fileCollect(
                entry
                , assets
                , procDetail
            );
        })
        //then add the asset path data
        .then(function thenAddPathData(assets) {
            assets.forEach(function forEachAsset(asset,indx) {
                asset.entries = assetPathData[indx].entries;
            });
            return promise.resolve(assets);
        });
    };

    /**
    * Generates a list of file paths from the asset path objects
    * @function
    */
    function getfilePaths(paths) {
        return paths.map(function mapPaths(pathObj) {
            return pathObj.path;
        });
    }
}