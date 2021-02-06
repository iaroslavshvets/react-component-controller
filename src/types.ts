import {ReactController} from './ReactController';

export type UseReactController<T extends any> = Omit<T, keyof ReactController>;
