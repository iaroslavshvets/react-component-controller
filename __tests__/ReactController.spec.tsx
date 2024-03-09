import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {createHookWithContext} from '../src/createHookWithContext';
import {createReactController} from '../src/createReactController';
import {ReactController} from '../src/ReactController';
import {type UseController, type WithController} from '../src/types';
import {createWithControllerDecorator} from '../src';

describe('ReactController', () => {
  const expectTypescriptError = (a: () => unknown) => {
    try {
      a();
    } catch {
      /* empty */
    }
  };

  it('should prevent using untyped props', () => {
    // @ts-expect-error - class defined for testing typings only
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class TypeTest extends ReactController {
      onInit() {
        // @ts-expect-error - testProp is not defined in props
        expectTypescriptError(() => this.props.testProp);
      }
    }
  });

  describe('should be able to create controller outside components', () => {
    it('without props', () => {
      interface Context {
        service: object;
      }

      const someMethodSpy = jest.fn();
      const context: Context = {service: {}};

      class Controller extends ReactController<Context> {
        someMethod = () => {
          someMethodSpy();
        };
      }

      // @ts-expect-error - props are missing
      expectTypescriptError(() => createReactController(Controller, context, {}));

      const controller = createReactController(Controller, context);
      controller.someMethod();

      expect(someMethodSpy).toBeCalled();
    });
    it('with props', () => {
      interface Context {
        service: object;
      }

      const onInitSpy = jest.fn();
      const someMethodSpy = jest.fn();
      const context: Context = {service: {}};

      class Controller extends ReactController<Context, {prop: number}> {
        onInit = () => {
          return undefined;
        };

        someMethod = someMethodSpy;
      }

      // @ts-expect-error - props are missing
      expectTypescriptError(() => createReactController(Controller, context));

      const controller = createReactController(Controller, context, {prop: 1});

      controller.someMethod();

      expect(onInitSpy).toBeCalledTimes(0);
      expect(someMethodSpy).toBeCalled();
      expect((controller as any).ctx.service).toEqual({});
      expect((controller as any).props.prop).toBe(1);
    });
  });

  it('should render React.Component with props', () => {
    const Context = React.createContext(null);
    const useController = createHookWithContext({ctx: Context});
    const withController = createWithControllerDecorator(useController);

    const testViewCallback = jest.fn();

    type TestViewProps = WithController<TestController> & {
      callback: () => void;
    };

    class TestController extends ReactController<typeof Context, TestViewProps> {
      controllerProp = 'controllerPropValue';

      onInit = () => {
        this.props.callback();
      };
    }

    @withController(TestController)
    class TestView extends React.Component<TestViewProps> {
      render() {
        // @ts-expect-error - controllerProp is missing in class
        const {controllerProp} = this.props.controller;
        return <span data-hook="prop">{controllerProp}</span>;
      }
    }

    const component = render(<TestView callback={testViewCallback} />);
    const element = component.baseElement;
    const propElement = element.querySelector(`[data-hook="prop"]`);

    expect(propElement?.innerHTML).toBe('controllerPropValue');
    expect(testViewCallback).toBeCalledTimes(1);
  });

  it('should render React functional component with props', async () => {
    const clickSpy = jest.fn();
    const onDestroySpy = jest.fn();
    const onInitDestroyCallbackSpy = jest.fn();
    const testViewPropSpy = jest.fn();

    interface TestViwProps {
      testProp: () => jest.SpyInstance;
      someOtherProp: () => string;
    }

    const Context = React.createContext(null);

    class TestController extends ReactController<typeof Context, TestViwProps> {
      reMappedProp = this.props.someOtherProp();

      onInit = async () => {
        this.props.testProp();
        return () => {
          onInitDestroyCallbackSpy();
        };
      };

      onDestroy = () => {
        onDestroySpy();
      };

      prop = 'test-property';

      method = () => {
        clickSpy();
      };
    }

    const useController = createHookWithContext({ctx: Context});

    const ViewWithPassedAsPropController = ({controller}: {controller: UseController<TestController>}) => {
      return <span>{controller.prop}</span>;
    };

    class TestErrorController extends ReactController<typeof Context, TestViwProps> {}

    const ViewWithController = (props: TestViwProps) => {
      // eslint-disable-next-line
      // @ts-expect-error - props not passed
      expectTypescriptError(() => useController(TestErrorController));

      const controller = useController(TestController, props);

      return (
        <>
          <span onClick={controller.method} data-hook="controller">
            <span data-hook="prop">{controller.prop}</span>
            <span data-hook="re-mapped-prop">{controller.reMappedProp}</span>
          </span>
          <ViewWithPassedAsPropController controller={controller} />
        </>
      );
    };

    const component = render(<ViewWithController testProp={testViewPropSpy} someOtherProp={() => 'someOtherValue'} />);

    const element = component.baseElement;
    const controllerElement = element.querySelector(`[data-hook="controller"]`);

    expect(testViewPropSpy).toBeCalledTimes(1);

    expect(controllerElement && controllerElement.querySelector(`[data-hook="prop"]`)!.innerHTML).toBe('test-property');
    expect(controllerElement && controllerElement.querySelector(`[data-hook="re-mapped-prop"]`)!.innerHTML).toBe(
      'someOtherValue',
    );

    if (controllerElement) {
      fireEvent.click(controllerElement);
    }

    expect(clickSpy).toBeCalledTimes(1);

    expect(onDestroySpy).toBeCalledTimes(0);

    component.unmount();

    expect(onDestroySpy).toBeCalledTimes(1);

    await new Promise<void>((resolve) => {
      process.nextTick(() => {
        expect(onInitDestroyCallbackSpy).toBeCalledTimes(1);
        resolve();
      });
    });
  });

  it('with injected controller', () => {
    class TestController extends ReactController {
      prop = 1;
    }
    const testController = new TestController();
    testController.prop = 2;

    const Context = React.createContext(null);
    const useController = createHookWithContext({ctx: Context});

    const ViewWithInjectedController = (props: {controller?: TestController}) => {
      const controller = useController(TestController, props);
      return <span data-hook="controller-prop">{controller.prop}</span>;
    };

    const component = render(<ViewWithInjectedController controller={testController} />);
    const element = component.baseElement;
    const controllerElement = element.querySelector(`[data-hook="controller-prop"]`);

    expect(controllerElement && controllerElement.innerHTML).toBe('2');
  });
});
