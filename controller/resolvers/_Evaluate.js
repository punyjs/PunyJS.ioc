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
    * @constants
    */
    var cnsts = {
        "nodeModuleError": /Error: Cannot find module '(.*)'/
        , "moduleErrorMsg": "A required node module is missing "
    };

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
            return evaluateExpression(
                global
                , abstractEntry
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

    /**
    * Attempts to evaluate the expression, hiding the globals for security
    * @function
    */
    function evaluateExpression(global, abstractEntry) {
        try {
            var funcParamNames =
                Object.keys(global)
                .concat(`return ${abstractEntry.expression};`)
            , funcArgs = Object.values(global)
            //Construct a Function to evaluate the expression
            , result =
                Function.apply(null, funcParamNames)
                .apply(null, funcArgs);

            return Promise.resolve(result);
        }
        catch(ex) {
            var match =
                ex.toString()
                .match(cnsts.nodeModuleError);

            if (!!match) {
                ex = new Error(
                    `${cnsts.moduleErrorMsg} '${match[1]}'`
                );
            }

            return Promise.reject(ex);
        }
    }
}