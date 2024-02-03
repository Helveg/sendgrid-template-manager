import { DefaultRenderer, Listr, ListrRendererValue, Spinner } from "listr2";
import { deepmerge } from "deepmerge-ts";
import isUnicodeSupported from "is-unicode-supported";

class DotSpinner extends Spinner {
  protected readonly spinner: string[] = !isUnicodeSupported()
    ? ["-", "\\", "|", "/"]
    : ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
}

export function outputListFactory<
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
        collapseSubtasks: false,
        icon: { OUTPUT: undefined },
        spinner: new DotSpinner(),
      },
    },
    { ...options },
  ) as typeof options;
  return new Listr<A, B, C>(tasks, options);
}
