import { Structures } from "discord.js";

declare module "discord.js" {
  interface DMChannel {}
}
Structures.extend("DMChannel", DMChannel => class extends DMChannel {
  
});