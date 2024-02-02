import dotenv from "dotenv";
import { Argument, Command } from "commander";
import { listDesignsCommand } from "./commands/list-designs.command";

dotenv.config();

const program = new Command();

program
  .name("STM")
  .description("CLI tool to manage SendGrid email templates")
  .version("1.0.0")
  .option("--key <string>", "The SendGrid API key");

function optionCascade(f: Function) {
  return (...args: any[]) => {
    let [options, command] = args.slice(-2) as [NonNullable<unknown>, Command];
    let c = command;
    while ((c = c.parent!)) {
      options = { ...options, ...c.opts() };
    }
    args[args.length - 2] = options;
    return f.apply(undefined, args);
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
  .action(optionCascade(listDesignsCommand));

program.parse();
