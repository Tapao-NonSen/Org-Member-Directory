export { default as extend } from './extend';

import app from 'flarum/admin/app';

app.initializers.add('tapao/org-member-directory', () => {
  // Imperative-only logic goes here.
  // Settings, permissions, and page registration are in extend.ts.
});
