import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import EditMemberRecordModal, { MemberRecordData } from './EditMemberRecordModal';
import { PositionData } from './EditPositionModal';

export interface MembersTabAttrs {
  positions: PositionData[];
  positionless: MemberRecordData[];
  past: { cohort: string | null; members: MemberRecordData[] }[];
  loading: boolean;
  onRefresh: () => void;
}

export default class MembersTab extends Component<MembersTabAttrs> {
  filterQuery: string = '';

  view(): any {
    if (this.attrs.loading) {
      return <LoadingIndicator />;
    }

    const allRecords = this.collectAllRecords();
    const filteredRecords = allRecords.filter((rec) => {
      if (!this.filterQuery) return true;
      const q = this.filterQuery.toLowerCase();
      const nameMatch = rec.user?.displayName.toLowerCase().includes(q) || rec.user?.username.toLowerCase().includes(q);
      const cohortMatch = rec.cohort?.toLowerCase().includes(q);
      return nameMatch || cohortMatch;
    });

    const positionsMap = new Map<number, PositionData>();
    (this.attrs.positions || []).forEach((p: PositionData) => {
      if (p.id) positionsMap.set(p.id, p);
    });

    return (
      <div className="MembersTab">
        <div className="OrgMemberDirectory-header">
          <h2>{app.translator.trans('tapao-org-member-directory.admin.members.title')}</h2>
          <div className="OrgMemberDirectory-actions">
            <input
              type="text"
              className="FormControl OrgMemberDirectory-searchInput"
              placeholder={app.translator.trans('core.admin.users.search_placeholder') as string}
              value={this.filterQuery}
              oninput={(e: Event) => {
                this.filterQuery = (e.target as HTMLInputElement).value;
              }}
            />
            <Button
              className="Button Button--primary"
              icon="fas fa-plus"
              onclick={() =>
                app.modal.show(EditMemberRecordModal, {
                  positions: this.attrs.positions,
                  onSave: () => this.attrs.onRefresh(),
                })
              }
            >
              {app.translator.trans('tapao-org-member-directory.admin.members.create_button')}
            </Button>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="OrgMemberDirectory-empty">
            {app.translator.trans('tapao-org-member-directory.admin.members.empty_text')}
          </div>
        ) : (
          <table className="Table OrgMemberDirectory-table">
            <thead>
              <tr>
                <th>{app.translator.trans('tapao-org-member-directory.admin.members.col_user')}</th>
                <th>{app.translator.trans('tapao-org-member-directory.admin.members.col_position')}</th>
                <th>{app.translator.trans('tapao-org-member-directory.admin.members.col_cohort')}</th>
                <th>{app.translator.trans('tapao-org-member-directory.admin.members.col_dates')}</th>
                <th>{app.translator.trans('tapao-org-member-directory.admin.members.col_status')}</th>
                <th>{app.translator.trans('tapao-org-member-directory.admin.members.col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => {
                const pos = rec.positionId ? positionsMap.get(rec.positionId) : null;
                const isPast = !!rec.endedAt;

                return (
                  <tr>
                    <td>
                      <div className="OrgMemberDirectory-userCell">
                        <span className="font-weight-bold">{rec.user?.displayName || 'Unknown'}</span>
                        <span className="text-muted text-small"> (@{rec.user?.username})</span>
                      </div>
                    </td>
                    <td>
                      {pos ? (
                        <span
                          className="OrgMemberDirectory-posBadge"
                          style={{ backgroundColor: pos.color || '#3b82f6' }}
                        >
                          {pos.name}
                        </span>
                      ) : (
                        <span className="text-muted">{app.translator.trans('tapao-org-member-directory.admin.members.position_none')}</span>
                      )}
                    </td>
                    <td>{rec.cohort || '-'}</td>
                    <td>
                      {rec.startedAt || '?'} ~ {rec.endedAt || app.translator.trans('tapao-org-member-directory.admin.members.status_active')}
                    </td>
                    <td>
                      {isPast ? (
                        <span className="Badge">{app.translator.trans('tapao-org-member-directory.admin.members.status_past')}</span>
                      ) : (
                        <span className="Badge Badge--success">{app.translator.trans('tapao-org-member-directory.admin.members.status_active')}</span>
                      )}
                    </td>
                    <td>
                      <div className="ButtonSet">
                        <Button
                          className="Button Button--icon Button--link"
                          icon="fas fa-edit"
                          title={app.translator.trans('core.admin.permissions_controls.edit_button')}
                          onclick={() =>
                            app.modal.show(EditMemberRecordModal, {
                              record: rec,
                              positions: this.attrs.positions,
                              onSave: () => this.attrs.onRefresh(),
                            })
                          }
                        />
                        <Button
                          className="Button Button--icon Button--link Button--danger"
                          icon="fas fa-trash-alt"
                          title={app.translator.trans('tapao-org-member-directory.admin.members.delete_button')}
                          onclick={() => this.deleteRecord(rec)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  collectAllRecords(): MemberRecordData[] {
    const list: MemberRecordData[] = [];
    const seen = new Set<number>();

    // Current records under positions
    (this.attrs.positions || []).forEach((pos: any) => {
      ((pos as any).members || []).forEach((rec: any) => {
        if (!seen.has(rec.id)) {
          seen.add(rec.id);
          list.push({ ...rec, positionId: pos.id, userId: rec.user.id });
        }
      });
    });

    // Current positionless records
    (this.attrs.positionless || []).forEach((rec: any) => {
      if (!seen.has(rec.id)) {
        seen.add(rec.id);
        list.push({ ...rec, positionId: null, userId: rec.user.id });
      }
    });

    // Past records
    (this.attrs.past || []).forEach((group: any) => {
      (group.members || []).forEach((rec: any) => {
        if (!seen.has(rec.id)) {
          seen.add(rec.id);
          list.push({ ...rec, positionId: rec.position?.id || null, userId: rec.user.id });
        }
      });
    });

    return list;
  }

  deleteRecord(rec: MemberRecordData) {
    if (!confirm(app.translator.trans('tapao-org-member-directory.admin.members.delete_confirmation') as string)) {
      return;
    }

    app
      .request({
        method: 'DELETE',
        url: `${app.forum.attribute('apiUrl')}/member-directory/members/${rec.id}`,
      })
      .then(() => {
        this.attrs.onRefresh();
      });
  }
}
