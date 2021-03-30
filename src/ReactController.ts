export type OnInit = (() => void) | (() => Promise<void>) | undefined;
export type OnDestroy = (() => void) | undefined;

export interface Context {
  [key: string]: any;
}``

export type NonViewAccessibleFields = 'onInit' | 'onDestroy' | 'onChange' | 'props' | 'context';

export type ReactControllerWithoutPrivateFields<T> = Omit<T, NonViewAccessibleFields>;

export abstract class ReactController<S extends Context = {}, P extends Object = never> {
  readonly context: S = undefined as any;
  readonly props: P = undefined as any;

  onDestroy: OnDestroy = () => undefined;
  onInit: OnInit = () => undefined;
}
