import type {ReactController} from './ReactController';

export type {UseControllerArguments} from './createHookWithContext';

export type UseController<T extends any> = Omit<T, keyof ReactController>;

export interface WithController<T> {
  controller?: UseController<T>;
}
