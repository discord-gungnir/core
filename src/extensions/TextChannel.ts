import { Structures } from "discord.js";

declare module "discord.js" {
  interface TextChannel {}
  interface NewsChannel {}
}
Structures.extend("TextChannel", TextChannel => class extends TextChannel {
  
});