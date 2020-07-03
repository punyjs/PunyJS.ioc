/**
* @factory
*   @dependency errors PunyJS.ioc.Errors
*   @dependency reporter PunyJS.core.log._Reporter
*   @dependency reporter PunyJS.ioc._ProcessDetails
* @naming
*   @alias resolvers.bind
*/
function _Bind(
    dependencyNotationTranslator
    , errors
    , reporter
    , processDetails
) {

    /**
    * @worker
    *   @param {object} abstractEntry An instance of {iAbstractEntry}
    *   @param {object} resolvedEntry An instance of {iResolvedEntry}
    *   @param {function} dependencyResolver
    *   @param {object} parentProcDetails An instance of {iProcessDetails}
    *   @async
    *   @sideeffect {insert} resolvedEntry.arguments
    *   @sideeffect {insert} resolvedEntry.target
    *   @sideeffect {insert} resolvedEntry.scope
    *   @sideeffect {update} resolvedEntry.value
    */
    return function Bind(
        abstractEntry
        , resolvedEntry
        , dependencyResolver
        , procDetails
    ) {
        return new Promise(function validateBind(resolve, reject) {
            var bindObj = abstractEntry.options.bind;
            if (typeof bindObj !== "object" || Array.isArray(bindObj)) {
                reject(
                    `${errors.invalid_bind_option} (${abstractEntry.options.bind})`
                );
            }
            resolve();
        })
        .then(function thenStartBind() {
            /// LOGGING
            reporter.ioc(
                `Bind Function: ${abstractEntry.namespace}`
                , procDetails
            );
            /// END LOGGING
            //validate the target of the bind is a function
            return validateTarget(
                resolvedEntry.value
            );
        })
        //resolve the scope
        .then(function thenResolveScope() {
            var scope = abstractEntry.options.bind.scope;
            if (!!scope) {
                /// LOGGING
                reporter.ioc(
                    `Resolve Bind Scope: ${abstractEntry.namespace}`
                    , procDetails
                );
                /// END LOGGING
                //resolve the scope
                return dependencyResolver(
                    dependencyNotationTranslator(
                        scope
                    )
                    , procDetails
                );
            }
            return Promise.resolve(null);
        })
        //resolve any bind arguments
        .then(function thenResolveBindArgs(resolvedScope) {
            resolvedEntry.scope = resolvedScope;
            var args = abstractEntry.options.bind.args;
            if (!!args) {
                /// LOGGING
                reporter.ioc(
                    `Resolve Bind Arguments: ${abstractEntry.namespace}`
                    , procDetails
                );
                /// END LOGGING
                //resolve all of the bind arguments
                return resolveBindArguments(
                    args
                    , dependencyResolver
                    , procDetails
                );
            }
            return Promise.resolve([]);
        })
        //bind the function and resolve the result
        .then(function thenBindTheTarget(resolvedArgs) {
            resolvedEntry.arguments = resolvedArgs;
            return bindTargetToScope(
                abstractEntry
                , resolvedEntry
            );
        })
        //then record the resulting bound function
        .then(function thenUpdate(boundResult) {
            /// LOGGING
            reporter.ioc(
                `Function Bound: ${abstractEntry.namespace}`
                , procDetails
            );
            /// END LOGGING
            //save the target
            resolvedEntry.target = resolvedEntry.value;
            resolvedEntry.value = boundResult;
            return Promise.resolve(resolvedEntry);
        });
    }

    /**
    * Validate the target of the bind operatio nis a function
    * @function
    *   @async
    */
    function validateTarget(fn) {
        //we can't bind a non-function value
        if (typeof fn !== "function") {
            return Promise.reject(
                new Error(`${errors.invalid_bind_func} (${typeof fn})`)
            );
        }
        return Promise.resolve(fn);
    }
    /**
    * The bind arguments should be instances of {iAbstractEntry}
    * @function
    *   @async
    */
    function resolveBindArguments(args, dependencyResolver, procDetails) {
        var procs = [];

        /// LOGGING
        reporter.ioc(
            `Resolve Bind Arguments`
            , procDetails
        );
        /// END LOGGING

        args.forEach(function forEachArg(argEntry, indx) {
            procs[indx] = dependencyResolver(
                argEntry
                , procDetails
            );
        });

        return Promise.all(procs);
    }
    /**
    * Binds the target, resolved entry, to the scope and arguments
    * @function
    *   @async
    */
    function bindTargetToScope(abstractEntry, resolvedEntry) {
        var scope = resolvedEntry.scope
        , args = resolvedEntry.arguments
        , fn = resolvedEntry.value
        ;
        //execute the bind
        try {
            return Promise.resolve(
                fn.bind(scope, args)
            );
        }
        catch(ex) {
            return Promise.resolve(ex);
        }
    }
}