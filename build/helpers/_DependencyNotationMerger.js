/**
* Merges 2 or more dependency trees, in dependency notation, and returns a new, combined dependency tree in dependency notation.
* @factory
*/
function _DependencyNotationMerger(
    promise
    , utils_merge
    , utils_copy
    , buildHelpers_trujs_ioc_dependencyNotationEntryTyper
    , errors
) {
    /**
    * @alias
    */
    var dependencyNotationEntryTyper = buildHelpers_trujs_ioc_dependencyNotationEntryTyper;

    /**
    * @worker
    *   @param {array} dtrees An array of dependency trees, in dependency notation, that will be merged
    */
    return function _DependencyNotationMerger(dtrees, config) {
        return new promise(function thenMergeTrees(resolve, reject) {
            try {
                resolve(
                    combineTrees(dtrees, config)
                );
            }
            catch(ex) {
                reject(ex);
            }
        });
    };

    /**
    * Converts the loaded dtrees and merges them
    * @function
    */
    function combineTrees(trees, config) {
        //pop the last tree off, it's the project tree, save it for last
        var projectTree = trees.pop()
        //create the combined tree, starting with the first member of the array
        , combinedTree = trees.shift();

        //loop through the trees, combining each tree
        trees.forEach(function forEachTree(nextTree) {
            combinedTree = mergeTrees(
                combinedTree
                , nextTree
            );
        });

        //add the project tree
        combinedTree = mergeTrees(
            combinedTree
            , projectTree
        );

        return combinedTree;
    }
    /**
    * Merges trees A and B, traversing branches
    * @function
    */
    function mergeTrees(treeA, treeB) {
        var merged = utils_copy(treeA);

        //loop through treeB and merge any shared property names
        Object.keys(treeB)
        .forEach(function forEachKey(key) {
            var entryA = treeA[key]
            , entryB = treeB[key]
            , entryBType = dependencyNotationEntryTyper(
                entryB
            );
            //if tree A doesn't have a property {key} then no need to merge it
            if (!treeA.hasOwnProperty(key)) {
                merged[key] = entryB;
                return;
            }
            //if the entries are branches, the call this recursively
            if (entryBType === "branch") {
                merged[key] = [
                    mergeTrees(
                        entryA[0]
                        , entryB[0]
                    )
                ];
            }
            //otherwise combine the entries
            else {
                merged[key] = mergeEntries(
                    entryA
                    , entryB
                );
            }
        });

        return merged;
    }
    /**
    * Merges 2 non-branch tree entries. Throws unable_merge if the 2 entries can't be merged.
    * @function
    */
    function mergeEntries(entryA, entryB) {
        //create an artifact for checking the types for the 2 entries
        var types = [
            dependencyNotationEntryTyper(
                entryA
            )
            , dependencyNotationEntryTyper(
                entryB
            )
        ]
        .sort()
        .join(",");

        //if the entries are factory entries, merge the arguments
        if (types === "factory,factory") {
            return mergeFactories(
                entryA
                , entryB
            );
        }

        //if the entries are both literals
        if (types === "literal,literal") {
            //if the literals are both objects, merge them
            if (
                typeof entryA === "object"
                && typeof entryB === "object"
            ) {
                //create a new entry
                return {
                    "value": utils_merge(
                        entryB
                        , entryA
                    )
                };
            }
            //if the literals are not both objects, overwrite with the B value
            return entryB;
        }

        //if the entries are union
        if (
            types === "union,union"
            || types === "concrete,union"
        ) {
            return mergeUnion(
                entryA
                , entryB
            );
        }

        //nothing else can be merged
        throw new Error(
            `${errors.unable_merge} (${types})`
        );
    }
    /**
    * Merges the arguments from factory A to factory B. Throws mismatched_factories if the factory values don't match
    * @function
    */
    function mergeFactories(factA, factB) {
        var factAns = factA[0]
        , factAdeps = factA[1]
        , factBns = factB[0]
        , factBdeps = factB[1]
        , merged;

        //check the namespaces
        if (factAns !== factBns) {
            throw new Error(
                `${errors.mismatched_factories} (${factAns},${factBns})`
            );
        }

        //start with a copy of A
        merged = utils_copy(
            factA
        );

        //merge entry B's dependencies with A's
        factBdeps
        .forEach(function forEachDep(dep, indx) {
            if (dep !== "\b") {
                merged[1][indx] = dep;
            }
        });

        return merged;
    }
    /**
    * Add's entryB's members to entryA, as well as merge entryB's options with entryA's options.
    * @function
    */
    function mergeUnion(entryA, entryB) {
        //remove the options off the end of the union entry, if exists
        var entryAops = typeof entryA[entryA.length - 1] === "object"
            && entryA.pop()
        , entryBops = typeof entryB[entryB.length - 1] === "object"
            && entryB.pop()
        //merge the members (minus the options)
        , merged = entryA.concat(entryB)
        ;
        //merge the options
        if (!!entryAops) {
            if (!!entryBops) {
                merged.push(
                    utils_merge(
                        entryBops
                        , entryAops
                    )
                );
            }
            else {
                merged.push(
                    entryAops
                );
            }
        }
        else if (!!entryBops) {
            merged.push(
                entryBops
            );
        }

        return merged;
    }
}