/**
* @factory
* @naming
*   @alias sourceFinder
*/
function _SourceFinder(
    
) {

    /**
    * @worker
    */
    return function SourceFinder(sourceList, namespaceObj) {
        var foundSource;

        //loop through the sources
        sourceList.every(function everySource(sourceNsObj) {
            if (namespaceObj.isMatch(sourceNsObj)) {
                foundSource = sourceNsObj;
                return false;
            }
            return true;
        });

        return foundSource;
    };
}