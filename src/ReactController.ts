export type Context = Record<string, any>;

export type NonViewAccessibleFields = 'onInit' | 'onDestroy' | 'props' | 'ctx';

export type ReactControllerWithoutPrivateFields<T> = Omit<T, NonViewAccessibleFields>;

export abstract class ReactController<C extends Context = {}, P extends Object = never> {
  readonly ctx: C = undefined as any;

  readonly props: P = undefined as any;

  // eslint-disable-next-line class-methods-use-this
  onDestroy(): unknown {
    return undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  onInit(): unknown {
    return undefined;
  }

  constructor(ctx?: C, props?: P) {
    this.ctx = ctx as C;
    this.props = props as P;
  }
}
