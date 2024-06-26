import {Newable} from './typings/internals';

type CreateReactControllerArguments<T extends Newable> = InstanceType<T>['props'] extends never
  ? [T, InstanceType<T>['ctx']]
  : [T, InstanceType<T>['ctx'], InstanceType<T>['props']];

export const createReactController = <T extends Newable>(...args: CreateReactControllerArguments<T>) => {
  const [Controller, context, maybeProps] = args;
  const controller = new Controller();

  controller.ctx = context;

  if (maybeProps !== undefined) {
    controller.props = maybeProps;
  }

  return controller as Omit<InstanceType<T>, 'ctx' | 'props' | 'onChange'>;
};
