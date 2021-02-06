import {Context, ReactNode, useContext, useEffect, useRef} from 'react';
import {ReactControllerWithoutPrivateFields} from './ReactController';
import {useRunOnce} from './useRunOnce';
import {Newable} from "./typings/internals";

type UseControllerArguments<T extends Newable> = InstanceType<T>['props'] extends never
  ? [T, {children?: ReactNode; controller?: InstanceType<T>}] | [T]
  : [T, InstanceType<T>['props'] & {controller?: InstanceType<T>}];

export const createHookWithContext = <S extends Context<any>>(servicesContext: S) => {
  return function useController<T extends Newable>(...args: UseControllerArguments<T>) {
    const [ControllerClass, props = undefined] = args;

    const services = useContext(servicesContext);
    const controllerRef = useRef<InstanceType<T>>();
    const initReturnRef = useRef<unknown>();

    if (!controllerRef.current) {
      let controller: InstanceType<T>;

      if (props !== undefined) {
        if ('controller' in props && props!.controller !== undefined) {
          controller = props!.controller;
        } else {
          controller = new ControllerClass();
          controller.props = props;
          controller.services = services;
        }
      } else {
        controller = new ControllerClass();
        controller.services = services;
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
            }
            controllerRef.current.onDestroy();
          }
        };
      },
      [],
    );

    useEffect(
      /* update controller with new component props */ () => {
        if (controllerRef.current) {
          controllerRef.current.props = props;
        }
      },
    );

    return controllerRef.current as ReactControllerWithoutPrivateFields<InstanceType<T>>;
  };
};
