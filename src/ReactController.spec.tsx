import {expect} from 'chai';
import {createHookWithContext} from './createHookWithContext';
import Sinon, {SinonSpy} from 'sinon';
import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {createReactController} from './createReactController';
import {ReactController} from './ReactController';
import {UseController, WithController} from './types';
import {createWithControllerDecorator} from '.';

describe('ReactController', () => {
  let sinon: Sinon.SinonSandbox;
  const expectTypescriptError = (a: () => unknown) => {
    try {
      a();
    } catch {}
  };

  beforeEach(() => (sinon = Sinon.createSandbox()));
  afterEach(() => sinon.restore());

  it('should prevent using untyped props', () => {
    // @ts-ignore-line
    class TypeTest extends ReactController {
      onInit() {
        // @ts-expect-error
        expectTypescriptError(() => this.props.testProp);
      };
    }
  });

  describe('should be able to create controller outside components', () => {
    it('without props', () => {
      interface Context {
        service: object;
      }

      const someMethodSpy = sinon.spy();
      const context: Context = {service: {}};

      class Controller extends ReactController<Context> {
        someMethod = () => someMethodSpy();
      }

      // @ts-expect-error
      expectTypescriptError(() => createReactController(Controller, context, {}));

      const controller = createReactController(Controller, context);
      controller.someMethod();

      expect(someMethodSpy.called).to.be.true;
    });
    it('with props', () => {
      interface Context {
        service: object;
      }

      const onInitSpy = sinon.spy();
      const someMethodSpy = sinon.spy();
      const context: Context = {service: {}};

      class Controller extends ReactController<Context, {prop: number}> {
        onInit = () => {};
        someMethod = someMethodSpy;
      }

      // @ts-expect-error
      expectTypescriptError(() => createReactController(Controller, context));

      const controller = createReactController(Controller, context, {prop: 1});

      controller.someMethod();

      expect(onInitSpy.called).to.be.false;
      expect(someMethodSpy.called).to.be.true;
      expect((controller as any).ctx.service).to.be.eql({});
      expect((controller as any).props.prop).to.be.eql(1);
    });
  });

  it('should render React.Component with props', () => {
    const Context = React.createContext(null);
    const useController = createHookWithContext({ctx: Context});
    const withController = createWithControllerDecorator(useController);

    const testViewCallback = sinon.spy();

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
        // @ts-expect-error
        return <span data-hook="prop">{this.props.controller.controllerProp}</span>
      }
    }

    const component = render(<TestView callback={testViewCallback} />);
    const element = component.baseElement;
    const propElement = element.querySelector(`[data-hook="prop"]`);

    expect(propElement?.innerHTML).to.equal('controllerPropValue')
    expect(testViewCallback.callCount).to.equal(1);
  });

  it('should render React.FC with props', () => {
    const clickSpy = sinon.spy();
    const onDestroySpy = sinon.spy();
    const testViewPropSpy = sinon.spy();

    interface TestViwProps {
      testProp: SinonSpy;
      someOtherProp: () => string;
    }

    const Context = React.createContext(null);

    class TestController extends ReactController<typeof Context, TestViwProps> {
      reMappedProp = this.props.someOtherProp();
      onInit = () => {
        this.props.testProp();
      };
      onDestroy = onDestroySpy;
      prop = 'test-property';
      method = () => {
        clickSpy();
      };
    }

    const useController = createHookWithContext({ctx: Context});

    const ViewWithPassedAsPropController: React.FC<{
      controller: UseController<TestController>;
    }> = (props) => {
      return <span>{props.controller.prop}</span>;
    };

    class TestErrorController extends ReactController<typeof Context, TestViwProps> {}

    const ViewWithController: React.FC<TestViwProps> = (props) => {
      // @ts-expect-error
      expectTypescriptError(() => useController(TestErrorController)); // eslint-disable-line

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

    expect(testViewPropSpy.callCount).to.equal(1);

    expect(controllerElement && controllerElement.querySelector(`[data-hook="prop"]`)!.innerHTML).to.equal(
      'test-property',
    );
    expect(controllerElement && controllerElement.querySelector(`[data-hook="re-mapped-prop"]`)!.innerHTML).to.equal(
      'someOtherValue',
    );

    controllerElement && fireEvent.click(controllerElement);

    expect(clickSpy.callCount).to.equal(1);

    expect(onDestroySpy.callCount).to.equal(0);

    component.unmount();

    expect(onDestroySpy.callCount).to.equal(1);
  });

  it('with injected controller', () => {
    class TestController extends ReactController {
      prop = 1;
    }
    const testController = new TestController();
    testController.prop = 2;

    const Context = React.createContext(null);
    const useController = createHookWithContext({ctx: Context});

    const ViewWithInjectedController: React.FC<{controller?: TestController}> = (props) => {
      const controller = useController(TestController, props);
      return <span data-hook="controller-prop">{controller.prop}</span>;
    };

    const component = render(<ViewWithInjectedController controller={testController} />);
    const element = component.baseElement;
    const controllerElement = element.querySelector(`[data-hook="controller-prop"]`);

    expect(controllerElement && controllerElement.innerHTML).to.equal('2');
  });
});
