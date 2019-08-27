/**
* @factory
*   @dependency errors TruJS.ioc.Errors
*   @dependency reporter TruJS.core.log._Reporter
*   @dependency reporter TruJS.ioc._ProcessDetails
* @naming
*   @alias resolvers.evaluate
*/
function _Evaluate(
    errors
    , reporter
    , processDetails
) {

    /**
    * Evaluates the expression within the global scope
    * @worker
    *   @param {object} abstractEntry An instance of {iAbstractEntry}
    *   @param {object} global The global object that contains an eval method
    *   @param {object} parentProcDetails An instance of {iProcessDetails}
    *   @returns {any} The value of the resolved dependency
    *   @async
    */
    return function Evaluate(
        abstractEntry
        , global
        , procDetails
    ) {
        if(!global) {
            return Promise.reject(
                new Error(errors.missing_global)
            );
        }
        return Promise.resolve()
        .then(function thenStartEvaluate() {
            /// LOGGING
            reporter.ioc(
                `Evaluate Expression: {${abstractEntry.expression}}`
                , procDetails
            );
            /// END LOGGING
            var funcParamNames =
                Object.keys(global)
                .concat(`return ${abstractEntry.expression};`)
            , funcArgs = Object.values(global);

            return Promise.resolve(
                Function.apply(null, funcParamNames).apply(null, funcArgs)
            );
        })
        .then(function thenReturnResult(result) {
            /// LOGGING
            reporter.ioc(
                `Expression Evaluated: {${abstractEntry.expression}} [${typeof result}]`
                , procDetails
            );
            /// END LOGGING
            return Promise.resolve({
                "value": result
            });
        });
    };
}