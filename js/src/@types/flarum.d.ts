declare var m: any;

declare namespace JSX {
  type Element = any;
  type ElementClass = any;
  interface ElementAttributesProperty {
    attrs: {};
  }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'flarum/admin/app' {
  const app: any;
  export default app;
}

declare module 'flarum/forum/app' {
  const app: any;
  export default app;
}

declare module 'flarum/admin/components/ExtensionPage' {
  import Component from 'flarum/common/Component';
  export default class ExtensionPage<A = any> extends Component<A> {
    content(): any;
  }
}

declare module 'flarum/common/Component' {
  export default class Component<A = any> {
    attrs: A;
    element: HTMLElement;
    constructor(vnode?: any);
    oninit(vnode?: any): void;
    oncreate(vnode?: any): void;
    onupdate(vnode?: any): void;
    onbeforeremove(vnode?: any): void;
    onremove(vnode?: any): void;
    view(vnode?: any): any;
  }
}

declare module 'flarum/common/components/Modal' {
  import Component from 'flarum/common/Component';
  export interface IInternalModalAttrs {
    [key: string]: any;
  }
  export default class Modal<A extends IInternalModalAttrs = {}> extends Component<A> {
    loading: boolean;
    className(): string;
    title(): any;
    content(): any;
    onsubmit(e: SubmitEvent): void;
    hide(): void;
  }
}

declare module 'flarum/common/components/Button' {
  import Component from 'flarum/common/Component';
  export default class Button extends Component<any> {}
}

declare module 'flarum/common/components/Select' {
  import Component from 'flarum/common/Component';
  export default class Select extends Component<any> {}
}

declare module 'flarum/common/components/LoadingIndicator' {
  import Component from 'flarum/common/Component';
  export default class LoadingIndicator extends Component<any> {}
}

declare module 'flarum/common/utils/Stream' {
  interface Stream<T> {
    (): T;
    (value: T): Stream<T>;
  }
  function Stream<T>(initialValue?: T): Stream<T>;
  export default Stream;
}

declare module 'flarum/common/extenders' {
  const Extend: {
    Admin: new () => {
      page(component: any): any;
      setting(callback: () => any, priority?: number): any;
      permission(callback: () => any, type?: string, priority?: number): any;
    };
    [key: string]: any;
  };
  export default Extend;
}
