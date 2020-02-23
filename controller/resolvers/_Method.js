/**
* @factory
*   @dependency errors TruJS.ioc.Errors
*   @dependency reporter TruJS.core.log._Reporter
*   @dependency reporter TruJS.ioc._ProcessDetails
* @naming
*   @alias resolvers.method
*/
function _Method(
    errors
    , reporter
    , processDetails
) {

    /**
    * @worker
    *   @param {object} abstractEntry An instance of {iAbstractEntry}
    *   @param {function} dependencyResolver
    *   @param {object} parentProcDetails An instance of {iProcessDetails}
    *   @returns {any} The value of the resolved owner entry dependency
    *   @async
    *   @sideeffect {update} abstractEntry.options.bind
    */
    return function Method(
        abstractEntry
        , dependencyResolver
        , procDetails
    ) {
        return Promise.resolve()
        .then(function thenStartMethod() {
            /// LOGGING
            reporter.ioc(
                `Resolve Method Owner: ${abstractEntry.ownerEntry.namespace}`
                , procDetails
            );
            /// END LOGGING
            //resolve the owner abstract entry
            return dependencyResolver(
                abstractEntry.ownerEntry
                , procDetails
            );
        })
        //validate the owner is an object
        .then(function thenValidateOwner(ownerResolvedEntry) {
            return validateOwnerAndMethod(
                ownerResolvedEntry
                , abstractEntry.methodName
            );
        })
        //resolve any bind arguments
        .then(function thenResolveBindArgs(ownerResolvedEntry) {
            return resolveBindArguments(
                abstractEntry
                , ownerResolvedEntry
                , procDetails
            );
        })
        //bind the method name to the owner
        .then(function thenBindFunc(argsAndOwner) {
            return bindOwnerToMethod(
                abstractEntry
                , argsAndOwner
            );
        })
        .then(function thenFinishBind(resolvedEntry) {
            /// LOGGING
            reporter.ioc(
                `Method Resolved: ${abstractEntry.namespace}`
                , procDetails
            );
            /// END LOGGING
            return Promise.resolve(resolvedEntry);
        });
    };

    /**
    * Validates that the resolved owner value is an object
    * @function
    *   @async
    */
    function validateOwnerAndMethod(ownerResolvedEntry, methodName) {
        var owner = ownerResolvedEntry.value
        , method = owner[methodName];

        if (typeof owner !== "object") {
            return Promise.reject(
                new Error(`${errors.invalid_owner} (${ownerResolvedEntry.type})`)
            );
        }

        if (typeof method !== "function") {
            return Promise.reject(
                new Error(`${errors.invalid_method} (${typeof method})`)
            );
        }

        return Promise.resolve(ownerResolvedEntry);
    }
    /**
    * Resolves any bind arguments
    * @function
    *   @async
    */
    function resolveBindArguments(abstractEntry, ownerResolvedEntry, procDetails) {
        var args = abstractEntry.options.bind.args || []
        , procs = [];

        args.forEach(function forEachArg(argEntry, indx) {
            /// LOGGING
            reporter.ioc(
                `Resolve Method Bind Arg: ${argEntry.namespace}`
                , procDetails
            );
            /// END LOGGING
            procs[indx] = dependencyResolver(
                argEntry
                , procDetails
            );
        });

        //add the ownerEntry to the tail of the argument processes
        procs.push(ownerResolvedEntry);

        return Promise.all(procs);
    }
    /**
    * Binds the owner to the method and returns an instance of {iResolvedEntry}
    * @function
    *   @async
    */
    function bindOwnerToMethod(abstractEntry, argsAndOwner) {
        var owner = argsAndOwner[argsAndOwner.length - 1].value
        , method = owner[abstractEntry.methodName]
        ;

        if (typeof method !== "function") {
            return Promise.reject(
                new Error(`${errors.invalid_method} (${typeof method})`)
            );
        }

        return Promise.resolve({
            "value": Function.prototype.bind.apply(method, argsAndOwner)
        });
    }
}