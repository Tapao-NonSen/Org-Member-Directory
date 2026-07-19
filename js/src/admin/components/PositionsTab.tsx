import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import EditPositionModal, { PositionData } from './EditPositionModal';

export interface PositionsTabAttrs {
  positions: PositionData[];
  loading: boolean;
  onRefresh: () => void;
}

export default class PositionsTab extends Component<PositionsTabAttrs> {
  view(): any {
    if (this.attrs.loading) {
      return <LoadingIndicator />;
    }

    const positions = this.attrs.positions || [];

    return (
      <div className="PositionsTab">
        <div className="OrgMemberDirectory-header">
          <h2>{app.translator.trans('tapao-org-member-directory.admin.positions.title')}</h2>
          <Button
            className="Button Button--primary"
            icon="fas fa-plus"
            onclick={() =>
              app.modal.show(EditPositionModal, {
                onSave: () => this.attrs.onRefresh(),
              })
            }
          >
            {app.translator.trans('tapao-org-member-directory.admin.positions.create_button')}
          </Button>
        </div>

        {positions.length === 0 ? (
          <div className="OrgMemberDirectory-empty">
            {app.translator.trans('tapao-org-member-directory.admin.positions.empty_text')}
          </div>
        ) : (
          <table className="OrgMemberDirectory-table">
            <thead>
              <tr>
                <th>{app.translator.trans('tapao-org-member-directory.admin.positions.col_name')}</th>
                <th>{app.translator.trans('tapao-org-member-directory.admin.positions.col_color')}</th>
                <th>{app.translator.trans('tapao-org-member-directory.admin.positions.col_sort')}</th>
                <th>{app.translator.trans('tapao-org-member-directory.admin.positions.col_visible')}</th>
                <th>{app.translator.trans('tapao-org-member-directory.admin.positions.col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr>
                  <td className="OrgMemberDirectory-posName font-weight-bold">{pos.name}</td>
                  <td>
                    {pos.color ? (
                      <span
                        className="OrgMemberDirectory-colorBadge"
                        style={{ backgroundColor: pos.color }}
                      >
                        {pos.color}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>{pos.sortOrder}</td>
                  <td>
                    {pos.isVisible ? (
                      <span className="OrgMemberDirectory-statusPill OrgMemberDirectory-statusPill--success">
                        {app.translator.trans('tapao-org-member-directory.admin.positions.visible')}
                      </span>
                    ) : (
                      <span className="OrgMemberDirectory-statusPill">
                        {app.translator.trans('tapao-org-member-directory.admin.positions.hidden')}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="ButtonSet">
                      <Button
                        className="Button Button--icon Button--link"
                        icon="fas fa-edit"
                        title={app.translator.trans('core.admin.permissions_controls.edit_button')}
                        onclick={() =>
                          app.modal.show(EditPositionModal, {
                            position: pos,
                            onSave: () => this.attrs.onRefresh(),
                          })
                        }
                      />
                      <Button
                        className="Button Button--icon Button--link Button--danger"
                        icon="fas fa-trash-alt"
                        title={app.translator.trans('tapao-org-member-directory.admin.positions.delete_button')}
                        onclick={() => this.deletePosition(pos)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  deletePosition(pos: PositionData) {
    if (!confirm(app.translator.trans('tapao-org-member-directory.admin.positions.delete_confirmation') as string)) {
      return;
    }

    app
      .request({
        method: 'DELETE',
        url: `${app.forum.attribute('apiUrl')}/member-directory/positions/${pos.id}`,
      })
      .then(() => {
        this.attrs.onRefresh();
      });
  }
}
