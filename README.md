**WARNING**:
I reworked and refactored the codebase for `2.0.0` release with most of deprecated stuff from
TypeScript will be replaced with replacement ones.

Check the [refactor-2.0](https://github.com/memothelemo/rbxts-transformer-fs/tree/refactor-2.0) branch
if you want to take a look of it.

# rbxts-transformer-fs

**rbxts-transformer-fs** is a transformer designed for roblox-ts.

It allows to convert from any file system related functions to an expected functionality offered with this transformer.

## Installation

1. Open your recent roblox-ts project

2. Install the transformer:

   - Run this line `npm i -D rbxts-transformer-ts` in the command line

3. Configure the transformer:

   - Go to the `tsconfig.json` in your preferred text editor and put the following under compilerOptions:

   ```json
   "plugins": [
   	{ "transform": "rbxts-transformer-fs" }
   ]
   ```

4. You're good to go!

## Warning

- This transformer is a bit unstable at this stage. The owner of this package cannot ensure the reliability of this transformer (especially the `$json` function)

## Migrating from rbxts-transformer-path

See [MIGRATION](MIGRATION.md)
