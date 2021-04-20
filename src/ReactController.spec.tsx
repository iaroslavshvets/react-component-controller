import {expect} from 'chai';
import {createHookWithContext} from './createHookWithContext';
import Sinon, {SinonSpy} from 'sinon';
import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {createReactController} from './createReactController';
import {ReactController} from './ReactController';
import {UseReactController} from './types';

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
      onInit = () => {
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

  it('should render React.FC with props', () => {
    const testPropValue = 'test-property';
    const clickSpy = sinon.spy();
    const onDestroySpy = sinon.spy();
    const testViewPropSpy = sinon.spy();

    interface TestViwProps {
      testProp: SinonSpy;
    }

    const Context = React.createContext(null);

    class TestController extends ReactController<typeof Context, TestViwProps> {
      onInit = () => {
        this.props.testProp();
      };
      onDestroy = onDestroySpy;
      prop = testPropValue;
      method = () => {
        clickSpy();
      };
    }

    const useController = createHookWithContext({ctx: Context});

    const ViewWithPassedAsPropController: React.FC<{
      controller: UseReactController<TestController>;
    }> = (props) => {
      return <span>{props.controller.prop}</span>;
    };

    const ViewWithController: React.FC<TestViwProps> = (props) => {
      // @ts-expect-error
      expectTypescriptError(() => useController(TestController)); // eslint-disable-line

      const controller = useController(TestController, props);

      return (
        <>
          <span onClick={controller.method} data-hook="controller">
            {controller.prop}
          </span>
          <ViewWithPassedAsPropController controller={controller} />
        </>
      );
    };

    const component = render(<ViewWithController testProp={testViewPropSpy} />);
    const element = component.baseElement;
    const controllerElement = element.querySelector(`[data-hook="controller"]`);

    expect(testViewPropSpy.callCount).to.equal(1);

    expect(controllerElement && controllerElement.innerHTML).to.equal(testPropValue);

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
