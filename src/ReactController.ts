export interface Context {
  [key: string]: any;
}

export type NonViewAccessibleFields = 'onInit' | 'onDestroy' | 'props' | 'ctx';

export type ReactControllerWithoutPrivateFields<T> = Omit<T, NonViewAccessibleFields>;

export abstract class ReactController<S extends Context = {}, P extends Object = never> {
  readonly ctx: S = undefined as any;

  readonly props: P = undefined as any;

  // eslint-disable-next-line class-methods-use-this
  onDestroy(): unknown {
    return undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  onInit(): unknown {
    return undefined;
  }

  constructor(ctx?: S, props?: P) {
    if (ctx) {
      this.ctx = ctx;
    }
    if (props) {
      this.props = props;
    }
  }
}
