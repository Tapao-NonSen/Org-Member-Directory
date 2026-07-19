import Extend from 'flarum/common/extenders';
import app from 'flarum/admin/app';
import OrgMemberDirectoryPage from './components/OrgMemberDirectoryPage';

export default [
  new Extend.Admin()
    .page(OrgMemberDirectoryPage)
    .permission(
      () => ({
        icon: 'fas fa-id-card',
        label: app.translator.trans('tapao-org-member-directory.admin.permissions.view_member_directory_label'),
        permission: 'member-directory.view',
        allowGuest: true,
      }),
      'view',
      90
    ),
];
