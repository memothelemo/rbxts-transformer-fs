# `rbxts-transformer-fs`

> [!WARNING]
> _This version of this transformer (`2.0.0-alpha`) is in alpha development stage._

A transformer for [roblox-ts](https://github.com/roblox-ts/roblox-ts) that allows to perform basic read-only file system operations and referencing Roblox instances from project paths with the help of Rojo by using macro functions.

*Some parts of the transformer code are based/copied from [Flamework's transformer](https://github.com/rbxts-flamework/transformer) (licensed under MIT License), including the source code for the type guard generation. I like to thank fireboltofdeath for making this transformer possible since the first version.*

## Table of Contents
- [Usage](#usage)
- [Installation](#installation)
- [Configuration](#configuration)
- [Examples](#examples)
- [Migrating from `rbxts-transformer-path`](#migrating-from-rbxts-transformer-path)

## Usage
```ts
/// <reference types="@rbxts/testez/globals" />
import { $instance } from "rbxts-transformer-fs";
import TestEZ from "@rbxts/testez";

TestEZ.TestBootstrap.run([
    $instance("src/server/specs"),
    $instance("src/shared/specs"),
]);
```
```ts
import { $instance } from "rbxts-transformer-fs";

interface Assets extends Model {
    Characters: Model;
    Furnitures: Model;
}

const Assets = $instance<Assets>("assets/game");
...
```

## Examples

### Basic Usage

Reading files:
```ts
$readFile("my-secrets.txt")
```

Expecting directory exists during build time:
```ts
$expectDir("Packages")
```

Getting instances:
```ts
$instance("src/server/main.server.ts")
$findInstance.exact("assets/game")
$waitForInstance("src/client/components")
```

## Configuration
This transformer supports the following configuration options:
- `disableComments` - Disables comments whenever macros are transformed
```ts
// With `disableComments` disabled:

// ▼ rbxts-transformer-fs: $instance: example.ts ▼
const myInstance = ...;

// With `disabledComments` enabled:
const myInstance = ...;
```

- `hashFileSizeLimit` (number in bytes) - File size limit for `$hashFile`
- `readFileSizeLimit` (number in bytes) - File size limit for `$readFile`

```json
{
    "compilerOptions": {
        // ... other compiler options ...
        "plugins": [
            {
                "transform": "rbxts-transformer-fs",
                // This is where your configuration goes here.
                "disableComments": false,
                "hashFileSizeLimit": 400000,
                "readFileSizeLimit": 400000
            }
        ]
    }
}
```

## Installation
```sh
# NPM
npm i -D rbxts-transformer-fs

# Yarn
yarn add --dev rbxts-transformer-fs

# or your favorite Node package manager will do
```

**Go to the `tsconfig.json` file in your preferred text editor and put the following under the `compilerOptions`**:
```json
{
    "compilerOptions": {
        // ... other compiler options ...
        "plugins": [
            { "transform": "rbxts-transformer-fs" }
        ]
    }
}
```

## Migrating from `rbxts-transformer-path`
See [MIGRATION.md](MIGRATION.md) file.
