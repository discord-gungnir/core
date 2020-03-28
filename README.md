# Gungnir Discord.js
![Gungnir Discord.js](https://nodei.co/npm/@gungnir/core.png?downloads=true&stars=true)

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
Creating a command is done using the `@defineCommand` decorator.\
If a command has multiple aliases, you can pass an array of names instead.
```ts
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
@defineCommand("roll")
@usage("natural?")
export class RollCommand extends Command {
  public run(message: Message, size: number = 6) {
    const roll = Math.ceil(Math.random()*size);
    return message.channel.send(`You rolled a ${size}!`);
  }
}
```

#### Rest arguments
An argument is marked as a rest argument by appending `...` before it.\
There can only be one rest argument and it needs to be the last argument.
```ts
@defineCommand("say")
@usage("...string")
export class SayCommand extends Command {
  public run(message: Message, text: string) {
    return message.channel.send(text);
  }
}
```

#### Multiple argument types
If an argument has multiple arguments, just separate the different types using `|`.
```ts
@defineCommand("hello")
@usage("member|user?")
export class SayCommand extends Command {
  public run(message: Message, user: GuildMember | User = message.author) {
    return message.channel.send(`Hello ${user}!`);
  }
}
```

### Creating subcommands
Let's say you have 2 commands, one called `increment`, that increments a number by a set value, and another called `increment reset` that resets that number.\
You could create a single command that parses the arguments, but the framework lets you create subcommands very easily.
```ts
let number = 0;

@defineCommand("increment")
@usage("natural?")
export class IncrementCommand extends Command {
  public run(message: Message, increment: number = 1) {
    number += increment;
    return msg.channel.send(`Number: ${number}`);
  }
}

@defineCommand("reset", IncrementCommand)
export class ResetIncrementCommand extends Command {
  public run(message: Message) {
    number = 0;
    return msg.channel.send(`The number has been reset.`);
  }
}
```

## Argument types
When using the `@usage`, you might wonder what the default types are, well there you go:
- string => Default argument type
- number => A number
- integer => An integer
- natural => Natural numbers (all positive integers (excluding 0))
- percentage => Converts a percentage to a number between 0 and 1 (75% will be converted to 0.75)
- user => a Discord.js `User`
- member => a Discord.js `GuildMember`
- role => a Discord.js `Role`
- channel => a Discord.js `GuildChannel`
- textchannel => a Discord.js `TextChannel`
- voicechannel => a Discord.js `VoiceChannel`
- message => a Discord.js `Message`
- guild => a Discord.js `Guild`
- command => a Gungnir `Command`

### Custom argument types
This is done by creating a new `Resolver` and decorating it using the `@defineResolver` decorator.\
Just like the `@defineCommand` decorator, this needs to be called before the client is created.\
Resolvers need to return `null` if the value couldn't be resolved to a valid argument.\
As an example, this is the default `GuildMember` `Resolver`:
```ts
@defineResolver("member")
export class GuildMemberResolver extends Resolver<GuildMember> {
  public async resolve(str: string, msg: Message) {
    if (!msg.guild) return null;
    if (/^<@!?\d{18}>$/.test(str)) str = (str.match(/\d{18}/) as RegExpMatchArray)[0];
    return msg.guild.members.resolve(str) ?? msg.guild.members.fetch(str).catch(() => null);
  }
}
```

## Inhibitors
TODO
