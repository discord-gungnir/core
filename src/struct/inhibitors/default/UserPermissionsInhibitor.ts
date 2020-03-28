import type { Message } from "discord.js";
import { defineInhibitor } from "../DefineInhibitor";
import { PermissionsInhibitor } from "./PermissionsInhibitor";

@defineInhibitor("user_permissions")
export class UserPermissionsInhibitor extends PermissionsInhibitor {
  protected readonly permissions = "userPermissions";
  protected getMember(message: Message) {
    return message.member;
  }
}