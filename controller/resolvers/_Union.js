/**
* @factory
*   @dependency errors PunyJS.ioc.Errors
*   @dependency reporter PunyJS.core.log._Reporter
*   @dependency reporter PunyJS.core.log._ProcessDetails
* @naming
*   @alias resolvers.union
*/
function _Union (
    errors
    , reporter
    , processDetails
) {

    /**
    * @worker
    *   @param {object} abstractEntry An instance of {iAbstractEntry}
    *   @param {function} dependencyResolver
    *   @param {object} parentProcDetails An instance of {iProcessDetails}
    *   @returns {any} The value of the resolved dependency
    *   @async
    */
    return function Union(
        abstractEntry
        , dependencyResolver
        , procDetails
    ) {
        return Promise.resolve()
        .then(function thenStartUnion() {
            /// LOGGING
            reporter.ioc(
                `Resolve Union: ${abstractEntry.name}`
                , procDetails
            );
            /// END LOGGING
            //resolve each member of the union
            var procs =
                Object.keys(abstractEntry.members)
                .map(function mapKey(key) {
                    var memberEntry = abstractEntry.members[key];
                    memberEntry.name = key;
                    return dependencyResolver(
                        memberEntry
                        , procDetails
                    );
                });
            //wait for all members to resolve
            return Promise.all(procs)

        })
        //then union objects
        .then(function thenUnionResults(results) {
            return unionResults(abstractEntry, results, procDetails);
        })
        //update the abstractEntry value
        .then(function thenUpdateEntry(union) {
            /// LOGGING
            reporter.ioc(
                `Union Resolved: ${abstractEntry.name}`
                , procDetails
            );
            /// END LOGGING
            return Promise.resolve({
                "value": union
            });
        });
    };

    /**
    * Loops through the results, checking that each is an object, and creates a concatinated object.
    * @function
    */
    function unionResults(abstractEntry, results, procDetails) {
        var union = {};

        try {
            //loop through the results
            results.forEach(function forEachRes(res) {
                //it's got to be an object
                if (typeof res !== "object") {
                    throw new Error (
                        `${errors.invalid_union_object} (${typeof res})`
                    );
                }
                //perform the union
                unionResult(
                    abstractEntry
                    , res.value
                    , union
                    , procDetails
                );
            });

            return Promise.resolve(union);
        }
        catch(ex) {
            return Promise.reject(ex);
        }
    }
    /**
    * Unions the result with the union object
    * @function
    */
    function unionResult(abstractEntry, result, union, procDetails) {
        //loop through the result keys
        Object.keys(result)
        .forEach(function forEachKey(key) {
            //if the property doesn't exist then just set it
            if (!union.hasOwnProperty(key)) {
                union[key] = result[key];
            }
            //otherwise merge the objects
            else {
                union[key] = mergeResults(
                    union[key]
                    , result[key]
                    , key
                    , abstractEntry.options.conflictResolution
                );
            }
        });
    }
    /**
    * Merges the objects, if they are both arrays, then concat, otherwise treat both like objects. Throws `union_conflict` if any property names conflict.
    * @function
    */
    function mergeResults(objA, objB, key, conflictResolution) {
        var val
        //create a string mapping the 2 types
        , types = [
            Array.isArray(objA)
                ? "array"
                : typeof objA
            , Array.isArray(objB)
                ? "array"
                : typeof objB
        ]
        .sort()
        .join(",")
        ;
        //if the property is 2 arrays, concat
        if (types === "array,array") {
            return objA.concat(objB);
        }
        //2 objects or an array and object
        if (
            types === "array,object"
            || types === "object,object"
        ) {
            val = merge(
                objA
                , objB
            );
            //if the merge returns falsey we'll skip on to the error
            if (!!val) {
                return val;
            }
        }
        //if we made it here and we can't have conflicts, throw error
        if (conflictResolution === "error") {
            throw new Error(
                `${errors.union_conflict} (${key})`
            );
        }
        //unless this is a warning, then just report the conflict
        else if (conflictResolution === "warning") {
            reporter.warning(
                `${errors.union_conflict} (${key})`
            );
        }
        //quietly fail and return objA
        return objA;
    }
    /**
    * Merges 2 objects, returning false if 2 properties conflict
    * @function
    */
    function merge(objA, objB) {
        //start with a copy of objectA
        var merged = JSON.parse(JSON.stringify(objA))
        //loop through object B's properties
        , success =
            Object.keys(objB)
            .every(function everyKey(key) {
                if (!merged.hasOwnProperty(key)) {
                    merged[key] = objB[key];
                    return true;
                }
                else if (
                    !!merged[key]
                    && typeof merged[key] === "object"
                    && !!objB[key]
                    && typeof objB[key] === "object"
                ) {
                     merged[key] = merge(
                         merged[key]
                         , objB[key]
                     );
                     return true;
                }
                return false;
            });

        if (success) {
            return merged;
        }

        return false;
    }
}