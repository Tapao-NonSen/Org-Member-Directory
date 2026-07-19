export { default as extend } from './extend';

import app from 'flarum/forum/app';

app.initializers.add('tapao/org-member-directory', () => {
  // Imperative-only logic goes here.
  // Route registration is in extend.ts.
});
