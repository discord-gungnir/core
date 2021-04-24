import { Command } from "../modules/commands/Command";

function defineCommand(name: string) {
  return true ? Command.guild(
    "191560973922992128", "255312496250978305",
    "487526786041774091", "221599907121856512"
  ).define(name) : Command.define(name);
}

@defineCommand("test")
@Command.ephemeral()
@Command.description("Just a test command")
export class TestCommand extends Command {
  public run(ctx: Command.Context) {
    return ctx.send("It works!");
  }
}

@defineCommand("avatar")
@Command.ephemeral()
@Command.usage("{user?: The user you want to grab the avatar of}")
@Command.description("Grab a user's avatar URL")
export class UserInfo extends Command {
  public run(ctx: Command.GuildContext, user = ctx.user) {
    return ctx.send(user.displayAvatarURL({format: "png", size: 4096, dynamic: true}));
  }
}

@defineCommand("roll")
@Command.description("Roll a dice!")
@Command.usage("{[natural] faces?: How many faces does the dice have?}")
export class RollCommand extends Command {
  public run(ctx: Command.Context, faces = 6) {
    const rand = Math.ceil(Math.random()*faces);
    return ctx.send(`You rolled a \`${rand}/${faces}\`! 🎲`);
  }
}

@defineCommand("rat")
@Command.description("Voilà")
export class RatCommand extends Command {
  public run(ctx: Command.Context) {
    return ctx.send("<:questioningrat:716669870800109659>");
  }
}

@defineCommand("ismelljojo")
@Command.description("ゴ　ゴ　ゴ　ゴ")
export class ISmellJojoCommand extends Command {
  public async run(ctx: Command.Context) {
    return ctx.send("[I smell JoJo!](https://www.youtube.com/watch?v=O6jjb2w5das)");
  }
}