/**
*
* @factory
*/
function _MonolithAssembler(
    promise
    , fs_fileInfo
    , defaults
) {

    /**
    * @worker
    */
    return function MonolithAssembler(
        entry
        , assets
        , procDetail
    ) {
        //create an array of the data for all assets then join them
        var assembled = assets.map(function mapAssets(asset) {
            return asset.data;
        })
        .join("\n\n")
        //create a new file info object
        , fileInfo = fs_fileInfo(
            entry.config[defaults.assembledFileNamePropertyName]
            , assembled
        );

        return promise.resolve([fileInfo]);
    };
}