import {type Context, type ReactNode, useContext, useEffect, useRef} from 'react';
import {type ReactControllerWithoutPrivateFields} from './ReactController';
import {useRunOnce} from './useRunOnce';

type Newable = new (...args: any[]) => any;

export type UseControllerArguments<T extends Newable> = InstanceType<T>['props'] extends never
  ? [T, {children?: ReactNode; controller?: InstanceType<T>}] | [T]
  : [T, InstanceType<T>['props'] & {controller?: InstanceType<T>}];

export const createHookWithContext = <S extends Context<any>>({
  ctx,
  updateWrapper,
}: {
  ctx: S;
  updateWrapper?: (updater: () => void) => void;
}) => {
  const isThenable = (value: unknown): value is Promise<(() => void) | undefined> => {
    return typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';
  };

  return function useController<T extends Newable>(...args: UseControllerArguments<T>) {
    const [ControllerClass, props = undefined] = args;
    const context = useContext(ctx);
    const controllerRef = useRef<InstanceType<T>>();
    const onInitResultRef = useRef<unknown>();

    useRunOnce(() => {
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
      onInitResultRef.current = controller.onInit();
    });

    useEffect(
      /* manage lifecycle in case, when new controller was created */ () => {
        return () => {
          if (typeof onInitResultRef.current === 'function') {
            onInitResultRef.current();
          } else if (isThenable(onInitResultRef.current)) {
            onInitResultRef.current.then((onDestroy) => {
              if (typeof onDestroy === 'function') {
                onDestroy();
              }
            });
          }
          controllerRef.current!.onDestroy();
        };
      },
      [],
    );

    if (updateWrapper) {
      updateWrapper(() => {
        controllerRef.current!.props = props;
      });
    } else {
      controllerRef.current!.props = props;
    }

    return controllerRef.current as ReactControllerWithoutPrivateFields<InstanceType<T>>;
  };
};
