# react-component-controller

## Core concepts:

* Controller holds all business logic for the component. Components itself must be as dumb as possible.
Component can hold state of something like dropdown is open or not via `React.useState()`;

* Before the first component render optional `onInit` is called on the controller, if present.
If it returns function, it will be called upon component unmount.
This unmount callback can be explicitly described in `onDestroy` optional function.

* what was passed as argument for `createHookWithContext` will be accessible as `this.ctx` inside controller class.
  usually the result of it is exported and used as `useController()` React hook later.

* if props needed, pass them as 2-nd argument to `useController(ComponentController, props)`. They will be accessible as `this.props`.
  Also it might be the case for tests, if `controller` is passed as prop to component, `useController` will use it instead of creating new controller instance.
* props are updated on every component call.
* Controllers can be re-used inside other components or controllers via `createReactController()`
* Controller can be passed down the line of components as a prop, use `UseReactController` typing to type this prop in consumers.

## Usage (mobx example)
* refer to [./src/ReactController.spec.ts](./src/ReactController.spec.ts)

```
// file ./ComponentController.ts
export class ComponentController extends Controller {
  @observable someProp: number;
  onInit = () => {
    this.ctx.appStore.someFunction();
    runInAction(() => this.someProp = 1);
  };
}

// file ./ServicesContext.ts
export const ServicesContext: React.Context<Services> = React.createContext(null);

// file ./Controller.ts
export const useController = createHookWithContext(ServicesContext);
export class Controller<P = any> extends ReactController<Services, P> {}

// file ./Component.tsx
export const Component: React.FC = observer(() => {
  const controller = useController(ComponentController);
  return (
    <div>{controller.someProp}</div>
  );
});
```
