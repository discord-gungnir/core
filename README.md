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

## Commands
This is how you create a simple command:
```ts
import type { Message } from "discord.js";
import { Command, defineCommand } from "@gungnir/core";

@defineCommand("mycommand")
export class MyCommand extends Command {
  public run(message: Message) {
    return message.channel.send("My commands works!")
  }
}
```

You should then be able to call your command using `/mycommand`.\
IMPORTANT: you need to add commands BEFORE creating the client.

### Command arguments
The `@usage` decorator is used to define what arguments the command uses.
```ts
import type { Message, GuildMember } from "discord.js";
import { Command, defineCommand, guildOnly } from "@gungnir/core";

@defineCommand("handsome")
@guildOnly() @usage("member")
export class HandsomeCommand extends Command {
  public run(message: Message, member: GuildMember) {
    return message.channel.send(`${member} is handsome!`);
  }
}
```
(note the `@guildOnly` decorator, we'll get to it later)

#### Multiple arguments
Multiple arguments are separated by spaces.
```ts
import type { Message, GuildMember } from "discord.js";
import { Command, defineCommand, guildOnly } from "@gungnir/core";

@defineCommand("age")
@guildOnly() @usage("member natural")
export class AgeCommand extends Command {
  public run(message: Message, member: GuildMember, age: number) {
    return message.channel.send(`${member} is ${age} years old.`);
  }
}
```

#### Optional arguments
An argument is marked as optional by appending `?` after it.
```ts
import type { Message } from "discord.js";
import { Command, defineCommand, guildOnly } from "@gungnir/core";

@defineCommand("roll")
@guildOnly() @usage("natural?")
export class RollCommand extends Command {
  public run(message: Message, size: number = 6) {
    const roll = Math.ceil(Math.random()*size);
    return message.channel.send(`You rolled a ${size}!`);
  }
}
```

#### Rest arguments
An argument is marked as a rest argument by appending `...` before it.
```ts
import type { Message } from "discord.js";
import { Command, defineCommand, guildOnly } from "@gungnir/core";

@defineCommand("say")
@usage("...string")
export class SayCommand extends Command {
  public run(message: Message, text: string) {
    return message.channel.send(text);
  }
}
```

####Multiple argument types
If an argument has multiple arguments, just separate the different types using `|`.
```ts
import type { Message } from "discord.js";
import { Command, defineCommand, guildOnly } from "@gungnir/core";

@defineCommand("hello")
@usage("member|user?")
export class SayCommand extends Command {
  public run(message: Message, user: GuildMember | user = message.author) {
    return message.channel.send(`Hello ${user}!`);
  }
}
```

### Creating subcommands

