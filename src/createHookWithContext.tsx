import {Context, ReactNode, useContext, useEffect, useRef} from 'react';
import {ReactControllerWithoutPrivateFields} from './ReactController';
import {useRunOnce} from './useRunOnce';

type Newable = new (...args: any[]) => any;

export type UseControllerArguments<T extends Newable> = InstanceType<T>['props'] extends never
  ? [T, {children?: ReactNode; controller?: InstanceType<T>}] | [T]
  : [T, InstanceType<T>['props'] & {controller?: InstanceType<T>}];

export const createHookWithContext = <S extends Context<any>>({ctx, updateWrapper}: {
  ctx: S;
  updateWrapper?: Function
}) => {
  return function useController<T extends Newable>(...args: UseControllerArguments<T>) {
    const [ControllerClass, props = undefined] = args;
    const context = useContext(ctx);
    const controllerRef = useRef<InstanceType<T>>();
    const initReturnRef = useRef<unknown>();

    if (!controllerRef.current) {
      let controller: InstanceType<T>;

      if (props !== undefined) {
        if ('controller' in props && props!.controller !== undefined) {
          controller = props!.controller;
        } else {
          controller = new ControllerClass(context, props);
          controller.props = props;
          controller.ctx = context;
        }
      } else {
        controller = new ControllerClass(context);
        controller.ctx = context;
      }

      controllerRef.current = controller;
    }

    useRunOnce(() => {
      if (controllerRef.current) {
        initReturnRef.current = controllerRef.current.onInit();
      }
    });

    useEffect(
      /* manage lifecycle in case, when new controller was created */ () => {
        return () => {
          if (controllerRef.current) {
            if (typeof initReturnRef.current === 'function') {
              initReturnRef.current();
            } else if (initReturnRef.current instanceof Promise) {
              initReturnRef.current?.then((destroy) => destroy?.());
            }
            controllerRef.current.onDestroy();
          }
        };
      },
      [],
    );

    if (updateWrapper) {
      updateWrapper(() => {
        controllerRef.current!.props = props;
      })
    } else {
      controllerRef.current!.props = props;
    }

    return controllerRef.current as ReactControllerWithoutPrivateFields<InstanceType<T>>;
  };
};
