## Source List

The `source.list` maps namespaces to endpoints. A namespace can represent a dependency or a collection of dependencies. An endpoint is represented by a URI and fulfils the request for the namespace, including any other dependencies that are required by the namespace.

The `source.list` is an array of `iSource`, listed in order of precedence.

###### iSource

The `iSource` interface describes an endpoint at `endpointUri`, which uses `type` of communication, and resolves dependencies within `namespace`.

| Property              | Description                                          |
|-----------------------|------------------------------------------------------|
| endpointType          | The type of endpoint; http, socket, file             |
| endpointUri           | The URI of the endpoint                              |
| namepace              | The fq namespace that is served by this endpoint     |
| description           | An optional description for the `iSource` entry      |

###### Examples
```json
[
    {
        "endpointType": "http"
        , "endpointUri": "https://trujs,geekshake.com"
        , "namespace": "F80F:TruJS.gui.comps.layout.1.1"
        , "description": "Use version 1.1 for anything in the TruJS.gui.comps.layout namespace."
    }
    , {
        "endpointType": "socket"
        , "endpointUri": "https://trujs,geekshake.com"
        , "namespace": "F80F:TruJS.gui.comps.1.0+3008"
        , "description": "Use version 1.0 at build 3008 for the rest of the TruJS.gui.comps namespace."
    }
    , {
        "endpointType": "http"
        , "endpointUri": "https://myapp.company.fake"
        , "namespace": "00:MyApp.gui"
        , "description": "Use the current version of MyApp for the MyApp.gui namespace."
    }
]
```