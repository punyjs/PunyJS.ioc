/**
* @factory
*   @dependency reporter PunyJS.core.log._Reporter
*   @dependency reporter PunyJS.ioc._ProcessDetails
* @naming
*   @alias resolvers.literal
*/
function _Literal(
    reporter
    , processDetails
) {

    /**
    * @worker
    */
    return function Literal(
        abstractEntry
        , procDetails
    ) {
        return Promise.resolve()
        //asyncronously resolve the literal
        .then(function thenResolveLiteral() {
            /// LOGGING
            reporter.ioc(
                `Resolve Literal: ${abstractEntry.namespace || abstractEntry.name}`
                , procDetails
            );
            /// END LOGGING
            return Promise.resolve(abstractEntry.value);
        })
        //report that the literal has been resolved
        .then(function thenReportFinish(value) {
            /// LOGGING
            reporter.ioc(
                `Literal resolved: ${abstractEntry.namespace || abstractEntry.name} [${typeof value}]`
                , procDetails
            );
            /// END LOGGING
            return Promise.resolve({
                "value": value
            });
        });
    };
}