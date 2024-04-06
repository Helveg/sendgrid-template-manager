import dotenv from "dotenv";
import { Argument, Command, Option } from "commander";
import { listAssetsCommand } from "./commands/list-assets.command.js";
import { STMError } from "./errors.js";
import { applyCommand } from "./commands/apply.command.js";
import { countContactsCommand } from "./commands/count-contacts.command.js";
import { uploadContactsCommand } from "./commands/upload-contacts.command.js";
import { listListsCommand } from "./commands/list-lists-command.js";
import { deleteListsCommand } from "./commands/delete-lists-command.js";

dotenv.config();

const program = new Command();

program
  .name("sgtm")
  .description(
    "SendGrid Template Manager: A community CLI tool to manage SendGrid email templates.",
  )
  .version("0.2.1")
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
        program.error(`ERROR: ${e.message}`, {
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

const contactGroup = program.command("contacts");

contactGroup
  .command("count", { isDefault: true })
  .action(handlerHandler(countContactsCommand));

contactGroup
  .command("upload")
  .argument("<csv>")
  .addOption(
    new Option("-c, --crop <X>", "Crop the upload CSV after X rows").argParser(
      parseInt,
    ),
  )
  .addOption(
    new Option("-s, --split <X>", "Split the upload CSV in X parts").argParser(
      parseInt,
    ),
  )
  .addOption(
    new Option("-k, --skip <X>", "Skip the first X CSV rows").argParser(
      parseInt,
    ),
  )
  .option(
    "-l, --lists <lists...>",
    "List of list IDs to upload the contacts to.",
  )
  .option(
    "-p, --create <prefixes...>",
    "Create lists with given prefixes as name, then use them." +
      " Incompatible with lists argument." +
      " When round-robin only one list prefix can be given",
  )
  .option(
    "-r, --round-robin",
    "Upload each split to a separate list, round-robin.",
  )
  .action(handlerHandler(uploadContactsCommand));

const listGroup = program.command("lists [lists...]");

listGroup.action(handlerHandler(listListsCommand));

listGroup
  .command("delete <lists...>")
  .action(handlerHandler(deleteListsCommand));

program.parse();
