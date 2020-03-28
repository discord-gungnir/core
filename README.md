# Gungnir Discord.js

Even though this package is compatible with JavaScript, it's designed to be used in TypeScript.\
As such, all code examples will be in TypeScript.

## Creating your client
```ts
import { GungnirClient } from "@gungnir/core";

const client = new GungnirClient({
  token: "YOUR_TOKEN", prefix: "/"
});

client.login();
```

## Adding new commands
```ts
import type { Message } from "discord.js";
import { Command, defineCommand } from "@gungnir/core";

@defineCommand("mycommand")
export class MyCommand extends Command {
  public run(message: Message) {
    return msg.channel.send("My commands works!")
  }
}
```

You should then be able to call your command using `/mycommand`.

## Command arguments
```ts
import type { Message, GuildMember } from "discord.js";
import { Command, defineCommand, guildOnly } from "@gungnir/core";

@defineCommand("handsome")
@guildOnly() @usage("member")
export class HandsomeCommand extends Command {
  public run(message: Message, member: GuildMember) {
    return msg.channel.send(`${member} is handsome!`);
  }
}
```

The `@usage` decorator is used to define what arguments the command uses.\
(you can also see the `@guildOnly` decorator) 
