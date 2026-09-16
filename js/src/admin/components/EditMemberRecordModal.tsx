import app from 'flarum/admin/app';
import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
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
  searchError!: string | null;
  searchDebounce?: number;
  searchSeq!: number;
  saveError!: string | null;
  name!: Stream<string>;
  positionId!: Stream<string>;
  cohort!: Stream<string>;
  startedAt!: Stream<string>;
  endedAt!: Stream<string>;
  sortOrder!: Stream<number>;

  oninit(vnode: any) {
    super.oninit(vnode);
    this.loading = false;

    const rec = this.attrs.record;
    this.selectedUser = Stream(rec?.user || null);
    this.searchQuery = Stream('');
    this.searchResults = [];
    this.isSearching = false;
    this.searchError = null;
    this.searchSeq = 0;
    this.saveError = null;

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

    const currentPosId = this.attrs.record?.positionId;

    (this.attrs.positions || []).forEach((pos) => {
      if (pos.id) {
        if (!pos.isArchived || pos.id === currentPosId) {
          positionOptions[String(pos.id)] = pos.name;
        }
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
              {this.searchQuery().trim() !== '' && (
                <div className="OrgMemberDirectory-searchResults">
                  {this.isSearching ? (
                    <div className="OrgMemberDirectory-searchStatus">
                      <LoadingIndicator display="inline" size="small" />
                    </div>
                  ) : this.searchError ? (
                    <div className="OrgMemberDirectory-searchStatus OrgMemberDirectory-searchError">
                      {this.searchError}
                    </div>
                  ) : this.searchResults.length === 0 ? (
                    <div className="OrgMemberDirectory-searchStatus">
                      {app.translator.trans(
                        'tapao-org-member-directory.admin.members.user_no_results',
                        {},
                        'No users found'
                      )}
                    </div>
                  ) : (
                    this.searchResults.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        className="Button"
                        onclick={() => {
                          this.searchSeq++;
                          this.selectedUser(u);
                          this.searchResults = [];
                          this.searchQuery('');
                        }}
                      >
                        <span>{u.displayName} (@{u.username})</span>
                      </button>
                    ))
                  )}
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

        {this.saveError && (
          <div className="Alert Alert--error">{this.saveError}</div>
        )}

        <div className="Form-group">
          <Button
            className="Button Button--primary"
            loading={this.loading}
            disabled={!this.selectedUser()}
            onclick={() => this.saveMember()}
          >
            {app.translator.trans('core.admin.settings.submit_button')}
          </Button>
        </div>
      </div>
    );
  }

  onremove() {
    clearTimeout(this.searchDebounce);
  }

  performUserSearch(query: string) {
    clearTimeout(this.searchDebounce);

    const term = (query || '').trim();

    if (!term) {
      this.searchResults = [];
      this.isSearching = false;
      this.searchError = null;
      m.redraw();
      return;
    }

    this.isSearching = true;
    this.searchError = null;
    m.redraw();

    this.searchDebounce = window.setTimeout(() => {
      // Only the newest request is allowed to write results, so a slow
      // response for an earlier keystroke can't clobber a newer one.
      const seq = ++this.searchSeq;

      app
        .request({
          method: 'GET',
          url: `${app.forum.attribute('apiUrl')}/users?filter[q]=${encodeURIComponent(term)}&page[limit]=10`,
        })
        .then((res: any) => {
          if (seq !== this.searchSeq) return;

          this.searchResults = (res?.data || []).map((u: any) => ({
            id: Number(u.id),
            username: u.attributes?.username ?? '',
            displayName: u.attributes?.displayName ?? u.attributes?.username ?? '',
            avatarUrl: u.attributes?.avatarUrl ?? null,
          }));
          this.isSearching = false;
          m.redraw();
        })
        .catch((err: any) => {
          if (seq !== this.searchSeq) return;

          this.searchResults = [];
          this.isSearching = false;
          this.searchError =
            err?.response?.errors?.[0]?.detail || err?.message || 'User search failed.';
          m.redraw();
        });
    }, 250);
  }

  saveMember() {
    const user = this.selectedUser();
    if (!user) return;

    this.loading = true;
    this.saveError = null;

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
        this.saveError = err?.response?.errors?.[0]?.detail || null;
        m.redraw();

        // A duplicate is expected user error, not a crash — it is shown inline.
        if (!this.saveError) throw err;
      });
  }
}
