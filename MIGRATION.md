# Migration from rbxts-transformer-path

**MIGRATION TUTORIAL:**

1. Open your roblox-ts project (that has rbxts-transformer-path installed in it)

2. Transformer uninstallation

   - Run this line here: `npm uninstall rbxts-transformer-path` in the command line

3. New transformer installation:
   - Follow this guide here in [README.md](README.md)

**CHANGES:**

Removed features:

- `$root` function is now removed (it does not make sense in this transformer)

Functions to change (arguments are the same thing):

- `$path` => `$instance`

- `$pathWaitFor` => `$instanceWaitFor`
