import React from 'react';
import hostNonReactStatics from 'hoist-non-react-statics';
import {createHookWithContext} from "./createHookWithContext";

export const createWithControllerDecorator = (controllerHook: ReturnType<typeof createHookWithContext>) => {
  return function withController(ControllerClass: any): any {
    return function Extend(WrappedComponent: any) {
      function WithController(props: any) {
        const controller = controllerHook(ControllerClass, props);

        const passDownProps = {
          controller,
          ...props,
        };

        return React.createElement(WrappedComponent, passDownProps);
      }

      WithController.displayName = `withController(${WrappedComponent.displayName || WrappedComponent.name})`;
      WithController.WrappedComponent = WrappedComponent;

      hostNonReactStatics(WithController, WrappedComponent);

      return WithController;
    };
  };
};
