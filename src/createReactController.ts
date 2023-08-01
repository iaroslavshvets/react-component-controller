type Newable = new (...args: any[]) => any;

type CreateReactControllerArguments<T extends Newable> = InstanceType<T>['props'] extends never
  ? [T, InstanceType<T>['ctx']]
  : [T, InstanceType<T>['ctx'], InstanceType<T>['props']];

export const createReactController = <T extends Newable>(...args: CreateReactControllerArguments<T>) => {
  const [Controller, context, props] = args;
  const controller = new Controller();

  controller.ctx = context;
  controller.props = props;

  return controller as Omit<InstanceType<T>, 'ctx' | 'props' | 'onChange'>;
};
