## Namespace

The namespace is a delimited string that represents the path to a specific dependency, within in a dependency tree, having a specific version, with a modifier at ID.

#### Specification

| Expression              | Equals                                            |
| --                      | --                                                |
| *namespace*             | `[ owner ":" ]` `local namespace` `[ "," ID ]`          |
| owner                   | `8hexOctet` (HEX QWORD)                             |
| >  hexOctet              | `hexDigit` `hexDigit`                                |
| > hexDigit              | `/^[0-9A-F]$/`                                    |
| local&nbsp;namespace    | `part` `[ 1*( "." part ) ]` `[ ( "." version ) / ( "#" commit hash ) ]` |
| > part                  | `/^[A-z][0-9A-z_.]*$/`                              |
| > version               | `major` `"." minor` `"." patch` `[ "-" prerelease ]` `[ "+" build ]` |
| >> major                | `/^[0-9]+$/`<br>"...  if any backwards incompatible changes are introduced" |
| >> minor                | `/^[0-9]+$/`<br>"... if new, backwards compatible functionality is introduced" |
| >> patch                | `/^[0-9]+$/`<br>"... if only backwards compatible bug fixes are introduced" |
| >> build                | `/^[0-9]*$/`<br>A number representing the build increment |
| >> prerelease           | `/^[0-9A-z_.]/`<br>A prerelease identifier |
| > commit hash           | `20hexOctet` |
| ID                      | `8hexOctet` (HEX QWORD) |

#### Description

There are four segments in a `fully qualified` namespace.  

* Owner
* Local Namespace
* Version
* ID

The **Owner** identifies the entity that owns the dependency; i.e. the owner of the dependency identified by the rest of the namespace. In the internet, this provides routing details for CRUD operations as well as accessibility settings and other meta data.

The **Local Namespace** represents a physical dependency; code, images, text, data, etc... For some dependencies this provides a model (or blueprint) that can be used with a modifier; e.g. it can be a data model with default values.

The **Version** identifies the version of the dependency at **Local Namespace** to use. In the case of a blueprint, this identifies the blueprint dependency.

The **ID** is used to identify a modifier for the dependency. A union is performed between the dependency blueprint and the modifier. A modifier can be used across versions for the same **Local Namespace**.

***

#### Quick Samples

Reference a dependency  
`MyApp.gui.User.model` <-- current version of the dependency  
`MyApp.gui.User.model.1.3.0` <-- version 1.3.0  

Reference a dependency and a modifier  
`MyApp.gui.User.model,3EA1` <-- modifier's namespace  
`MyApp.gui.User.model` <-- dependency's namespace  

Reference the universal version of the dependency  
`0F5E:MyApp.gui.User.model,3EA1` <-- universal namespace  
`MyApp.gui.User.model,3EA1` <-- dependency namespace at `0F5E`  
`MyApp.gui.User.model` <-- dependency model/blueprint namespace  

#### In-Depth Samples

`F80F:MyApp.gui.Login.record.1.3.0-rodger+3456,3DE50`
* Owner     -> F80F
* Local     -> MyApp.gui.Login.model
* Version   -> 1.3.0-rodger+3456
* ID        -> 3DE50  

> The owner `F80F`, owns the record at `MyApp.gui.Login.model.1.3.0-rodger+3456,3DE50`. The local namespace `MyApp.gui.Login.model` points to a dependency that, in this case, represents a data model definition. The version `1.3.0-rodger+3456` represents a version of the local namespace `MyApp.gui.Login.model`. The ID `3DE50` is the unique identifier that points to the modifier for the `MyApp.gui.Login.model` model. The modifier is used to identify a unique implementation of the `MyApp.gui.Login.model` dependency.


`MyApp.gui.User.1.3.0`

* Owner     -> 00 (default, not routable)
* Local     -> MyApp.gui.User
* Version   -> 1.3.0
* ID        -> 00

> In this example, we are referencing the original dependency `MyApp.gui.User` at version `1.3.0`. There isn't an ID because this is a definition or a single dimension dependency; i.e. it's doesn't use a modifier.


`F80F:MyApp.gui.Login.record.1.3.0+3892,3DE50`
* Owner     -> 00 (default, not routable)
* Local     -> MyApp.gui.Login.model
* Version   -> 1.3.0+3892
* ID        -> 3DE50

> In this example, the local namespace `MyApp.gui.Login.model` dependency is at version `1.3.0+3892` and modified with record `3DE50`

***

#### Locally Qualified Namespace

A locally qualified namespace does not have an owner ID and is used within a private ecosystem; the `local namespace` prefix (i.e. the first word) should be publicly unique if the dependency is expected to operate in the universe.

The local namespace begins with a pascal-case namespace root. Each branch is camel-case. The end node is pascal-case; `Root.branch.inner.MyDependency`.

#### Universally Qualified Namespace

A universally qualified namespace is unique within the universe; using the *owner id* and *root prefix*.

###### Owner

The owner is distinct 64 bit QWORD representing a specific entity within an ecosystem.

#### Versioned Namespace

A versioned namespace is suffixed with a version; preferably using semantic versioning techniques. The end result creates an environment in which all versions of a local namespace can exist at the same time; if listed and sorted descending, the top most member should be the most current version (with a possible exception with pre-release versions).