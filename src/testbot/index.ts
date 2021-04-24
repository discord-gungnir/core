import { GungnirClient, JSONProvider } from "../index";
import { token } from "./config";
import "./commands";

@GungnirClient.login(token)
@JSONProvider.provide("./data")
export class TestClient extends GungnirClient {
  public init() {
    console.log("Ready!");
  }

  public error(err: Error) {
    console.error(err)
  }
}