/**
* Reads a single dependency notation entry and determines the type and namespace.
* @factory
*   @singleton
* @naming
*   @alias dependencyNotationTranslator
* @feature Dependency Notation
*   @rule literal Any value that doesn't match the following
*   @rule eval A single string with a `+` prefix
*   @rule concrete A single string with a `:` prefix
*   @rule abstract A single string with a `.` prefix
*   @rule method A literal/eval/concrete/abstract string, which references an object, followed by an abstract string which points to a method on the object
*   @rule factory An abstract or concrete entry, followed by an array, optionally followed by either an object or boolean.
*   @rule branch
*   @rule union
*/
function _DependencyNotationTranslator(
    dependencyNotationEntryTyper
    , errors
) {
    var cnsts = {
        /**
        * A collection of templates to use when creating the entry output
        * @property
        * @private
        * @constant
        */
        "entryTemplates": {
            "method": {
                "type": "method"
                , "namespace": null
                , "method": null
                , "options": {
                    "bind": {}
                }
                , "isResolved": false
                , "value": null
            }
            , "factory": {
                "type": "factory"
                , "namespace": null
                , "dependencies": []
                , "options": {}
                , "isResolved": false
                , "value": undefined
            }
            , "eval": {
                "type": "eval"
                , "expression": null
                , "options": {}
                , "isResolved": false
                , "value": undefined
            }
            , "concrete": {
                "type": "concrete"
                , "namespace": null
                , "options": {}
                , "isResolved": false
                , "value": undefined
            }
            , "abstract": {
                "type": "abstract"
                , "namespace": null
                , "options": {}
                , "isResolved": false
                , "value": undefined
            }
            , "branch": {
                "type": "branch"
                , "members": {}
                , "options": {}
                , "isResolved": false
                , "value": undefined
            }
            , "union": {
                "type": "union"
                , "members": []
                , "options": {}
                , "isResolved": false
                , "value": undefined
            }
            , "literal": {
                "type": "literal"
                , "isResolved": false
                , "value": undefined
            }
        }
    }
    /**
    * A regex pattern for namespace prefixes
    * @property
    * @private
    */
    , PRFX_PATT = /^[.:+]/
    /**
    * A pointer to the worker function
    * @property
    * @pivate
    */
    , self;

    /**
    * @worker
    *   @param {any} extEntry An external value, either a literal or dependency
    *   notation.
    */
    return self = function DependencyNotationTranslator(extEntry) {
        //get the type of entry this is based on the extEntry layout
        var entryType = dependencyNotationEntryTyper(
            extEntry
        )
        //creste a copy of the template
        , entry = JSON.parse(
            JSON.stringify(
                cnsts.entryTemplates[entryType]
            )
        );
        //add type specific data
        updateEntry(
            extEntry
            , entryType
            , entry
        );

        return entry;
    };

    /**
    * Updates the entry with the type specific data
    * @function
    */
    function updateEntry(extEntry, entryType, entry) {
        switch(entryType) {
            case "method":
                entry.namespace = `${extEntry[0].replace(PRFX_PATT, "")}${extEntry[1]}`;
                entry.ownerEntry = self([extEntry[0]]);
                entry.methodName = extEntry[1].replace(PRFX_PATT, "");
                apply(extEntry[2], entry.options);
                break;
            case "factory":
                //the underscore prefix on the factory namespace changes the name enough so the factoryEntry and entry namespaces don't collide
                entry.namespace = `_${extEntry[0].replace(PRFX_PATT, "")}`;
                entry.factoryEntry = self([extEntry[0]]);
                entry.dependencies = translateDependencies(extEntry[1]);
                apply(extEntry[2], entry.factoryEntry.options);
                break;
            case "eval":
                entry.expression = extEntry[0].replace(PRFX_PATT, "");
                entry.namespace = entry.expression;
                apply(extEntry[1], entry.options);
                break;
            case "concrete":
                entry.namespace = extEntry[0].replace(PRFX_PATT, "");
                apply(extEntry[1], entry.options);
                break;
            case "abstract":
                entry.namespace = extEntry[0].replace(PRFX_PATT, "");
                apply(extEntry[1], entry.options);
                break;
            case "branch":
                entry.members = translateProperties(extEntry[0]);
                apply(extEntry[1], entry.options);
                break;
            case "union":
                //the last member is the options if it's an object
                if (typeof extEntry[extEntry.length - 1] === "object") {
                    apply(extEntry.pop(), entry.options);
                }
                entry.members = translateMembers(extEntry);
                break;
            case "literal":
                entry.value = extEntry;
        }
        //if there are bind args then translate those
        if (!!entry.options
            && !!entry.options.bind
            && !!entry.options.bind.arguments)
            {
                entry.options.bind.arguments =
                    translateBindArgs(entry.options.bind.arguments);
            }
    }
    /**
    * Loops through the dependencies array, runs the translator for each
    * dependency, and returns an array of translated dependencies.
    * @function
    */
    function translateDependencies(depends) {
        if (!Array.isArray(depends)) {
            throw new Error(errors.ioc.invalid_dependencies);
        }
        return depends.map(function mapDepend(depend) {
            return self(depend);
        });
    }
    /**
    * Loops through the properties on the members object, translating each
    * @function
    */
    function translateProperties(extProperties) {
        if (typeof extProperties !== "object") {
            throw new Error(errors.ioc.invalid_members);
        }
        var members = {};

        Object.keys(extProperties)
            .forEach(function forEachKey(key) {
                members[key] = self(extProperties[key]);
            });

        return members;
    }
    /**
    * Loops through the properties on the args object, translating each
    * @function
    */
    function translateBindArgs(bindArgs) {
        if (typeof bindArgs !== "object") {
            throw new Error(errors.ioc.invalid_members);
        }
        var argEntries = {};

        Object.keys(bindArgs)
            .forEach(function forEachKey(key) {
                argEntries[key] = self(bindArgs[key]);
            });

        return argEntries;
    }
    /**
    * @function
    */
    function translateMembers(extMembers) {
        return extMembers.map(function forEachMember(member) {
            return self([member]);
        });
    }
    /**
    * Applies properties from the source to the target
    * @function
    */
    function apply(source, target) {
        if (!!source && typeof source === "object") {
            Object.keys(source)
                .forEach(function forEachKey(key) {
                    target[key] = source[key];
                });
        }
    }
}