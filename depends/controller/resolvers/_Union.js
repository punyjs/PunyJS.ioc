/**
* @factory
*   @dependency errors TruJS.ioc.Errors
*   @dependency reporter TruJS.core.log._Reporter
*   @dependency reporter TruJS.ioc._ProcessDetails
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
            return unionResults(abstractEntry, results);
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
    function unionResults(abstractEntry, results) {
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
                );
            });

            return Promise.resolve(union);
        }
        catch(ex) {
            return Promise.reject(ex);
        }
    }
    /**
    *
    * @function
    */
    function unionResult(abstractEntry, result, union) {
        //loop through the result keys
        Object.keys(result)
        .forEach(function forEachKey(key) {
            if (!union.hasOwnProperty(key)) {
                union[key] = result[key];
            }
            else {
                //do we throw an error if there is a conflict
                if (abstractEntry.options.conflictResolution === "error") {
                    throw new Error(
                        `${errors.union_conflict} (${key})`
                    );
                }
            }
        });
    }
}