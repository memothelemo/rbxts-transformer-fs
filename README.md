# rbxts-transformer-fs

## Info

**rbxts-transformer-fs** is a transformer designed for roblox-ts.

It allows to convert from any file system related functions to an expected functionality offered with this transformer.

## Usage

```ts
import { Players } from "@rbxts/services";
import { $readJSON } from "rbxts-transformer-fs";

const secrets = $readJSON<{
  token: string;
  password: number;
}>("secrets.json");

print(`My password is ${secrets.password}`);

/*
	-- this will turn to:
	local secrets = {
		token = "0_0",
		password = "1234",
	}
	print("My password is " .. secrets.password)
	-- should print: My password is 1234
*/
```
