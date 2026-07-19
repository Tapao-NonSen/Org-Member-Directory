import app from 'flarum/admin/app';
import OrgMemberDirectoryPage from './components/OrgMemberDirectoryPage';

app.initializers.add('tapao/org-member-directory', () => {
  app.extensionData
    .for('tapao-org-member-directory')
    .registerPage(OrgMemberDirectoryPage)
    .registerPermission(
      {
        icon: 'fas fa-id-card',
        label: app.translator.trans('tapao-org-member-directory.admin.permissions.view_member_directory_label'),
        permission: 'member-directory.view',
      },
      'view'
    );
});

