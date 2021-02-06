export type OnInit = (() => void) | (() => Promise<void>) | undefined;
export type OnDestroy = (() => void) | undefined;

export interface Services {
  [key: string]: any;
}

export type NonViewAccessibleFields = 'onInit' | 'onDestroy' | 'onChange' | 'props' | 'services';

export type ReactControllerWithoutPrivateFields<T> = Omit<T, NonViewAccessibleFields>;

export abstract class ReactController<S extends Services = {}, P extends Object = never> {
  readonly services: S = undefined as any;
  readonly props: P = undefined as any;

  onDestroy: OnDestroy = () => undefined;
  onInit: OnInit = () => undefined;
}
