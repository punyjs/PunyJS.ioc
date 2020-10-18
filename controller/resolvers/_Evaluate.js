/**
* @factory
*   @dependency errors PunyJS.ioc.Errors
*   @dependency reporter PunyJS.core.log._Reporter
*   @dependency reporter PunyJS.ioc._ProcessDetails
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
    }
    /**
    * A regular expression pattern for parsing global expressions
    * @property
    */
    , EXPR_PATT = /^([A-z$_][A-z0-9$_]+)[ \t\r\n]*((?:\()|(?:[.])|(?:[=]{2,3})|$)/
    ;

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
                new Error(errors.ioc.missing_global)
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
            //parse the evaluate expression
            var match = abstractEntry.expression.match(EXPR_PATT)
            , globalKey
            , exprfunc
            , result
            ;
            if (!match) {
                return Promise.reject(
                    new Error(
                        `${errors.ioc.invalid_evaluate_expression} (${abstractEntry.expression})`
                    )
                );
            }
            //validate the root global key
            globalKey = match[1];
            if (!global.hasOwnProperty(globalKey)) {
                return Promise.reject(
                    new Error(
                        `${errors.ioc.missing_global_property} (${globalKey})`
                    )
                );
            }
            //create a function to evaluate the expression
            exprfunc = Function(
                globalKey
                , `return ${abstractEntry.expression};`
            );
            //execute the function
            result = exprfunc(
                global[globalKey] //pass the single global property
            );

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