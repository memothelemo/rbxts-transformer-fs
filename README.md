# rbxts-transformer-path

A transformer designed for roblox-ts that allows to convert from filesystem project paths to pure Roblox tree structure (rojo required)

```ts
import { $path } from "rbxts-transformer-path";

const scripts = $path<Folder>("src/server/scripts");

function getDescendantsWhichIsA<T extends keyof Instances>(
  parent: Instance,
  className: T
) {
  return parent
    .GetDescendants()
    .filter((object): object is Instances[T] => object.IsA(className));
}

getDescendantsWhichIsA(scripts, "ModuleScript").forEach((script) =>
  require(script)
);
```

## Warning

- ~~Client-side paths are not tested yet but planned in the next version~~.
- ~~It is designed for games, not plugins~~.
- It is a bit unstable and unhelpful to errors and debugging
- It is slow because of function generator (_I don't know how to optimize this_)
- It defaults to `default.project.json`

## Installation

1. Run this command below:

```bash
npm i rbxts-transformer-path
```

2. Head over to the `tsconfig.json` on your recent project and put the following under compilerOptions:

```json
"plugins": [
	{ "transform": "rbxts-transformer-path" }
]
```
