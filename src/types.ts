import {type ReactController} from './ReactController';

export type {UseControllerArguments} from './createHookWithContext';

export type UseController<T> = Omit<T, keyof ReactController>;

export interface WithController<T> {
  controller?: UseController<T>;
}
