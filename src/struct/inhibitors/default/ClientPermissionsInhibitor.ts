import type { Message } from "discord.js";
import { defineInhibitor } from "../DefineInhibitor";
import { PermissionsInhibitor } from "./PermissionsInhibitor";

@defineInhibitor("client_permissions")
export class ClientPermissionsInhibitor extends PermissionsInhibitor {
  protected readonly permissions = "clientPermissions";
  protected getMember(message: Message) {
    return message.guild?.me ?? null;
  }
}