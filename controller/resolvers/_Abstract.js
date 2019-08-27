/**
* @factory
*   @dependency errors TruJS.ioc.Errors
*   @dependency reporter TruJS.core.log._Reporter
*   @dependency reporter TruJS.ioc._ProcessDetails
* @naming
*   @alias resolvers.abstract
*/
function _Abstract(
    errors
    , reporter
    , processDetails
) {
    /**
    * Finds an entry in the abstract tree and resolves it
    * @worker
    *   @param {object} abstractEntry An instance of {iAbstractEntry}
    *   @param {object} abstractTree An instance of {iAbstractTree}
    *   @param {function} dependencyResolver
    *   @param {object} parentProcDetails An instance of {iProcessDetails}
    *   @returns {any} The value of the resolved dependency
    *   @async
    */
    return function Abstract(
        abstractEntry
        , abstractTree
        , dependencyResolver
        , procDetails
    ) {
        return Promise.resolve()
        .then(function thenFindNode() {
            try {
                /// LOGGING
                reporter.ioc(
                    `Resolve Abstract: ${abstractEntry.namespace}`
                    , procDetails
                );
                /// END LOGGING
                return Promise.resolve(
                    abstractTree.findNode(abstractEntry.namespace)
                );
            }
            catch(ex) {
                return Promise.reject(ex);
            }
        })
        .then(function (foundEntry) {
            //if we found the entry, it will always be another abstract entry, so resolve that
            if (!!foundEntry) {
                /// LOGGING
                reporter.ioc(
                    `Abstract Resolved: ${abstractEntry.namespace} to ${foundEntry.type}-${foundEntry.namespace || foundEntry.methodName || foundEntry.expression && ("{" + foundEntry.expression + "}") || foundEntry.name}`
                    , procDetails
                );
                /// END LOGGING
                return dependencyResolver(
                    foundEntry
                    , procDetails
                );
            }
            //if we made it here then the abstract entry doesn't exist, bad news
            return Promise.reject(
                new Error(
                    `${errors.missing_abstract_namespace} ("${abstractEntry.namespace}")`
                )
            );
        });
    };
}