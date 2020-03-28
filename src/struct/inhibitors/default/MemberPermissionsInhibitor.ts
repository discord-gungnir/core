import type { Message } from "discord.js";
import { defineInhibitor } from "../DefineInhibitor";
import { PermissionsInhibitor } from "./PermissionsInhibitor";

@defineInhibitor("member_permissions")
export class PermissionsMemberInhibitor extends PermissionsInhibitor {
  protected readonly permissions = "memberPermissions";
  protected getMember(message: Message) {
    return message.member;
  }
}