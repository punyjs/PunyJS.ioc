/**
* The dependency tree generator uses the manifest entry to determine the hierarchy of dpendency trees to load and then merge. The `dtree` property in the entry identifies the absolute path and name of the entry's dependency tree. The `base` property, optional, is an array of external dependnecy trees that will be merged. The dependency tree is merged, starting with the first member of the base array through to the last and then ending with then manifest entry's dtree; overwriting any properties that share the same name.
* @factory
* @feature base-notation
*   Base Notation is the path, in dot notation, from the source directory, that points to a dependency tree
*/
function _DependencyTreeGenerator(
    promise
    , is_array
    , workspacePath
    , defaults
) {
    /**
    * A reg exp pattern for replaceing the dots in a namespace
    * @property
    */
    var DOT_PATT = /[.]/g;

    /**
    * @worker
    */
    return function DependencyTreeGenerator(entry) {
        //create the list of dependency trees to load
        return new promise(
            createLoadList.bind(null, entry)
        )
        //then load the trees
        .then(function thenLoadTrees(paths) {
            console.log(paths);

            return promise.resolve();
        })
        //then combine the trees into one
        .then(function thenCombineTrees() {
            return promise.resolve();
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
            , rootPath = `${workspacePath}/${defaults.sourceDirectory}`
            , paths
            ;

            //ensure there is a bes
            if (!base) {
                base = [];
            }
            //ensure the base is an array
            if (!is_array(base)) {
                base = [base];
            }
            //add the dtree to the base
            base.push(
                `${dtree}`
            );

            //loop through the base array and turn each member into a fq path
            paths = base.map(function mapBase(val) {
                return `${rootPath}/${val.replace(DOT_PATT,"/")}.json`
            });

            resolve(paths);
        }
        catch(ex) {
            reject(ex);
        }
    }
}