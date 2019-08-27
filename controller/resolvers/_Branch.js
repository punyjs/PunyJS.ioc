/**
* @factory
*   @dependency errors TruJS.ioc.Errors
*   @dependency reporter TruJS.core.log._Reporter
*   @dependency reporter TruJS.ioc._ProcessDetails
* @naming
*   @alias resolvers.branch
*/
function _Branch (
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
    return function Branch(
        abstractEntry
        , dependencyResolver
        , procDetails
    ) {
        return Promise.resolve()
        .then(function thenStartBranch() {
            /// LOGGING
            reporter.ioc(
                `Resolve Branch: ${abstractEntry.name}`
                , procDetails
            );
            /// END LOGGING
            //resolve each member of the branch
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
        //update the abstractEntry value
        .then(function thenUpdateBranch(results) {
            var branch = {};
            /// LOGGING
            reporter.ioc(
                `Branch Resolved: ${abstractEntry.name}`
                , procDetails
            );
            /// END LOGGING
            //add the results to the branch
            Object.keys(abstractEntry.members)
            .forEach(function forEachKey(key, indx) {
                branch[key] = results[indx].value;
            });
            return Promise.resolve({
                "value": branch
            });
        });

        return proc;
    };
}