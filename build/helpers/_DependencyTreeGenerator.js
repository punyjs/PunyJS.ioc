/**
* The dependency tree generator uses the manifest entry to determine the list of dpendency trees to load, then loads and merges them. The `dtree` property in the entry identifies the absolute path and name of the entry's dependency tree. The `base` property, optional, is an array of external dependnecy trees that will be merged. The dependency tree is merged, starting with the first member of the base array through to the last and then ending with the manifest entry's dtree; overwriting any properties that share the same name.
* @factory
* @feature base-notation
*   Base Notation is the path, in dot notation, from the source directory, that points to a dependency tree
*/
function _DependencyTreeGenerator(
    promise
    , buildHelpers_trujs_ioc_dependencyNotationMerger
    , buildHelpers_trujs_ioc_dependencyNotationTranslator
    , buildHelpers_trujs_ioc_dependencyTreeLoader
    , utils_copy
) {

    /**
    * @alias
    */
    var dependencyNotationMerger = buildHelpers_trujs_ioc_dependencyNotationMerger
    /**
    * @alias
    */
    , dependencyTreeLoader = buildHelpers_trujs_ioc_dependencyTreeLoader
    /**
    * @alias
    */
    , dependencyNotationTranslator = buildHelpers_trujs_ioc_dependencyNotationTranslator
    ;

    /**
    * @worker
    */
    return function DependencyTreeGenerator(
        entry
    ) {
        //load the dependency trees
        return dependencyTreeLoader(
            entry
        )
        //then combine the trees into one
        .then(function thenCombineTrees(trees) {
            return dependencyNotationMerger(
                trees
            );
        })
        //then translate the combined tree
        .then(function thenTranslateTree(dtree) {
            entry.dtree = dtree;
            return translateTree(
                entry
            );
        });
    };

    /**
    * @function
    */
    function translateTree(entry) {
        try {
            //translate the dependency tree and store the result
            var abstractTree = dependencyNotationTranslator(
                [entry.dtree]
            );
            entry.abstractTree = abstractTree;

            return promise.resolve(abstractTree);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
}