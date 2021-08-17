# rbxts-transformer-fs

**rbxts-transformer-ts** is a transformer designed for roblox-ts.

It allows to use or mainpulate project filesystem and do the transformer its thing.

## Warning

_If you installed rbxts-transformer-path, please replace it with rbxts-transformer-ts and good to go!_

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
	-- should print `My password is 1234`
*/
```
