export class FenError extends Error {
  constructor(
    message: string,
    readonly fen: string,
  ) {
    super(message);
    this.name = 'FenError';
  }
}

export class IllegalMoveError extends Error {
  constructor(readonly move: string) {
    super(`Illegal move: ${move}`);
    this.name = 'IllegalMoveError';
  }
}
