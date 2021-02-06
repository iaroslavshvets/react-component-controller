import {Newable} from "./typings/internals";


type CreateReactControllerArguments<T extends Newable> = InstanceType<T>['props'] extends never
  ? [T, InstanceType<T>['services']]
  : [T, InstanceType<T>['services'], InstanceType<T>['props']];

export const createReactController = <T extends Newable>(...args: CreateReactControllerArguments<T>) => {
  const [Controller, services, maybeProps] = args;

  const controller = new Controller();

  controller.services = services;

  if (maybeProps !== undefined) {
    controller.props = maybeProps;
  }

  return controller as Omit<InstanceType<T>, 'services' | 'props' | 'onChange'>;
};
