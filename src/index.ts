import dotenv from "dotenv";
import { Argument, Command } from "commander";
import { listAssetsCommand } from "./commands/list-assets.command";
import { STMError } from "./errors";
import { applyCommand } from "./commands/apply.command";

dotenv.config();

const program = new Command();

program
  .name("sgtm")
  .description(
    "SendGrid Template Manager: A community CLI tool to manage SendGrid email templates.",
  )
  .version("1.0.0")
  .option("--key <string>", "The SendGrid API key");

function handlerHandler(f: Function) {
  return async (...args: any[]) => {
    let [options, command] = args.slice(-2) as [NonNullable<unknown>, Command];
    let c = command;
    while ((c = c.parent!)) {
      options = { ...options, ...c.opts() };
    }
    args[args.length - 2] = options;
    try {
      return await f.apply(undefined, args);
    } catch (e) {
      if (e instanceof STMError) {
        program.error(e.message, {
          exitCode: e.info.exitCode ?? 1,
          code: e.info.code,
        });
      } else {
        throw e;
      }
    }
  };
}

program
  .command("list")
  .addArgument(
    new Argument("type", "Type of asset to list.")
      .choices(["designs", "templates"])
      .argOptional(),
  )
  .description("List the assets.")
  .action(handlerHandler(listAssetsCommand));

program
  .command("apply")
  .description("Apply a design to one or more templates")
  .argument("<design>")
  .argument("[templates...]")
  .option("-t, --tag", "The version name to create/update", "latest")
  .option("--activate", "Toggle to immediately activate the new version.")
  .action(handlerHandler(applyCommand));

program.parse();
