import { DefaultRenderer, Listr, ListrRendererValue, Spinner } from "listr2";
import { deepmerge } from "deepmerge-ts";
import isUnicodeSupported from "is-unicode-supported";
import { STMError } from "./errors.js";

class DotSpinner extends Spinner {
  protected readonly spinner: string[] = !isUnicodeSupported()
    ? ["-", "\\", "|", "/"]
    : ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
}

export async function runTasks<
  A,
  B extends ListrRendererValue,
  C extends ListrRendererValue,
>(
  tasks: ConstructorParameters<typeof Listr<A, B, C>>[0],
  ctx: A,
  options?: ConstructorParameters<typeof Listr<A, B, C>>[1],
) {
  try {
    return await createTasks(tasks, options).run(ctx);
  } catch (e) {
    if (e instanceof STMError) {
      // Error dealt with by listr2 already
      return;
    } else {
      throw e;
    }
  }
}

export function createTasks<
  A,
  B extends ListrRendererValue,
  C extends ListrRendererValue,
>(
  tasks: ConstructorParameters<typeof Listr<A, B, C>>[0],
  options?: ConstructorParameters<typeof Listr<A, B, C>>[1],
) {
  options = deepmerge(
    {
      renderer: DefaultRenderer,
      rendererOptions: {
        spinner: new DotSpinner(),
      },
    },
    { ...options },
  ) as typeof options;
  return new Listr<A, B, C>(tasks, options);
}

export function createOutputListTasks<
  A,
  B extends ListrRendererValue,
  C extends ListrRendererValue,
>(
  tasks: ConstructorParameters<typeof Listr<A, B, C>>[0],
  options?: ConstructorParameters<typeof Listr<A, B, C>>[1],
) {
  options = deepmerge(
    {
      rendererOptions: {
        collapseSubtasks: false,
        icon: { OUTPUT: undefined },
      },
    },
    { ...options },
  ) as typeof options;
  return createTasks(tasks, options);
}
