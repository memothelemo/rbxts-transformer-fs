import fs from "rbxts-transformer-fs";

// function findInstanceFromPath(entries: string[], exact: boolean) {
//   let current: Instance | undefined = game;

//   // Only applicable for entries starting with ReplicatedStorage (on clients)
//   if (game.GetService("RunService").IsClient() && !game.IsLoaded()) {
//     // We need to wait until the game is fully initialized
//     game.Loaded.Wait();
//   }

//   if (game.GetService("RunService").IsClient() && !exact) {
//     const player = game.GetService("Players").LocalPlayer;
//     let modified = true;
//     switch (entries[0]) {
//       case "StarterPlayer":
//         current = player;
//         switch (entries[1]) {
//           case "StarterCharacterScripts":
//             const character = player.Character;
//             if (!character) return;
//             current = character;
//           case "StarterPlayerScripts":
//             const scripts = player.FindFirstChild("PlayerScripts");
//             if (!scripts) return;
//             current = scripts;
//             break;
//           default:
//             return;
//         }
//         entries.remove(0);
//         break;
//       case "StarterGui":
//         const playerGui = player.FindFirstChild("PlayerGui");
//         if (!playerGui) return;
//         current = playerGui;
//         break;
//       case "StarterPack":
//         const backpack = player.FindFirstChild("Backpack");
//         if (!backpack) return;
//         current = backpack;
//       default:
//         modified = false;
//         break;
//     }
//     if (modified) entries.remove(0);
//   }

//   while (entries.size() > 0 && current !== undefined) {
//     current = current.FindFirstChild(entries.remove(0)!);
//   }

//   return current;
// }

// print(fs["$CURRENT_FILE_NAME"]);
// print(fs.$CURRENT_FILE_NAME);

// print(fs.$hashFile("test.txt", "sha1"));

// fs.$readFile("default.project.json");
// fs.$readFile("default.project.json");

// fs.$readFileOpt("hello");
// fs.$readFileOpt("hello");

// fs.$expectFile(".");
// fs.$expectDir("out");
// fs.$expectPath(".");

// fs.$fileExists(".");
// fs.$dirExists(".");
// fs.$pathExists(".");

// fs.$instance<Instance>("src/client/test.ts", true);

// // Preload
// // const _1 = game.GetService("ServerStorage").FindFirstChild("Hello")?.FindFirstChild("World");

// // fs.$waitForInstance("src/server/main.server.ts", undefined, false);

// // fs.$findInstance("src/server/main.server.ts");

// const instance = findInstanceFromPath(["ServerScriptService", "TS"], false);
// print(instance);
