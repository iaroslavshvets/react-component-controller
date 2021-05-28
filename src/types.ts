import {ReactController} from './ReactController';

export type UseController<T extends any> = Omit<T, keyof ReactController>;
