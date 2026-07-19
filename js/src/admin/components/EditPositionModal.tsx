import app from 'flarum/admin/app';
import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';

export interface PositionData {
  id?: number;
  name: string;
  color?: string | null;
  sortOrder: number;
  isVisible: boolean;
}

export interface EditPositionModalAttrs extends IInternalModalAttrs {
  position?: PositionData;
  onSave?: () => void;
}

export default class EditPositionModal extends Modal<EditPositionModalAttrs> {
  name!: Stream<string>;
  color!: Stream<string>;
  sortOrder!: Stream<number>;
  isVisible!: Stream<boolean>;

  oninit(vnode: any) {
    super.oninit(vnode);
    this.loading = false;

    const pos = this.attrs.position;
    this.name = Stream(pos?.name || '');
    this.color = Stream(pos?.color || '#3b82f6');
    this.sortOrder = Stream(pos?.sortOrder ?? 0);
    this.isVisible = Stream(pos?.isVisible ?? true);
  }

  className() {
    return 'EditPositionModal Modal--small';
  }

  title() {
    return this.attrs.position
      ? app.translator.trans('tapao-org-member-directory.admin.positions.edit_title')
      : app.translator.trans('tapao-org-member-directory.admin.positions.create_title');
  }

  content(): any {
    return (
      <div className="Modal-body">
        <div className="Form-group">
          <label>{app.translator.trans('tapao-org-member-directory.admin.positions.name_label')}</label>
          <input
            className="FormControl"
            value={this.name()}
            oninput={(e: Event) => this.name((e.target as HTMLInputElement).value)}
            placeholder="e.g. ประธาน, รองประธาน"
          />
        </div>

        <div className="Form-group">
          <label>{app.translator.trans('tapao-org-member-directory.admin.positions.color_label')}</label>
          <div className="OrgMemberDirectory-colorInput">
            <input
              type="color"
              className="FormControl OrgMemberDirectory-colorPicker"
              value={this.color()}
              oninput={(e: Event) => this.color((e.target as HTMLInputElement).value)}
            />
            <input
              type="text"
              className="FormControl OrgMemberDirectory-colorHex"
              value={this.color()}
              oninput={(e: Event) => this.color((e.target as HTMLInputElement).value)}
              placeholder="#3b82f6"
            />
          </div>
        </div>

        <div className="Form-group">
          <label>{app.translator.trans('tapao-org-member-directory.admin.positions.sort_order_label')}</label>
          <input
            type="number"
            className="FormControl"
            value={this.sortOrder()}
            oninput={(e: Event) => this.sortOrder(Number((e.target as HTMLInputElement).value))}
          />
        </div>

        <div className="Form-group">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={this.isVisible()}
              onchange={(e: Event) => this.isVisible((e.target as HTMLInputElement).checked)}
            />
            {app.translator.trans('tapao-org-member-directory.admin.positions.is_visible_label')}
          </label>
        </div>

        <div className="Form-group">
          <Button
            className="Button Button--primary EditPositionModal-save"
            loading={this.loading}
            disabled={!this.name().trim()}
            onclick={() => this.savePosition()}
          >
            {app.translator.trans('core.admin.settings.submit_button')}
          </Button>
        </div>
      </div>
    );
  }

  savePosition() {
    if (!this.name().trim()) return;

    this.loading = true;

    const isEdit = !!this.attrs.position?.id;
    const url = isEdit
      ? `${app.forum.attribute('apiUrl')}/member-directory/positions/${this.attrs.position!.id}`
      : `${app.forum.attribute('apiUrl')}/member-directory/positions`;
    const method = isEdit ? 'PATCH' : 'POST';

    app
      .request({
        method,
        url,
        body: {
          name: this.name(),
          color: this.color() || null,
          sortOrder: Number(this.sortOrder()),
          isVisible: this.isVisible(),
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
