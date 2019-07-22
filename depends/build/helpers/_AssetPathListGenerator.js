/**
*
* @factory
*/
function _AssetPathListGenerator(
    promise
) {

    /**
    * @worker
    */
    return function AssetPathListGenerator() {

        return promise.resolve();
    };
}