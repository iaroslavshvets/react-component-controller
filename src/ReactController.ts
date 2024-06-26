export type OnInit = (() => void) | (() => Promise<void>) | undefined;
export type OnDestroy = (() => void) | undefined;

export interface Context {
  [key: string]: any;
}

export type NonViewAccessibleFields = 'onInit' | 'onDestroy' | 'onChange' | 'props' | 'ctx';

export type ReactControllerWithoutPrivateFields<T> = Omit<T, NonViewAccessibleFields>;

export abstract class ReactController<S extends Context = {}, P extends Object = never> {
  readonly ctx: S = undefined as any;
  readonly props: P = undefined as any;

  onDestroy: OnDestroy = () => undefined;
  onInit: OnInit = () => undefined;
}
