export class STMError extends Error {
  constructor(
    public message: string,
    public info: { exitCode?: number; code?: string } = {},
  ) {
    super(message);
  }
}
