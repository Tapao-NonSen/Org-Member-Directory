import app from 'flarum/admin/app';
import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import Stream from 'flarum/common/utils/Stream';
import { PositionData } from './EditPositionModal';

export interface UserSummary {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface MemberRecordData {
  id?: number;
  userId: number;
  name?: string | null;
  positionId?: number | null;
  cohort?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  sortOrder: number;
  user?: UserSummary;
}

export interface EditMemberRecordModalAttrs extends IInternalModalAttrs {
  record?: MemberRecordData;
  positions: PositionData[];
  onSave?: () => void;
}

export default class EditMemberRecordModal extends Modal<EditMemberRecordModalAttrs> {
  selectedUser!: Stream<UserSummary | null>;
  searchQuery!: Stream<string>;
  searchResults!: UserSummary[];
  isSearching!: boolean;
  name!: Stream<string>;
  positionId!: Stream<string>;
  cohort!: Stream<string>;
  startedAt!: Stream<string>;
  endedAt!: Stream<string>;
  sortOrder!: Stream<number>;

  oninit(vnode: any) {
    super.oninit(vnode);

    const rec = this.attrs.record;
    this.selectedUser = Stream(rec?.user || null);
    this.searchQuery = Stream('');
    this.searchResults = [];
    this.isSearching = false;

    this.name = Stream(rec?.name || '');
    this.positionId = Stream(rec?.positionId ? String(rec.positionId) : '');
    this.cohort = Stream(rec?.cohort || '');
    this.startedAt = Stream(rec?.startedAt || '');
    this.endedAt = Stream(rec?.endedAt || '');
    this.sortOrder = Stream(rec?.sortOrder ?? 0);
  }

  className() {
    return 'EditMemberRecordModal Modal--medium';
  }

  title() {
    return this.attrs.record
      ? app.translator.trans('tapao-org-member-directory.admin.members.edit_title')
      : app.translator.trans('tapao-org-member-directory.admin.members.create_title');
  }

  content(): any {
    const positionOptions: Record<string, string> = {
      '': app.translator.trans('tapao-org-member-directory.admin.members.position_none') as string,
    };

    (this.attrs.positions || []).forEach((pos) => {
      if (pos.id) {
        positionOptions[String(pos.id)] = pos.name;
      }
    });

    const user = this.selectedUser();

    return (
      <div className="Modal-body">
        <div className="Form-group">
          <label>{app.translator.trans('tapao-org-member-directory.admin.members.user_label')}</label>
          {user ? (
            <div className="OrgMemberDirectory-selectedUser">
              <span className="OrgMemberDirectory-userInfo">
                {user.displayName} (@{user.username})
              </span>
              {!this.attrs.record && (
                <Button
                  className="Button Button--link Button--icon"
                  icon="fas fa-times"
                  onclick={() => this.selectedUser(null)}
                />
              )}
            </div>
          ) : (
            <div className="OrgMemberDirectory-userSearch">
              <input
                className="FormControl"
                placeholder={app.translator.trans('tapao-org-member-directory.admin.members.user_placeholder') as string}
                value={this.searchQuery()}
                oninput={(e: Event) => {
                  const val = (e.target as HTMLInputElement).value;
                  this.searchQuery(val);
                  this.performUserSearch(val);
                }}
              />
              {this.searchResults.length > 0 && (
                <div className="Dropdown-menu OrgMemberDirectory-searchResults">
                  {this.searchResults.map((u) => (
                    <button
                      type="button"
                      className="Dropdown-item Button"
                      onclick={() => {
                        this.selectedUser(u);
                        this.searchResults = [];
                        this.searchQuery('');
                      }}
                    >
                      <span>{u.displayName} (@{u.username})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="Form-group">
          <label>{app.translator.trans('tapao-org-member-directory.admin.members.name_label', {}, 'Name Option')}</label>
          <input
            className="FormControl"
            value={this.name()}
            oninput={(e: Event) => this.name((e.target as HTMLInputElement).value)}
            placeholder="Custom Name (optional)"
          />
        </div>

        <div className="Form-group">
          <label>{app.translator.trans('tapao-org-member-directory.admin.members.position_label')}</label>
          <Select
            options={positionOptions}
            value={this.positionId()}
            onchange={(val: string) => this.positionId(val)}
          />
        </div>

        <div className="Form-group">
          <label>{app.translator.trans('tapao-org-member-directory.admin.members.cohort_label')}</label>
          <input
            className="FormControl"
            value={this.cohort()}
            oninput={(e: Event) => this.cohort((e.target as HTMLInputElement).value)}
            placeholder="e.g. รุ่น 1, 2568"
          />
        </div>

        <div className="Form-group">
          <div className="Form-group-row">
            <div>
              <label>{app.translator.trans('tapao-org-member-directory.admin.members.started_at_label')}</label>
              <input
                type="date"
                className="FormControl"
                value={this.startedAt()}
                oninput={(e: Event) => this.startedAt((e.target as HTMLInputElement).value)}
              />
            </div>
            <div>
              <label>{app.translator.trans('tapao-org-member-directory.admin.members.ended_at_label')}</label>
              <input
                type="date"
                className="FormControl"
                value={this.endedAt()}
                oninput={(e: Event) => this.endedAt((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>
        </div>

        <div className="Form-group">
          <label>{app.translator.trans('tapao-org-member-directory.admin.members.sort_order_label')}</label>
          <input
            type="number"
            className="FormControl"
            value={this.sortOrder()}
            oninput={(e: Event) => this.sortOrder(Number((e.target as HTMLInputElement).value))}
          />
        </div>

        <div className="Form-group">
          <Button
            type="submit"
            className="Button Button--primary"
            loading={this.loading}
            disabled={!this.selectedUser()}
          >
            {app.translator.trans('core.admin.settings.submit_button')}
          </Button>
        </div>
      </div>
    );
  }

  performUserSearch(query: string) {
    if (!query || query.trim().length < 2) {
      this.searchResults = [];
      m.redraw();
      return;
    }

    this.isSearching = true;

    app.store
      .find('users', { filter: { q: query }, page: { limit: 5 } })
      .then((users: any[]) => {
        this.searchResults = users.map((u: any) => ({
          id: Number(u.id()),
          username: u.username(),
          displayName: u.displayName(),
          avatarUrl: u.avatarUrl(),
        }));
        this.isSearching = false;
        m.redraw();
      })
      .catch(() => {
        this.searchResults = [];
        this.isSearching = false;
        m.redraw();
      });
  }

  onsubmit(e: SubmitEvent) {
    e.preventDefault();

    const user = this.selectedUser();
    if (!user) return;

    this.loading = true;

    const isEdit = !!this.attrs.record?.id;
    const url = isEdit
      ? `${app.forum.attribute('apiUrl')}/member-directory/members/${this.attrs.record!.id}`
      : `${app.forum.attribute('apiUrl')}/member-directory/members`;
    const method = isEdit ? 'PATCH' : 'POST';

    const posId = this.positionId();

    app
      .request({
        method,
        url,
        body: {
          userId: user.id,
          name: this.name() || null,
          positionId: posId ? Number(posId) : null,
          cohort: this.cohort() || null,
          startedAt: this.startedAt() || null,
          endedAt: this.endedAt() || null,
          sortOrder: Number(this.sortOrder()),
        },
      })
      .then(() => {
        this.hide();
        if (this.attrs.onSave) {
          this.attrs.onSave();
        }
      })
      .catch((err: any) => {
        this.loading = false;
        m.redraw();
        throw err;
      });
  }
}
