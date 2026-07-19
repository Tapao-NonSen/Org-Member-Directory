export { default as extend } from './extend';
import { extend as extendFlarum } from 'flarum/common/extend';
import IndexPage from 'flarum/forum/components/IndexPage';
import LinkButton from 'flarum/common/components/LinkButton';
import app from 'flarum/forum/app';

app.initializers.add('tapao/org-member-directory', () => {
  extendFlarum(IndexPage.prototype, 'navItems', function (items) {
    items.add(
      'member-directory',
      <LinkButton href={app.route('members')} icon="fas fa-users">
        {app.translator.trans('tapao-org-member-directory.forum.nav.member_directory_link')}
      </LinkButton>,
      15 // Priority
    );
  });
});
